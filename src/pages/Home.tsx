import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';
import Dialog from '@/components/Dialog';
import Shell from '@/components/Shell';
import { STEP_LABELS } from '@/components/labels';
import { furthestStep } from '@/domain/navigation';
import { isValidTournamentName } from '@/domain/tournament/tournament';
import type { Tournament, TournamentId } from '@/domain/tournament/types';
import { useTournaments } from '@/store/useTournaments';

const longDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? '—' : longDate.format(date);
}

export default function Home() {
  const { list, unreadable, loading, load, create, open, remove } = useTournaments();
  const navigate = useNavigate();

  const [creationOpen, setCreationOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [toRemove, setToRemove] = useState<Tournament | null>(null);

  useEffect(() => {
    void load();
  }, [load]);

  const confirmCreation = async () => {
    if (!isValidTournamentName(newName)) {
      return;
    }

    const id = await create(newName);
    setNewName('');
    setCreationOpen(false);
    void navigate(`/tournoi/${id}`);
  };

  const openTournament = (id: TournamentId) => {
    open(id);
    void navigate(`/tournoi/${id}`);
  };

  const confirmRemoval = async () => {
    if (toRemove) {
      await remove(toRemove.id);
      setToRemove(null);
    }
  };

  return (
    <Shell
      title="Cochonnet-18"
      subtitle="Tournois"
      actions={
        <Button
          tone="primary"
          onClick={() => {
            setCreationOpen(true);
          }}
        >
          Nouveau tournoi
        </Button>
      }
    >
      <div className="mx-auto w-full max-w-3xl">
        {unreadable.length > 0 && (
          <div className="mb-5 rounded-panel border border-warning bg-warning-ground p-4 text-sm">
            <p className="font-semibold text-warning">
              {unreadable.length === 1
                ? '1 fichier de tournoi est illisible'
                : `${unreadable.length} fichiers de tournoi sont illisibles`}
            </p>
            <ul className="mt-2 space-y-1 text-ink-soft">
              {unreadable.map((entry) => (
                <li key={entry.file}>
                  <span className="font-mono">{entry.file}</span> — {entry.reason}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-ink-soft">Les autres tournois restent utilisables.</p>
          </div>
        )}

        {loading && <p className="text-ink-soft">Chargement…</p>}

        {!loading && list.length === 0 && (
          <div className="rounded-panel border border-dashed border-line p-10 text-center">
            <p className="font-medium">Aucun tournoi</p>
            <p className="mt-1 text-sm text-ink-soft">Crée ton premier tournoi pour commencer.</p>
          </div>
        )}

        {list.length > 0 && (
          <ul className="divide-y divide-line-soft overflow-hidden rounded-panel border border-line bg-surface">
            {list.map((tournament) => (
              <li key={tournament.id} className="flex items-center gap-4 px-4 py-3">
                <button
                  type="button"
                  onClick={() => {
                    openTournament(tournament.id);
                  }}
                  className="min-w-0 flex-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <span className="block truncate font-medium">{tournament.name}</span>
                  <span className="block truncate text-sm text-ink-soft">
                    {STEP_LABELS[furthestStep(tournament)]} · modifié le{' '}
                    {formatDate(tournament.modified)}
                  </span>
                </button>
                <Button
                  onClick={() => {
                    openTournament(tournament.id);
                  }}
                >
                  Ouvrir
                </Button>
                <Button
                  tone="danger"
                  onClick={() => {
                    setToRemove(tournament);
                  }}
                >
                  Supprimer
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog
        open={creationOpen}
        onOpenChange={setCreationOpen}
        title="Nouveau tournoi"
        description="Donne-lui un nom ; tu pourras le changer plus tard."
        actions={
          <>
            <Button
              onClick={() => {
                setCreationOpen(false);
              }}
            >
              Annuler
            </Button>
            <Button
              tone="primary"
              disabled={!isValidTournamentName(newName)}
              onClick={() => {
                void confirmCreation();
              }}
            >
              Créer
            </Button>
          </>
        }
      >
        <input
          autoFocus
          value={newName}
          onChange={(changeEvent) => {
            setNewName(changeEvent.target.value);
          }}
          onKeyDown={(keyEvent) => {
            if (keyEvent.key === 'Enter') {
              void confirmCreation();
            }
          }}
          placeholder="Tournoi du 14 septembre"
          className="w-full rounded-panel border border-line bg-ground px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
        />
      </Dialog>

      <Dialog
        open={toRemove !== null}
        onOpenChange={(open) => {
          if (!open) {
            setToRemove(null);
          }
        }}
        title="Supprimer ce tournoi ?"
        description={
          toRemove
            ? `« ${toRemove.name} » et tout ce qu'il contient seront effacés définitivement.`
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
                void confirmRemoval();
              }}
            >
              Supprimer
            </Button>
          </>
        }
      />
    </Shell>
  );
}
