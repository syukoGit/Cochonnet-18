import { describe, expect, it } from 'vitest';
import { recordForfeit, recordScore } from '@/domain/match/result';
import { addTeam } from '@/domain/tournament/teams';
import { createTournament } from '@/domain/tournament/tournament';
import type { Tournament } from '@/domain/tournament/types';
import { drawPhase1 } from './draw';
import { enteredCount, playableCount, rankTeams } from './ranking';

const t0 = '2026-09-15T09:00:00.000Z';

function tournamentOf(teamCount: number, matchCount: number): Tournament {
  const base = Array.from({ length: teamCount }, (_unused, index) => `Equipe ${index + 1}`).reduce(
    (current, name) => addTeam(current, name, t0),
    createTournament('t1', 'Tournoi', t0)
  );

  return {
    ...base,
    matchCount,
    phase: 'phase1',
    matches: drawPhase1(
      base.teams.map((team) => team.id),
      matchCount,
      7
    ),
  };
}

function withScore(tournament: Tournament, index: number, home: number, away: number): Tournament {
  return {
    ...tournament,
    matches: tournament.matches.map((match, position) =>
      position === index ? recordScore(match, [home, away], 0) : match
    ),
  };
}

describe('phase 1 ranking', () => {
  it('starts every team at zero', () => {
    const { entries } = rankTeams(tournamentOf(4, 2));

    expect(entries).toHaveLength(4);
    expect(entries.every((entry) => entry.differential === 0 && entry.played === 0)).toBe(true);
  });

  it('gives the gap to the winner and takes it from the loser', () => {
    const tournament = withScore(tournamentOf(4, 2), 0, 13, 7);
    const { entries } = rankTeams(tournament);

    expect(entries[0]?.differential).toBe(6);
    expect(entries.at(-1)?.differential).toBe(-6);
    expect(entries[0]?.wins).toBe(1);
    expect(entries[0]?.pointsScored).toBe(13);
    expect(entries.at(-1)?.pointsScored).toBe(7);
  });

  it('counts a forfeit as a win worth the configured differential, scoring no point', () => {
    const base = tournamentOf(4, 2);
    const absent = (base.matches[0]?.slots[1] as { team: number }).team;
    const tournament = {
      ...base,
      matches: base.matches.map((match, position) =>
        position === 0 ? recordForfeit(match, absent) : match
      ),
    };

    const { entries } = rankTeams(tournament);

    expect(entries[0]?.differential).toBe(base.settings.forfeitDifferential);
    expect(entries[0]?.wins).toBe(1);
    expect(entries[0]?.pointsScored).toBe(0);
    expect(entries.at(-1)?.differential).toBe(-base.settings.forfeitDifferential);
  });

  it('counts byes without crediting them during the phase', () => {
    const { entries } = rankTeams(tournamentOf(5, 3));

    expect(entries.some((entry) => entry.byes > 0)).toBe(true);
    expect(entries.every((entry) => entry.differential === 0)).toBe(true);
  });

  it('ignores matches with no result', () => {
    expect(enteredCount(tournamentOf(6, 3).matches)).toBe(0);
    expect(playableCount(tournamentOf(6, 3).matches)).toBe(9);
  });

  it('I11 — the ranking is a pure function of the entered scores', () => {
    const tournament = withScore(withScore(tournamentOf(6, 3), 0, 13, 4), 1, 13, 11);
    const roundTripped = JSON.parse(JSON.stringify(tournament)) as Tournament;

    expect(rankTeams(roundTripped)).toEqual(rankTeams(tournament));
    expect(rankTeams(tournament)).toEqual(rankTeams(tournament));
  });

  it('I11 — the order never depends on team insertion order', () => {
    const tournament = withScore(tournamentOf(6, 3), 0, 13, 4);
    const shuffled = { ...tournament, teams: [...tournament.teams].reverse() };

    expect(rankTeams(shuffled).entries.map((entry) => entry.team)).toEqual(
      rankTeams(tournament).entries.map((entry) => entry.team)
    );
  });
});
