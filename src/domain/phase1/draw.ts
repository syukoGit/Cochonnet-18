import type { Match, Slot } from '@/domain/match/types';
import { shuffled } from '@/domain/random';
import type { Seed } from '@/domain/random';
import type { TeamId } from '@/domain/tournament/types';

const PHANTOM = null;

type Seat = TeamId | typeof PHANTOM;

export function maxMatchCount(teamCount: number): number {
  return teamCount < 2 ? 0 : teamCount - 1;
}

function seatsFor(teams: readonly TeamId[], seed: Seed): Seat[] {
  const seats: Seat[] = [...shuffled(teams, seed)];

  if (seats.length % 2 === 1) {
    seats.push(PHANTOM);
  }

  return seats;
}

function rotate(seats: Seat[]): Seat[] {
  const [fixed, ...rest] = seats;
  const last = rest.pop();

  if (fixed === undefined || last === undefined) {
    return seats;
  }

  return [fixed, last, ...rest];
}

function slotFor(seat: Seat): Slot {
  return seat === PHANTOM ? { kind: 'bye' } : { kind: 'team', team: seat };
}

export function drawPhase1(teams: readonly TeamId[], matchCount: number, seed: Seed): Match[] {
  if (matchCount < 1 || matchCount > maxMatchCount(teams.length)) {
    return [];
  }

  const matches: Match[] = [];
  let seats = seatsFor(teams, seed);
  let nextId = 1;

  for (let round = 1; round <= matchCount; round += 1) {
    for (let index = 0; index < seats.length / 2; index += 1) {
      const home = seats[index];
      const away = seats[seats.length - 1 - index];

      if (home === undefined || away === undefined) {
        continue;
      }

      matches.push({
        id: nextId++,
        phase: 'phase1',
        round,
        slots: [slotFor(home), slotFor(away)],
        status: 'waiting',
      });
    }

    seats = rotate(seats);
  }

  return matches;
}
