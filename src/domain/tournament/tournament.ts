import type { Timestamp, Tournament, TournamentId } from './types';

export const MAX_NAME_LENGTH = 80;

export function normaliseName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME_LENGTH);
}

export function isValidTournamentName(name: string): boolean {
  return normaliseName(name).length > 0;
}

export function createTournament(id: TournamentId, name: string, now: Timestamp): Tournament {
  return {
    id,
    name: normaliseName(name),
    phase: 'configuration',
    created: now,
    modified: now,
    opened: now,
  };
}

export function renameTournament(tournament: Tournament, name: string, now: Timestamp): Tournament {
  const normalised = normaliseName(name);

  if (!isValidTournamentName(normalised) || normalised === tournament.name) {
    return tournament;
  }

  return { ...tournament, name: normalised, modified: now };
}

export function markOpened(tournament: Tournament, now: Timestamp): Tournament {
  return { ...tournament, opened: now };
}

export function byMostRecentlyOpened(a: Tournament, b: Tournament): number {
  return b.opened.localeCompare(a.opened);
}
