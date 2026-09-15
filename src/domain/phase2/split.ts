import type { TeamId } from '@/domain/ids';
import { phase1Complete, rankTeams } from '@/domain/phase1/ranking';
import { pruneDecisions } from '@/domain/phase1/tiebreak';
import type { Timestamp, Tournament } from '@/domain/tournament/types';

export interface Split {
  main: TeamId[];
  consolation: TeamId[];
}

export function remainingOrder(tournament: Tournament): TeamId[] {
  return rankTeams(tournament)
    .entries.map((entry) => entry.team)
    .filter((team) => !tournament.withdrawn.includes(team));
}

function stillContested(
  tournament: Tournament,
  groups: readonly (readonly TeamId[])[]
): TeamId[][] {
  return groups
    .map((group) => group.filter((team) => !tournament.withdrawn.includes(team)))
    .filter((group) => group.length > 1);
}

export function liveTies(tournament: Tournament): TeamId[][] {
  return stillContested(tournament, rankTeams(tournament).unresolvedTies);
}

export function contestedGroups(tournament: Tournament): TeamId[][] {
  return stillContested(tournament, rankTeams(tournament).tieGroups);
}

export function splitOf(tournament: Tournament): Split {
  const order = remainingOrder(tournament);
  const mainSize = Math.ceil(order.length / 2);

  return { main: order.slice(0, mainSize), consolation: order.slice(mainSize) };
}

function reconcileDecisions(tournament: Tournament): Tournament {
  const kept = pruneDecisions(tournament.tieBreaks, contestedGroups(tournament));

  return kept.length === tournament.tieBreaks.length
    ? tournament
    : { ...tournament, tieBreaks: kept };
}

export function withdraw(tournament: Tournament, team: TeamId, now: Timestamp): Tournament {
  if (tournament.withdrawn.includes(team) || !tournament.teams.some((one) => one.id === team)) {
    return tournament;
  }

  return {
    ...reconcileDecisions({ ...tournament, withdrawn: [...tournament.withdrawn, team] }),
    modified: now,
  };
}

export function reinstate(tournament: Tournament, team: TeamId, now: Timestamp): Tournament {
  if (!tournament.withdrawn.includes(team)) {
    return tournament;
  }

  return {
    ...reconcileDecisions({
      ...tournament,
      withdrawn: tournament.withdrawn.filter((one) => one !== team),
    }),
    modified: now,
  };
}

export function closePhase1(tournament: Tournament, now: Timestamp): Tournament {
  if (tournament.phase !== 'phase1' || !phase1Complete(tournament)) {
    return tournament;
  }

  return { ...tournament, phase: 'closing', modified: now };
}

export function reopenPhase1(tournament: Tournament, now: Timestamp): Tournament {
  if (tournament.phase !== 'closing') {
    return tournament;
  }

  return { ...tournament, phase: 'phase1', modified: now };
}
