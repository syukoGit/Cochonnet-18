import { describe, expect, it } from 'vitest';
import {
  creerEvenement,
  marquerOuvert,
  nomEvenementValide,
  normaliserNom,
  parDernierOuvert,
  renommerEvenement,
} from './evenement';

const t0 = '2026-09-14T09:00:00.000Z';
const t1 = '2026-09-14T10:00:00.000Z';

describe('événement', () => {
  it('normalise les espaces du nom', () => {
    expect(normaliserNom('  Tournoi   du   club  ')).toBe('Tournoi du club');
  });

  it('refuse un nom vide ou blanc', () => {
    expect(nomEvenementValide('   ')).toBe(false);
    expect(nomEvenementValide('Tournoi')).toBe(true);
  });

  it('crée un événement en configuration', () => {
    const evenement = creerEvenement('e1', 'Tournoi', t0);
    expect(evenement).toEqual({
      id: 'e1',
      nom: 'Tournoi',
      phase: 'configuration',
      cree: t0,
      modifie: t0,
      ouvert: t0,
    });
  });

  it('renomme et met à jour la date de modification', () => {
    const renomme = renommerEvenement(creerEvenement('e1', 'Tournoi', t0), 'Coupe', t1);
    expect(renomme.nom).toBe('Coupe');
    expect(renomme.modifie).toBe(t1);
    expect(renomme.cree).toBe(t0);
  });

  it('ne modifie rien si le nom est inchangé ou invalide', () => {
    const evenement = creerEvenement('e1', 'Tournoi', t0);
    expect(renommerEvenement(evenement, 'Tournoi', t1)).toBe(evenement);
    expect(renommerEvenement(evenement, '  ', t1)).toBe(evenement);
  });

  it('marquer ouvert ne touche pas la date de modification', () => {
    const ouvert = marquerOuvert(creerEvenement('e1', 'Tournoi', t0), t1);
    expect(ouvert.ouvert).toBe(t1);
    expect(ouvert.modifie).toBe(t0);
  });

  it('ordonne du dernier ouvert au plus ancien', () => {
    const ancien = creerEvenement('e1', 'Ancien', t0);
    const recent = creerEvenement('e2', 'Recent', t1);
    expect([ancien, recent].sort(parDernierOuvert).map((e) => e.id)).toEqual(['e2', 'e1']);
  });
});
