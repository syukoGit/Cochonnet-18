import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Bouton from '@/components/Bouton';
import Shell from '@/components/Shell';
import { useEvenements } from '@/store/useEvenements';

export default function Evenement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { liste, chargement, charger, courant, ouvrir } = useEvenements();

  useEffect(() => {
    if (!chargement && liste.length === 0) {
      void charger();
    }
  }, [chargement, liste.length, charger]);

  useEffect(() => {
    if (id && courant?.id !== id && liste.some((evenement) => evenement.id === id)) {
      void ouvrir(id);
    }
  }, [id, courant, liste, ouvrir]);

  if (!chargement && id && !liste.some((evenement) => evenement.id === id)) {
    return (
      <Shell titre="Tournoi introuvable">
        <div className="mx-auto w-full max-w-3xl">
          <p className="text-encre-douce">
            Ce tournoi n&apos;existe plus, ou son fichier est illisible.
          </p>
          <Bouton className="mt-4" onClick={() => navigate('/')}>
            Retour aux tournois
          </Bouton>
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      titre={courant?.nom ?? 'Tournoi'}
      sousTitre="Configuration"
      actions={<Bouton onClick={() => navigate('/')}>Tournois</Bouton>}
    >
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-panneau border border-dashed border-trait p-10 text-center">
          <p className="font-medium">Les équipes arrivent à la tranche suivante</p>
          <p className="mt-1 text-sm text-encre-douce">V2 — ajouter, renommer, supprimer</p>
        </div>
      </div>
    </Shell>
  );
}
