import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import BracketGrid from '@/components/BracketGrid';
import Button from '@/components/Button';
import Dialog from '@/components/Dialog';
import { lastRoundOf, matchLabel, slotLabel } from '@/components/labels';
import ScoreInput from '@/components/ScoreInput';
import Shell from '@/components/Shell';
import type { MatchId, TeamId } from '@/domain/ids';
import { invalidatedBy } from '@/domain/match/cascade';
import { occupantsIn } from '@/domain/match/resolve';
import { hasResult, phaseMatches } from '@/domain/match/types';
import type { BracketPhase, Match } from '@/domain/match/types';
import { bracketsLocked, rematchesIn } from '@/domain/phase2/start';
import { minimumGapFor } from '@/domain/tournament/settings';
import type { Tournament } from '@/domain/tournament/types';
import { useTournaments } from '@/store/useTournaments';

interface Phase2Props {
  tournament: Tournament;
  nav: ReactNode;
}

const BRACKET_LABELS: Record<BracketPhase, string> = {
  main: 'Tournoi principal',
  consolation: 'Consolante',
};

export default function Phase2({ tournament, nav }: Phase2Props) {
  const navigate = useNavigate();
  const { drawBrackets, enterScore, enterForfeit, clearEntry } = useTournaments();
  const [active, setActive] = useState<BracketPhase>('main');
  const [selected, setSelected] = useState<MatchId | null>(null);
  const [confirming, setConfirming] = useState(false);

  const nameOf = (team: TeamId): string =>
    tournament.teams.find((candidate) => candidate.id === team)?.name ?? `Équipe ${team}`;

  const matchesOf = (phase: BracketPhase) => phaseMatches(tournament.matches, phase);
  const locked = bracketsLocked(tournament);
  const rematches = rematchesIn(tournament, active);
  const shown = matchesOf(active);

  const match = tournament.matches.find((candidate) => candidate.id === selected) ?? null;
  const gap = minimumGapFor(tournament.settings, match?.phase ?? active);
  const erased = selected === null ? [] : invalidatedBy(tournament.matches, selected);

  const close = () => {
    setSelected(null);
    setConfirming(false);
  };

  const labelOf = (one: Match): string => {
    const bracket = tournament.matches.filter((candidate) => candidate.phase === one.phase);
    const round = matchLabel(one, lastRoundOf(bracket));
    const home = slotLabel(tournament.matches, one, 0, nameOf);
    const away = slotLabel(tournament.matches, one, 1, nameOf);

    return `${round} · ${home} — ${away}`;
  };

  return (
    <Shell
      title={tournament.name}
      nav={nav}
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
          <BracketGrid
            matches={shown}
            allMatches={tournament.matches}
            nameOf={nameOf}
            onSelect={(one) => {
              setSelected(one.id);
              setConfirming(false);
            }}
          />
        )}
      </div>

      <Dialog
        open={match !== null}
        onOpenChange={(open) => {
          if (!open) {
            close();
          }
        }}
        title={match ? labelOf(match) : ''}
        description={
          match && hasResult(match)
            ? 'Ce résultat est verrouillé. Le corriger efface tout ce qui en découle.'
            : undefined
        }
        actions={<Button onClick={close}>Fermer</Button>}
      >
        {match && !hasResult(match) && (
          <div className="flex flex-col gap-4">
            <ScoreInput
              score={undefined}
              minimumGap={gap}
              onCommit={(score) => {
                enterScore(match.id, score);
                close();
              }}
            />
            <div className="flex flex-col gap-2">
              <p className="text-xs text-ink-faint">Ou déclarer un forfait :</p>
              {occupantsIn(tournament.matches, match)
                .filter((team): team is TeamId => team !== null)
                .map((team) => (
                  <Button
                    key={team}
                    onClick={() => {
                      enterForfeit(match.id, team);
                      close();
                    }}
                  >
                    {nameOf(team)} est absente
                  </Button>
                ))}
            </div>
          </div>
        )}

        {match && hasResult(match) && !confirming && (
          <Button
            tone="danger"
            onClick={() => {
              setConfirming(true);
            }}
          >
            Déverrouiller et corriger
          </Button>
        )}

        {match && hasResult(match) && confirming && (
          <div className="flex flex-col gap-3">
            {erased.length > 0 ? (
              <div className="rounded-panel border border-warning bg-warning-ground p-3 text-sm">
                <p className="font-semibold text-warning">
                  {erased.length === 1
                    ? '1 match déjà joué sera effacé :'
                    : `${erased.length} matchs déjà joués seront effacés :`}
                </p>
                <ul className="mt-2 flex flex-col gap-1 text-ink-soft">
                  {erased.map((one) => (
                    <li key={one.id}>{labelOf(one)}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-ink-soft">Aucun match en aval n’a encore de résultat.</p>
            )}
            <Button
              tone="primary"
              onClick={() => {
                clearEntry(match.id);
                setConfirming(false);
              }}
            >
              Effacer et rouvrir la saisie
            </Button>
          </div>
        )}
      </Dialog>
    </Shell>
  );
}
