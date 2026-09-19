import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { TeamId } from '@/domain/ids';
import type { Match } from '@/domain/match/types';
import { bracketShape, buildBracket, isThirdPlace } from './bracket';
import type { Seat } from './bracket';

const teamIds = (count: number): TeamId[] =>
  Array.from({ length: count }, (_unused, index) => index + 1);

function seatsFor(teamCount: number): Seat[] {
  const { size } = bracketShape(teamCount);
  const seats: Seat[] = Array.from({ length: size }, () => null);
  const byes = size - teamCount;

  teamIds(teamCount).forEach((team, index) => {
    seats[index < byes ? index * 2 : index + byes] = team;
  });

  return seats;
}

const bracketOf = (teamCount: number): Match[] => buildBracket(seatsFor(teamCount), 'main', 1);

const knockout = (matches: Match[]) => matches.filter((match) => !isThirdPlace(match));

describe('bracket shape', () => {
  it('rounds up to the next power of two', () => {
    expect(bracketShape(2)).toEqual({ size: 2, depth: 1, byes: 0 });
    expect(bracketShape(3)).toEqual({ size: 4, depth: 2, byes: 1 });
    expect(bracketShape(6)).toEqual({ size: 8, depth: 3, byes: 2 });
    expect(bracketShape(8)).toEqual({ size: 8, depth: 3, byes: 0 });
  });

  it('a group too small to play has no shape at all', () => {
    expect(bracketShape(0)).toEqual({ size: 0, depth: 0, byes: 0 });
    expect(bracketShape(1)).toEqual({ size: 1, depth: 0, byes: 0 });
  });

  it('R4.2 — byes are always fewer than the first round pairs', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 64 }), (teamCount) => {
        const { size, byes } = bracketShape(teamCount);
        expect(byes).toBeLessThan(size / 2);
      })
    );
  });
});

describe('bracket construction', () => {
  it('R4.15 — an empty or single team group produces no match', () => {
    expect(buildBracket([], 'main', 1)).toEqual([]);
    expect(buildBracket([7], 'main', 1)).toEqual([]);
  });

  it('R4.15 — two teams give one final and no third place', () => {
    const matches = bracketOf(2);

    expect(matches).toHaveLength(1);
    expect(matches.some(isThirdPlace)).toBe(false);
  });

  it('R4.15 — three teams give one semi final and a final, with no play-off', () => {
    const matches = bracketOf(3);

    expect(knockout(matches)).toHaveLength(2);
    expect(matches.filter(isThirdPlace)).toHaveLength(0);
  });

  it('R4.14 — four teams or more always get a third place match', () => {
    for (const teamCount of [4, 5, 8, 12, 33]) {
      expect(bracketOf(teamCount).filter(isThirdPlace)).toHaveLength(1);
    }
  });

  it('I5 — every round above the first is complete, and one final closes it', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 64 }), (teamCount) => {
        const { depth } = bracketShape(teamCount);
        const matches = knockout(bracketOf(teamCount));

        for (let round = 2; round <= depth; round += 1) {
          expect(matches.filter((match) => match.round === round)).toHaveLength(
            2 ** (depth - round)
          );
        }

        expect(matches.filter((match) => match.round === depth)).toHaveLength(1);
      }),
      { numRuns: 200 }
    );
  });

  it('I5 — every match but the final feeds exactly one downstream slot', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 64 }), (teamCount) => {
        const matches = knockout(bracketOf(teamCount));
        const finalRound = Math.max(...matches.map((match) => match.round));

        for (const match of matches) {
          expect(match.feeds === undefined).toBe(match.round === finalRound);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('I6 — no first round pair is made of two byes', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 64 }), (teamCount) => {
        const seats = seatsFor(teamCount);

        for (let pair = 0; pair < seats.length / 2; pair += 1) {
          expect(seats[pair * 2] === null && seats[pair * 2 + 1] === null).toBe(false);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('every team appears exactly once across the bracket entry points', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 64 }), (teamCount) => {
        const matches = bracketOf(teamCount);
        const entering = matches.flatMap((match) =>
          match.slots.flatMap((slot) => (slot.kind === 'team' ? [slot.team] : []))
        );

        expect([...entering].sort((a, b) => a - b)).toEqual(teamIds(teamCount));
      }),
      { numRuns: 200 }
    );
  });

  it('the third place match is fed by the two semi final losers', () => {
    const matches = bracketOf(8);
    const thirdPlace = matches.find(isThirdPlace);
    const semiFinals = matches.filter((match) => match.feedsConsolation !== undefined);

    expect(semiFinals).toHaveLength(2);
    expect(semiFinals.every((match) => match.feedsConsolation?.match === thirdPlace?.id)).toBe(
      true
    );
  });

  it('gives every match a unique identifier', () => {
    const matches = bracketOf(12);
    expect(new Set(matches.map((match) => match.id)).size).toBe(matches.length);
  });
});
