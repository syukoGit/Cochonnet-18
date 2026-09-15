import type { MatchId, TeamId } from '@/domain/ids';
import type { Score } from '@/domain/score/validity';

export type { MatchId };

export type MatchPhase = 'phase1';

export type MatchStatus = 'waiting' | 'played' | 'forfeit';

export type Slot = { kind: 'team'; team: TeamId } | { kind: 'bye' };

export interface Match {
  id: MatchId;
  phase: MatchPhase;
  round: number;
  slots: [Slot, Slot];
  status: MatchStatus;
  score?: Score;
  forfeitBy?: TeamId;
}

export function isBye(match: Match): boolean {
  return match.slots.some((slot) => slot.kind === 'bye');
}

export function opponents(match: Match): TeamId[] {
  return match.slots.flatMap((slot) => (slot.kind === 'team' ? [slot.team] : []));
}

export function isPlayable(match: Match): boolean {
  return !isBye(match);
}

export function hasResult(match: Match): boolean {
  return match.status !== 'waiting';
}
