import type { TeamId } from '@/domain/ids';
import type { Match } from '@/domain/match/types';
import { isBye, opponents, phaseMatches } from '@/domain/match/types';
import { nextSeed, shuffled } from '@/domain/random';
import type { Seed } from '@/domain/random';
import { bracketShape } from './bracket';
import type { Seat } from './bracket';

export const MAX_ATTEMPTS = 1000;

export interface DrawnSeats {
  seats: Seat[];
  rematches: number;
}

export function pastOpponents(matches: readonly Match[]): Set<string> {
  const met = new Set<string>();

  for (const match of phaseMatches(matches, 'phase1')) {
    if (isBye(match) || match.status === 'waiting') {
      continue;
    }

    const [home, away] = opponents(match);

    if (home !== undefined && away !== undefined) {
      met.add(pairKey(home, away));
    }
  }

  return met;
}

export function pairKey(a: TeamId, b: TeamId): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function countRematches(seats: readonly Seat[], met: ReadonlySet<string>): number {
  let count = 0;

  for (let pair = 0; pair < seats.length / 2; pair += 1) {
    const home = seats[pair * 2] ?? null;
    const away = seats[pair * 2 + 1] ?? null;

    if (home !== null && away !== null && met.has(pairKey(home, away))) {
      count += 1;
    }
  }

  return count;
}

function layOut(teams: readonly TeamId[], size: number, seed: Seed): Seat[] {
  const pairs = size / 2;
  const byes = size - teams.length;
  const shuffledTeams = shuffled(teams, seed);
  const byePairs = new Set(shuffled([...Array(pairs).keys()], nextSeed(seed)).slice(0, byes));
  const sides = shuffled([...Array(pairs).keys()], nextSeed(nextSeed(seed)));

  const seats: Seat[] = Array.from({ length: size }, () => null);
  let taken = 0;

  for (let pair = 0; pair < pairs; pair += 1) {
    if (byePairs.has(pair)) {
      const alone = shuffledTeams[taken++] ?? null;
      const side = (sides[pair] ?? 0) % 2;
      seats[pair * 2 + side] = alone;
      continue;
    }

    seats[pair * 2] = shuffledTeams[taken++] ?? null;
    seats[pair * 2 + 1] = shuffledTeams[taken++] ?? null;
  }

  return seats;
}

export function drawSeats(
  teams: readonly TeamId[],
  matches: readonly Match[],
  seed: Seed
): DrawnSeats {
  const { size } = bracketShape(teams.length);

  if (teams.length < 2) {
    return { seats: teams.map((team) => team), rematches: 0 };
  }

  const met = pastOpponents(matches);
  let best: DrawnSeats | null = null;
  let current = seed;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const seats = layOut(teams, size, current);
    const rematches = countRematches(seats, met);

    if (rematches === 0) {
      return { seats, rematches };
    }

    if (!best || rematches < best.rematches) {
      best = { seats, rematches };
    }

    current = nextSeed(current);
  }

  return best ?? { seats: layOut(teams, size, seed), rematches: 0 };
}
