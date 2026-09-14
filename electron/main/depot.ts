import { constants } from 'node:fs';
import { mkdir, open, readdir, readFile, rename, rm, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import type { Evenement } from '@/domain/event/types';
import { lireSauvegarde, VERSION_SAUVEGARDE } from '@/shared/save/schema';

export interface EvenementIllisible {
  fichier: string;
  motif: string;
  detail: string;
}

export interface Inventaire {
  evenements: Evenement[];
  illisibles: EvenementIllisible[];
}

const EXTENSION = '.json';

function chemin(dossier: string, id: string): string {
  return join(dossier, `${id}${EXTENSION}`);
}

export async function ecrire(dossier: string, evenement: Evenement): Promise<void> {
  await mkdir(dossier, { recursive: true });

  const destination = chemin(dossier, evenement.id);
  const temporaire = `${destination}.${process.pid}.tmp`;
  const contenu = JSON.stringify({ version: VERSION_SAUVEGARDE, evenement }, null, 2);

  const fichier = await open(
    temporaire,
    constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC
  );

  try {
    await fichier.writeFile(contenu, 'utf8');
    await fichier.sync();
  } finally {
    await fichier.close();
  }

  try {
    await rename(temporaire, destination);
  } catch (erreur) {
    await unlink(temporaire).catch(() => undefined);
    throw erreur;
  }
}

export async function lire(dossier: string, id: string): Promise<Evenement | null> {
  try {
    const resultat = lireSauvegarde(await readFile(chemin(dossier, id), 'utf8'));
    return resultat.ok ? resultat.sauvegarde.evenement : null;
  } catch {
    return null;
  }
}

export async function lister(dossier: string): Promise<Inventaire> {
  await mkdir(dossier, { recursive: true });

  const entrees = await readdir(dossier, { withFileTypes: true });
  const evenements: Evenement[] = [];
  const illisibles: EvenementIllisible[] = [];

  for (const entree of entrees) {
    if (!entree.isFile() || !entree.name.endsWith(EXTENSION)) {
      continue;
    }

    let contenu: string;

    try {
      contenu = await readFile(join(dossier, entree.name), 'utf8');
    } catch (erreur) {
      illisibles.push({
        fichier: entree.name,
        motif: 'lecture-impossible',
        detail: String(erreur),
      });
      continue;
    }

    const resultat = lireSauvegarde(contenu);

    if (resultat.ok) {
      evenements.push(resultat.sauvegarde.evenement);
    } else {
      illisibles.push({
        fichier: entree.name,
        motif: resultat.echec.motif,
        detail: resultat.echec.detail,
      });
    }
  }

  return { evenements, illisibles };
}

export async function supprimer(dossier: string, id: string): Promise<void> {
  await rm(chemin(dossier, id), { force: true });
}
