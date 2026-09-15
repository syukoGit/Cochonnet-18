import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { TeamId } from '@/domain/ids';
import type { Match } from '@/domain/match/types';
import { bracketShape } from './bracket';
import { drawSeats, MAX_ATTEMPTS, pairKey, pastOpponents } from './bracketDraw';

const teamIds = (count: number): TeamId[] =>
  Array.from({ length: count }, (_unused, index) => index + 1);

function met(id: number, home: TeamId, away: TeamId): Match {
  return {
    id,
    phase: 'phase1',
    round: 1,
    slots: [
      { kind: 'team', team: home },
      { kind: 'team', team: away },
    ],
    status: 'played',
    score: [13, 5],
  };
}

function allPairsMet(teams: readonly TeamId[]): Match[] {
  const matches: Match[] = [];
  let id = 1;

  for (let first = 0; first < teams.length; first += 1) {
    for (let second = first + 1; second < teams.length; second += 1) {
      matches.push(met(id++, teams[first] ?? 0, teams[second] ?? 0));
    }
  }

  return matches;
}

function firstRoundPairsOf(seats: readonly (TeamId | null)[]): [TeamId, TeamId][] {
  const pairs: [TeamId, TeamId][] = [];

  for (let pair = 0; pair < seats.length / 2; pair += 1) {
    const home = seats[pair * 2] ?? null;
    const away = seats[pair * 2 + 1] ?? null;

    if (home !== null && away !== null) {
      pairs.push([home, away]);
    }
  }

  return pairs;
}

describe('bracket draw', () => {
  it('seats every team exactly once and fills the bracket size', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 64 }),
        fc.integer({ min: 0, max: 2 ** 31 - 1 }),
        (teamCount, seed) => {
          const teams = teamIds(teamCount);
          const { seats } = drawSeats(teams, [], seed);

          expect(seats).toHaveLength(bracketShape(teamCount).size);
          expect(seats.filter((seat) => seat !== null).sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual(
            teams
          );
        }
      ),
      { numRuns: 200 }
    );
  });

  it('I6 — never puts two byes in the same first round pair', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 64 }),
        fc.integer({ min: 0, max: 2 ** 31 - 1 }),
        (teamCount, seed) => {
          const { seats } = drawSeats(teamIds(teamCount), [], seed);

          for (let pair = 0; pair < seats.length / 2; pair += 1) {
            expect(seats[pair * 2] === null && seats[pair * 2 + 1] === null).toBe(false);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it('I7 — finds a clean draw whenever one exists', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 4, max: 32 }),
        fc.integer({ min: 0, max: 2 ** 31 - 1 }),
        (teamCount, seed) => {
          const teams = teamIds(teamCount);
          const history = [met(1, teams[0] ?? 0, teams[1] ?? 0)];
          const { seats, rematches } = drawSeats(teams, history, seed);

          expect(rematches).toBe(0);
          expect(firstRoundPairsOf(seats).map(([home, away]) => pairKey(home, away))).not.toContain(
            pairKey(teams[0] ?? 0, teams[1] ?? 0)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('I7 — reports the unavoidable rematches when no clean draw exists', () => {
    const teams = teamIds(4);
    const { seats, rematches } = drawSeats(teams, allPairsMet(teams), 42);

    expect(rematches).toBe(2);
    expect(firstRoundPairsOf(seats)).toHaveLength(2);
  });

  it('I7 — a partly met field still reaches the achievable minimum', () => {
    const teams = teamIds(4);
    const history = [met(1, 1, 2), met(2, 3, 4), met(3, 1, 3), met(4, 2, 4)];
    const { rematches } = drawSeats(teams, history, 7);

    expect(rematches).toBe(0);
  });

  it('is deterministic for a given seed, and varies across seeds', () => {
    const teams = teamIds(8);

    expect(drawSeats(teams, [], 42)).toEqual(drawSeats(teams, [], 42));

    const layouts = new Set(
      Array.from({ length: 20 }, (_unused, seed) => drawSeats(teams, [], seed).seats.join(','))
    );

    expect(layouts.size).toBeGreaterThan(1);
  });

  it('reads past opponents from phase 1 only, ignoring unplayed matches', () => {
    const history = [
      met(1, 1, 2),
      { ...met(2, 3, 4), status: 'waiting' as const, score: undefined },
    ];

    expect(pastOpponents(history)).toEqual(new Set([pairKey(1, 2)]));
  });

  it('stops early rather than exhausting its budget on a clean field', () => {
    expect(MAX_ATTEMPTS).toBe(1000);
    expect(drawSeats(teamIds(16), [], 1).rematches).toBe(0);
  });

  it('handles groups too small to draw', () => {
    expect(drawSeats([], [], 1)).toEqual({ seats: [], rematches: 0 });
    expect(drawSeats([7], [], 1)).toEqual({ seats: [7], rematches: 0 });
  });
});
