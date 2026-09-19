import type { TeamId } from '@/domain/ids';
import { occupantsIn } from '@/domain/match/resolve';
import type { Match } from '@/domain/match/types';
import { isThirdPlace } from '@/domain/phase2/bracket';
import type { Step } from '@/domain/navigation';

export const STEP_LABELS: Record<Step, string> = {
  configuration: 'Configuration',
  phase1: 'Phase 1',
  closing: 'Clôture',
  phase2: 'Phase 2',
  results: 'Résultats',
};

export function lastRoundOf(matches: readonly Match[]): number {
  return matches.reduce((highest, match) => Math.max(highest, match.round), 1);
}

export function roundLabel(round: number, lastRound: number): string {
  if (round === lastRound) {
    return 'Finale';
  }

  if (round === lastRound - 1) {
    return 'Demi-finales';
  }

  if (round === lastRound - 2) {
    return 'Quarts';
  }

  return `Tour ${round}`;
}

export function matchLabel(match: Match, lastRound: number): string {
  return isThirdPlace(match) ? 'Petite finale' : roundLabel(match.round, lastRound);
}

export function slotLabel(
  allMatches: readonly Match[],
  match: Match,
  index: 0 | 1,
  nameOf: (team: TeamId) => string
): string {
  const occupant = occupantsIn(allMatches, match)[index];

  if (occupant !== null) {
    return nameOf(occupant);
  }

  const slot = match.slots[index];

  if (slot.kind === 'winner') {
    return `vainqueur du match ${slot.from}`;
  }

  if (slot.kind === 'loser') {
    return `perdant du match ${slot.from}`;
  }

  return 'exempte';
}
