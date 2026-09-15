import type { TeamId } from '@/domain/ids';
import { loserOf, winnerOf } from '@/domain/match/result';
import { isBye, opponents } from '@/domain/match/types';
import type { Match } from '@/domain/match/types';
import { differential } from '@/domain/score/validity';

export interface TieBreak {
  teams: TeamId[];
  order: TeamId[];
}

export interface Contender {
  team: TeamId;
  wins: number;
  pointsScored: number;
}

export function sameTeamSet(a: readonly TeamId[], b: readonly TeamId[]): boolean {
  return (
    a.length === b.length &&
    [...a]
      .sort((x, y) => x - y)
      .every((team, index) => team === [...b].sort((x, y) => x - y)[index])
  );
}

export function findDecision(
  decisions: readonly TieBreak[],
  teams: readonly TeamId[]
): TieBreak | null {
  return decisions.find((decision) => sameTeamSet(decision.teams, teams)) ?? null;
}

export function recordDecision(decisions: readonly TieBreak[], decision: TieBreak): TieBreak[] {
  return [...decisions.filter((kept) => !sameTeamSet(kept.teams, decision.teams)), decision];
}

export function pruneDecisions(
  decisions: readonly TieBreak[],
  liveTies: readonly (readonly TeamId[])[]
): TieBreak[] {
  return decisions.filter((decision) => liveTies.some((tie) => sameTeamSet(decision.teams, tie)));
}

function everyPairMet(group: readonly TeamId[], matches: readonly Match[]): boolean {
  const met = new Set<string>();

  for (const match of matches) {
    if (isBye(match) || match.status === 'waiting') {
      continue;
    }

    const [home, away] = opponents(match);

    if (home !== undefined && away !== undefined && group.includes(home) && group.includes(away)) {
      met.add([home, away].sort((a, b) => a - b).join('-'));
    }
  }

  return met.size === (group.length * (group.length - 1)) / 2;
}

function headToHeadDifferentials(
  group: readonly TeamId[],
  matches: readonly Match[],
  forfeitValue: number
): Map<TeamId, number> {
  const totals = new Map(group.map((team) => [team, 0]));

  for (const match of matches) {
    if (isBye(match) || match.status === 'waiting') {
      continue;
    }

    const winner = winnerOf(match);
    const loser = loserOf(match);

    if (winner === null || loser === null || !group.includes(winner) || !group.includes(loser)) {
      continue;
    }

    const gained = match.status === 'forfeit' ? forfeitValue : differential(match.score ?? [0, 0]);

    totals.set(winner, (totals.get(winner) ?? 0) + gained);
    totals.set(loser, (totals.get(loser) ?? 0) - gained);
  }

  return totals;
}

export function separate(
  group: readonly Contender[],
  matches: readonly Match[],
  forfeitValue: number
): Contender[][] {
  const byWins = groupBy(group, (contender) => contender.wins);

  return byWins.flatMap((sameWins) => {
    if (sameWins.length === 1) {
      return [sameWins];
    }

    const teams = sameWins.map((contender) => contender.team);
    const afterHeadToHead = everyPairMet(teams, matches)
      ? groupBy(
          sameWins,
          (contender) =>
            headToHeadDifferentials(teams, matches, forfeitValue).get(contender.team) ?? 0
        )
      : [sameWins];

    return afterHeadToHead.flatMap((block) =>
      block.length === 1 ? [block] : groupBy(block, (contender) => contender.pointsScored)
    );
  });
}

function groupBy(
  contenders: readonly Contender[],
  key: (contender: Contender) => number
): Contender[][] {
  const buckets = new Map<number, Contender[]>();

  for (const contender of contenders) {
    const bucket = buckets.get(key(contender));

    if (bucket) {
      bucket.push(contender);
    } else {
      buckets.set(key(contender), [contender]);
    }
  }

  return [...buckets.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, bucket]) => [...bucket].sort((a, b) => a.team - b.team));
}
