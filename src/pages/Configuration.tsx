import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '@/components/Button';
import Dialog from '@/components/Dialog';
import Shell from '@/components/Shell';
import TeamRow from '@/components/TeamRow';
import { teamNameIssue } from '@/domain/tournament/teams';
import type { TeamNameIssue } from '@/domain/tournament/teams';
import type { Team } from '@/domain/tournament/types';
import { useTournaments } from '@/store/useTournaments';

const ISSUE_MESSAGES: Record<TeamNameIssue, string> = {
  empty: "Donne un nom à l'équipe.",
  duplicate: 'Une équipe porte déjà ce nom.',
};

export default function Configuration() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { list, loading, load, current, open, addTeam, renameTeam, removeTeam } = useTournaments();

  const [newName, setNewName] = useState('');
  const [toRemove, setToRemove] = useState<Team | null>(null);
  const addField = useRef<HTMLInputElement>(null);

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

  if (!current) {
    return (
      <Shell title="Tournoi">
        <p className="text-ink-soft">Chargement…</p>
      </Shell>
    );
  }

  const issue = newName.trim().length === 0 ? null : teamNameIssue(current, newName);

  const submitNewTeam = () => {
    if (teamNameIssue(current, newName) !== null) {
      return;
    }

    addTeam(newName);
    setNewName('');
    addField.current?.focus();
  };

  const teamCount = current.teams.length;

  return (
    <Shell
      title={current.name}
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
    >
      <div className="mx-auto w-full max-w-3xl">
        <div className="overflow-hidden rounded-panel border border-line bg-surface">
          {teamCount === 0 ? (
            <p className="px-4 py-8 text-center text-ink-soft">
              Aucune équipe. Ajoute la première ci-dessous.
            </p>
          ) : (
            <ul className="divide-y divide-line-soft">
              {current.teams.map((team) => (
                <TeamRow
                  key={team.id}
                  team={team}
                  issueOf={(name) => teamNameIssue(current, name, team.id)}
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
              {current.nextTeamId}
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
