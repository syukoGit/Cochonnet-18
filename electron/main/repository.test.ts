import { mkdir, mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises';
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

  it('I14 — every shape of broken file is named, and none hides the others', async () => {
    await write(directory, tournament('good', 'Readable'));

    await writeFile(join(directory, 'empty.json'), '', 'utf8');
    await writeFile(
      join(directory, 'truncated.json'),
      '{ "version": 1, "tournament": { "id"',
      'utf8'
    );
    await writeFile(
      join(directory, 'wrong-shape.json'),
      JSON.stringify({ version: 1, tournament: { id: 't' } }),
      'utf8'
    );
    await writeFile(join(directory, 'not-an-object.json'), '"just a string"', 'utf8');
    await writeFile(
      join(directory, 'from-the-future.json'),
      JSON.stringify({ version: 99 }),
      'utf8'
    );
    await mkdir(join(directory, 'a-directory.json'));

    const inventory = await list(directory);
    const reasonOf = (file: string) =>
      inventory.unreadable.find((entry) => entry.file === file)?.reason;

    expect(inventory.tournaments.map((one) => one.id)).toEqual(['good']);
    expect(inventory.unreadable).toHaveLength(6);
    expect(reasonOf('empty.json')).toBe('invalid-json');
    expect(reasonOf('truncated.json')).toBe('invalid-json');
    expect(reasonOf('wrong-shape.json')).toBe('invalid-schema');
    expect(reasonOf('not-an-object.json')).toBe('invalid-schema');
    expect(reasonOf('from-the-future.json')).toBe('unknown-version');
    expect(reasonOf('a-directory.json')).toBe('unreadable-file');

    for (const entry of inventory.unreadable) {
      expect(entry.detail.length).toBeGreaterThan(0);
    }
  });

  it('I14 — reading one tournament never touches another', async () => {
    await write(directory, tournament('t1', 'One'));
    await write(directory, tournament('t2', 'Two'));

    const before = await readFile(join(directory, 't2.json'), 'utf8');
    await read(directory, 't1');
    await remove(directory, 't3');

    expect(await readFile(join(directory, 't2.json'), 'utf8')).toBe(before);
  });

  it('removing twice does not complain', async () => {
    await write(directory, tournament('t1', 'One'));
    await remove(directory, 't1');
    await remove(directory, 't1');

    expect((await list(directory)).tournaments).toEqual([]);
  });
});
