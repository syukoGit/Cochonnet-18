import { describe, expect, it } from 'vitest';
import { buildBracket } from '@/domain/phase2/bracket';
import { isReady, loserIn, occupantOf, occupantsIn, teamsIn, winnerIn } from './resolve';
import type { Match } from './types';

function must<T>(value: T | undefined, what: string): T {
  if (value === undefined) {
    throw new Error(`${what} introuvable dans le tableau de test`);
  }

  return value;
}

function played(matches: Match[], id: number, score: [number, number]): Match[] {
  return matches.map((match) =>
    match.id === id ? { ...match, status: 'played' as const, score } : match
  );
}

const fourTeams = () => buildBracket([1, 2, 3, 4], 'main', 1);

const finalOf = (matches: Match[]) =>
  must(
    matches.find(
      (match) => match.round === 2 && !match.slots.some((slot) => slot.kind === 'loser')
    ),
    'la finale'
  );

const firstOf = (matches: Match[]) => must(matches[0], 'le premier match');

describe('resolving a slot', () => {
  it('reads a team slot directly and leaves a bye empty', () => {
    expect(occupantOf([], { kind: 'team', team: 7 })).toBe(7);
    expect(occupantOf([], { kind: 'bye' })).toBeNull();
  });

  it('returns nothing when the source match is unknown', () => {
    expect(occupantOf([], { kind: 'winner', from: 99 })).toBeNull();
    expect(occupantOf([], { kind: 'loser', from: 99 })).toBeNull();
  });

  it('stays empty while the source match has no result', () => {
    const matches = fourTeams();

    expect(occupantsIn(matches, finalOf(matches))).toEqual([null, null]);
    expect(isReady(matches, finalOf(matches))).toBe(false);
  });

  it('carries the winner downstream once the source is decided', () => {
    const matches = played(played(fourTeams(), 1, [13, 7]), 2, [8, 13]);

    expect(occupantsIn(matches, finalOf(matches))).toEqual([1, 4]);
    expect(isReady(matches, finalOf(matches))).toBe(true);
  });

  it('carries the losers into the third place match', () => {
    const matches = played(played(fourTeams(), 1, [13, 7]), 2, [8, 13]);
    const thirdPlace = must(
      matches.find((match) => match.slots.every((slot) => slot.kind === 'loser')),
      'la petite finale'
    );

    expect(occupantsIn(matches, thirdPlace)).toEqual([2, 3]);
  });

  it('a bye lets its opponent through without a score', () => {
    const matches = buildBracket([1, null, 2, 3], 'main', 1);

    expect(occupantsIn(matches, finalOf(matches))).toEqual([1, null]);
  });

  it('names the winner and the loser of a played match', () => {
    const matches = played(fourTeams(), 1, [13, 7]);

    expect(winnerIn(matches, firstOf(matches))).toBe(1);
    expect(loserIn(matches, firstOf(matches))).toBe(2);
    expect(teamsIn(matches, firstOf(matches))).toEqual([1, 2]);
  });

  it('names the winner of a forfeit and has none while waiting', () => {
    const matches = fourTeams();

    expect(winnerIn(matches, firstOf(matches))).toBeNull();
    expect(loserIn(matches, firstOf(matches))).toBeNull();

    const forfeited = matches.map((match) =>
      match.id === firstOf(matches).id
        ? { ...match, status: 'forfeit' as const, forfeitBy: 2 }
        : match
    );

    expect(winnerIn(forfeited, firstOf(forfeited))).toBe(1);
    expect(loserIn(forfeited, firstOf(forfeited))).toBe(2);
  });

  it('I9 — a team never reaches a match it has not earned', () => {
    const matches = fourTeams();

    expect(teamsIn(matches, finalOf(matches))).toEqual([]);

    const afterFirst = played(matches, 1, [13, 7]);
    expect(teamsIn(afterFirst, finalOf(afterFirst))).toEqual([1]);

    const cleared = afterFirst.map((match) =>
      match.id === 1 ? { ...match, status: 'waiting' as const, score: undefined } : match
    );
    expect(teamsIn(cleared, finalOf(cleared))).toEqual([]);
  });
});
