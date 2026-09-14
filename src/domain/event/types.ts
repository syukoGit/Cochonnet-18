export type EventId = string;

export type Horodatage = string;

export const PHASES = ['configuration', 'phase1', 'cloture', 'phase2', 'resultats'] as const;

export type Phase = (typeof PHASES)[number];

export interface Evenement {
  id: EventId;
  nom: string;
  phase: Phase;
  cree: Horodatage;
  modifie: Horodatage;
  ouvert: Horodatage;
}
