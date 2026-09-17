export type Migration = (raw: unknown) => unknown;

export type MigrationTable = Record<number, Migration>;

export const MIGRATIONS: MigrationTable = {};

export type MigrationResult = { ok: true; raw: unknown } | { ok: false; detail: string };

export function migrate(
  raw: unknown,
  from: number,
  to: number,
  table: MigrationTable = MIGRATIONS
): MigrationResult {
  if (from > to) {
    return { ok: false, detail: `version ${from} is newer than ${to}` };
  }

  let current = raw;

  for (let version = from; version < to; version += 1) {
    const step = table[version];

    if (!step) {
      return { ok: false, detail: `no migration from version ${version} to ${version + 1}` };
    }

    current = step(current);
  }

  return { ok: true, raw: current };
}
