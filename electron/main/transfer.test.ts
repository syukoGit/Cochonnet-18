import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { addTeam } from '@/domain/tournament/teams';
import { createTournament } from '@/domain/tournament/tournament';
import type { Tournament } from '@/domain/tournament/types';
import { read, write } from './repository';
import { exportTo, importFrom, suggestedFileName, TRANSFER_EXTENSION } from './transfer';

let directory: string;

const t0 = '2026-09-17T09:00:00.000Z';

function sample(): Tournament {
  return ['Alpha', 'Bravo', 'Charlie'].reduce(
    (current, name) => addTeam(current, name, t0),
    createTournament('t1', 'Tournoi du 14 septembre', t0)
  );
}

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'cochonnet-transfer-'));
});

describe('the suggested file name', () => {
  it('keeps the tournament name readable and carries the extension', () => {
    expect(suggestedFileName(sample())).toBe(`Tournoi-du-14-septembre${TRANSFER_EXTENSION}`);
  });

  it('keeps accented letters, which are part of the name', () => {
    expect(suggestedFileName(createTournament('t2', 'Été à Marseille', t0))).toBe(
      `Été-à-Marseille${TRANSFER_EXTENSION}`
    );
  });

  it('falls back on the identifier when the name leaves nothing usable', () => {
    expect(suggestedFileName(createTournament('t3', '///', t0))).toBe(`t3${TRANSFER_EXTENSION}`);
  });
});

describe('R6.9 — exporting and importing a tournament', () => {
  it('comes back identical after a round trip through a file', async () => {
    const saved = sample();
    const path = join(directory, 'sortie.cochonnet.json');

    await exportTo(path, saved);
    const outcome = await importFrom(path);

    expect(outcome).toEqual({ ok: true, tournament: saved });
  });

  it('survives deleting and rewriting the tournament in between', async () => {
    const saved = sample();
    const path = join(directory, 'sortie.cochonnet.json');

    await exportTo(path, saved);
    const outcome = await importFrom(path);

    expect(outcome.ok).toBe(true);

    if (outcome.ok) {
      await write(directory, outcome.tournament, Date.parse(t0));
      expect(await read(directory, 't1')).toEqual(saved);
    }
  });

  it('refuses a file that is not a save, naming the reason', async () => {
    const path = join(directory, 'notes.cochonnet.json');
    await writeFile(path, '{ "hello": true }', 'utf8');

    expect(await importFrom(path)).toMatchObject({ ok: false, reason: 'invalid-schema' });
  });

  it('refuses something that is not even JSON', async () => {
    const path = join(directory, 'cassé.cochonnet.json');
    await writeFile(path, 'pas du json', 'utf8');

    expect(await importFrom(path)).toMatchObject({ ok: false, reason: 'invalid-json' });
  });

  it('refuses a file it cannot read at all', async () => {
    const outcome = await importFrom(join(directory, 'absent.cochonnet.json'));

    expect(outcome).toMatchObject({ ok: false, reason: 'unreadable-file' });
  });
});
