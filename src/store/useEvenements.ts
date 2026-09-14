import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  creerEvenement,
  marquerOuvert,
  parDernierOuvert,
  renommerEvenement,
} from '@/domain/event/evenement';
import type { EventId, Evenement } from '@/domain/event/types';
import type { EvenementIllisible } from '@/env';

const DELAI_ECRITURE = 500;

const minuteries = new Map<EventId, ReturnType<typeof setTimeout>>();

function planifierEcriture(evenement: Evenement): void {
  clearTimeout(minuteries.get(evenement.id));

  minuteries.set(
    evenement.id,
    setTimeout(() => {
      minuteries.delete(evenement.id);
      void window.cochonnet.evenements.ecrire(evenement);
    }, DELAI_ECRITURE)
  );
}

export async function viderLaFileDEcriture(): Promise<void> {
  const enAttente = [...minuteries.values()];
  minuteries.clear();
  enAttente.forEach(clearTimeout);
}

interface EtatEvenements {
  liste: Evenement[];
  illisibles: EvenementIllisible[];
  courant: Evenement | null;
  chargement: boolean;
  charger: () => Promise<void>;
  creer: (nom: string) => Promise<EventId>;
  ouvrir: (id: EventId) => Promise<void>;
  renommer: (id: EventId, nom: string) => void;
  supprimer: (id: EventId) => Promise<void>;
}

function maintenant(): string {
  return new Date().toISOString();
}

function identifiant(): EventId {
  return crypto.randomUUID();
}

export const useEvenements = create<EtatEvenements>()(
  immer((set, get) => ({
    liste: [],
    illisibles: [],
    courant: null,
    chargement: true,

    charger: async () => {
      const inventaire = await window.cochonnet.evenements.lister();

      set((etat) => {
        etat.liste = [...inventaire.evenements].sort(parDernierOuvert);
        etat.illisibles = inventaire.illisibles;
        etat.chargement = false;
      });
    },

    creer: async (nom) => {
      const evenement = creerEvenement(identifiant(), nom, maintenant());
      await window.cochonnet.evenements.ecrire(evenement);

      set((etat) => {
        etat.liste.unshift(evenement);
        etat.courant = evenement;
      });

      return evenement.id;
    },

    ouvrir: async (id) => {
      const trouve = get().liste.find((evenement) => evenement.id === id);

      if (!trouve) {
        return;
      }

      const ouvert = marquerOuvert(trouve, maintenant());
      planifierEcriture(ouvert);

      set((etat) => {
        etat.courant = ouvert;
        const index = etat.liste.findIndex((evenement) => evenement.id === id);
        if (index >= 0) {
          etat.liste[index] = ouvert;
        }
      });
    },

    renommer: (id, nom) => {
      const trouve = get().liste.find((evenement) => evenement.id === id);

      if (!trouve) {
        return;
      }

      const renomme = renommerEvenement(trouve, nom, maintenant());

      if (renomme === trouve) {
        return;
      }

      planifierEcriture(renomme);

      set((etat) => {
        const index = etat.liste.findIndex((evenement) => evenement.id === id);
        if (index >= 0) {
          etat.liste[index] = renomme;
        }
        if (etat.courant?.id === id) {
          etat.courant = renomme;
        }
      });
    },

    supprimer: async (id) => {
      clearTimeout(minuteries.get(id));
      minuteries.delete(id);
      await window.cochonnet.evenements.supprimer(id);

      set((etat) => {
        etat.liste = etat.liste.filter((evenement) => evenement.id !== id);
        if (etat.courant?.id === id) {
          etat.courant = null;
        }
      });
    },
  }))
);
