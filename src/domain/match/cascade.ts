import type { MatchId } from '@/domain/ids';
import { hasResult } from './types';
import type { Match } from './types';

function targetsOf(match: Match): MatchId[] {
  return [match.feeds, match.feedsConsolation].flatMap((feed) => (feed ? [feed.match] : []));
}

export function downstreamOf(matches: readonly Match[], matchId: MatchId): MatchId[] {
  const reached = new Set<MatchId>();
  const pending: MatchId[] = [matchId];

  while (pending.length > 0) {
    const current = pending.pop();

    if (current === undefined) {
      break;
    }

    const match = matches.find((candidate) => candidate.id === current);

    if (!match) {
      continue;
    }

    for (const target of targetsOf(match)) {
      if (!reached.has(target)) {
        reached.add(target);
        pending.push(target);
      }
    }
  }

  reached.delete(matchId);

  return matches.filter((match) => reached.has(match.id)).map((match) => match.id);
}

export function invalidatedBy(matches: readonly Match[], matchId: MatchId): Match[] {
  const downstream = new Set(downstreamOf(matches, matchId));

  return matches.filter((match) => downstream.has(match.id) && hasResult(match));
}
