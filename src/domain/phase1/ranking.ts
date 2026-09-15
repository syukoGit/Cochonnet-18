import type { TeamId } from '@/domain/ids';
import { loserOf, winnerOf } from '@/domain/match/result';
import { isBye, opponents } from '@/domain/match/types';
import type { Match } from '@/domain/match/types';
import { differential } from '@/domain/score/validity';
import type { Tournament } from '@/domain/tournament/types';

export interface RankingEntry {
  team: TeamId;
  differential: number;
  wins: number;
  pointsScored: number;
  played: number;
  byes: number;
}

function emptyEntry(team: TeamId): RankingEntry {
  return { team, differential: 0, wins: 0, pointsScored: 0, played: 0, byes: 0 };
}

function applyMatch(entries: Map<TeamId, RankingEntry>, match: Match, forfeitValue: number): void {
  if (isBye(match)) {
    for (const team of opponents(match)) {
      const entry = entries.get(team);
      if (entry) {
        entry.byes += 1;
      }
    }
    return;
  }

  const winner = winnerOf(match);
  const loser = loserOf(match);

  if (winner === null || loser === null) {
    return;
  }

  const winnerEntry = entries.get(winner);
  const loserEntry = entries.get(loser);

  if (!winnerEntry || !loserEntry) {
    return;
  }

  const gained = match.status === 'forfeit' ? forfeitValue : differential(match.score ?? [0, 0]);

  winnerEntry.differential += gained;
  loserEntry.differential -= gained;
  winnerEntry.wins += 1;
  winnerEntry.played += 1;
  loserEntry.played += 1;

  if (match.status === 'played' && match.score) {
    const [home, away] = match.score;
    const homeTeam = opponents(match)[0];
    winnerEntry.pointsScored += homeTeam === winner ? home : away;
    loserEntry.pointsScored += homeTeam === loser ? home : away;
  }
}

export function computeRanking(tournament: Tournament): RankingEntry[] {
  const entries = new Map(tournament.teams.map((team) => [team.id, emptyEntry(team.id)]));

  for (const match of tournament.matches) {
    applyMatch(entries, match, tournament.settings.forfeitDifferential);
  }

  return [...entries.values()].sort((a, b) => b.differential - a.differential || a.team - b.team);
}

export function enteredCount(matches: Match[]): number {
  return matches.filter((match) => !isBye(match) && match.status !== 'waiting').length;
}

export function playableCount(matches: Match[]): number {
  return matches.filter((match) => !isBye(match)).length;
}
