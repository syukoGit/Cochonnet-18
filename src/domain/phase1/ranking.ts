import type { TeamId } from '@/domain/ids';
import { loserOf, winnerOf } from '@/domain/match/result';
import { isBye, opponents } from '@/domain/match/types';
import type { Match } from '@/domain/match/types';
import { differential } from '@/domain/score/validity';
import type { Tournament } from '@/domain/tournament/types';
import { byeCredit } from './bye';
import { findDecision, separate } from './tiebreak';
import type { Contender } from './tiebreak';

export interface RankingEntry {
  team: TeamId;
  differential: number;
  differentialFromMatches: number;
  byeCredit: number;
  wins: number;
  pointsScored: number;
  played: number;
  byes: number;
}

export interface Ranking {
  entries: RankingEntry[];
  tieGroups: TeamId[][];
  unresolvedTies: TeamId[][];
  complete: boolean;
}

function emptyEntry(team: TeamId): RankingEntry {
  return {
    team,
    differential: 0,
    differentialFromMatches: 0,
    byeCredit: 0,
    wins: 0,
    pointsScored: 0,
    played: 0,
    byes: 0,
  };
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

  winnerEntry.differentialFromMatches += gained;
  loserEntry.differentialFromMatches -= gained;
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

export function playableCount(matches: readonly Match[]): number {
  return matches.filter((match) => !isBye(match)).length;
}

export function enteredCount(matches: readonly Match[]): number {
  return matches.filter((match) => !isBye(match) && match.status !== 'waiting').length;
}

export function phase1Complete(tournament: Tournament): boolean {
  const playable = playableCount(tournament.matches);

  return playable > 0 && enteredCount(tournament.matches) === playable;
}

export function rankTeams(tournament: Tournament): Ranking {
  const entries = new Map(tournament.teams.map((team) => [team.id, emptyEntry(team.id)]));

  for (const match of tournament.matches) {
    applyMatch(entries, match, tournament.settings.forfeitDifferential);
  }

  const complete = phase1Complete(tournament);

  for (const entry of entries.values()) {
    entry.byeCredit = complete ? byeCredit(entry, tournament.settings.byePoints) : 0;
    entry.differential = entry.differentialFromMatches + entry.byeCredit;
  }

  const byDifferential = new Map<number, RankingEntry[]>();

  for (const entry of entries.values()) {
    const bucket = byDifferential.get(entry.differential);
    if (bucket) {
      bucket.push(entry);
    } else {
      byDifferential.set(entry.differential, [entry]);
    }
  }

  const ordered: RankingEntry[] = [];
  const tieGroups: TeamId[][] = [];
  const unresolvedTies: TeamId[][] = [];

  for (const [, bucket] of [...byDifferential.entries()].sort((a, b) => b[0] - a[0])) {
    const contenders: Contender[] = bucket.map((entry) => ({
      team: entry.team,
      wins: entry.wins,
      pointsScored: entry.pointsScored,
    }));

    for (const block of separate(
      contenders,
      tournament.matches,
      tournament.settings.forfeitDifferential
    )) {
      const teams = block.map((contender) => contender.team);
      const decision = block.length > 1 ? findDecision(tournament.tieBreaks, teams) : null;
      const finalOrder = decision ? decision.order : teams;

      if (block.length > 1) {
        tieGroups.push(teams);

        if (!decision) {
          unresolvedTies.push(teams);
        }
      }

      for (const team of finalOrder) {
        const entry = entries.get(team);
        if (entry) {
          ordered.push(entry);
        }
      }
    }
  }

  return { entries: ordered, tieGroups, unresolvedTies, complete };
}
