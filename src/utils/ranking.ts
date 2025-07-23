export interface RankingEntry {
  team: string;
  score: number;
}

import type { Round } from './schedule';

export function computeRanking(teams: string[], rounds: Round[]): RankingEntry[] {
  const scores = new Map<string, number>();
  teams.forEach((t) => scores.set(t, 0));

  for (const round of rounds) {
    for (const match of round) {
      const { teamA, teamB, scoreA, scoreB } = match;
      if (scoreA === undefined || scoreB === undefined) continue;
      const diff = Math.abs(scoreA - scoreB);
      if (scoreA > scoreB) {
        scores.set(teamA, (scores.get(teamA) ?? 0) + diff);
        scores.set(teamB, (scores.get(teamB) ?? 0) - diff);
      } else if (scoreB > scoreA) {
        scores.set(teamB, (scores.get(teamB) ?? 0) + diff);
        scores.set(teamA, (scores.get(teamA) ?? 0) - diff);
      }
    }
  }

  const list: RankingEntry[] = teams.map((team) => ({
    team,
    score: scores.get(team) ?? 0,
  }));
  list.sort((a, b) => b.score - a.score);
  return list;
}
