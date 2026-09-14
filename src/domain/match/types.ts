import type { MatchId, TeamId } from '@/domain/ids';

export type { MatchId };

export type MatchPhase = 'phase1';

export type MatchStatus = 'waiting' | 'played';

export type Slot = { kind: 'team'; team: TeamId } | { kind: 'bye' };

export interface Match {
  id: MatchId;
  phase: MatchPhase;
  round: number;
  slots: [Slot, Slot];
  status: MatchStatus;
}

export function isBye(match: Match): boolean {
  return match.slots.some((slot) => slot.kind === 'bye');
}

export function opponents(match: Match): TeamId[] {
  return match.slots.flatMap((slot) => (slot.kind === 'team' ? [slot.team] : []));
}
