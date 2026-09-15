import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';
import Dialog from '@/components/Dialog';
import MatchRow from '@/components/MatchRow';
import RankingPanel from '@/components/RankingPanel';
import SettingsPanel from '@/components/SettingsPanel';
import Shell from '@/components/Shell';
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
}

function roundsOf(matches: Match[]): number[] {
  return [...new Set(matches.map((match) => match.round))].sort((a, b) => a - b);
}

export default function Phase1({ tournament }: Phase1Props) {
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

  const roundEntered = (round: number) =>
    tournament.matches.filter(
      (match) => match.round === round && !isBye(match) && match.status !== 'waiting'
    ).length;
  const roundTotal = (round: number) =>
    tournament.matches.filter((match) => match.round === round && !isBye(match)).length;

  return (
    <Shell
      title={tournament.name}
      subtitle={`Phase 1 · ${entered} / ${total} matchs saisis`}
      footer={
        <>
          <span className="mr-auto text-sm text-ink-soft">
            {phase1Complete(tournament)
              ? 'Tous les matchs sont saisis.'
              : `${total - entered} ${total - entered > 1 ? 'matchs restants' : 'match restant'}.`}
          </span>
          <Button tone="primary" disabled={!phase1Complete(tournament)} onClick={closePhase1}>
            Clôturer la phase 1
          </Button>
        </>
      }
      actions={
        <>
          <Button
            onClick={() => {
              setRulesOpen(true);
            }}
          >
            Règles
          </Button>
          <Button
            onClick={() => {
              void navigate('/');
            }}
          >
            Tournois
          </Button>
        </>
      }
    >
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {rounds.map((round) => (
              <Button
                key={round}
                tone={round === activeRound ? 'primary' : 'quiet'}
                onClick={() => {
                  setActiveRound(round);
                }}
              >
                Tour {round} · {roundEntered(round)}/{roundTotal(round)}
              </Button>
            ))}
          </div>

          <ul className="divide-y divide-line-soft overflow-hidden rounded-panel border border-line bg-surface">
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
          </ul>

          {resting.length > 0 && (
            <p className="rounded-panel border border-line bg-sunken px-4 py-3 text-sm">
              <span className="text-ink-soft">Exemptée ce tour :</span>{' '}
              <span className="font-medium">{resting.map(nameOf).join(', ')}</span>
            </p>
          )}
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
        onOpenChange={(open) => {
          if (!open) {
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
