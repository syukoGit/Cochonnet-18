import type { ByePointsMode } from '@/domain/tournament/settings';

function roundAwayFromZero(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}

export interface ByeCreditInput {
  byes: number;
  played: number;
  differentialFromMatches: number;
}

export function byeCredit(input: ByeCreditInput, mode: ByePointsMode): number {
  if (input.byes === 0) {
    return 0;
  }

  if (mode === 'zero') {
    return 0;
  }

  if (mode === 'forfeit13') {
    return 13 * input.byes;
  }

  if (input.played === 0) {
    return 0;
  }

  return roundAwayFromZero(input.differentialFromMatches / input.played) * input.byes;
}
