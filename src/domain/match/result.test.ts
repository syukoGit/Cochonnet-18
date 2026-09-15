import { describe, expect, it } from 'vitest';
import { clearResult, loserOf, recordForfeit, recordScore, winnerOf } from './result';
import type { Match } from './types';

const playable: Match = {
  id: 1,
  phase: 'phase1',
  round: 1,
  slots: [
    { kind: 'team', team: 7 },
    { kind: 'team', team: 9 },
  ],
  status: 'waiting',
};

const bye: Match = {
  id: 2,
  phase: 'phase1',
  round: 1,
  slots: [{ kind: 'team', team: 7 }, { kind: 'bye' }],
  status: 'waiting',
};

describe('recording a match result', () => {
  it('records a valid score and names the winner', () => {
    const played = recordScore(playable, [13, 8], 0);

    expect(played.status).toBe('played');
    expect(winnerOf(played)).toBe(7);
    expect(loserOf(played)).toBe(9);
  });

  it('names the winner when the away team wins', () => {
    const played = recordScore(playable, [8, 13], 0);

    expect(winnerOf(played)).toBe(9);
    expect(loserOf(played)).toBe(7);
  });

  it('leaves the match untouched when the same score is entered twice', () => {
    const played = recordScore(playable, [13, 8], 0);

    expect(recordScore(played, [13, 8], 0)).toBe(played);
    expect(recordScore(played, [13, 9], 0)).not.toBe(played);
  });

  it('refuses an unreachable score', () => {
    expect(recordScore(playable, [14, 12], 0)).toBe(playable);
  });

  it('honours the minimum gap it is given', () => {
    expect(recordScore(playable, [13, 12], 2)).toBe(playable);
    expect(recordScore(playable, [14, 12], 2).status).toBe('played');
  });

  it('records a forfeit and gives the win to the team present', () => {
    const forfeited = recordForfeit(playable, 9);

    expect(forfeited.status).toBe('forfeit');
    expect(winnerOf(forfeited)).toBe(7);
    expect(loserOf(forfeited)).toBe(9);
  });

  it('leaves the match untouched when the same forfeit is entered twice', () => {
    const forfeited = recordForfeit(playable, 9);

    expect(recordForfeit(forfeited, 9)).toBe(forfeited);
    expect(recordForfeit(forfeited, 7)).not.toBe(forfeited);
  });

  it('a forfeit clears any score already recorded', () => {
    const forfeited = recordForfeit(recordScore(playable, [13, 8], 0), 7);

    expect(forfeited.score).toBeUndefined();
    expect(winnerOf(forfeited)).toBe(9);
  });

  it('clears a result back to waiting and leaves a waiting match untouched', () => {
    const played = recordScore(playable, [13, 8], 0);
    const cleared = clearResult(played);

    expect(cleared.status).toBe('waiting');
    expect(cleared.score).toBeUndefined();
    expect(clearResult(playable)).toBe(playable);
  });

  it('has no winner while the match is waiting, nor on a bye', () => {
    expect(winnerOf(playable)).toBeNull();
    expect(loserOf(playable)).toBeNull();
    expect(winnerOf(bye)).toBeNull();
    expect(loserOf(bye)).toBeNull();
  });
});
