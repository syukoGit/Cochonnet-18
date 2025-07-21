import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface EventState {
  name: string;
  matches: number;
  teams: string[];
}

const initialState: EventState = {
  name: "",
  matches: 1,
  teams: [],
};

const eventSlice = createSlice({
  name: "event",
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
  },
});

export const { setName, setMatches, addTeam } = eventSlice.actions;
export default eventSlice.reducer;
