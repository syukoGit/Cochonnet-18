import { z } from 'zod';
import type { Scenario } from '@/domain/replay';
import { BYE_POINTS_MODES } from '@/domain/tournament/settings';

const scoreSchema = z.tuple([z.number().int().min(0), z.number().int().min(0)]);

export const scenarioSchema = z.object({
  name: z.string().min(1),
  teams: z.array(z.string().min(1)).min(2),
  matchCount: z.number().int().min(1),
  seed: z.number().int().min(0),
  settings: z
    .object({
      minimumGapPhase1: z.number().int().min(0).optional(),
      byePoints: z.enum(BYE_POINTS_MODES).optional(),
      forfeitDifferential: z.number().int().min(0).optional(),
      minimumGapPhase2: z.number().int().min(0).optional(),
    })
    .optional(),
  withdrawn: z.array(z.number().int().min(1)).optional(),
  scores: z.record(z.string(), scoreSchema).optional(),
});

export type ScenarioResult = { ok: true; scenario: Scenario } | { ok: false; detail: string };

export function readScenario(contents: string): ScenarioResult {
  let raw: unknown;

  try {
    raw = JSON.parse(contents);
  } catch (error) {
    return { ok: false, detail: `not valid JSON — ${String(error)}` };
  }

  const parsed = scenarioSchema.safeParse(raw);

  return parsed.success
    ? { ok: true, scenario: parsed.data }
    : { ok: false, detail: z.prettifyError(parsed.error) };
}
