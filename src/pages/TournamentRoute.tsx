import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '@/components/Button';
import Shell from '@/components/Shell';
import type { Phase } from '@/domain/tournament/types';
import Closing from '@/pages/Closing';
import Configuration from '@/pages/Configuration';
import Phase1 from '@/pages/Phase1';
import Phase2 from '@/pages/Phase2';
import { useTournaments } from '@/store/useTournaments';

const NOT_YET_BUILT: Partial<Record<Phase, string>> = {
  results: 'Les résultats arrivent à la tranche V7.',
};

export default function TournamentRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { list, loading, load, current, open } = useTournaments();

  useEffect(() => {
    if (loading && list.length === 0) {
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

  if (!current || current.id !== id) {
    return (
      <Shell title="Tournoi">
        <p className="text-ink-soft">Chargement…</p>
      </Shell>
    );
  }

  if (current.phase === 'configuration') {
    return <Configuration tournament={current} />;
  }

  if (current.phase === 'phase1') {
    return <Phase1 tournament={current} />;
  }

  if (current.phase === 'closing') {
    return <Closing tournament={current} />;
  }

  if (current.phase === 'phase2') {
    return <Phase2 tournament={current} />;
  }

  return (
    <Shell title={current.name} subtitle="À venir">
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-ink-soft">{NOT_YET_BUILT[current.phase]}</p>
      </div>
    </Shell>
  );
}
