import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { creerEvenement } from '@/domain/event/evenement';
import type { Evenement } from '@/domain/event/types';
import { lireSauvegarde, schemaEvenement, VERSION_SAUVEGARDE } from './schema';

type Equivalent<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

const leSchemaDecritLeType: Equivalent<z.infer<typeof schemaEvenement>, Evenement> = true;

const evenement = creerEvenement('e1', 'Tournoi du 14 septembre', '2026-09-14T09:00:00.000Z');

const sauvegarde = (contenu: unknown) => JSON.stringify(contenu);

describe('schéma de sauvegarde', () => {
  it('décrit exactement les champs du type du domaine', () => {
    expect(leSchemaDecritLeType).toBe(true);
    expect(Object.keys(schemaEvenement.shape).sort()).toEqual(Object.keys(evenement).sort());
  });

  it('accepte un événement produit par le domaine', () => {
    expect(schemaEvenement.safeParse(evenement).success).toBe(true);
  });

  it('refuse un fichier qui n est pas du JSON', () => {
    const resultat = lireSauvegarde('{ ceci nest pas du json');
    expect(resultat.ok).toBe(false);
    expect(!resultat.ok && resultat.echec.motif).toBe('json-invalide');
  });

  it('refuse un JSON valide dont le schéma est faux', () => {
    const resultat = lireSauvegarde(
      sauvegarde({ version: VERSION_SAUVEGARDE, evenement: { ...evenement, phase: 'inconnue' } })
    );
    expect(resultat.ok).toBe(false);
    expect(!resultat.ok && resultat.echec.motif).toBe('schema-invalide');
  });

  it('refuse une version de sauvegarde inconnue', () => {
    const resultat = lireSauvegarde(sauvegarde({ version: 99, evenement }));
    expect(resultat.ok).toBe(false);
    expect(!resultat.ok && resultat.echec.motif).toBe('version-inconnue');
  });

  it('accepte une sauvegarde complète', () => {
    const resultat = lireSauvegarde(sauvegarde({ version: VERSION_SAUVEGARDE, evenement }));
    expect(resultat.ok).toBe(true);
    expect(resultat.ok && resultat.sauvegarde.evenement).toEqual(evenement);
  });
});
