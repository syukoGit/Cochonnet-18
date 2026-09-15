import type { MatchId, TeamId } from '@/domain/ids';
import { clearResult, recordForfeit, recordScore } from '@/domain/match/result';
import { isBye } from '@/domain/match/types';
import type { Score } from '@/domain/score/validity';
import { minimumGapFor } from '@/domain/tournament/settings';
import type { Timestamp, Tournament } from '@/domain/tournament/types';

function replaceMatch(
  tournament: Tournament,
  matchId: MatchId,
  change: (match: Tournament['matches'][number]) => Tournament['matches'][number],
  now: Timestamp
): Tournament {
  const matches = tournament.matches.map((match) => (match.id === matchId ? change(match) : match));
  const changed = matches.some((match, index) => match !== tournament.matches[index]);

  return changed ? { ...tournament, matches, modified: now } : tournament;
}

export function enterScore(
  tournament: Tournament,
  matchId: MatchId,
  score: Score,
  now: Timestamp
): Tournament {
  return replaceMatch(
    tournament,
    matchId,
    (match) => recordScore(match, score, minimumGapFor(tournament.settings, match.phase)),
    now
  );
}

export function enterForfeit(
  tournament: Tournament,
  matchId: MatchId,
  absent: TeamId,
  now: Timestamp
): Tournament {
  return replaceMatch(tournament, matchId, (match) => recordForfeit(match, absent), now);
}

export function clearEntry(tournament: Tournament, matchId: MatchId, now: Timestamp): Tournament {
  return replaceMatch(tournament, matchId, clearResult, now);
}

export function phase1SettingsLocked(tournament: Tournament): boolean {
  return tournament.matches.some((match) => !isBye(match) && match.status !== 'waiting');
}
