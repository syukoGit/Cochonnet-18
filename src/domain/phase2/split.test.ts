import { describe, expect, it } from 'vitest';
import type { TeamId } from '@/domain/ids';
import type { Match } from '@/domain/match/types';
import { rankTeams } from '@/domain/phase1/ranking';
import { recordDecision } from '@/domain/phase1/tiebreak';
import { addTeam } from '@/domain/tournament/teams';
import { createTournament } from '@/domain/tournament/tournament';
import type { Tournament } from '@/domain/tournament/types';
import { closePhase1, liveTies, reinstate, reopenPhase1, splitOf, withdraw } from './split';

const t0 = '2026-09-15T09:00:00.000Z';
const t1 = '2026-09-15T10:00:00.000Z';

function match(id: number, home: TeamId, away: TeamId, score: [number, number]): Match {
  return {
    id,
    phase: 'phase1',
    round: 1,
    slots: [
      { kind: 'team', team: home },
      { kind: 'team', team: away },
    ],
    status: 'played',
    score,
  };
}

function tournamentOf(teamCount: number, matches: Match[]): Tournament {
  const base = Array.from({ length: teamCount }, (_unused, index) => `Equipe ${index + 1}`).reduce(
    (current, name) => addTeam(current, name, t0),
    createTournament('t1', 'Tournoi', t0)
  );

  return { ...base, phase: 'phase1', matchCount: 1, matches };
}

describe('closing and splitting', () => {
  it('refuses to close while a match is still waiting', () => {
    const waiting = tournamentOf(4, [
      match(1, 1, 2, [13, 5]),
      { ...match(2, 3, 4, [13, 5]), status: 'waiting', score: undefined },
    ]);

    expect(closePhase1(waiting, t1)).toBe(waiting);
  });

  it('closes once every match is entered, and reopens', () => {
    const complete = tournamentOf(4, [match(1, 1, 2, [13, 5]), match(2, 3, 4, [13, 9])]);
    const closed = closePhase1(complete, t1);

    expect(closed.phase).toBe('closing');
    expect(reopenPhase1(closed, t1).phase).toBe('phase1');
  });

  it('reopening only applies to a closed phase', () => {
    const complete = tournamentOf(4, [match(1, 1, 2, [13, 5]), match(2, 3, 4, [13, 9])]);

    expect(reopenPhase1(complete, t1)).toBe(complete);
  });

  it('cuts in half and gives the extra team to the main bracket', () => {
    const odd = tournamentOf(5, [match(1, 1, 2, [13, 5]), match(2, 3, 4, [13, 9])]);
    const split = splitOf(odd);

    expect(split.main).toHaveLength(3);
    expect(split.consolation).toHaveLength(2);
    expect([...split.main, ...split.consolation]).toHaveLength(5);
  });

  it('I10 — withdrawing a team changes no score and no phase 1 rank', () => {
    const tournament = tournamentOf(4, [match(1, 1, 2, [13, 5]), match(2, 3, 4, [13, 9])]);
    const before = rankTeams(tournament);
    const after = withdraw(tournament, 2, t1);

    expect(after.matches).toEqual(tournament.matches);
    expect(rankTeams(after).entries).toEqual(before.entries);
  });

  it('excludes a withdrawn team from the split and puts it back on reinstatement', () => {
    const tournament = tournamentOf(4, [match(1, 1, 2, [13, 5]), match(2, 3, 4, [13, 9])]);
    const reduced = withdraw(tournament, 2, t1);

    expect([...splitOf(reduced).main, ...splitOf(reduced).consolation]).not.toContain(2);
    expect(splitOf(reduced).main).toHaveLength(2);

    const restored = reinstate(reduced, 2, t1);
    expect([...splitOf(restored).main, ...splitOf(restored).consolation]).toContain(2);
  });

  it('ignores an unknown or already withdrawn team', () => {
    const tournament = tournamentOf(4, [match(1, 1, 2, [13, 5]), match(2, 3, 4, [13, 9])]);
    expect(withdraw(tournament, 99, t1)).toBe(tournament);

    const once = withdraw(tournament, 2, t1);
    expect(withdraw(once, 2, t1)).toBe(once);
    expect(reinstate(tournament, 2, t1)).toBe(tournament);
  });

  it('I12 — a recorded decision survives while its tied set is unchanged', () => {
    const tied = tournamentOf(4, [match(1, 1, 2, [13, 5]), match(2, 3, 4, [13, 5])]);
    const tie = rankTeams(tied).unresolvedTies[0];

    expect(tie).toBeDefined();

    const decided = {
      ...tied,
      tieBreaks: recordDecision(tied.tieBreaks, {
        teams: tie ?? [],
        order: [...(tie ?? [])].reverse(),
      }),
    };

    expect(rankTeams(decided).unresolvedTies).not.toContainEqual(tie);
    expect(liveTies(decided)).not.toContainEqual(tie);

    const afterUnrelatedWithdrawal = withdraw(decided, 99, t1);
    expect(afterUnrelatedWithdrawal.tieBreaks).toEqual(decided.tieBreaks);
  });

  it('a tie whose member withdrew no longer asks to be arbitrated', () => {
    const tied = tournamentOf(4, [match(1, 1, 2, [13, 5]), match(2, 3, 4, [13, 5])]);
    const tie = rankTeams(tied).unresolvedTies[0] ?? [];

    expect(liveTies(tied)).toContainEqual(tie);
    expect(liveTies(withdraw(tied, tie[0] ?? 0, t1))).not.toContainEqual(tie);
  });

  it('I12 — an unrelated withdrawal never erases a settled decision', () => {
    const tied = tournamentOf(6, [
      match(1, 1, 2, [13, 5]),
      match(2, 3, 4, [13, 5]),
      match(3, 5, 6, [13, 5]),
    ]);

    const winners = rankTeams(tied).unresolvedTies.find((tie) => tie.includes(1)) ?? [];
    const losers = rankTeams(tied).unresolvedTies.find((tie) => tie.includes(2)) ?? [];

    expect(winners).toEqual([1, 3, 5]);
    expect(losers).toEqual([2, 4, 6]);

    const decided = {
      ...tied,
      tieBreaks: recordDecision(tied.tieBreaks, { teams: winners, order: [3, 1, 5] }),
    };

    const afterLoserWithdrew = withdraw(decided, 6, t1);

    expect(afterLoserWithdrew.tieBreaks).toEqual(decided.tieBreaks);
    expect(liveTies(afterLoserWithdrew)).not.toContainEqual(winners);
    expect(
      rankTeams(afterLoserWithdrew)
        .entries.slice(0, 3)
        .map((entry) => entry.team)
    ).toEqual([3, 1, 5]);
  });

  it('I12 — a decision is discarded once its tied set changes', () => {
    const tied = tournamentOf(4, [match(1, 1, 2, [13, 5]), match(2, 3, 4, [13, 5])]);
    const tie = rankTeams(tied).unresolvedTies[0] ?? [];
    const decided = {
      ...tied,
      tieBreaks: recordDecision(tied.tieBreaks, { teams: tie, order: [...tie].reverse() }),
    };

    const broken = withdraw(decided, tie[0] ?? 0, t1);

    expect(broken.tieBreaks).toEqual([]);
  });
});
