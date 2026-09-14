import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { createTournament } from '@/domain/tournament/tournament';
import type { Tournament } from '@/domain/tournament/types';
import { readSave, SAVE_VERSION, tournamentSchema } from './schema';

type Equivalent<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

const schemaDescribesTheDomainType: Equivalent<z.infer<typeof tournamentSchema>, Tournament> = true;

const tournament = createTournament('t1', 'Tournoi du 14 septembre', '2026-09-14T09:00:00.000Z');

const saved = (contents: unknown) => JSON.stringify(contents);

describe('save schema', () => {
  it('describes exactly the fields of the domain type', () => {
    expect(schemaDescribesTheDomainType).toBe(true);
    expect(Object.keys(tournamentSchema.shape).sort()).toEqual(Object.keys(tournament).sort());
  });

  it('accepts a tournament produced by the domain', () => {
    expect(tournamentSchema.safeParse(tournament).success).toBe(true);
  });

  it('rejects a file that is not JSON', () => {
    const result = readSave('{ this is not json');
    expect(result.ok).toBe(false);
    expect(!result.ok && result.failure.reason).toBe('invalid-json');
  });

  it('rejects valid JSON that does not match the schema', () => {
    const result = readSave(
      saved({ version: SAVE_VERSION, tournament: { ...tournament, phase: 'unknown' } })
    );
    expect(result.ok).toBe(false);
    expect(!result.ok && result.failure.reason).toBe('invalid-schema');
  });

  it('rejects an unknown save version', () => {
    const result = readSave(saved({ version: 99, tournament }));
    expect(result.ok).toBe(false);
    expect(!result.ok && result.failure.reason).toBe('unknown-version');
  });

  it('accepts a complete save', () => {
    const result = readSave(saved({ version: SAVE_VERSION, tournament }));
    expect(result.ok).toBe(true);
    expect(result.ok && result.save.tournament).toEqual(tournament);
  });
});
