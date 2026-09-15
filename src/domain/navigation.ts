import { resultsReady } from '@/domain/phase2/podium';
import { PHASES } from '@/domain/tournament/types';
import type { Tournament } from '@/domain/tournament/types';

export const STEPS = [...PHASES, 'results'] as const;

export type Step = (typeof STEPS)[number];

export type StepState = 'done' | 'open' | 'locked';

export interface StepEntry {
  step: Step;
  state: StepState;
}

export function stepsOf(tournament: Tournament): StepEntry[] {
  const reached = STEPS.indexOf(tournament.phase);
  const ready = resultsReady(tournament);

  return STEPS.map((step, index) => {
    if (step === 'results') {
      return { step, state: ready ? 'open' : 'locked' };
    }

    if (index === reached) {
      return { step, state: 'open' };
    }

    return { step, state: index < reached ? 'done' : 'locked' };
  });
}

export function canOpen(tournament: Tournament, step: Step): boolean {
  return stepsOf(tournament).some((entry) => entry.step === step && entry.state === 'open');
}

export function stepShown(tournament: Tournament, wanted: Step | null): Step {
  return wanted !== null && canOpen(tournament, wanted) ? wanted : tournament.phase;
}

export function furthestStep(tournament: Tournament): Step {
  return resultsReady(tournament) ? 'results' : tournament.phase;
}
