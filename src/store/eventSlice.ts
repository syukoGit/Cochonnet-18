import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Round } from '../utils/schedule';

export interface EventState {
  name: string;
  matches: number;
  teams: string[];
  rounds: Round[];
  phase2Groups: {
    winners: string[];
    consolation: string[];
  } | null;
}

const initialState: EventState = {
  name: '',
  matches: 1,
  teams: [],
  rounds: [],
  phase2Groups: null,
};

const eventSlice = createSlice({
  name: 'event',
  initialState,
  reducers: {
    setName(state, action: PayloadAction<string>) {
      state.name = action.payload;
    },
    setMatches(state, action: PayloadAction<number>) {
      state.matches = action.payload;
    },
    addTeam(state, action: PayloadAction<string>) {
      const team = action.payload.trim();
      if (team && !state.teams.includes(team)) {
        state.teams.push(team);
      }
    },
    setRounds(state, action: PayloadAction<Round[]>) {
      state.rounds = action.payload;
    },
    setMatchScore(
      state,
      action: PayloadAction<{
        roundIndex: number;
        matchIndex: number;
        scoreA: number | undefined;
        scoreB: number | undefined;
      }>
    ) {
      const { roundIndex, matchIndex, scoreA, scoreB } = action.payload;
      const match = state.rounds[roundIndex]?.[matchIndex];
      if (match) {
        match.scoreA = scoreA;
        match.scoreB = scoreB;
      }
    },
    setPhase2Groups(
      state,
      action: PayloadAction<{ winners: string[]; consolation: string[] }>
    ) {
      state.phase2Groups = action.payload;
    },
  },
});

export const {
  setName,
  setMatches,
  addTeam,
  setRounds,
  setMatchScore,
  setPhase2Groups,
} = eventSlice.actions;
export default eventSlice.reducer;
