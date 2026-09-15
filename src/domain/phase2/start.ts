import type { MatchId } from '@/domain/ids';
import { bracketMatches } from '@/domain/match/types';
import type { Match, MatchPhase } from '@/domain/match/types';
import type { Seed } from '@/domain/random';
import type { Timestamp, Tournament } from '@/domain/tournament/types';
import { buildBracket } from './bracket';
import { drawSeats } from './bracketDraw';
import { liveTies, splitOf } from './split';

export type Phase2Blocker = 'not-closing' | 'unsettled-ties' | 'not-enough-teams';

export function phase2Blocker(tournament: Tournament): Phase2Blocker | null {
  if (tournament.phase !== 'closing' && tournament.phase !== 'phase2') {
    return 'not-closing';
  }

  if (liveTies(tournament).length > 0) {
    return 'unsettled-ties';
  }

  const { main, consolation } = splitOf(tournament);

  return main.length + consolation.length < 2 ? 'not-enough-teams' : null;
}

export function bracketsLocked(tournament: Tournament): boolean {
  return bracketMatches(tournament.matches).some((match) => match.status !== 'waiting');
}

export function rematchesIn(tournament: Tournament, phase: MatchPhase): number {
  return drawSeats(
    phase === 'main' ? splitOf(tournament).main : splitOf(tournament).consolation,
    tournament.matches,
    tournament.phase2Seed
  ).rematches;
}

function nextMatchId(matches: readonly Match[]): MatchId {
  return matches.reduce((highest, match) => Math.max(highest, match.id), 0) + 1;
}

export function drawBrackets(tournament: Tournament, seed: Seed, now: Timestamp): Tournament {
  if (phase2Blocker(tournament) !== null || bracketsLocked(tournament)) {
    return tournament;
  }

  const split = splitOf(tournament);
  const qualification = tournament.matches.filter((match) => match.phase === 'phase1');

  const mainDraw = drawSeats(split.main, qualification, seed);
  const main = buildBracket(mainDraw.seats, 'main', nextMatchId(qualification));

  const consolationDraw = drawSeats(split.consolation, qualification, seed);
  const consolation = buildBracket(
    consolationDraw.seats,
    'consolation',
    nextMatchId([...qualification, ...main])
  );

  return {
    ...tournament,
    phase: 'phase2',
    phase2Seed: seed,
    matches: [...qualification, ...main, ...consolation],
    modified: now,
  };
}
