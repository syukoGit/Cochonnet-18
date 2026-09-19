import { z } from 'zod';
import { MATCH_PHASES } from '@/domain/match/types';
import { BYE_POINTS_MODES } from '@/domain/tournament/settings';
import { PHASES } from '@/domain/tournament/types';
import { migrate, MIGRATIONS } from './migrate';
import type { MigrationTable } from './migrate';

export const SAVE_VERSION = 1;

export const teamSchema = z.object({
  id: z.number().int().min(1),
  name: z.string().min(1),
});

export const slotSchema = z.union([
  z.object({ kind: z.literal('team'), team: z.number().int().min(1) }),
  z.object({ kind: z.literal('bye') }),
  z.object({ kind: z.literal('winner'), from: z.number().int().min(1) }),
  z.object({ kind: z.literal('loser'), from: z.number().int().min(1) }),
]);

export const feedSchema = z.object({
  match: z.number().int().min(1),
  slot: z.union([z.literal(0), z.literal(1)]),
});

export const matchSchema = z.object({
  id: z.number().int().min(1),
  phase: z.enum(MATCH_PHASES),
  round: z.number().int().min(1),
  slots: z.tuple([slotSchema, slotSchema]),
  status: z.enum(['waiting', 'played', 'forfeit']),
  score: z.tuple([z.number().int().min(0), z.number().int().min(0)]).optional(),
  forfeitBy: z.number().int().min(1).optional(),
  feeds: feedSchema.optional(),
  feedsConsolation: feedSchema.optional(),
});

export const settingsSchema = z.object({
  minimumGapPhase1: z.number().int().min(0),
  byePoints: z.enum(BYE_POINTS_MODES),
  forfeitDifferential: z.number().int().min(0),
  minimumGapPhase2: z.number().int().min(0),
});

export const tieBreakSchema = z.object({
  teams: z.array(z.number().int().min(1)),
  order: z.array(z.number().int().min(1)),
});

export const tournamentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  phase: z.enum(PHASES),
  teams: z.array(teamSchema),
  nextTeamId: z.number().int().min(1),
  matchCount: z.number().int().min(1),
  settings: settingsSchema,
  matches: z.array(matchSchema),
  phase2Seed: z.number().int().min(0),
  tieBreaks: z.array(tieBreakSchema),
  withdrawn: z.array(z.number().int().min(1)),
  created: z.string().min(1),
  modified: z.string().min(1),
  opened: z.string().min(1),
});

export const saveSchema = z.object({
  version: z.literal(SAVE_VERSION),
  tournament: tournamentSchema,
});

export type Save = z.infer<typeof saveSchema>;

export type ReadFailure =
  | { reason: 'invalid-json'; detail: string }
  | { reason: 'invalid-schema'; detail: string }
  | { reason: 'unknown-version'; detail: string };

export type ReadResult = { ok: true; save: Save } | { ok: false; failure: ReadFailure };

function versionOf(raw: unknown): number | null {
  const version = (raw as { version?: unknown } | null)?.version;

  return typeof version === 'number' ? version : null;
}

function atCurrentVersion(raw: unknown): unknown {
  return typeof raw === 'object' && raw !== null ? { ...raw, version: SAVE_VERSION } : raw;
}

export function readSave(contents: string, table: MigrationTable = MIGRATIONS): ReadResult {
  let raw: unknown;

  try {
    raw = JSON.parse(contents);
  } catch (error) {
    return { ok: false, failure: { reason: 'invalid-json', detail: String(error) } };
  }

  const version = versionOf(raw);

  if (version !== null && version > SAVE_VERSION) {
    return {
      ok: false,
      failure: {
        reason: 'unknown-version',
        detail: `version ${version}, this application reads up to ${SAVE_VERSION}`,
      },
    };
  }

  if (version !== null && version < SAVE_VERSION) {
    const migrated = migrate(raw, version, SAVE_VERSION, table);

    if (!migrated.ok) {
      return { ok: false, failure: { reason: 'unknown-version', detail: migrated.detail } };
    }

    raw = atCurrentVersion(migrated.raw);
  }

  const parsed = saveSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      failure: { reason: 'invalid-schema', detail: z.prettifyError(parsed.error) },
    };
  }

  return { ok: true, save: parsed.data };
}
