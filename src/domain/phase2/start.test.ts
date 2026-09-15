import { describe, expect, it } from 'vitest';
import type { TeamId } from '@/domain/ids';
import type { Match } from '@/domain/match/types';
import { bracketMatches, phaseMatches } from '@/domain/match/types';
import { addTeam } from '@/domain/tournament/teams';
import { createTournament } from '@/domain/tournament/tournament';
import type { Tournament } from '@/domain/tournament/types';
import { isThirdPlace } from './bracket';
import { bracketsLocked, drawBrackets, phase2Blocker, rematchesIn } from './start';

const t0 = '2026-09-15T09:00:00.000Z';
const t1 = '2026-09-15T10:00:00.000Z';

function match(id: number, home: TeamId, away: TeamId, score: [number, number]): Match {
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

function closedTournament(teamCount: number, matches: Match[]): Tournament {
  const base = Array.from({ length: teamCount }, (_unused, index) => `Equipe ${index + 1}`).reduce(
    (current, name) => addTeam(current, name, t0),
    createTournament('t1', 'Tournoi', t0)
  );

  return { ...base, phase: 'closing', matchCount: 1, matches };
}

const sixTeams = () =>
  closedTournament(6, [match(1, 1, 2, [13, 1]), match(2, 3, 4, [13, 2]), match(3, 5, 6, [13, 3])]);

describe('starting phase 2', () => {
  it('refuses to draw before the closing screen', () => {
    const tournament = { ...sixTeams(), phase: 'phase1' as const };

    expect(phase2Blocker(tournament)).toBe('not-closing');
    expect(drawBrackets(tournament, 42, t1)).toBe(tournament);
  });

  it('refuses to draw while a tie is unsettled', () => {
    const tied = closedTournament(4, [match(1, 1, 2, [13, 5]), match(2, 3, 4, [13, 5])]);

    expect(phase2Blocker(tied)).toBe('unsettled-ties');
    expect(drawBrackets(tied, 42, t1)).toBe(tied);
  });

  it('refuses a field too small to play anything', () => {
    const tiny = { ...closedTournament(2, [match(1, 1, 2, [13, 5])]), withdrawn: [1, 2] };

    expect(phase2Blocker(tiny)).toBe('not-enough-teams');
  });

  it('draws both brackets and moves to phase 2', () => {
    const drawn = drawBrackets(sixTeams(), 42, t1);

    expect(drawn.phase).toBe('phase2');
    expect(drawn.phase2Seed).toBe(42);
    expect(phaseMatches(drawn.matches, 'main').length).toBeGreaterThan(0);
    expect(phaseMatches(drawn.matches, 'consolation').length).toBeGreaterThan(0);
    expect(drawn.modified).toBe(t1);
  });

  it('keeps the qualification matches untouched', () => {
    const before = sixTeams();
    const drawn = drawBrackets(before, 42, t1);

    expect(phaseMatches(drawn.matches, 'phase1')).toEqual(before.matches);
  });

  it('gives every match a unique identifier across both brackets', () => {
    const drawn = drawBrackets(sixTeams(), 42, t1);

    expect(new Set(drawn.matches.map((one) => one.id)).size).toBe(drawn.matches.length);
  });

  it('seats each team in exactly one bracket', () => {
    const drawn = drawBrackets(sixTeams(), 42, t1);
    const seated = bracketMatches(drawn.matches).flatMap((one) =>
      one.slots.flatMap((slot) => (slot.kind === 'team' ? [slot.team] : []))
    );

    expect([...seated].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('R4.8 — the draw can be relaunched until a result is entered', () => {
    const drawn = drawBrackets(sixTeams(), 42, t1);

    expect(bracketsLocked(drawn)).toBe(false);
    expect(drawBrackets(drawn, 7, t1).phase2Seed).toBe(7);

    const firstBracketMatch = bracketMatches(drawn.matches).find((one) => !isThirdPlace(one));
    const locked = {
      ...drawn,
      matches: drawn.matches.map((one) =>
        one.id === firstBracketMatch?.id
          ? { ...one, status: 'played' as const, score: [13, 4] as [number, number] }
          : one
      ),
    };

    expect(bracketsLocked(locked)).toBe(true);
    expect(drawBrackets(locked, 7, t1)).toBe(locked);
  });

  it('reports the unavoidable rematches of each bracket', () => {
    const drawn = drawBrackets(sixTeams(), 42, t1);

    expect(rematchesIn(drawn, 'main')).toBe(0);
    expect(rematchesIn(drawn, 'consolation')).toBe(0);
  });

  it('excludes withdrawn teams from the brackets', () => {
    const reduced = { ...sixTeams(), withdrawn: [1] };
    const drawn = drawBrackets(reduced, 42, t1);
    const seated = bracketMatches(drawn.matches).flatMap((one) =>
      one.slots.flatMap((slot) => (slot.kind === 'team' ? [slot.team] : []))
    );

    expect(seated).not.toContain(1);
    expect(seated).toHaveLength(5);
  });
});
