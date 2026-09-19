import type { Seed } from '@/domain/random';
import type { Timestamp, Tournament } from '@/domain/tournament/types';
import { drawPhase1, maxMatchCount } from './draw';

export type StartBlocker = 'already-started' | 'not-enough-teams' | 'invalid-match-count';

export const MINIMUM_TEAMS = 2;

export const GUARANTEED_TEAMS = 64;

export function startBlocker(tournament: Tournament): StartBlocker | null {
  if (tournament.phase !== 'configuration') {
    return 'already-started';
  }

  if (tournament.teams.length < MINIMUM_TEAMS) {
    return 'not-enough-teams';
  }

  const limit = maxMatchCount(tournament.teams.length);

  if (tournament.matchCount < 1 || tournament.matchCount > limit) {
    return 'invalid-match-count';
  }

  return null;
}

export function beyondGuaranteedSize(tournament: Tournament): boolean {
  return tournament.teams.length > GUARANTEED_TEAMS;
}

export function startPhase1(tournament: Tournament, seed: Seed, now: Timestamp): Tournament {
  if (startBlocker(tournament) !== null) {
    return tournament;
  }

  const matches = drawPhase1(
    tournament.teams.map((team) => team.id),
    tournament.matchCount,
    seed
  );

  if (matches.length === 0) {
    return tournament;
  }

  return { ...tournament, phase: 'phase1', matches, modified: now };
}
