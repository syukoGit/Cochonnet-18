import { describe, expect, it } from 'vitest';
import { addTeam, removeTeam, renameTeam, teamNameIssue } from './teams';
import { createTournament } from './tournament';
import type { Tournament } from './types';

const t0 = '2026-09-14T09:00:00.000Z';
const t1 = '2026-09-14T10:00:00.000Z';

function withTeams(...names: string[]): Tournament {
  return names.reduce(
    (tournament, name) => addTeam(tournament, name, t0),
    createTournament('t1', 'Tournoi', t0)
  );
}

describe('teams', () => {
  it('adds teams with increasing identifiers', () => {
    expect(withTeams('Un', 'Deux', 'Trois').teams).toEqual([
      { id: 1, name: 'Un' },
      { id: 2, name: 'Deux' },
      { id: 3, name: 'Trois' },
    ]);
  });

  it('normalises the name on the way in', () => {
    expect(withTeams('  Les   Boulistes  ').teams[0]?.name).toBe('Les Boulistes');
  });

  it('refuses a blank name', () => {
    const tournament = withTeams('Un');
    expect(teamNameIssue(tournament, '   ')).toBe('empty');
    expect(addTeam(tournament, '   ', t1)).toBe(tournament);
  });

  it('refuses a duplicate name whatever the case or spacing', () => {
    const tournament = withTeams('Les Boulistes');
    expect(teamNameIssue(tournament, 'les boulistes')).toBe('duplicate');
    expect(teamNameIssue(tournament, '  LES   BOULISTES ')).toBe('duplicate');
    expect(addTeam(tournament, 'les boulistes', t1)).toBe(tournament);
  });

  it('never reuses the identifier of a removed team', () => {
    const afterRemoval = removeTeam(withTeams('Un', 'Deux', 'Trois'), 2, t1);
    const afterAdd = addTeam(afterRemoval, 'Quatre', t1);

    expect(afterAdd.teams.map((team) => team.id)).toEqual([1, 3, 4]);
  });

  it('never reuses the identifier even when the last team is removed', () => {
    const afterRemoval = removeTeam(withTeams('Un', 'Deux'), 2, t1);
    expect(addTeam(afterRemoval, 'Trois', t1).teams.map((team) => team.id)).toEqual([1, 3]);
  });

  it('renaming changes no identifier', () => {
    const before = withTeams('Un', 'Deux');
    const after = renameTeam(before, 1, 'Premier', t1);

    expect(after.teams).toEqual([
      { id: 1, name: 'Premier' },
      { id: 2, name: 'Deux' },
    ]);
  });

  it('a team may keep its own name when renamed', () => {
    const tournament = withTeams('Un', 'Deux');
    expect(teamNameIssue(tournament, 'Un', 1)).toBeNull();
    expect(renameTeam(tournament, 1, '  Un  ', t1)).toBe(tournament);
  });

  it('refuses renaming onto another team name', () => {
    const tournament = withTeams('Un', 'Deux');
    expect(renameTeam(tournament, 1, 'deux', t1)).toBe(tournament);
  });

  it('ignores an unknown identifier', () => {
    const tournament = withTeams('Un');
    expect(renameTeam(tournament, 99, 'Autre', t1)).toBe(tournament);
    expect(removeTeam(tournament, 99, t1)).toBe(tournament);
  });

  it('touches the modification time only when something changed', () => {
    const tournament = withTeams('Un');
    expect(addTeam(tournament, 'Deux', t1).modified).toBe(t1);
    expect(addTeam(tournament, 'un', t1).modified).toBe(t0);
  });
});
