import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';
import Dialog from '@/components/Dialog';
import Rail, { RailBack, RailBrand, RailTitle } from '@/components/Rail';
import SettingsPanel from '@/components/SettingsPanel';
import Shell from '@/components/Shell';
import TeamRow from '@/components/TeamRow';
import { IconForward, IconPlus } from '@/components/icons';
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
  nav: ReactNode;
}

export default function Configuration({ tournament, nav }: ConfigurationProps) {
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

  const rail = (
    <Rail>
      <RailBrand />
      <RailTitle
        name={tournament.name}
        meta={`${teamCount} ${teamCount > 1 ? 'équipes' : 'équipe'} · ${tournament.matchCount} ${tournament.matchCount > 1 ? 'tours' : 'tour'}`}
      />
      {nav}
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
      eyebrow="Étape 1 sur 5"
      title="Configuration"
      lead="Les règles se figent dès le premier score saisi. Le nom d'une équipe, lui, reste modifiable jusqu'au bout."
      footer={
        <>
          <p className="mr-auto text-sm text-ink-soft">
            {blocker === null
              ? `${tournament.matchCount} ${tournament.matchCount > 1 ? 'tours' : 'tour'} seront tirés au sort. La graine du tirage est enregistrée avec le tournoi.`
              : BLOCKER_MESSAGES[blocker]}
          </p>
          <Button tone="primary" disabled={blocker !== null} onClick={startPhase1}>
            Démarrer la phase 1
            <IconForward size={16} />
          </Button>
        </>
      }
    >
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <section className="flex min-w-0 flex-col gap-3">
          <div className="flex items-baseline gap-2.5">
            <span className="font-display text-[42px] leading-none font-bold tracking-tight tabular-nums">
              {teamCount}
            </span>
            <span className="text-sm text-ink-soft">
              {teamCount > 1 ? 'équipes inscrites' : 'équipe inscrite'}
            </span>
          </div>

          {beyondGuaranteedSize(tournament) && (
            <p className="rounded-card border border-warning-line bg-warning-ground px-4 py-3 text-[13.5px] leading-relaxed">
              Au-delà de {GUARANTEED_TEAMS} équipes, l&apos;application fonctionne mais sort du
              domaine couvert par ses tests.
            </p>
          )}

          <div className="flex items-start gap-2.5">
            <div className="min-w-0 flex-1">
              <label htmlFor="new-team" className="sr-only">
                Nom de la nouvelle équipe
              </label>
              <input
                id="new-team"
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
                className="h-12 w-full rounded-panel border-[1.5px] border-accent bg-surface px-4 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
              />
              {issue && <p className="mt-1.5 text-sm text-warning">{ISSUE_MESSAGES[issue]}</p>}
            </div>
            <Button
              tone="primary"
              className="h-12"
              disabled={issue !== null || newName.trim().length === 0}
              onClick={submitNewTeam}
            >
              <IconPlus size={16} />
              Ajouter
            </Button>
          </div>

          <div className="overflow-hidden rounded-card border border-line bg-surface">
            {teamCount === 0 ? (
              <p className="px-4 py-10 text-center text-ink-soft">
                Aucune équipe. Ajoute la première ci-dessus.
              </p>
            ) : (
              <ul>
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
          </div>
        </section>

        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="font-display text-base font-semibold">Règles du tournoi</h2>
          <SettingsPanel
            tournament={tournament}
            onMatchCountChange={setMatchCount}
            onSettingChange={setSetting}
          />
        </section>
      </div>

      <Dialog
        open={toRemove !== null}
        onOpenChange={(value) => {
          if (!value) {
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
