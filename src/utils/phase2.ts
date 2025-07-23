export interface BracketMatch {
  teamA?: string;
  teamB?: string;
  scoreA?: number;
  scoreB?: number;
  winner?: string;
}

export type BracketRound = BracketMatch[];

export function splitPhase2Groups(
  teams: string[]
): { winners: string[]; consolation: string[] } {
  const n = teams.length;
  if (n === 0) return { winners: [], consolation: [] };

  let winnersCount: number;
  let consolationCount: number;

  if (n % 2 === 1) {
    winnersCount = Math.ceil(n / 2);
    consolationCount = n - winnersCount;
  } else {
    winnersCount = n / 2;
    consolationCount = n / 2;
    if (n % 4 !== 0) {
      winnersCount += 1;
      consolationCount -= 1;
    }
  }

  const winners = teams.slice(0, winnersCount);
  const consolation = teams.slice(winnersCount, winnersCount + consolationCount);
  return { winners, consolation };
}

export function generateBracket(
  teams: string[],
  avoidPairs: Set<string> = new Set()
): BracketRound[] {
  const pairKey = (a: string, b: string) => [a, b].sort().join('|');

  const remaining = teams.slice();
  const firstRound: BracketMatch[] = [];

  while (remaining.length > 0) {
    const teamA = remaining.shift()!;
    let teamB: string | undefined;
    const idx = remaining.findIndex((t) => !avoidPairs.has(pairKey(teamA, t)));
    if (idx !== -1) {
      teamB = remaining.splice(idx, 1)[0];
    } else {
      teamB = remaining.shift();
    }
    const match: BracketMatch = { teamA, teamB };
    if (!teamB) {
      match.winner = teamA;
    }
    firstRound.push(match);
  }

  const rounds: BracketRound[] = [firstRound];
  let current = firstRound.map((m) => m.winner ?? '');

  while (current.length > 1) {
    const round: BracketMatch[] = [];
    const next: string[] = [];
    for (let i = 0; i < current.length; i += 2) {
      const teamA = current[i] || undefined;
      const teamB = current[i + 1] || undefined;
      const match: BracketMatch = { teamA, teamB };
      if (teamA && !teamB) {
        match.winner = teamA;
        next.push(teamA);
      } else {
        next.push('');
      }
      round.push(match);
    }
    rounds.push(round);
    current = next;
  }

  return rounds;
}

import type { Round } from './schedule';

export function getPlayedPairs(rounds: Round[]): Set<string> {
  const pairs = new Set<string>();
  const key = (a: string, b: string) => [a, b].sort().join('|');
  for (const round of rounds) {
    for (const { teamA, teamB } of round) {
      pairs.add(key(teamA, teamB));
    }
  }
  return pairs;
}
