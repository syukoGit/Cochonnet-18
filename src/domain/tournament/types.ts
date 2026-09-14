export type TournamentId = string;

export type TeamId = number;

export type Timestamp = string;

export const PHASES = ['configuration', 'phase1', 'closing', 'phase2', 'results'] as const;

export type Phase = (typeof PHASES)[number];

export interface Team {
  id: TeamId;
  name: string;
}

export interface Tournament {
  id: TournamentId;
  name: string;
  phase: Phase;
  teams: Team[];
  nextTeamId: TeamId;
  created: Timestamp;
  modified: Timestamp;
  opened: Timestamp;
}
