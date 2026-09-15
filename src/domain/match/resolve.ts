import type { MatchId, TeamId } from '@/domain/ids';
import { winnerIndex } from '@/domain/score/validity';
import type { Match, Slot } from './types';

function byId(matches: readonly Match[], id: MatchId): Match | undefined {
  return matches.find((match) => match.id === id);
}

export function occupantOf(matches: readonly Match[], slot: Slot): TeamId | null {
  if (slot.kind === 'team') {
    return slot.team;
  }

  if (slot.kind === 'bye') {
    return null;
  }

  const source = byId(matches, slot.from);

  if (!source) {
    return null;
  }

  return slot.kind === 'winner' ? winnerIn(matches, source) : loserIn(matches, source);
}

export function occupantsIn(
  matches: readonly Match[],
  match: Match
): [TeamId | null, TeamId | null] {
  return [occupantOf(matches, match.slots[0]), occupantOf(matches, match.slots[1])];
}

export function teamsIn(matches: readonly Match[], match: Match): TeamId[] {
  return occupantsIn(matches, match).filter((team): team is TeamId => team !== null);
}

export function isReady(matches: readonly Match[], match: Match): boolean {
  return occupantsIn(matches, match).every((team) => team !== null);
}

export function winnerIn(matches: readonly Match[], match: Match): TeamId | null {
  const occupants = occupantsIn(matches, match);

  if (match.status === 'forfeit') {
    return occupants.find((team) => team !== null && team !== match.forfeitBy) ?? null;
  }

  if (match.status === 'played' && match.score) {
    return occupants[winnerIndex(match.score)];
  }

  return null;
}

export function loserIn(matches: readonly Match[], match: Match): TeamId | null {
  const winner = winnerIn(matches, match);

  if (winner === null) {
    return null;
  }

  return occupantsIn(matches, match).find((team) => team !== null && team !== winner) ?? null;
}
