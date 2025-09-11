import type { BracketNode } from './phase2';
import type { Team } from '../store/eventSlice';

export interface TournamentResult {
  first: Team | null;
  second: Team | null;
  third: Team | null;
}

export interface TournamentResults {
  winners: TournamentResult;
  consolation: TournamentResult;
  bothFinished: boolean;
}

/**
 * Check if a tournament bracket is completed (has a winner at the root)
 */
export function isTournamentComplete(bracket: BracketNode | null): boolean {
  if (!bracket) return false;
  
  // Tournament is complete if the root node has exactly 2 teams and a winner selected
  return (
    bracket.teams && 
    bracket.teams.length === 2 && 
    bracket.winnerIndex !== undefined &&
    (bracket.winnerIndex === 0 || bracket.winnerIndex === 1)
  );
}

/**
 * Check if the consolation match is completed
 */
export function isConsolationComplete(bracket: BracketNode | null): boolean {
  if (!bracket || !bracket.consolation) return false;
  
  // Consolation is complete if it has 2 teams and a winner selected
  return (
    bracket.consolation.teams &&
    bracket.consolation.teams.length === 2 &&
    bracket.consolation.winnerIndex !== undefined &&
    (bracket.consolation.winnerIndex === 0 || bracket.consolation.winnerIndex === 1)
  );
}

/**
 * Extract tournament results from completed brackets
 */
export function extractTournamentResults(
  winnersbracket: BracketNode | null,
  consolationBracket: BracketNode | null,
  teams: Team[]
): TournamentResults {
  const teamMap = new Map(teams.map(team => [team.id, team]));
  
  const winnersComplete = isTournamentComplete(winnersbracket);
  const consolationComplete = isTournamentComplete(consolationBracket);
  
  // Extract winners tournament results
  const winnersResult: TournamentResult = {
    first: null,
    second: null,
    third: null
  };
  
  if (winnersComplete && winnersbracket) {
    const winnerTeamId = winnersbracket.teams[winnersbracket.winnerIndex!];
    const loserTeamId = winnersbracket.teams[winnersbracket.winnerIndex! === 0 ? 1 : 0];
    
    winnersResult.first = teamMap.get(winnerTeamId) || null;
    winnersResult.second = teamMap.get(loserTeamId) || null;
    
    // Third place from consolation match (if available)
    if (isConsolationComplete(winnersbracket)) {
      const consolationWinnerId = winnersbracket.consolation!.teams[winnersbracket.consolation!.winnerIndex!];
      winnersResult.third = teamMap.get(consolationWinnerId) || null;
    }
  }
  
  // Extract consolation tournament results
  const consolationResult: TournamentResult = {
    first: null,
    second: null,
    third: null
  };
  
  if (consolationComplete && consolationBracket) {
    const winnerTeamId = consolationBracket.teams[consolationBracket.winnerIndex!];
    const loserTeamId = consolationBracket.teams[consolationBracket.winnerIndex! === 0 ? 1 : 0];
    
    consolationResult.first = teamMap.get(winnerTeamId) || null;
    consolationResult.second = teamMap.get(loserTeamId) || null;
    
    // Third place from consolation match (if available)
    if (isConsolationComplete(consolationBracket)) {
      const consolationWinnerId = consolationBracket.consolation!.teams[consolationBracket.consolation!.winnerIndex!];
      consolationResult.third = teamMap.get(consolationWinnerId) || null;
    }
  }
  
  return {
    winners: winnersResult,
    consolation: consolationResult,
    bothFinished: winnersComplete && consolationComplete
  };
}