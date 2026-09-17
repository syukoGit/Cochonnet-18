import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { clearEntry, enterForfeit, enterScore } from '@/domain/match/entry';
import { startPhase1 } from '@/domain/phase1/start';
import { recordDecision } from '@/domain/phase1/tiebreak';
import { closePhase1, reinstate, reopenPhase1, withdraw } from '@/domain/phase2/split';
import { drawBrackets } from '@/domain/phase2/start';
import { addTeam, removeTeam, renameTeam } from '@/domain/tournament/teams';
import type { Settings } from '@/domain/tournament/settings';
import {
  asCopy,
  byMostRecentlyOpened,
  createTournament,
  markOpened,
  renameTournament,
} from '@/domain/tournament/tournament';
import type { MatchId } from '@/domain/ids';
import type { Score } from '@/domain/score/validity';
import type { TeamId, Tournament, TournamentId } from '@/domain/tournament/types';
import type { ExportOutcome, ImportOutcome, UnreadableTournament } from '@/env';

const WRITE_DEBOUNCE_MS = 500;

const timers = new Map<TournamentId, ReturnType<typeof setTimeout>>();

async function flushWrite(tournament: Tournament): Promise<void> {
  clearTimeout(timers.get(tournament.id));
  timers.delete(tournament.id);
  await window.cochonnet.tournaments.write(tournament);
}

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
  addTeam: (name: string) => void;
  renameTeam: (teamId: TeamId, name: string) => void;
  removeTeam: (teamId: TeamId) => void;
  setMatchCount: (matchCount: number) => void;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  startPhase1: () => void;
  enterScore: (matchId: MatchId, score: Score) => void;
  enterForfeit: (matchId: MatchId, absent: TeamId) => void;
  clearEntry: (matchId: MatchId) => void;
  closePhase1: () => void;
  reopenPhase1: () => void;
  withdraw: (team: TeamId) => void;
  reinstate: (team: TeamId) => void;
  settleTie: (teams: TeamId[], order: TeamId[]) => void;
  drawBrackets: () => void;
  exportTournament: (id: TournamentId) => Promise<ExportOutcome>;
  importTournament: () => Promise<ImportOutcome>;
  adopt: (tournament: Tournament, mode: 'replace' | 'copy') => Promise<TournamentId>;
}

function now(): string {
  return new Date().toISOString();
}

function newId(): TournamentId {
  return crypto.randomUUID();
}

function drawSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
}

type Setter = (recipe: (state: TournamentsState) => void) => void;
type Getter = () => TournamentsState;

function applyToCurrent(
  set: Setter,
  get: Getter,
  change: (tournament: Tournament) => Tournament
): void {
  const current = get().current;

  if (!current) {
    return;
  }

  const updated = change(current);

  if (updated === current) {
    return;
  }

  scheduleWrite(updated);

  set((state) => {
    state.current = updated;
    const index = state.list.findIndex((tournament) => tournament.id === updated.id);
    if (index >= 0) {
      state.list[index] = updated;
    }
  });
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

    addTeam: (name) => {
      applyToCurrent(set, get, (tournament) => addTeam(tournament, name, now()));
    },

    renameTeam: (teamId, name) => {
      applyToCurrent(set, get, (tournament) => renameTeam(tournament, teamId, name, now()));
    },

    removeTeam: (teamId) => {
      applyToCurrent(set, get, (tournament) => removeTeam(tournament, teamId, now()));
    },

    setMatchCount: (matchCount) => {
      applyToCurrent(set, get, (tournament) =>
        tournament.matchCount === matchCount
          ? tournament
          : { ...tournament, matchCount, modified: now() }
      );
    },

    setSetting: (key, value) => {
      applyToCurrent(set, get, (tournament) =>
        tournament.settings[key] === value
          ? tournament
          : {
              ...tournament,
              settings: { ...tournament.settings, [key]: value },
              modified: now(),
            }
      );
    },

    startPhase1: () => {
      applyToCurrent(set, get, (tournament) => startPhase1(tournament, drawSeed(), now()));
    },

    enterScore: (matchId, score) => {
      applyToCurrent(set, get, (tournament) => enterScore(tournament, matchId, score, now()));
    },

    enterForfeit: (matchId, absent) => {
      applyToCurrent(set, get, (tournament) => enterForfeit(tournament, matchId, absent, now()));
    },

    clearEntry: (matchId) => {
      applyToCurrent(set, get, (tournament) => clearEntry(tournament, matchId, now()));
    },

    closePhase1: () => {
      applyToCurrent(set, get, (tournament) => closePhase1(tournament, now()));
    },

    reopenPhase1: () => {
      applyToCurrent(set, get, (tournament) => reopenPhase1(tournament, now()));
    },

    withdraw: (team) => {
      applyToCurrent(set, get, (tournament) => withdraw(tournament, team, now()));
    },

    reinstate: (team) => {
      applyToCurrent(set, get, (tournament) => reinstate(tournament, team, now()));
    },

    settleTie: (teams, order) => {
      applyToCurrent(set, get, (tournament) => ({
        ...tournament,
        tieBreaks: recordDecision(tournament.tieBreaks, { teams, order }),
        modified: now(),
      }));
    },

    drawBrackets: () => {
      applyToCurrent(set, get, (tournament) => drawBrackets(tournament, drawSeed(), now()));
    },

    exportTournament: async (id) => {
      const known = get().list.find((tournament) => tournament.id === id);

      if (known) {
        await flushWrite(known);
      }

      return window.cochonnet.tournaments.export(id);
    },

    importTournament: () => window.cochonnet.tournaments.import(),

    adopt: async (tournament, mode) => {
      const adopted =
        mode === 'copy' ? asCopy(tournament, newId(), now()) : markOpened(tournament, now());

      await window.cochonnet.tournaments.write(adopted);

      set((state) => {
        const index = state.list.findIndex((one) => one.id === adopted.id);
        if (index >= 0) {
          state.list[index] = adopted;
        } else {
          state.list.unshift(adopted);
        }
      });

      return adopted.id;
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
