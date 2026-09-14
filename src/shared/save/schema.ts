import { z } from 'zod';
import { PHASES } from '@/domain/event/types';

export const VERSION_SAUVEGARDE = 1;

export const schemaEvenement = z.object({
  id: z.string().min(1),
  nom: z.string().min(1),
  phase: z.enum(PHASES),
  cree: z.string().min(1),
  modifie: z.string().min(1),
  ouvert: z.string().min(1),
});

export const schemaSauvegarde = z.object({
  version: z.literal(VERSION_SAUVEGARDE),
  evenement: schemaEvenement,
});

export type Sauvegarde = z.infer<typeof schemaSauvegarde>;

export type EchecDeLecture =
  | { motif: 'json-invalide'; detail: string }
  | { motif: 'schema-invalide'; detail: string }
  | { motif: 'version-inconnue'; detail: string };

export type ResultatDeLecture =
  { ok: true; sauvegarde: Sauvegarde } | { ok: false; echec: EchecDeLecture };

export function lireSauvegarde(contenu: string): ResultatDeLecture {
  let brut: unknown;

  try {
    brut = JSON.parse(contenu);
  } catch (erreur) {
    return { ok: false, echec: { motif: 'json-invalide', detail: String(erreur) } };
  }

  const versionLue = (brut as { version?: unknown } | null)?.version;

  if (typeof versionLue === 'number' && versionLue !== VERSION_SAUVEGARDE) {
    return {
      ok: false,
      echec: {
        motif: 'version-inconnue',
        detail: `version ${versionLue}, attendue ${VERSION_SAUVEGARDE}`,
      },
    };
  }

  const analyse = schemaSauvegarde.safeParse(brut);

  if (!analyse.success) {
    return {
      ok: false,
      echec: { motif: 'schema-invalide', detail: z.prettifyError(analyse.error) },
    };
  }

  return { ok: true, sauvegarde: analyse.data };
}
