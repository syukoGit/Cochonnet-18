import { access, copyFile, mkdir, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

export const BACKUP_INTERVAL_MS = 10 * 60 * 1000;

export const BACKUP_KEEP = 10;

const EXTENSION = '.json';

export function stampOf(moment: number): string {
  return new Date(moment).toISOString().replace(/:/g, '-').replace('.', '-');
}

export function momentOf(stamp: string): number | null {
  const iso = stamp.replace(
    /^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/,
    '$1T$2:$3:$4.$5Z'
  );
  const parsed = Date.parse(iso);

  return Number.isNaN(parsed) ? null : parsed;
}

export function directoryFor(directory: string, id: string): string {
  return join(directory, 'backups', id);
}

export async function stampsIn(directory: string, id: string): Promise<string[]> {
  let entries: string[];

  try {
    entries = await readdir(directoryFor(directory, id));
  } catch {
    return [];
  }

  return entries
    .filter((entry) => entry.endsWith(EXTENSION))
    .map((entry) => entry.slice(0, -EXTENSION.length))
    .filter((stamp) => momentOf(stamp) !== null)
    .sort();
}

export function isDue(stamps: readonly string[], moment: number, interval: number): boolean {
  const latest = stamps.at(-1);

  if (latest === undefined) {
    return true;
  }

  const previous = momentOf(latest);

  return previous === null || moment - previous >= interval;
}

export async function snapshot(
  directory: string,
  id: string,
  source: string,
  moment: number,
  interval = BACKUP_INTERVAL_MS,
  keep = BACKUP_KEEP
): Promise<boolean> {
  try {
    await access(source);
  } catch {
    return false;
  }

  const stamps = await stampsIn(directory, id);

  if (!isDue(stamps, moment, interval)) {
    return false;
  }

  const target = directoryFor(directory, id);
  await mkdir(target, { recursive: true });
  await copyFile(source, join(target, `${stampOf(moment)}${EXTENSION}`));

  const kept = await stampsIn(directory, id);

  for (const stamp of kept.slice(0, Math.max(0, kept.length - keep))) {
    await rm(join(target, `${stamp}${EXTENSION}`), { force: true });
  }

  return true;
}

export async function discard(directory: string, id: string): Promise<void> {
  await rm(directoryFor(directory, id), { recursive: true, force: true });
}
