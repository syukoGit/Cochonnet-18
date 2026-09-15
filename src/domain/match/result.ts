import type { TeamId } from '@/domain/ids';
import type { Score } from '@/domain/score/validity';
import { isValidScore, winnerIndex } from '@/domain/score/validity';
import { opponents } from './types';
import type { Match } from './types';

function sameScore(match: Match, score: Score): boolean {
  return match.status === 'played' && match.score?.[0] === score[0] && match.score[1] === score[1];
}

export function recordScore(match: Match, score: Score, minimumGap: number): Match {
  if (!isValidScore(score[0], score[1], minimumGap) || sameScore(match, score)) {
    return match;
  }

  return { ...match, status: 'played', score, forfeitBy: undefined };
}

export function recordForfeit(match: Match, absent: TeamId): Match {
  if (match.status === 'forfeit' && match.forfeitBy === absent) {
    return match;
  }

  return { ...match, status: 'forfeit', score: undefined, forfeitBy: absent };
}

export function clearResult(match: Match): Match {
  if (match.status === 'waiting') {
    return match;
  }

  return { ...match, status: 'waiting', score: undefined, forfeitBy: undefined };
}

export function winnerOf(match: Match): TeamId | null {
  const teams = opponents(match);

  if (match.status === 'forfeit') {
    return teams.find((team) => team !== match.forfeitBy) ?? null;
  }

  return match.status === 'played' && match.score
    ? (teams[winnerIndex(match.score)] ?? null)
    : null;
}

export function loserOf(match: Match): TeamId | null {
  const winner = winnerOf(match);

  return winner === null ? null : (opponents(match).find((team) => team !== winner) ?? null);
}
