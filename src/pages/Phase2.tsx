import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import BracketGrid from '@/components/BracketGrid';
import Button from '@/components/Button';
import Dialog from '@/components/Dialog';
import Rail, { RailBack, RailBrand, RailNote, RailTitle } from '@/components/Rail';
import ScoreInput from '@/components/ScoreInput';
import Shell from '@/components/Shell';
import { IconWarning } from '@/components/icons';
import { lastRoundOf, matchLabel, slotLabel } from '@/components/labels';
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
  main: 'Principal',
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

  const rail = (
    <Rail>
      <RailBrand />
      <RailTitle
        name={tournament.name}
        meta={`${tournament.teams.length - tournament.withdrawn.length} équipes en lice`}
      />
      {nav}
      <RailNote title="Tirage">
        <p className="text-[13px] leading-relaxed text-rail-soft">
          {locked
            ? 'Figé : un résultat est saisi. Le relancer demanderait d’effacer les matchs joués.'
            : 'Il peut être relancé tant qu’aucun résultat n’est saisi.'}
        </p>
      </RailNote>
      <RailBack
        onClick={() => {
          void navigate('/');
        }}
      />
    </Rail>
  );

  return (
    <Shell
      rail={rail}
      eyebrow="Étape 4 sur 5"
      title="Phase 2 — tableaux"
      fill
      actions={
        <div
          role="tablist"
          aria-label="Tableau affiché"
          className="flex gap-1 rounded-card bg-sunken p-1"
        >
          {(['main', 'consolation'] as const).map((phase) => (
            <button
              key={phase}
              type="button"
              role="tab"
              aria-selected={phase === active}
              onClick={() => {
                setActive(phase);
              }}
              className={`min-h-10 rounded-panel px-4 text-[14.5px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${phase === active ? 'bg-ink font-semibold text-ground' : 'text-ink-soft hover:text-ink'}`}
            >
              {BRACKET_LABELS[phase]} · {matchesOf(phase).length}
            </button>
          ))}
        </div>
      }
      footer={
        <>
          <p className="mr-auto text-sm text-ink-soft">
            Glisse pour te déplacer, molette pour zoomer. Clique une affiche pour saisir son score ;
            un résultat enregistré est verrouillé.
          </p>
          <Button disabled={locked} onClick={drawBrackets}>
            Relancer le tirage
          </Button>
        </>
      }
    >
      {rematches > 0 && (
        <div className="flex shrink-0 items-center gap-3 rounded-card border border-warning-line bg-warning-ground px-4 py-2.5 shadow-[inset_3px_0_0_var(--c-warning)]">
          <IconWarning size={18} className="shrink-0 text-warning" />
          <p className="text-[13.5px] leading-relaxed text-ink-soft">
            <strong className="font-semibold text-warning">
              {rematches === 1
                ? '1 affiche de premier tour rejoue un match de la phase 1.'
                : `${rematches} affiches de premier tour rejouent un match de la phase 1.`}
            </strong>{' '}
            Inévitable avec ce groupe : toutes les autres combinaisons en comptaient autant ou
            davantage.
          </p>
        </div>
      )}

      <BracketGrid
        matches={shown}
        allMatches={tournament.matches}
        nameOf={nameOf}
        onSelect={(one) => {
          setSelected(one.id);
          setConfirming(false);
        }}
      />

      <Dialog
        open={match !== null}
        onOpenChange={(value) => {
          if (!value) {
            close();
          }
        }}
        title={match ? labelOf(match) : ''}
        description={
          match && hasResult(match)
            ? 'Déverrouiller, c’est effacer. Les matchs qui en découlent perdent leur résultat.'
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
                    className="min-h-[52px] justify-start"
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
              <div className="rounded-card border border-warning-line bg-warning-ground p-3.5 shadow-[inset_3px_0_0_var(--c-warning)]">
                <p className="text-[13.5px] font-semibold text-warning">
                  {erased.length === 1
                    ? '1 match déjà joué sera effacé'
                    : `${erased.length} matchs déjà joués seront effacés`}
                </p>
                <ul className="mt-2 flex flex-col gap-1.5 text-[13.5px] leading-relaxed text-ink-soft">
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
