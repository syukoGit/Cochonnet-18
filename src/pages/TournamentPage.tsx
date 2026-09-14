import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '@/components/Button';
import Shell from '@/components/Shell';
import { useTournaments } from '@/store/useTournaments';

export default function TournamentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { list, loading, load, current, open } = useTournaments();

  useEffect(() => {
    if (!loading && list.length === 0) {
      void load();
    }
  }, [loading, list.length, load]);

  useEffect(() => {
    if (id && current?.id !== id && list.some((tournament) => tournament.id === id)) {
      open(id);
    }
  }, [id, current, list, open]);

  if (!loading && id && !list.some((tournament) => tournament.id === id)) {
    return (
      <Shell title="Tournoi introuvable">
        <div className="mx-auto w-full max-w-3xl">
          <p className="text-ink-soft">
            Ce tournoi n&apos;existe plus, ou son fichier est illisible.
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              void navigate('/');
            }}
          >
            Retour aux tournois
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      title={current?.name ?? 'Tournoi'}
      subtitle="Configuration"
      actions={
        <Button
          onClick={() => {
            void navigate('/');
          }}
        >
          Tournois
        </Button>
      }
    >
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-panel border border-dashed border-line p-10 text-center">
          <p className="font-medium">Les équipes arrivent à la tranche suivante</p>
          <p className="mt-1 text-sm text-ink-soft">V2 — ajouter, renommer, supprimer</p>
        </div>
      </div>
    </Shell>
  );
}
