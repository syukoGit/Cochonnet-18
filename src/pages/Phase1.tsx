import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';
import Dialog from '@/components/Dialog';
import MatchRow from '@/components/MatchRow';
import Rail, { RailBack, RailBrand, RailNote, RailTitle } from '@/components/Rail';
import RankingPanel from '@/components/RankingPanel';
import SettingsPanel from '@/components/SettingsPanel';
import Shell from '@/components/Shell';
import { IconForward, IconRest, IconRules } from '@/components/icons';
import type { TeamId } from '@/domain/ids';
import { isBye, opponents } from '@/domain/match/types';
import type { Match } from '@/domain/match/types';
import { phase1SettingsLocked } from '@/domain/phase1/entry';
import { enteredCount, phase1Complete, playableCount, rankTeams } from '@/domain/phase1/ranking';
import { minimumGapFor } from '@/domain/tournament/settings';
import type { Tournament } from '@/domain/tournament/types';
import { useTournaments } from '@/store/useTournaments';

interface Phase1Props {
  tournament: Tournament;
  nav: ReactNode;
}

function roundsOf(matches: Match[]): number[] {
  return [...new Set(matches.map((match) => match.round))].sort((a, b) => a - b);
}

export default function Phase1({ tournament, nav }: Phase1Props) {
  const navigate = useNavigate();
  const { enterScore, enterForfeit, clearEntry, setSetting, closePhase1 } = useTournaments();

  const rounds = roundsOf(tournament.matches);
  const [activeRound, setActiveRound] = useState(rounds[0] ?? 1);
  const [forfeitFor, setForfeitFor] = useState<Match | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);

  const nameOf = (team: TeamId): string =>
    tournament.teams.find((candidate) => candidate.id === team)?.name ?? `Équipe ${team}`;

  const inRound = tournament.matches.filter((match) => match.round === activeRound);
  const playable = inRound.filter((match) => !isBye(match));
  const resting = inRound.filter(isBye).flatMap(opponents);

  const locked = phase1SettingsLocked(tournament);
  const entered = enteredCount(tournament.matches);
  const total = playableCount(tournament.matches);
  const gap = minimumGapFor(tournament.settings, 'phase1');
  const remaining = total - entered;

  const roundEntered = (round: number) =>
    tournament.matches.filter(
      (match) => match.round === round && !isBye(match) && match.status !== 'waiting'
    ).length;
  const roundTotal = (round: number) =>
    tournament.matches.filter((match) => match.round === round && !isBye(match)).length;

  const rail = (
    <Rail>
      <RailBrand />
      <RailTitle
        name={tournament.name}
        meta={`${tournament.teams.length} équipes · ${tournament.matchCount} tours`}
      />
      {nav}
      <RailNote title="Avancement">
        <p className="font-display text-2xl leading-none font-bold tabular-nums">
          {entered}
          <span className="text-base font-medium text-rail-faint"> / {total}</span>
        </p>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-rail-line">
          <div
            className="h-full bg-success"
            style={{ width: `${total === 0 ? 0 : (entered / total) * 100}%` }}
          />
        </div>
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
      eyebrow="Étape 2 sur 5"
      title="Phase 1 — poules"
      fill
      actions={
        <Button
          onClick={() => {
            setRulesOpen(true);
          }}
        >
          <IconRules size={16} />
          Règles
        </Button>
      }
      footer={
        <>
          <p className="mr-auto text-sm text-ink-soft">
            {phase1Complete(tournament) ? (
              'Tous les matchs sont saisis.'
            ) : (
              <>
                <strong className="font-semibold text-ink">
                  {remaining} {remaining > 1 ? 'matchs restants' : 'match restant'}
                </strong>{' '}
                avant de pouvoir clôturer.
              </>
            )}
          </p>
          <Button tone="primary" disabled={!phase1Complete(tournament)} onClick={closePhase1}>
            Clôturer la phase 1
            <IconForward size={16} />
          </Button>
        </>
      }
    >
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col gap-3">
          <div role="tablist" aria-label="Tours" className="flex flex-wrap gap-1.5">
            {rounds.map((round) => {
              const done = roundEntered(round) === roundTotal(round);
              const current = round === activeRound;

              return (
                <button
                  key={round}
                  type="button"
                  role="tab"
                  aria-selected={current}
                  onClick={() => {
                    setActiveRound(round);
                  }}
                  className={`flex min-h-[42px] items-center gap-2.5 rounded-panel border px-3.5 text-[14.5px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${current ? 'border-ink bg-ink text-ground' : 'border-line bg-surface hover:bg-sunken'}`}
                >
                  Tour {round}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums ${current ? 'bg-white/20 text-ground' : done ? 'bg-success-ground text-success' : 'bg-sunken text-ink-soft'}`}
                  >
                    {roundEntered(round)}/{roundTotal(round)}
                  </span>
                </button>
              );
            })}
          </div>

          <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
            {playable.map((match) => (
              <MatchRow
                key={match.id}
                match={match}
                minimumGap={gap}
                nameOf={nameOf}
                onScore={(score) => {
                  enterScore(match.id, score);
                }}
                onForfeit={() => {
                  setForfeitFor(match);
                }}
                onClear={() => {
                  clearEntry(match.id);
                }}
              />
            ))}

            {resting.length > 0 && (
              <li className="flex min-h-[52px] items-center gap-2.5 rounded-card border border-dashed border-line bg-sunken px-4 text-sm">
                <IconRest size={17} className="shrink-0 text-ink-faint" />
                <span className="text-ink-soft">
                  {resting.length > 1 ? 'Exemptées ce tour' : 'Exemptée ce tour'} —{' '}
                  <strong className="font-semibold text-ink">
                    {resting.map(nameOf).join(', ')}
                  </strong>
                  . Le crédit sera calculé à la clôture.
                </span>
              </li>
            )}
          </ul>
        </div>

        <RankingPanel ranking={rankTeams(tournament).entries} nameOf={nameOf} provisional />
      </div>

      <Dialog
        open={rulesOpen}
        onOpenChange={setRulesOpen}
        title="Règles de la phase 1"
        description={
          locked
            ? 'Un score a été saisi : les règles sont figées pour ne pas changer le classement rétroactivement.'
            : 'Modifiables tant qu’aucun score n’est saisi.'
        }
        actions={
          <Button
            tone="primary"
            onClick={() => {
              setRulesOpen(false);
            }}
          >
            Fermer
          </Button>
        }
      >
        <SettingsPanel
          tournament={tournament}
          disabled={locked}
          includeMatchCount={false}
          onMatchCountChange={() => undefined}
          onSettingChange={setSetting}
        />
      </Dialog>

      <Dialog
        open={forfeitFor !== null}
        onOpenChange={(value) => {
          if (!value) {
            setForfeitFor(null);
          }
        }}
        title="Quelle équipe est absente ?"
        description="Le forfait compte comme une victoire pour l’équipe présente, sans point marqué."
        actions={
          <Button
            onClick={() => {
              setForfeitFor(null);
            }}
          >
            Annuler
          </Button>
        }
      >
        <div className="flex flex-col gap-2">
          {forfeitFor &&
            opponents(forfeitFor).map((team) => (
              <Button
                key={team}
                className="min-h-[52px] justify-start"
                onClick={() => {
                  enterForfeit(forfeitFor.id, team);
                  setForfeitFor(null);
                }}
              >
                {nameOf(team)}
              </Button>
            ))}
        </div>
      </Dialog>
    </Shell>
  );
}
