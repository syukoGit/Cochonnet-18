import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';
import Dialog from '@/components/Dialog';
import SettingsPanel from '@/components/SettingsPanel';
import Shell from '@/components/Shell';
import TeamRow from '@/components/TeamRow';
import { beyondGuaranteedSize, GUARANTEED_TEAMS, startBlocker } from '@/domain/phase1/start';
import type { StartBlocker } from '@/domain/phase1/start';
import { teamNameIssue } from '@/domain/tournament/teams';
import type { TeamNameIssue } from '@/domain/tournament/teams';
import type { Team, Tournament } from '@/domain/tournament/types';
import { useTournaments } from '@/store/useTournaments';

const ISSUE_MESSAGES: Record<TeamNameIssue, string> = {
  empty: "Donne un nom à l'équipe.",
  duplicate: 'Une équipe porte déjà ce nom.',
};

const BLOCKER_MESSAGES: Record<StartBlocker, string> = {
  'already-started': 'La phase 1 a déjà commencé.',
  'not-enough-teams': 'Il faut au moins deux équipes.',
  'invalid-match-count': 'Le nombre de matchs par équipe est hors limites.',
};

interface ConfigurationProps {
  tournament: Tournament;
}

export default function Configuration({ tournament }: ConfigurationProps) {
  const navigate = useNavigate();
  const { addTeam, renameTeam, removeTeam, setMatchCount, setSetting, startPhase1 } =
    useTournaments();

  const [newName, setNewName] = useState('');
  const [toRemove, setToRemove] = useState<Team | null>(null);
  const addField = useRef<HTMLInputElement>(null);

  const issue = newName.trim().length === 0 ? null : teamNameIssue(tournament, newName);
  const blocker = startBlocker(tournament);

  const submitNewTeam = () => {
    if (teamNameIssue(tournament, newName) !== null) {
      return;
    }

    addTeam(newName);
    setNewName('');
    addField.current?.focus();
  };

  const teamCount = tournament.teams.length;

  return (
    <Shell
      title={tournament.name}
      subtitle={`Configuration · ${teamCount} ${teamCount > 1 ? 'équipes' : 'équipe'}`}
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
            {blocker === null
              ? `${tournament.matchCount} ${tournament.matchCount > 1 ? 'tours' : 'tour'} seront tirés au sort.`
              : BLOCKER_MESSAGES[blocker]}
          </span>
          <Button tone="primary" disabled={blocker !== null} onClick={startPhase1}>
            Démarrer la phase 1
          </Button>
        </>
      }
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        {beyondGuaranteedSize(tournament) && (
          <p className="rounded-panel border border-warning bg-warning-ground px-4 py-3 text-sm">
            Au-delà de {GUARANTEED_TEAMS} équipes, l&apos;application fonctionne mais sort du
            domaine couvert par ses tests.
          </p>
        )}

        <div className="overflow-hidden rounded-panel border border-line bg-surface">
          {teamCount === 0 ? (
            <p className="px-4 py-8 text-center text-ink-soft">
              Aucune équipe. Ajoute la première ci-dessous.
            </p>
          ) : (
            <ul className="divide-y divide-line-soft">
              {tournament.teams.map((team) => (
                <TeamRow
                  key={team.id}
                  team={team}
                  issueOf={(name) => teamNameIssue(tournament, name, team.id)}
                  onRename={(name) => {
                    renameTeam(team.id, name);
                  }}
                  onRemove={() => {
                    setToRemove(team);
                  }}
                />
              ))}
            </ul>
          )}

          <div className="flex items-start gap-2 border-t border-line bg-ground px-4 py-3">
            <span className="w-10 pt-2 text-right font-mono text-sm text-ink-faint">
              {tournament.nextTeamId}
            </span>
            <div className="flex-1">
              <input
                ref={addField}
                autoFocus
                value={newName}
                onChange={(changeEvent) => {
                  setNewName(changeEvent.target.value);
                }}
                onKeyDown={(keyEvent) => {
                  if (keyEvent.key === 'Enter') {
                    submitNewTeam();
                  }
                }}
                placeholder="Nom de l'équipe, puis Entrée"
                className="w-full rounded-panel border border-line bg-surface px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
              />
              {issue && <p className="mt-1 text-sm text-warning">{ISSUE_MESSAGES[issue]}</p>}
            </div>
            <Button
              tone="primary"
              disabled={issue !== null || newName.trim().length === 0}
              onClick={submitNewTeam}
            >
              Ajouter
            </Button>
          </div>
        </div>

        <SettingsPanel
          tournament={tournament}
          onMatchCountChange={setMatchCount}
          onSettingChange={setSetting}
        />
      </div>

      <Dialog
        open={toRemove !== null}
        onOpenChange={(open) => {
          if (!open) {
            setToRemove(null);
          }
        }}
        title="Retirer cette équipe ?"
        description={
          toRemove
            ? `« ${toRemove.name} » sera retirée du tournoi. Son numéro ${toRemove.id} ne sera pas réattribué.`
            : undefined
        }
        actions={
          <>
            <Button
              onClick={() => {
                setToRemove(null);
              }}
            >
              Annuler
            </Button>
            <Button
              tone="primary"
              onClick={() => {
                if (toRemove) {
                  removeTeam(toRemove.id);
                  setToRemove(null);
                }
              }}
            >
              Retirer
            </Button>
          </>
        }
      />
    </Shell>
  );
}
