import { constants } from 'node:fs';
import { mkdir, open, readdir, readFile, rename, rm, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import type { Tournament } from '@/domain/tournament/types';
import { readSave, SAVE_VERSION } from '@/shared/save/schema';
import { discard, snapshot } from './backups';

export interface UnreadableTournament {
  file: string;
  reason: string;
  detail: string;
}

export interface Inventory {
  tournaments: Tournament[];
  unreadable: UnreadableTournament[];
}

const EXTENSION = '.json';

function pathFor(directory: string, id: string): string {
  return join(directory, `${id}${EXTENSION}`);
}

export async function write(
  directory: string,
  tournament: Tournament,
  moment: number = Date.now()
): Promise<void> {
  await mkdir(directory, { recursive: true });

  const destination = pathFor(directory, tournament.id);

  await snapshot(directory, tournament.id, destination, moment);
  const temporary = `${destination}.${process.pid}.tmp`;
  const contents = JSON.stringify({ version: SAVE_VERSION, tournament }, null, 2);

  const file = await open(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC);

  try {
    await file.writeFile(contents, 'utf8');
    await file.sync();
  } finally {
    await file.close();
  }

  try {
    await rename(temporary, destination);
  } catch (error) {
    await unlink(temporary).catch(() => undefined);
    throw error;
  }
}

export async function read(directory: string, id: string): Promise<Tournament | null> {
  try {
    const result = readSave(await readFile(pathFor(directory, id), 'utf8'));
    return result.ok ? result.save.tournament : null;
  } catch {
    return null;
  }
}

export async function list(directory: string): Promise<Inventory> {
  await mkdir(directory, { recursive: true });

  const entries = await readdir(directory, { withFileTypes: true });
  const tournaments: Tournament[] = [];
  const unreadable: UnreadableTournament[] = [];

  for (const entry of entries) {
    if (!entry.name.endsWith(EXTENSION)) {
      continue;
    }

    let contents: string;

    try {
      contents = await readFile(join(directory, entry.name), 'utf8');
    } catch (error) {
      unreadable.push({ file: entry.name, reason: 'unreadable-file', detail: String(error) });
      continue;
    }

    const result = readSave(contents);

    if (result.ok) {
      tournaments.push(result.save.tournament);
    } else {
      unreadable.push({
        file: entry.name,
        reason: result.failure.reason,
        detail: result.failure.detail,
      });
    }
  }

  return { tournaments, unreadable };
}

export async function remove(directory: string, id: string): Promise<void> {
  await rm(pathFor(directory, id), { force: true });
  await discard(directory, id);
}
