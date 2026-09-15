import type { MatchId, TeamId } from '@/domain/ids';
import type { Score } from '@/domain/score/validity';

export type { MatchId };

export const MATCH_PHASES = ['phase1', 'main', 'consolation'] as const;

export type MatchPhase = (typeof MATCH_PHASES)[number];

export type MatchStatus = 'waiting' | 'played' | 'forfeit';

export type Slot =
  | { kind: 'team'; team: TeamId }
  | { kind: 'bye' }
  | { kind: 'winner'; from: MatchId }
  | { kind: 'loser'; from: MatchId };

export interface Feed {
  match: MatchId;
  slot: 0 | 1;
}

export interface Match {
  id: MatchId;
  phase: MatchPhase;
  round: number;
  slots: [Slot, Slot];
  status: MatchStatus;
  score?: Score;
  forfeitBy?: TeamId;
  feeds?: Feed;
  feedsConsolation?: Feed;
}

export function isBye(match: Match): boolean {
  return match.slots.some((slot) => slot.kind === 'bye');
}

export function opponents(match: Match): TeamId[] {
  return match.slots.flatMap((slot) => (slot.kind === 'team' ? [slot.team] : []));
}

export function hasResult(match: Match): boolean {
  return match.status !== 'waiting';
}

export function phaseMatches(matches: readonly Match[], phase: MatchPhase): Match[] {
  return matches.filter((match) => match.phase === phase);
}

export function bracketMatches(matches: readonly Match[]): Match[] {
  return matches.filter((match) => match.phase !== 'phase1');
}
