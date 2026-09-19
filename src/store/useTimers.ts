import { create } from 'zustand';
import type { MatchId } from '@/domain/ids';
import type { TournamentId } from '@/domain/tournament/types';

type TimerKey = string;

type Running = Record<TimerKey, number>;

function keyOf(tournament: TournamentId, match: MatchId): TimerKey {
  return `${tournament}#${match}`;
}

function without(running: Running, key: TimerKey): Running {
  return Object.fromEntries(Object.entries(running).filter(([held]) => held !== key));
}

interface TimersState {
  startedAt: Running;
  startedFor: (tournament: TournamentId, match: MatchId) => number | null;
  toggle: (tournament: TournamentId, match: MatchId) => void;
  stop: (tournament: TournamentId, match: MatchId) => void;
}

export const useTimers = create<TimersState>()((set, get) => ({
  startedAt: {},

  startedFor: (tournament, match) => get().startedAt[keyOf(tournament, match)] ?? null,

  toggle: (tournament, match) => {
    const key = keyOf(tournament, match);

    set((state) =>
      state.startedAt[key] === undefined
        ? { startedAt: { ...state.startedAt, [key]: Date.now() } }
        : { startedAt: without(state.startedAt, key) }
    );
  },

  stop: (tournament, match) => {
    const key = keyOf(tournament, match);

    set((state) =>
      state.startedAt[key] === undefined ? state : { startedAt: without(state.startedAt, key) }
    );
  },
}));
