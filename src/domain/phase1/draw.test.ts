import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { isBye, opponents } from '@/domain/match/types';
import type { Match } from '@/domain/match/types';
import type { TeamId } from '@/domain/tournament/types';
import { drawPhase1, maxMatchCount } from './draw';

const teamIds = (count: number): TeamId[] =>
  Array.from({ length: count }, (_unused, index) => index + 1);

function playedCounts(matches: Match[], teams: TeamId[]): Map<TeamId, number> {
  const counts = new Map(teams.map((team) => [team, 0]));

  for (const match of matches.filter((match) => !isBye(match))) {
    for (const team of opponents(match)) {
      counts.set(team, (counts.get(team) ?? 0) + 1);
    }
  }

  return counts;
}

function byesByRound(matches: Match[]): TeamId[] {
  return matches.filter(isBye).flatMap((match) => opponents(match));
}

const scenario = fc.integer({ min: 2, max: 64 }).chain((teamCount) =>
  fc.record({
    teamCount: fc.constant(teamCount),
    matchCount: fc.integer({ min: 1, max: maxMatchCount(teamCount) }),
    seed: fc.integer({ min: 0, max: 2 ** 31 - 1 }),
  })
);

describe('phase 1 draw', () => {
  it('I1 — no pair of teams meets twice', () => {
    fc.assert(
      fc.property(scenario, ({ teamCount, matchCount, seed }) => {
        const matches = drawPhase1(teamIds(teamCount), matchCount, seed);
        const seen = new Set<string>();

        for (const match of matches.filter((match) => !isBye(match))) {
          const key = [...opponents(match)].sort((a, b) => a - b).join('-');
          expect(seen.has(key)).toBe(false);
          seen.add(key);
        }
      }),
      { numRuns: 300 }
    );
  });

  it('I2 — the busiest and the least busy team differ by at most one match', () => {
    fc.assert(
      fc.property(scenario, ({ teamCount, matchCount, seed }) => {
        const teams = teamIds(teamCount);
        const counts = [...playedCounts(drawPhase1(teams, matchCount, seed), teams).values()];

        expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
      }),
      { numRuns: 300 }
    );
  });

  it('I3 — no team gets a second bye before every other has had one', () => {
    fc.assert(
      fc.property(scenario, ({ teamCount, matchCount, seed }) => {
        const byes = byesByRound(drawPhase1(teamIds(teamCount), matchCount, seed));

        expect(new Set(byes).size).toBe(byes.length);
      }),
      { numRuns: 300 }
    );
  });

  it('produces exactly one round per requested match', () => {
    fc.assert(
      fc.property(scenario, ({ teamCount, matchCount, seed }) => {
        const matches = drawPhase1(teamIds(teamCount), matchCount, seed);
        const rounds = new Set(matches.map((match) => match.round));

        expect(rounds.size).toBe(matchCount);
        expect([...rounds].sort((a, b) => a - b)).toEqual(
          Array.from({ length: matchCount }, (_unused, index) => index + 1)
        );
      }),
      { numRuns: 200 }
    );
  });

  it('every team appears exactly once per round', () => {
    fc.assert(
      fc.property(scenario, ({ teamCount, matchCount, seed }) => {
        const matches = drawPhase1(teamIds(teamCount), matchCount, seed);

        for (let round = 1; round <= matchCount; round += 1) {
          const appearing = matches
            .filter((match) => match.round === round)
            .flatMap((match) => opponents(match));

          expect(appearing.sort((a, b) => a - b)).toEqual(teamIds(teamCount));
        }
      }),
      { numRuns: 200 }
    );
  });

  it('the same seed always produces the same draw', () => {
    fc.assert(
      fc.property(scenario, ({ teamCount, matchCount, seed }) => {
        expect(drawPhase1(teamIds(teamCount), matchCount, seed)).toEqual(
          drawPhase1(teamIds(teamCount), matchCount, seed)
        );
      }),
      { numRuns: 100 }
    );
  });

  it('bounds the number of rounds to the teams available', () => {
    expect(maxMatchCount(2)).toBe(1);
    expect(maxMatchCount(5)).toBe(4);
    expect(maxMatchCount(6)).toBe(5);
    expect(drawPhase1(teamIds(4), 99, 1)).toEqual([]);
    expect(drawPhase1(teamIds(1), 1, 1)).toEqual([]);
  });

  it('gives a bye to exactly one team per round when the count is odd', () => {
    const matches = drawPhase1(teamIds(7), 3, 42);

    for (let round = 1; round <= 3; round += 1) {
      const byes = matches.filter((match) => match.round === round && isBye(match));
      expect(byes).toHaveLength(1);
    }
  });

  it('gives no bye at all when the count is even', () => {
    expect(drawPhase1(teamIds(8), 5, 42).filter(isBye)).toEqual([]);
  });
});
