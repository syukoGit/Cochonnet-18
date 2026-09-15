import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from './settings';
import {
  byMostRecentlyOpened,
  createTournament,
  isValidTournamentName,
  markOpened,
  normaliseName,
  renameTournament,
} from './tournament';

const t0 = '2026-09-14T09:00:00.000Z';
const t1 = '2026-09-14T10:00:00.000Z';

describe('tournament', () => {
  it('collapses whitespace in the name', () => {
    expect(normaliseName('  Tournoi   du   club  ')).toBe('Tournoi du club');
  });

  it('rejects a blank name', () => {
    expect(isValidTournamentName('   ')).toBe(false);
    expect(isValidTournamentName('Tournoi')).toBe(true);
  });

  it('creates a tournament in the configuration phase', () => {
    expect(createTournament('t1', 'Tournoi', t0)).toEqual({
      id: 't1',
      name: 'Tournoi',
      phase: 'configuration',
      teams: [],
      nextTeamId: 1,
      matchCount: 3,
      settings: DEFAULT_SETTINGS,
      matches: [],
      tieBreaks: [],
      withdrawn: [],
      created: t0,
      modified: t0,
      opened: t0,
    });
  });

  it('renaming updates the modification time but not the creation time', () => {
    const renamed = renameTournament(createTournament('t1', 'Tournoi', t0), 'Coupe', t1);
    expect(renamed.name).toBe('Coupe');
    expect(renamed.modified).toBe(t1);
    expect(renamed.created).toBe(t0);
  });

  it('renaming to the same or to a blank name changes nothing', () => {
    const tournament = createTournament('t1', 'Tournoi', t0);
    expect(renameTournament(tournament, 'Tournoi', t1)).toBe(tournament);
    expect(renameTournament(tournament, '  ', t1)).toBe(tournament);
  });

  it('opening does not touch the modification time', () => {
    const opened = markOpened(createTournament('t1', 'Tournoi', t0), t1);
    expect(opened.opened).toBe(t1);
    expect(opened.modified).toBe(t0);
  });

  it('orders from the most recently opened', () => {
    const older = createTournament('t1', 'Older', t0);
    const newer = createTournament('t2', 'Newer', t1);
    expect([older, newer].sort(byMostRecentlyOpened).map((t) => t.id)).toEqual(['t2', 't1']);
  });
});
