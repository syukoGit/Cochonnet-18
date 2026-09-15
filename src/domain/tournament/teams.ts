import { normaliseName } from './tournament';
import type { TeamId, Timestamp, Tournament } from './types';

export type TeamNameIssue = 'empty' | 'duplicate';

function sameName(a: string, b: string): boolean {
  return a.localeCompare(b, 'fr', { sensitivity: 'base' }) === 0;
}

export function teamNameIssue(
  tournament: Tournament,
  name: string,
  ignoring?: TeamId
): TeamNameIssue | null {
  const normalised = normaliseName(name);

  if (normalised.length === 0) {
    return 'empty';
  }

  const taken = tournament.teams.some(
    (team) => team.id !== ignoring && sameName(team.name, normalised)
  );

  return taken ? 'duplicate' : null;
}

export function addTeam(tournament: Tournament, name: string, now: Timestamp): Tournament {
  if (teamNameIssue(tournament, name) !== null) {
    return tournament;
  }

  return {
    ...tournament,
    teams: [...tournament.teams, { id: tournament.nextTeamId, name: normaliseName(name) }],
    nextTeamId: tournament.nextTeamId + 1,
    modified: now,
  };
}

export function renameTeam(
  tournament: Tournament,
  id: TeamId,
  name: string,
  now: Timestamp
): Tournament {
  const normalised = normaliseName(name);
  const current = tournament.teams.find((team) => team.id === id);

  if (!current || current.name === normalised) {
    return tournament;
  }

  if (teamNameIssue(tournament, name, id) !== null) {
    return tournament;
  }

  return {
    ...tournament,
    teams: tournament.teams.map((team) => (team.id === id ? { ...team, name: normalised } : team)),
    modified: now,
  };
}

export function removeTeam(tournament: Tournament, id: TeamId, now: Timestamp): Tournament {
  if (!tournament.teams.some((team) => team.id === id)) {
    return tournament;
  }

  return {
    ...tournament,
    teams: tournament.teams.filter((team) => team.id !== id),
    modified: now,
  };
}
