import { describe, expect, it } from 'vitest';
import { occupantsIn } from '@/domain/match/resolve';
import { BRACKET_PHASES, bracketMatches } from '@/domain/match/types';
import { maxMatchCount } from '@/domain/phase1/draw';
import { rankTeams } from '@/domain/phase1/ranking';
import { GUARANTEED_TEAMS } from '@/domain/phase1/start';
import { podiumOf } from '@/domain/phase2/podium';
import { splitOf } from '@/domain/phase2/split';
import { bracketsLocked, rematchesIn } from '@/domain/phase2/start';
import { replay } from './replay';
import type { Tournament } from './tournament/types';

const t0 = '2026-09-17T09:00:00.000Z';

export const FRAME_BUDGET_MS = 16;

const BEYOND_BUDGET_MS = 60;

const RUNS = 25;

function fullTournament(teamCount: number): Tournament {
  return replay(
    {
      name: `${teamCount} teams`,
      teams: Array.from({ length: teamCount }, (_unused, index) => `Equipe ${index + 1}`),
      matchCount: Math.min(5, maxMatchCount(teamCount)),
      seed: 42,
    },
    t0
  ).tournament;
}

function recompute(tournament: Tournament): number {
  const ranking = rankTeams(tournament);
  const split = splitOf(tournament);
  const occupants = bracketMatches(tournament.matches).flatMap((match) =>
    occupantsIn(tournament.matches, match)
  );
  const podiums = BRACKET_PHASES.map((phase) => podiumOf(tournament, phase));
  const rematches = BRACKET_PHASES.map((phase) => rematchesIn(tournament, phase));
  const locked = bracketsLocked(tournament);

  return (
    ranking.entries.length +
    split.main.length +
    occupants.length +
    podiums.length +
    rematches.length +
    (locked ? 1 : 0)
  );
}

function bestOf(tournament: Tournament): number {
  let best = Number.POSITIVE_INFINITY;

  for (let run = 0; run < RUNS; run += 1) {
    const started = performance.now();
    recompute(tournament);
    best = Math.min(best, performance.now() - started);
  }

  return best;
}

describe('the recompute budget', () => {
  it(`rebuilds every screen of a full ${String(GUARANTEED_TEAMS)} team tournament within one frame`, () => {
    const tournament = fullTournament(GUARANTEED_TEAMS);

    expect(tournament.matches.length).toBeGreaterThan(GUARANTEED_TEAMS);
    expect(bestOf(tournament)).toBeLessThan(FRAME_BUDGET_MS);
  });

  it('stays usable at twice the guaranteed size, where nothing is promised', () => {
    expect(bestOf(fullTournament(GUARANTEED_TEAMS * 2))).toBeLessThan(BEYOND_BUDGET_MS);
  });

  it('grows gently rather than exploding between 32 and 64 teams', () => {
    const small = bestOf(fullTournament(32));
    const large = bestOf(fullTournament(GUARANTEED_TEAMS));

    expect(large).toBeLessThan(Math.max(small, 0.05) * 12);
  });
});
