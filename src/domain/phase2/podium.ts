import type { TeamId } from '@/domain/ids';
import { loserIn, winnerIn } from '@/domain/match/resolve';
import { BRACKET_PHASES, phaseMatches } from '@/domain/match/types';
import type { BracketPhase, Match } from '@/domain/match/types';
import type { Tournament } from '@/domain/tournament/types';
import { isThirdPlace } from './bracket';
import { splitOf } from './split';

export interface Podium {
  first: TeamId | null;
  second: TeamId | null;
  third: TeamId | null;
}

const EMPTY: Podium = { first: null, second: null, third: null };

export function groupOf(tournament: Tournament, phase: BracketPhase): TeamId[] {
  const split = splitOf(tournament);

  return phase === 'main' ? split.main : split.consolation;
}

export function finalOf(matches: readonly Match[], phase: BracketPhase): Match | null {
  const knockout = phaseMatches(matches, phase).filter((match) => !isThirdPlace(match));
  const lastRound = Math.max(...knockout.map((match) => match.round));

  return knockout.find((match) => match.round === lastRound) ?? null;
}

function thirdIn(matches: readonly Match[], phase: BracketPhase, final: Match): TeamId | null {
  const bracket = phaseMatches(matches, phase);
  const playOff = bracket.find(isThirdPlace);

  if (playOff) {
    return winnerIn(matches, playOff);
  }

  const semiFinals = bracket.filter((match) => match.round === final.round - 1);
  const only = semiFinals.length === 1 ? semiFinals[0] : undefined;

  return only ? loserIn(matches, only) : null;
}

export function podiumOf(tournament: Tournament, phase: BracketPhase): Podium {
  const group = groupOf(tournament, phase);
  const alone = group.length === 1 ? group[0] : undefined;

  if (alone !== undefined) {
    return { ...EMPTY, first: alone };
  }

  const final = group.length === 0 ? null : finalOf(tournament.matches, phase);

  if (!final) {
    return EMPTY;
  }

  return {
    first: winnerIn(tournament.matches, final),
    second: loserIn(tournament.matches, final),
    third: thirdIn(tournament.matches, phase, final),
  };
}

export function bracketComplete(tournament: Tournament, phase: BracketPhase): boolean {
  return groupOf(tournament, phase).length === 0 || podiumOf(tournament, phase).first !== null;
}

export function resultsReady(tournament: Tournament): boolean {
  return (
    tournament.phase === 'phase2' &&
    BRACKET_PHASES.every((phase) => bracketComplete(tournament, phase))
  );
}
