import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  byMostRecentlyOpened,
  createTournament,
  markOpened,
  renameTournament,
} from '@/domain/tournament/tournament';
import type { Tournament, TournamentId } from '@/domain/tournament/types';
import type { UnreadableTournament } from '@/env';

const WRITE_DEBOUNCE_MS = 500;

const timers = new Map<TournamentId, ReturnType<typeof setTimeout>>();

function scheduleWrite(tournament: Tournament): void {
  clearTimeout(timers.get(tournament.id));

  timers.set(
    tournament.id,
    setTimeout(() => {
      timers.delete(tournament.id);
      void window.cochonnet.tournaments.write(tournament);
    }, WRITE_DEBOUNCE_MS)
  );
}

interface TournamentsState {
  list: Tournament[];
  unreadable: UnreadableTournament[];
  current: Tournament | null;
  loading: boolean;
  load: () => Promise<void>;
  create: (name: string) => Promise<TournamentId>;
  open: (id: TournamentId) => void;
  rename: (id: TournamentId, name: string) => void;
  remove: (id: TournamentId) => Promise<void>;
}

function now(): string {
  return new Date().toISOString();
}

function newId(): TournamentId {
  return crypto.randomUUID();
}

export const useTournaments = create<TournamentsState>()(
  immer((set, get) => ({
    list: [],
    unreadable: [],
    current: null,
    loading: true,

    load: async () => {
      const inventory = await window.cochonnet.tournaments.list();

      set((state) => {
        state.list = [...inventory.tournaments].sort(byMostRecentlyOpened);
        state.unreadable = inventory.unreadable;
        state.loading = false;
      });
    },

    create: async (name) => {
      const tournament = createTournament(newId(), name, now());
      await window.cochonnet.tournaments.write(tournament);

      set((state) => {
        state.list.unshift(tournament);
        state.current = tournament;
      });

      return tournament.id;
    },

    open: (id) => {
      const found = get().list.find((tournament) => tournament.id === id);

      if (!found) {
        return;
      }

      const opened = markOpened(found, now());
      scheduleWrite(opened);

      set((state) => {
        state.current = opened;
        const index = state.list.findIndex((tournament) => tournament.id === id);
        if (index >= 0) {
          state.list[index] = opened;
        }
      });
    },

    rename: (id, name) => {
      const found = get().list.find((tournament) => tournament.id === id);

      if (!found) {
        return;
      }

      const renamed = renameTournament(found, name, now());

      if (renamed === found) {
        return;
      }

      scheduleWrite(renamed);

      set((state) => {
        const index = state.list.findIndex((tournament) => tournament.id === id);
        if (index >= 0) {
          state.list[index] = renamed;
        }
        if (state.current?.id === id) {
          state.current = renamed;
        }
      });
    },

    remove: async (id) => {
      clearTimeout(timers.get(id));
      timers.delete(id);
      await window.cochonnet.tournaments.remove(id);

      set((state) => {
        state.list = state.list.filter((tournament) => tournament.id !== id);
        if (state.current?.id === id) {
          state.current = null;
        }
      });
    },
  }))
);
