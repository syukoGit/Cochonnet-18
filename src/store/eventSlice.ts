import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Round } from '../utils/schedule';
import type { BracketNode } from '../utils/phase2';
import { generateBracketTree } from '../utils/phase2';

export interface Team {
  id: number;
  name: string;
}

export interface EventState {
  name: string;
  matches: number;
  teams: Team[];
  rounds: Round[];
  phase2Groups: {
    winners: number[];
    consolation: number[];
  } | null;
  // optional generated bracket trees for phase2 (winners and consolation)
  phase2Brackets?: {
    winners?: BracketNode | null;
    consolation?: BracketNode | null;
  } | null;
  // Current route/step in the application
  currentRoute: string;
  // Track which pages have been visited for navigation
  visitedPages: string[];
}

const initialState: EventState = {
  name: '',
  matches: 3,
  teams: [],
  rounds: [],
  phase2Groups: null,
  phase2Brackets: null,
  currentRoute: '/',
  visitedPages: ['/'], // Home is always visited first
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
      const teamName = action.payload.trim();
      if (teamName && !state.teams.some((team) => team.name === teamName)) {
        // Find the lowest available ID
        const existingIds = state.teams
          .map((team) => team.id)
          .sort((a, b) => a - b);
        let nextId = 1;
        for (const id of existingIds) {
          if (id === nextId) {
            nextId++;
          } else {
            break;
          }
        }
        state.teams.push({ id: nextId, name: teamName });
      }
    },
    removeTeam(state, action: PayloadAction<number>) {
      state.teams = state.teams.filter((team) => team.id !== action.payload);
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
      action: PayloadAction<{ winners: number[]; consolation: number[] }>
    ) {
      state.phase2Groups = action.payload;
      // Pre-generate bracket trees for both winners and consolation so the UI
      // doesn't need to compute them on render. This keeps Phase2 page purely
      // presentational regarding tree generation.
      state.phase2Brackets = {
        winners: generateBracketTree(action.payload.winners || []),
        consolation: generateBracketTree(action.payload.consolation || []),
      };
    },
    setPhase2Brackets(
      state,
      action: PayloadAction<{
        winners?: BracketNode | null;
        consolation?: BracketNode | null;
      }>
    ) {
      state.phase2Brackets = action.payload;
    },
    setPhase2Winner(
      state,
      action: PayloadAction<{
        nodeId: string;
        winnerIndex: number;
        tree: 'winners' | 'consolation';
      }>
    ) {
      const payload = action.payload;
      if (!state.phase2Brackets) return;

      const applyWinner = (node?: BracketNode): number | undefined => {
        if (!node) return undefined;
        if (node.id === payload.nodeId) {
          // only set if there are exactly 2 teams
          if (node.teams && node.teams.length === 2) {
            node.winnerIndex = payload.winnerIndex;
            return payload.winnerIndex;
          }
          return undefined;
        }

        if (node.consolation) {
          applyWinner(node.consolation);
        }

        // recurse
        const leftWinnerIndex = applyWinner(node.left);
        const rightWinnerIndex = applyWinner(node.right);

        // If a child returned a winner, place it into this node's teams
        if (leftWinnerIndex !== undefined || rightWinnerIndex !== undefined) {
          // initialize teams to 0..2 if unset
          const t: number[] = node.teams ? [...node.teams] : [];

          if (node.left && leftWinnerIndex !== undefined) {
            // left child winner should occupy the 0 position
            t[0] = node.left.teams[leftWinnerIndex];

            if (node.consolation) {
              node.consolation.teams[0] =
                node.left.teams[leftWinnerIndex == 1 ? 0 : 1];
            }
          }
          if (node.right && rightWinnerIndex !== undefined) {
            // right child winner should occupy the 1 position
            t[1] = node.right.teams[rightWinnerIndex];

            if (node.consolation) {
              node.consolation.teams[1] =
                node.right.teams[rightWinnerIndex === 1 ? 0 : 1];
            }
          }
          node.teams = t;
          // if both teams present and winnerIndex already set, return the winner
          if (node.teams.length === 2 && node.winnerIndex !== undefined) {
            return node.winnerIndex;
          }
          return undefined;
        }

        return undefined;
      };

      // If a tree is specified, only update that one. Otherwise attempt both.
      if (payload.tree === 'winners') {
        if (state.phase2Brackets.winners)
          applyWinner(state.phase2Brackets.winners);
      } else if (payload.tree === 'consolation') {
        if (state.phase2Brackets.consolation)
          applyWinner(state.phase2Brackets.consolation);
      } else {
        return undefined;
      }
    },
    resetState(state) {
      // Reset to initial state
      Object.assign(state, initialState);
    },
    restoreState(state, action: PayloadAction<EventState>) {
      // Restore from backup
      Object.assign(state, action.payload);
    },
    setCurrentRoute(state, action: PayloadAction<string>) {
      state.currentRoute = action.payload;
      // Add to visited pages if not already present
      if (!state.visitedPages.includes(action.payload)) {
        state.visitedPages.push(action.payload);
      }
    },
    addVisitedPage(state, action: PayloadAction<string>) {
      // Add a page to visited pages without changing current route
      if (!state.visitedPages.includes(action.payload)) {
        state.visitedPages.push(action.payload);
      }
    },
  },
});

export const {
  setName,
  setMatches,
  addTeam,
  removeTeam,
  setRounds,
  setMatchScore,
  setPhase2Groups,
  setPhase2Brackets,
  setPhase2Winner,
  resetState,
  restoreState,
  setCurrentRoute,
  addVisitedPage,
} = eventSlice.actions;
export default eventSlice.reducer;
