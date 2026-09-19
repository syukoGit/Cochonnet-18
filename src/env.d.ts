/// <reference types="vite/client" />

import type { Tournament, TournamentId } from './domain/tournament/types';

export interface UnreadableTournament {
  file: string;
  reason: string;
  detail: string;
}

export interface Inventory {
  tournaments: Tournament[];
  unreadable: UnreadableTournament[];
}

export type ExportOutcome =
  | { status: 'cancelled' }
  | { status: 'written'; path: string }
  | { status: 'failed'; detail: string };

export type ImportOutcome =
  | { status: 'cancelled' }
  | { status: 'read'; tournament: Tournament }
  | { status: 'invalid'; reason: string; detail: string };

export interface TournamentBridge {
  list: () => Promise<Inventory>;
  read: (id: TournamentId) => Promise<Tournament | null>;
  write: (tournament: Tournament) => Promise<void>;
  remove: (id: TournamentId) => Promise<void>;
  export: (id: TournamentId) => Promise<ExportOutcome>;
  import: () => Promise<ImportOutcome>;
}

declare global {
  interface Window {
    cochonnet: { tournaments: TournamentBridge };
  }
}
