import { mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTournament } from '@/domain/tournament/tournament';
import { SAVE_VERSION } from '@/shared/save/schema';
import { list, read, remove, write } from './repository';

let directory: string;

const tournament = (id: string, name: string) =>
  createTournament(id, name, '2026-09-14T09:00:00.000Z');

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'cochonnet-'));
});

describe('tournament repository', () => {
  it('writes then reads a tournament back', async () => {
    const saved = tournament('t1', 'Tournoi');
    await write(directory, saved);
    expect(await read(directory, 't1')).toEqual(saved);
  });

  it('leaves no temporary file behind', async () => {
    await write(directory, tournament('t1', 'Tournoi'));
    expect(await readdir(directory)).toEqual(['t1.json']);
  });

  it('replaces an existing file without truncating it', async () => {
    await write(directory, tournament('t1', 'First name'));
    await write(directory, tournament('t1', 'Second name'));

    const raw = await readFile(join(directory, 't1.json'), 'utf8');
    expect(JSON.parse(raw)).toEqual({
      version: SAVE_VERSION,
      tournament: tournament('t1', 'Second name'),
    });
  });

  it('lists the valid tournaments', async () => {
    await write(directory, tournament('t1', 'One'));
    await write(directory, tournament('t2', 'Two'));

    const inventory = await list(directory);
    expect(inventory.tournaments.map((t) => t.name).sort()).toEqual(['One', 'Two']);
    expect(inventory.unreadable).toEqual([]);
  });

  it('an unreadable file does not keep the others from opening', async () => {
    await write(directory, tournament('good', 'Readable'));
    await writeFile(join(directory, 'broken.json'), '{ "version": 1, "tournament":', 'utf8');
    await writeFile(join(directory, 'empty.json'), '', 'utf8');
    await writeFile(join(directory, 'future.json'), JSON.stringify({ version: 99 }), 'utf8');

    const inventory = await list(directory);

    expect(inventory.tournaments.map((t) => t.id)).toEqual(['good']);
    expect(inventory.unreadable.map((u) => u.file).sort()).toEqual([
      'broken.json',
      'empty.json',
      'future.json',
    ]);
    expect(inventory.unreadable.find((u) => u.file === 'future.json')?.reason).toBe(
      'unknown-version'
    );
  });

  it('ignores anything that is not a save file', async () => {
    await write(directory, tournament('t1', 'One'));
    await writeFile(join(directory, 'notes.txt'), 'nothing to see', 'utf8');

    const inventory = await list(directory);
    expect(inventory.tournaments).toHaveLength(1);
    expect(inventory.unreadable).toEqual([]);
  });

  it('reading an unknown id returns null', async () => {
    expect(await read(directory, 'ghost')).toBeNull();
  });

  it('removing twice does not complain', async () => {
    await write(directory, tournament('t1', 'One'));
    await remove(directory, 't1');
    await remove(directory, 't1');

    expect((await list(directory)).tournaments).toEqual([]);
  });
});
