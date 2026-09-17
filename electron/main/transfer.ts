import { readFile, writeFile } from 'node:fs/promises';
import type { Tournament } from '@/domain/tournament/types';
import { readSave, SAVE_VERSION } from '@/shared/save/schema';

export const TRANSFER_EXTENSION = '.cochonnet.json';

export function suggestedFileName(tournament: Tournament): string {
  const stem = tournament.name.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');

  return `${stem.length > 0 ? stem : tournament.id}${TRANSFER_EXTENSION}`;
}

export type ImportOutcome =
  { ok: true; tournament: Tournament } | { ok: false; reason: string; detail: string };

export async function exportTo(path: string, tournament: Tournament): Promise<void> {
  await writeFile(path, JSON.stringify({ version: SAVE_VERSION, tournament }, null, 2), 'utf8');
}

export async function importFrom(path: string): Promise<ImportOutcome> {
  let contents: string;

  try {
    contents = await readFile(path, 'utf8');
  } catch (error) {
    return { ok: false, reason: 'unreadable-file', detail: String(error) };
  }

  const result = readSave(contents);

  return result.ok
    ? { ok: true, tournament: result.save.tournament }
    : { ok: false, reason: result.failure.reason, detail: result.failure.detail };
}
