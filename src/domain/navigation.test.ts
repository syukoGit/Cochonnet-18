import { describe, expect, it } from 'vitest';
import type { TeamId } from '@/domain/ids';
import { clearEntry, enterScore } from '@/domain/match/entry';
import type { Match } from '@/domain/match/types';
import { drawBrackets } from '@/domain/phase2/start';
import { addTeam } from '@/domain/tournament/teams';
import { createTournament } from '@/domain/tournament/tournament';
import type { Phase, Tournament } from '@/domain/tournament/types';
import { canOpen, furthestStep, stepShown, stepsOf } from './navigation';

const t0 = '2026-09-15T09:00:00.000Z';
const t1 = '2026-09-15T10:00:00.000Z';

function qualification(id: number, home: TeamId, away: TeamId, score: [number, number]): Match {
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

function at(phase: Phase): Tournament {
  const base = ['A', 'B', 'C'].reduce(
    (current, name) => addTeam(current, name, t0),
    createTournament('t1', 'Tournoi', t0)
  );

  return { ...base, phase, matchCount: 1, matches: [qualification(1, 1, 2, [13, 1])] };
}

function stateOf(tournament: Tournament, step: string): string {
  return stepsOf(tournament).find((entry) => entry.step === step)?.state ?? 'missing';
}

describe('R7.2 — the reachable steps come from the state', () => {
  it('opens only the step the tournament actually stands on', () => {
    const tournament = at('phase1');

    expect(stateOf(tournament, 'configuration')).toBe('done');
    expect(stateOf(tournament, 'phase1')).toBe('open');
    expect(stateOf(tournament, 'closing')).toBe('locked');
    expect(stateOf(tournament, 'phase2')).toBe('locked');
    expect(stateOf(tournament, 'results')).toBe('locked');
  });

  it('starts a fresh tournament on configuration and nothing else', () => {
    const fresh = at('configuration');

    expect(stepShown(fresh, null)).toBe('configuration');
    expect(canOpen(fresh, 'phase2')).toBe(false);
    expect(stepShown(fresh, 'phase2')).toBe('configuration');
  });

  it('keeps the results locked while a bracket has no winner', () => {
    const drawn = drawBrackets(at('closing'), 42, t1);

    expect(drawn.phase).toBe('phase2');
    expect(stateOf(drawn, 'results')).toBe('locked');
    expect(stepShown(drawn, 'results')).toBe('phase2');
    expect(furthestStep(drawn)).toBe('phase2');
  });

  it('never leaves the entry screen on its own once the results open', () => {
    const drawn = drawBrackets(at('closing'), 42, t1);
    const played = drawn.matches
      .filter((match) => match.phase !== 'phase1')
      .reduce((current, match) => enterScore(current, match.id, [13, 5], t1), drawn);

    expect(stateOf(played, 'results')).toBe('open');
    expect(stateOf(played, 'phase2')).toBe('open');
    expect(stepShown(played, null)).toBe('phase2');
    expect(stepShown(played, 'results')).toBe('results');
    expect(furthestStep(played)).toBe('results');
  });

  it('falls back to the current step when the wanted one closes again', () => {
    const drawn = drawBrackets(at('closing'), 42, t1);
    const played = drawn.matches
      .filter((match) => match.phase !== 'phase1')
      .reduce((current, match) => enterScore(current, match.id, [13, 5], t1), drawn);

    const reopened = clearEntry(played, played.matches[1]?.id ?? 0, t1);

    expect(stepShown(reopened, 'results')).toBe('phase2');
  });
});
