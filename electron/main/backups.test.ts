import { mkdtemp, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTournament } from '@/domain/tournament/tournament';
import { BACKUP_KEEP, directoryFor, momentOf, stampOf, stampsIn } from './backups';
import { remove, write } from './repository';

let directory: string;

const t0 = '2026-09-17T09:00:00.000Z';
const MINUTE = 60 * 1000;
const INTERVAL = 10 * MINUTE;

const tournament = (name: string) => createTournament('t1', name, t0);

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'cochonnet-backup-'));
});

async function backupsOf(id: string): Promise<string[]> {
  return stampsIn(directory, id);
}

describe('the timestamp of a backup', () => {
  it('survives a round trip and carries no character Windows refuses', () => {
    const moment = Date.parse('2026-09-17T14:05:09.123Z');
    const stamp = stampOf(moment);

    expect(stamp).toBe('2026-09-17T14-05-09-123Z');
    expect(stamp).not.toContain(':');
    expect(momentOf(stamp)).toBe(moment);
  });

  it('refuses a name that is not one of ours', () => {
    expect(momentOf('notes')).toBeNull();
  });

  it('sorts chronologically as plain text', () => {
    const early = stampOf(Date.parse('2026-09-17T09:00:00.000Z'));
    const late = stampOf(Date.parse('2026-09-17T11:00:00.000Z'));

    expect([late, early].sort()).toEqual([early, late]);
  });
});

describe('R6.4 — rotating backups', () => {
  it('takes no backup on the very first write, there being nothing to save yet', async () => {
    await write(directory, tournament('First'), Date.parse(t0));

    expect(await readdir(directory)).toEqual(['t1.json']);
    expect(await backupsOf('t1')).toEqual([]);
  });

  it('keeps the previous contents, not the new ones', async () => {
    const start = Date.parse(t0);
    await write(directory, tournament('First'), start);
    await write(directory, tournament('Second'), start + INTERVAL);

    const stamps = await backupsOf('t1');
    const first = stamps[0] ?? '';
    const raw = await readFile(join(directoryFor(directory, 't1'), `${first}.json`), 'utf8');

    expect(stamps).toHaveLength(1);
    expect(JSON.parse(raw)).toMatchObject({ tournament: { name: 'First' } });
  });

  it('spaces its snapshots, so a burst of entries does not exhaust the rotation', async () => {
    const start = Date.parse(t0);

    for (let step = 0; step < 40; step += 1) {
      await write(directory, tournament(`Saisie ${step}`), start + step * 500);
    }

    expect(await backupsOf('t1')).toHaveLength(1);
  });

  it('keeps ten, and drops the oldest first', async () => {
    const start = Date.parse(t0);

    for (let step = 0; step < BACKUP_KEEP + 5; step += 1) {
      await write(directory, tournament(`Saisie ${step}`), start + step * INTERVAL);
    }

    const stamps = await backupsOf('t1');

    expect(stamps).toHaveLength(BACKUP_KEEP);
    expect(momentOf(stamps[0] ?? '')).toBeGreaterThan(start);
    expect([...stamps].sort()).toEqual(stamps);
  });

  it('keeps one rotation per tournament', async () => {
    const start = Date.parse(t0);
    const other = createTournament('t2', 'Autre', t0);

    await write(directory, tournament('First'), start);
    await write(directory, tournament('Second'), start + INTERVAL);
    await write(directory, other, start);
    await write(directory, other, start + INTERVAL);

    expect(await backupsOf('t1')).toHaveLength(1);
    expect(await backupsOf('t2')).toHaveLength(1);
  });

  it('takes the backups with the tournament when it is removed', async () => {
    const start = Date.parse(t0);

    await write(directory, tournament('First'), start);
    await write(directory, tournament('Second'), start + INTERVAL);

    expect(await backupsOf('t1')).toHaveLength(1);

    await remove(directory, 't1');

    expect(await backupsOf('t1')).toEqual([]);
  });
});
