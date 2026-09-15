import { describe, expect, it } from 'vitest';
import type { TeamId } from '@/domain/ids';
import type { Match } from '@/domain/match/types';
import { findDecision, pruneDecisions, recordDecision, sameTeamSet, separate } from './tiebreak';
import type { Contender } from './tiebreak';

function played(id: number, home: TeamId, away: TeamId, score: [number, number]): Match {
  return {
    id,
    phase: 'phase1',
    round: 1,
    slots: [
      { kind: 'team', team: home },
      { kind: 'team', team: away },
    ],
    status: 'played',
    score,
  };
}

const contender = (team: TeamId, wins: number, pointsScored: number): Contender => ({
  team,
  wins,
  pointsScored,
});

const teamsOf = (blocks: Contender[][]) => blocks.map((block) => block.map((one) => one.team));

describe('tie-break chain', () => {
  it('separates on the number of wins first', () => {
    const blocks = separate([contender(1, 1, 20), contender(2, 2, 10)], [], 5);

    expect(teamsOf(blocks)).toEqual([[2], [1]]);
  });

  it('uses head to head only when every pair has met', () => {
    const group = [contender(1, 1, 20), contender(2, 1, 20)];

    expect(teamsOf(separate(group, [], 5))).toEqual([[1, 2]]);
    expect(teamsOf(separate(group, [played(1, 2, 1, [13, 4])], 5))).toEqual([[2], [1]]);
  });

  it('orders a group of three on the differential of their own matches only', () => {
    const group = [contender(1, 1, 30), contender(2, 1, 30), contender(3, 1, 30)];
    const matches = [
      played(1, 1, 2, [13, 3]),
      played(2, 2, 3, [13, 11]),
      played(3, 3, 1, [13, 12]),
      played(4, 1, 9, [13, 0]),
    ];

    expect(teamsOf(separate(group, matches, 5))).toEqual([[1], [3], [2]]);
  });

  it('falls back to points scored when head to head does not apply', () => {
    const group = [contender(1, 1, 20), contender(2, 1, 26)];

    expect(teamsOf(separate(group, [], 5))).toEqual([[2], [1]]);
  });

  it('leaves a genuine tie in one block, ordered deterministically', () => {
    const blocks = separate([contender(5, 1, 20), contender(2, 1, 20)], [], 5);

    expect(teamsOf(blocks)).toEqual([[2, 5]]);
  });
});

describe('recorded decisions', () => {
  it('matches a set whatever the order it is written in', () => {
    expect(sameTeamSet([1, 2, 3], [3, 1, 2])).toBe(true);
    expect(sameTeamSet([1, 2], [1, 2, 3])).toBe(false);
    expect(sameTeamSet([1, 2], [1, 4])).toBe(false);
  });

  it('finds a decision by its set, and replaces rather than duplicates', () => {
    const first = recordDecision([], { teams: [1, 2], order: [2, 1] });
    const second = recordDecision(first, { teams: [2, 1], order: [1, 2] });

    expect(second).toHaveLength(1);
    expect(findDecision(second, [1, 2])?.order).toEqual([1, 2]);
    expect(findDecision(second, [3, 4])).toBeNull();
  });

  it('prunes decisions whose tie no longer exists', () => {
    const decisions = recordDecision(recordDecision([], { teams: [1, 2], order: [2, 1] }), {
      teams: [3, 4],
      order: [3, 4],
    });

    expect(pruneDecisions(decisions, [[1, 2]])).toHaveLength(1);
    expect(pruneDecisions(decisions, [])).toEqual([]);
  });
});
