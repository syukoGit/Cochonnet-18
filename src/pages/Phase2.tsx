import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BracketGrid from '@/components/BracketGrid';
import Button from '@/components/Button';
import Shell from '@/components/Shell';
import type { TeamId } from '@/domain/ids';
import { phaseMatches } from '@/domain/match/types';
import type { MatchPhase } from '@/domain/match/types';
import { bracketsLocked, rematchesIn } from '@/domain/phase2/start';
import type { Tournament } from '@/domain/tournament/types';
import { useTournaments } from '@/store/useTournaments';

interface Phase2Props {
  tournament: Tournament;
}

const BRACKET_LABELS: Record<'main' | 'consolation', string> = {
  main: 'Tournoi principal',
  consolation: 'Consolante',
};

export default function Phase2({ tournament }: Phase2Props) {
  const navigate = useNavigate();
  const { drawBrackets } = useTournaments();
  const [active, setActive] = useState<'main' | 'consolation'>('main');

  const nameOf = (team: TeamId): string =>
    tournament.teams.find((candidate) => candidate.id === team)?.name ?? `Équipe ${team}`;

  const matchesOf = (phase: MatchPhase) => phaseMatches(tournament.matches, phase);
  const locked = bracketsLocked(tournament);
  const rematches = rematchesIn(tournament, active);
  const shown = matchesOf(active);

  return (
    <Shell
      title={tournament.name}
      subtitle={`Phase 2 · ${matchesOf('main').length} matchs au principal, ${matchesOf('consolation').length} en consolante`}
      actions={
        <Button
          onClick={() => {
            void navigate('/');
          }}
        >
          Tournois
        </Button>
      }
      footer={
        <>
          <span className="mr-auto text-sm text-ink-soft">
            {locked
              ? 'Un résultat est saisi : le tirage est figé.'
              : 'Le tirage peut être relancé tant qu’aucun résultat n’est saisi.'}
          </span>
          <Button disabled={locked} onClick={drawBrackets}>
            Relancer le tirage
          </Button>
        </>
      }
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {(['main', 'consolation'] as const).map((phase) => (
            <Button
              key={phase}
              tone={phase === active ? 'primary' : 'quiet'}
              onClick={() => {
                setActive(phase);
              }}
            >
              {BRACKET_LABELS[phase]} · {matchesOf(phase).length}
            </Button>
          ))}
        </div>

        {rematches > 0 && (
          <p className="rounded-panel border border-warning bg-warning-ground px-4 py-3 text-sm">
            <span className="font-semibold text-warning">
              {rematches === 1
                ? '1 affiche de premier tour rejoue un match de la phase 1'
                : `${rematches} affiches de premier tour rejouent un match de la phase 1`}
            </span>{' '}
            <span className="text-ink-soft">
              — inévitable avec ce groupe : toutes les autres combinaisons en comptaient autant ou
              davantage.
            </span>
          </p>
        )}

        {shown.length === 0 ? (
          <p className="rounded-panel border border-dashed border-line px-4 py-10 text-center text-ink-soft">
            Ce groupe est trop petit pour un tableau.
          </p>
        ) : (
          <BracketGrid matches={shown} allMatches={tournament.matches} nameOf={nameOf} />
        )}
      </div>
    </Shell>
  );
}
