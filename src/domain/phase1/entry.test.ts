import { describe, expect, it } from 'vitest';
import { addTeam } from '@/domain/tournament/teams';
import { createTournament } from '@/domain/tournament/tournament';
import type { Tournament } from '@/domain/tournament/types';
import { drawPhase1 } from './draw';
import { clearEntry, enterForfeit, enterScore, phase1SettingsLocked } from './entry';

const t0 = '2026-09-15T09:00:00.000Z';
const t1 = '2026-09-15T10:00:00.000Z';

function tournamentOf(teamCount: number, matchCount: number, minimumGapPhase1 = 0): Tournament {
  const base = Array.from({ length: teamCount }, (_unused, index) => `Equipe ${index + 1}`).reduce(
    (current, name) => addTeam(current, name, t0),
    createTournament('t1', 'Tournoi', t0)
  );

  return {
    ...base,
    phase: 'phase1',
    matchCount,
    settings: { ...base.settings, minimumGapPhase1 },
    matches: drawPhase1(
      base.teams.map((team) => team.id),
      matchCount,
      7
    ),
  };
}

const firstPlayable = (tournament: Tournament) =>
  tournament.matches.find((match) => match.slots.every((slot) => slot.kind === 'team'))?.id ?? 0;

describe('entering a phase 1 result', () => {
  it('records a valid score', () => {
    const tournament = tournamentOf(4, 2);
    const id = firstPlayable(tournament);
    const after = enterScore(tournament, id, [13, 7], t1);

    expect(after.matches.find((match) => match.id === id)?.status).toBe('played');
    expect(after.modified).toBe(t1);
  });

  it('refuses an unreachable score and changes nothing', () => {
    const tournament = tournamentOf(4, 2);
    expect(enterScore(tournament, firstPlayable(tournament), [14, 12], t1)).toBe(tournament);
  });

  it('uses the phase 1 gap setting, not a hard coded one', () => {
    const strict = tournamentOf(4, 2, 2);
    const id = firstPlayable(strict);

    expect(enterScore(strict, id, [13, 12], t1)).toBe(strict);
    expect(enterScore(strict, id, [14, 12], t1)).not.toBe(strict);
  });

  it('records a forfeit and clears any score', () => {
    const tournament = tournamentOf(4, 2);
    const id = firstPlayable(tournament);
    const played = enterScore(tournament, id, [13, 7], t1);
    const absent = (played.matches.find((match) => match.id === id)?.slots[0] as { team: number })
      .team;

    const forfeited = enterForfeit(played, id, absent, t1);
    const match = forfeited.matches.find((candidate) => candidate.id === id);

    expect(match?.status).toBe('forfeit');
    expect(match?.score).toBeUndefined();
    expect(match?.forfeitBy).toBe(absent);
  });

  it('refuses a forfeit from a team that is not in the match', () => {
    const tournament = tournamentOf(4, 2);
    expect(enterForfeit(tournament, firstPlayable(tournament), 999, t1)).toBe(tournament);
  });

  it('clears a result back to waiting', () => {
    const tournament = tournamentOf(4, 2);
    const id = firstPlayable(tournament);
    const cleared = clearEntry(enterScore(tournament, id, [13, 7], t1), id, t1);

    expect(cleared.matches.find((match) => match.id === id)?.status).toBe('waiting');
  });

  it('locks the phase 1 settings at the first entered result, not before', () => {
    const tournament = tournamentOf(4, 2);
    expect(phase1SettingsLocked(tournament)).toBe(false);

    const played = enterScore(tournament, firstPlayable(tournament), [13, 7], t1);
    expect(phase1SettingsLocked(played)).toBe(true);

    expect(phase1SettingsLocked(clearEntry(played, firstPlayable(tournament), t1))).toBe(false);
  });

  it('ignores an unknown match', () => {
    const tournament = tournamentOf(4, 2);
    expect(enterScore(tournament, 9999, [13, 7], t1)).toBe(tournament);
  });
});
