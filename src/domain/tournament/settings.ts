import type { MatchPhase } from '@/domain/match/types';

export const BYE_POINTS_MODES = ['average', 'zero', 'forfeit13'] as const;

export type ByePointsMode = (typeof BYE_POINTS_MODES)[number];

export interface Settings {
  minimumGapPhase1: number;
  byePoints: ByePointsMode;
  forfeitDifferential: number;
  minimumGapPhase2: number;
}

export const DEFAULT_SETTINGS: Settings = {
  minimumGapPhase1: 0,
  byePoints: 'average',
  forfeitDifferential: 5,
  minimumGapPhase2: 0,
};

export const MAX_GAP = 16;

export const MAX_FORFEIT_DIFFERENTIAL = 13;

export function clampGap(value: number): number {
  return Math.min(Math.max(Math.trunc(value), 0), MAX_GAP);
}

export function clampForfeitDifferential(value: number): number {
  return Math.min(Math.max(Math.trunc(value), 0), MAX_FORFEIT_DIFFERENTIAL);
}

const GAP_BY_PHASE: Record<MatchPhase, keyof Settings> = {
  phase1: 'minimumGapPhase1',
};

export function minimumGapFor(settings: Settings, phase: MatchPhase): number {
  return Number(settings[GAP_BY_PHASE[phase]]);
}
