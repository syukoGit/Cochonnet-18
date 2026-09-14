import type { TeamId, Timestamp, TournamentId } from '@/domain/ids';
import type { Match } from '@/domain/match/types';
import type { Settings } from './settings';

export type { TeamId, Timestamp, TournamentId };

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
  matchCount: number;
  settings: Settings;
  matches: Match[];
  created: Timestamp;
  modified: Timestamp;
  opened: Timestamp;
}
