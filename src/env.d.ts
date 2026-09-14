/// <reference types="vite/client" />

import type { Evenement } from './domain/event/types';

export interface EvenementIllisible {
  fichier: string;
  motif: string;
  detail: string;
}

export interface Inventaire {
  evenements: Evenement[];
  illisibles: EvenementIllisible[];
}

export interface PontEvenements {
  lister: () => Promise<Inventaire>;
  lire: (id: string) => Promise<Evenement | null>;
  ecrire: (evenement: Evenement) => Promise<void>;
  supprimer: (id: string) => Promise<void>;
}

declare global {
  interface Window {
    cochonnet: { evenements: PontEvenements };
  }
}
