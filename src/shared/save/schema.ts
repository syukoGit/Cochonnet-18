import { z } from 'zod';
import { PHASES } from '@/domain/tournament/types';

export const SAVE_VERSION = 1;

export const teamSchema = z.object({
  id: z.number().int().min(1),
  name: z.string().min(1),
});

export const tournamentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  phase: z.enum(PHASES),
  teams: z.array(teamSchema),
  nextTeamId: z.number().int().min(1),
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

export function readSave(contents: string): ReadResult {
  let raw: unknown;

  try {
    raw = JSON.parse(contents);
  } catch (error) {
    return { ok: false, failure: { reason: 'invalid-json', detail: String(error) } };
  }

  const version = (raw as { version?: unknown } | null)?.version;

  if (typeof version === 'number' && version !== SAVE_VERSION) {
    return {
      ok: false,
      failure: {
        reason: 'unknown-version',
        detail: `version ${version}, expected ${SAVE_VERSION}`,
      },
    };
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
