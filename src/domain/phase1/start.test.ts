import { describe, expect, it } from 'vitest';
import { addTeam } from '@/domain/tournament/teams';
import { createTournament } from '@/domain/tournament/tournament';
import type { Tournament } from '@/domain/tournament/types';
import { beyondGuaranteedSize, startBlocker, startPhase1 } from './start';

const t0 = '2026-09-14T09:00:00.000Z';
const t1 = '2026-09-14T10:00:00.000Z';

function withTeams(count: number, matchCount: number): Tournament {
  const base = Array.from({ length: count }, (_unused, index) => `Equipe ${index + 1}`).reduce(
    (tournament, name) => addTeam(tournament, name, t0),
    createTournament('t1', 'Tournoi', t0)
  );

  return { ...base, matchCount };
}

describe('starting phase 1', () => {
  it('refuses fewer than two teams', () => {
    expect(startBlocker(withTeams(1, 1))).toBe('not-enough-teams');
  });

  it('refuses a match count outside 1..N-1', () => {
    expect(startBlocker(withTeams(5, 0))).toBe('invalid-match-count');
    expect(startBlocker(withTeams(5, 5))).toBe('invalid-match-count');
    expect(startBlocker(withTeams(5, 4))).toBeNull();
  });

  it('draws the matches and moves to phase 1', () => {
    const started = startPhase1(withTeams(7, 3), 42, t1);

    expect(started.phase).toBe('phase1');
    expect(new Set(started.matches.map((match) => match.round)).size).toBe(3);
    expect(started.modified).toBe(t1);
  });

  it('never regenerates a draw already produced', () => {
    const started = startPhase1(withTeams(7, 3), 42, t1);
    const again = startPhase1(started, 99, t1);

    expect(startBlocker(started)).toBe('already-started');
    expect(again).toBe(started);
  });

  it('flags a field larger than the guaranteed range', () => {
    expect(beyondGuaranteedSize(withTeams(64, 3))).toBe(false);
    expect(beyondGuaranteedSize(withTeams(65, 3))).toBe(true);
  });
});
