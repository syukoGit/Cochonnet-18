export type TournamentId = string;

export type Timestamp = string;

export const PHASES = ['configuration', 'phase1', 'closing', 'phase2', 'results'] as const;

export type Phase = (typeof PHASES)[number];

export interface Tournament {
  id: TournamentId;
  name: string;
  phase: Phase;
  created: Timestamp;
  modified: Timestamp;
  opened: Timestamp;
}
