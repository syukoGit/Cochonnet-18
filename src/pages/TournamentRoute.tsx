import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '@/components/Button';
import Rail, { RailBack, RailBrand } from '@/components/Rail';
import Shell from '@/components/Shell';
import StepNav from '@/components/StepNav';
import { stepShown } from '@/domain/navigation';
import type { Step } from '@/domain/navigation';
import type { Tournament } from '@/domain/tournament/types';
import Closing from '@/pages/Closing';
import Configuration from '@/pages/Configuration';
import Phase1 from '@/pages/Phase1';
import Phase2 from '@/pages/Phase2';
import Results from '@/pages/Results';
import { useTournaments } from '@/store/useTournaments';

function screenOf(tournament: Tournament, step: Step, nav: ReactNode) {
  if (step === 'configuration') {
    return <Configuration tournament={tournament} nav={nav} />;
  }

  if (step === 'phase1') {
    return <Phase1 tournament={tournament} nav={nav} />;
  }

  if (step === 'closing') {
    return <Closing tournament={tournament} nav={nav} />;
  }

  if (step === 'phase2') {
    return <Phase2 tournament={tournament} nav={nav} />;
  }

  return <Results tournament={tournament} nav={nav} />;
}

export default function TournamentRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { list, loading, load, current, open } = useTournaments();
  const [wanted, setWanted] = useState<Step | null>(null);

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

  const plainRail = (
    <Rail>
      <RailBrand />
      <RailBack
        onClick={() => {
          void navigate('/');
        }}
      />
    </Rail>
  );

  if (!loading && id && !list.some((tournament) => tournament.id === id)) {
    return (
      <Shell rail={plainRail} title="Tournoi introuvable">
        <div className="mx-auto w-full max-w-3xl">
          <p className="text-ink-soft">
            Ce tournoi n&apos;existe plus, ou son fichier est illisible.
          </p>
          <Button
            tone="primary"
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
      <Shell rail={plainRail} title="Tournoi">
        <p className="text-ink-soft">Chargement…</p>
      </Shell>
    );
  }

  const step = stepShown(current, wanted);

  return screenOf(current, step, <StepNav tournament={current} shown={step} onOpen={setWanted} />);
}
