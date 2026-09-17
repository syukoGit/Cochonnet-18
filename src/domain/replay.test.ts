import { describe, expect, it } from 'vitest';
import { hasResult, isBye, phaseMatches } from '@/domain/match/types';
import { maxMatchCount } from '@/domain/phase1/draw';
import { GUARANTEED_TEAMS } from '@/domain/phase1/start';
import { replay } from './replay';
import type { Report, Scenario } from './replay';

const t0 = '2026-09-17T09:00:00.000Z';

const SIZES = [2, 3, 4, 5, 6, 7, 8, 9, 11, 16, 31, 32, 33, 64, 65];

function scenarioOf(teamCount: number, rounds = 3, seed = 42): Scenario {
  return {
    name: `${teamCount} teams`,
    teams: Array.from({ length: teamCount }, (_unused, index) => `Equipe ${index + 1}`),
    matchCount: Math.min(rounds, maxMatchCount(teamCount)),
    seed,
  };
}

function podiumSize(report: Report, phase: 'main' | 'consolation'): number {
  const bracket = report.brackets.find((one) => one.phase === phase);

  return [bracket?.podium.first, bracket?.podium.second, bracket?.podium.third].filter(
    (name) => name !== null && name !== undefined
  ).length;
}

describe('replaying a whole tournament', () => {
  it('reproduces itself exactly from the same seed', () => {
    const first = replay(scenarioOf(12), t0);
    const second = replay(scenarioOf(12), t0);

    expect(second.tournament).toEqual(first.tournament);
  });

  it('follows the seed it is given', () => {
    const first = replay(scenarioOf(12, 3, 1), t0);
    const second = replay(scenarioOf(12, 3, 2), t0);

    expect(second.qualification).not.toEqual(first.qualification);
  });

  it('honours the scores a scenario pins down', () => {
    const base = scenarioOf(4, 1);
    const pinned = replay({ ...base, scores: { '1': [13, 0] } }, t0);

    expect(pinned.qualification.find((match) => match.id === 1)?.score).toEqual([13, 0]);
  });

  it('reports the blocker instead of throwing when the field is too small', () => {
    const report = replay({ ...scenarioOf(2), teams: ['Seule'] }, t0);

    expect(report.blocked).toBe('not-enough-teams');
    expect(report.brackets.every((bracket) => bracket.matches.length === 0)).toBe(true);
  });

  it('reports the blocker when every team withdraws at the closing', () => {
    const report = replay({ ...scenarioOf(2, 1), withdrawn: [1, 2] }, t0);

    expect(report.blocked).toBe('not-enough-teams');
  });

  it('carries the withdrawals through to the split', () => {
    const report = replay({ ...scenarioOf(8), withdrawn: [1] }, t0);
    const seated = report.brackets.flatMap((bracket) => bracket.teams);

    expect(seated).toHaveLength(7);
    expect(report.tournament.withdrawn).toEqual([1]);
  });
});

describe('R2.13 — ties the criteria cannot separate', () => {
  it('settles them from the seed and says which ones it settled', () => {
    const report = replay(scenarioOf(GUARANTEED_TEAMS + 1), t0);

    expect(report.settledTies.length).toBeGreaterThan(0);
    expect(report.unresolvedTies).toEqual([]);
    expect(report.blocked).toBeNull();
  });

  it('settles them the same way every time, so a replay stays a replay', () => {
    const first = replay(scenarioOf(GUARANTEED_TEAMS + 1), t0);
    const second = replay(scenarioOf(GUARANTEED_TEAMS + 1), t0);

    expect(second.settledTies).toEqual(first.settledTies);
    expect(second.tournament.tieBreaks).toEqual(first.tournament.tieBreaks);
  });

  it('leaves the list empty when the criteria separate everyone', () => {
    expect(replay(scenarioOf(8), t0).settledTies).toEqual([]);
  });
});

describe('R1.4 — the application holds at every field size', () => {
  it.each(SIZES)('%i teams run from the draw to the podium', (teamCount) => {
    const report = replay(scenarioOf(teamCount), t0);

    expect(report.blocked).toBeNull();
    expect(report.teams).toBe(teamCount);
    expect(report.ranking).toHaveLength(teamCount);

    const qualification = phaseMatches(report.tournament.matches, 'phase1');

    expect(qualification.filter((match) => !isBye(match)).every(hasResult)).toBe(true);
    expect(report.tournament.matches.filter((match) => !isBye(match)).every(hasResult)).toBe(true);
  });

  it.each(SIZES)('%i teams produce a podium consistent with each group size', (teamCount) => {
    const report = replay(scenarioOf(teamCount), t0);

    for (const bracket of report.brackets) {
      const size = bracket.teams.length;
      const expected = size === 0 ? 0 : size === 1 ? 1 : size === 2 ? 2 : 3;

      expect(podiumSize(report, bracket.phase)).toBe(expected);
    }
  });

  it('keeps going past the size the tests guarantee', () => {
    const report = replay(scenarioOf(GUARANTEED_TEAMS + 1), t0);

    expect(report.blocked).toBeNull();
    expect(report.teams).toBeGreaterThan(GUARANTEED_TEAMS);
  });

  it('gives an odd field exactly one bye per round', () => {
    const report = replay(scenarioOf(9), t0);
    const byRound = new Map<number, number>();

    for (const match of phaseMatches(report.tournament.matches, 'phase1').filter(isBye)) {
      byRound.set(match.round, (byRound.get(match.round) ?? 0) + 1);
    }

    expect([...byRound.values()]).toEqual([1, 1, 1]);
  });
});
