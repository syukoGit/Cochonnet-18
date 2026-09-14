import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Bouton from '@/components/Bouton';
import Dialogue from '@/components/Dialogue';
import Shell from '@/components/Shell';
import { nomEvenementValide } from '@/domain/event/evenement';
import type { EventId, Evenement, Phase } from '@/domain/event/types';
import { useEvenements } from '@/store/useEvenements';

const LIBELLE_PHASE: Record<Phase, string> = {
  configuration: 'Configuration',
  phase1: 'Phase 1',
  cloture: 'Clôture',
  phase2: 'Phase 2',
  resultats: 'Terminé',
};

const dateLongue = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

function formaterDate(horodatage: string): string {
  const date = new Date(horodatage);
  return Number.isNaN(date.getTime()) ? '—' : dateLongue.format(date);
}

export default function Accueil() {
  const { liste, illisibles, chargement, charger, creer, ouvrir, supprimer } = useEvenements();
  const navigate = useNavigate();

  const [creationOuverte, setCreationOuverte] = useState(false);
  const [nouveauNom, setNouveauNom] = useState('');
  const [aSupprimer, setASupprimer] = useState<Evenement | null>(null);

  useEffect(() => {
    void charger();
  }, [charger]);

  const validerCreation = async () => {
    if (!nomEvenementValide(nouveauNom)) {
      return;
    }

    const id = await creer(nouveauNom);
    setNouveauNom('');
    setCreationOuverte(false);
    navigate(`/evenement/${id}`);
  };

  const ouvrirEvenement = async (id: EventId) => {
    await ouvrir(id);
    navigate(`/evenement/${id}`);
  };

  const confirmerSuppression = async () => {
    if (aSupprimer) {
      await supprimer(aSupprimer.id);
      setASupprimer(null);
    }
  };

  return (
    <Shell
      titre="Cochonnet-18"
      sousTitre="Tournois"
      actions={
        <Bouton ton="principal" onClick={() => setCreationOuverte(true)}>
          Nouveau tournoi
        </Bouton>
      }
    >
      <div className="mx-auto w-full max-w-3xl">
        {illisibles.length > 0 && (
          <div className="mb-5 rounded-panneau border border-alerte bg-alerte-fond p-4 text-sm">
            <p className="font-semibold text-alerte">
              {illisibles.length === 1
                ? '1 fichier de tournoi est illisible'
                : `${illisibles.length} fichiers de tournoi sont illisibles`}
            </p>
            <ul className="mt-2 space-y-1 text-encre-douce">
              {illisibles.map((illisible) => (
                <li key={illisible.fichier}>
                  <span className="font-mono">{illisible.fichier}</span> — {illisible.motif}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-encre-douce">Les autres tournois restent utilisables.</p>
          </div>
        )}

        {chargement && <p className="text-encre-douce">Chargement…</p>}

        {!chargement && liste.length === 0 && (
          <div className="rounded-panneau border border-dashed border-trait p-10 text-center">
            <p className="font-medium">Aucun tournoi</p>
            <p className="mt-1 text-sm text-encre-douce">
              Crée ton premier tournoi pour commencer.
            </p>
          </div>
        )}

        {liste.length > 0 && (
          <ul className="divide-y divide-trait-doux overflow-hidden rounded-panneau border border-trait bg-surface">
            {liste.map((evenement) => (
              <li key={evenement.id} className="flex items-center gap-4 px-4 py-3">
                <button
                  type="button"
                  onClick={() => void ouvrirEvenement(evenement.id)}
                  className="min-w-0 flex-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <span className="block truncate font-medium">{evenement.nom}</span>
                  <span className="block truncate text-sm text-encre-douce">
                    {LIBELLE_PHASE[evenement.phase]} · modifié le {formaterDate(evenement.modifie)}
                  </span>
                </button>
                <Bouton onClick={() => void ouvrirEvenement(evenement.id)}>Ouvrir</Bouton>
                <Bouton ton="danger" onClick={() => setASupprimer(evenement)}>
                  Supprimer
                </Bouton>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialogue
        ouvert={creationOuverte}
        surFermeture={setCreationOuverte}
        titre="Nouveau tournoi"
        description="Donne-lui un nom ; tu pourras le changer plus tard."
        actions={
          <>
            <Bouton onClick={() => setCreationOuverte(false)}>Annuler</Bouton>
            <Bouton
              ton="principal"
              disabled={!nomEvenementValide(nouveauNom)}
              onClick={() => void validerCreation()}
            >
              Créer
            </Bouton>
          </>
        }
      >
        <input
          autoFocus
          value={nouveauNom}
          onChange={(event) => setNouveauNom(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && void validerCreation()}
          placeholder="Tournoi du 14 septembre"
          className="w-full rounded-panneau border border-trait bg-fond px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
        />
      </Dialogue>

      <Dialogue
        ouvert={aSupprimer !== null}
        surFermeture={(ouvert) => !ouvert && setASupprimer(null)}
        titre="Supprimer ce tournoi ?"
        description={
          aSupprimer
            ? `« ${aSupprimer.nom} » et tout ce qu'il contient seront effacés définitivement.`
            : undefined
        }
        actions={
          <>
            <Bouton onClick={() => setASupprimer(null)}>Annuler</Bouton>
            <Bouton ton="principal" onClick={() => void confirmerSuppression()}>
              Supprimer
            </Bouton>
          </>
        }
      />
    </Shell>
  );
}
