import { mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { creerEvenement } from '@/domain/event/evenement';
import { VERSION_SAUVEGARDE } from '@/shared/save/schema';
import { ecrire, lire, lister, supprimer } from './depot';

let dossier: string;

const evenement = (id: string, nom: string) => creerEvenement(id, nom, '2026-09-14T09:00:00.000Z');

beforeEach(async () => {
  dossier = await mkdtemp(join(tmpdir(), 'cochonnet-'));
});

describe('dépôt des événements', () => {
  it('écrit puis relit un événement', async () => {
    const tournoi = evenement('e1', 'Tournoi');
    await ecrire(dossier, tournoi);
    expect(await lire(dossier, 'e1')).toEqual(tournoi);
  });

  it('ne laisse aucun fichier temporaire derrière lui', async () => {
    await ecrire(dossier, evenement('e1', 'Tournoi'));
    const fichiers = await readdir(dossier);
    expect(fichiers).toEqual(['e1.json']);
  });

  it('remplace le fichier existant sans le tronquer en cas de réécriture', async () => {
    await ecrire(dossier, evenement('e1', 'Premier nom'));
    await ecrire(dossier, evenement('e1', 'Second nom'));

    const brut = await readFile(join(dossier, 'e1.json'), 'utf8');
    expect(JSON.parse(brut)).toEqual({
      version: VERSION_SAUVEGARDE,
      evenement: evenement('e1', 'Second nom'),
    });
  });

  it('liste les événements valides', async () => {
    await ecrire(dossier, evenement('e1', 'Un'));
    await ecrire(dossier, evenement('e2', 'Deux'));

    const inventaire = await lister(dossier);
    expect(inventaire.evenements.map((e) => e.nom).sort()).toEqual(['Deux', 'Un']);
    expect(inventaire.illisibles).toEqual([]);
  });

  it('un fichier illisible n empêche pas les autres de s ouvrir', async () => {
    await ecrire(dossier, evenement('bon', 'Lisible'));
    await writeFile(join(dossier, 'casse.json'), '{ "version": 1, "evenement":', 'utf8');
    await writeFile(join(dossier, 'vide.json'), '', 'utf8');
    await writeFile(join(dossier, 'futur.json'), JSON.stringify({ version: 99 }), 'utf8');

    const inventaire = await lister(dossier);

    expect(inventaire.evenements.map((e) => e.id)).toEqual(['bon']);
    expect(inventaire.illisibles.map((i) => i.fichier).sort()).toEqual([
      'casse.json',
      'futur.json',
      'vide.json',
    ]);
    expect(inventaire.illisibles.find((i) => i.fichier === 'futur.json')?.motif).toBe(
      'version-inconnue'
    );
  });

  it('ignore ce qui n est pas un fichier de sauvegarde', async () => {
    await ecrire(dossier, evenement('e1', 'Un'));
    await writeFile(join(dossier, 'notes.txt'), 'rien à voir', 'utf8');

    const inventaire = await lister(dossier);
    expect(inventaire.evenements).toHaveLength(1);
    expect(inventaire.illisibles).toEqual([]);
  });

  it('lire renvoie null sur un identifiant inconnu', async () => {
    expect(await lire(dossier, 'fantome')).toBeNull();
  });

  it('supprime un événement sans se plaindre si le fichier a déjà disparu', async () => {
    await ecrire(dossier, evenement('e1', 'Un'));
    await supprimer(dossier, 'e1');
    await supprimer(dossier, 'e1');

    expect((await lister(dossier)).evenements).toEqual([]);
  });
});
