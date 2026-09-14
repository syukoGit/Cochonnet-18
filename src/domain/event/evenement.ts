import type { EventId, Evenement, Horodatage } from './types';

export const LONGUEUR_NOM_MAXIMALE = 80;

export function normaliserNom(nom: string): string {
  return nom.trim().replace(/\s+/g, ' ').slice(0, LONGUEUR_NOM_MAXIMALE);
}

export function nomEvenementValide(nom: string): boolean {
  return normaliserNom(nom).length > 0;
}

export function creerEvenement(id: EventId, nom: string, maintenant: Horodatage): Evenement {
  return {
    id,
    nom: normaliserNom(nom),
    phase: 'configuration',
    cree: maintenant,
    modifie: maintenant,
    ouvert: maintenant,
  };
}

export function renommerEvenement(
  evenement: Evenement,
  nom: string,
  maintenant: Horodatage
): Evenement {
  const normalise = normaliserNom(nom);

  if (!nomEvenementValide(normalise) || normalise === evenement.nom) {
    return evenement;
  }

  return { ...evenement, nom: normalise, modifie: maintenant };
}

export function marquerOuvert(evenement: Evenement, maintenant: Horodatage): Evenement {
  return { ...evenement, ouvert: maintenant };
}

export function parDernierOuvert(a: Evenement, b: Evenement): number {
  return b.ouvert.localeCompare(a.ouvert);
}
