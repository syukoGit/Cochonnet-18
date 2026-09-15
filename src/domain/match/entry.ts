import type { MatchId, TeamId } from '@/domain/ids';
import type { Score } from '@/domain/score/validity';
import { minimumGapFor } from '@/domain/tournament/settings';
import type { Timestamp, Tournament } from '@/domain/tournament/types';
import { downstreamOf } from './cascade';
import { isReady, occupantsIn } from './resolve';
import { clearResult, recordForfeit, recordScore } from './result';
import type { Match } from './types';

function writeMatch(
  tournament: Tournament,
  matchId: MatchId,
  change: (match: Match) => Match,
  now: Timestamp
): Tournament {
  const target = tournament.matches.find((match) => match.id === matchId);

  if (!target) {
    return tournament;
  }

  const written = change(target);

  if (written === target) {
    return tournament;
  }

  const stale = new Set(downstreamOf(tournament.matches, matchId));

  const matches = tournament.matches.map((match) => {
    if (match.id === matchId) {
      return written;
    }

    return stale.has(match.id) ? clearResult(match) : match;
  });

  return { ...tournament, matches, modified: now };
}

export function enterScore(
  tournament: Tournament,
  matchId: MatchId,
  score: Score,
  now: Timestamp
): Tournament {
  return writeMatch(
    tournament,
    matchId,
    (match) =>
      isReady(tournament.matches, match)
        ? recordScore(match, score, minimumGapFor(tournament.settings, match.phase))
        : match,
    now
  );
}

export function enterForfeit(
  tournament: Tournament,
  matchId: MatchId,
  absent: TeamId,
  now: Timestamp
): Tournament {
  return writeMatch(
    tournament,
    matchId,
    (match) =>
      isReady(tournament.matches, match) && occupantsIn(tournament.matches, match).includes(absent)
        ? recordForfeit(match, absent)
        : match,
    now
  );
}

export function clearEntry(tournament: Tournament, matchId: MatchId, now: Timestamp): Tournament {
  return writeMatch(tournament, matchId, clearResult, now);
}
