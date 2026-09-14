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

export interface TournamentBridge {
  list: () => Promise<Inventory>;
  read: (id: TournamentId) => Promise<Tournament | null>;
  write: (tournament: Tournament) => Promise<void>;
  remove: (id: TournamentId) => Promise<void>;
}

declare global {
  interface Window {
    cochonnet: { tournaments: TournamentBridge };
  }
}
