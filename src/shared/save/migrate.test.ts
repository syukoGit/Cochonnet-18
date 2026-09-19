import { describe, expect, it } from 'vitest';
import { migrate } from './migrate';
import type { MigrationTable } from './migrate';
import { readSave, SAVE_VERSION } from './schema';
import { createTournament } from '@/domain/tournament/tournament';

const t0 = '2026-09-17T09:00:00.000Z';

const table: MigrationTable = {
  0: (raw) => ({ ...(raw as object), tournament: { ...createTournament('t1', 'Ancien', t0) } }),
};

function fileAt(version: number): string {
  return JSON.stringify({ version, hint: 'a shape this application no longer knows' });
}

describe('migrating a save forward', () => {
  it('returns the payload untouched when there is nothing to do', () => {
    const result = migrate({ a: 1 }, 3, 3, {});

    expect(result).toEqual({ ok: true, raw: { a: 1 } });
  });

  it('applies each step in order', () => {
    const steps: MigrationTable = {
      1: (raw) => ({ ...(raw as object), one: true }),
      2: (raw) => ({ ...(raw as object), two: true }),
    };

    expect(migrate({}, 1, 3, steps)).toEqual({ ok: true, raw: { one: true, two: true } });
  });

  it('refuses a gap in the chain rather than guessing', () => {
    const result = migrate({}, 1, 3, { 1: (raw) => raw });

    expect(result.ok).toBe(false);
  });

  it('refuses a payload written by a newer version', () => {
    const result = migrate({}, 4, 2, {});

    expect(result.ok).toBe(false);
  });
});

describe('R6.5 — reading a save of another version', () => {
  it('migrates an older file before validating it', () => {
    const result = readSave(fileAt(SAVE_VERSION - 1), table);

    expect(result.ok).toBe(true);
    expect(result.ok && result.save.version).toBe(SAVE_VERSION);
    expect(result.ok && result.save.tournament.name).toBe('Ancien');
  });

  it('refuses an older file when no migration covers it', () => {
    const result = readSave(fileAt(SAVE_VERSION - 1), {});

    expect(result.ok).toBe(false);
    expect(!result.ok && result.failure.reason).toBe('unknown-version');
  });

  it('refuses a file written by a newer application', () => {
    const result = readSave(fileAt(SAVE_VERSION + 1));

    expect(result.ok).toBe(false);
    expect(!result.ok && result.failure.reason).toBe('unknown-version');
  });
});
