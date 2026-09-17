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

const IMPORT_FAILURES: Record<string, string> = {
  'unreadable-file': 'Ce fichier est introuvable ou illisible.',
  'invalid-json': "Ce fichier n'est pas du JSON valide.",
  'invalid-schema': "Ce fichier n'est pas une sauvegarde Cochonnet.",
  'unknown-version': "Ce fichier vient d'une version que cette application ne sait pas lire.",
};

const longDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? '—' : longDate.format(date);
}

export default function Home() {
  const { list, unreadable, loading, load, create, open, remove } = useTournaments();
  const { exportTournament, importTournament, adopt } = useTournaments();
  const navigate = useNavigate();

  const [creationOpen, setCreationOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [toRemove, setToRemove] = useState<Tournament | null>(null);
  const [incoming, setIncoming] = useState<Tournament | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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

  const runExport = async (tournament: Tournament) => {
    const outcome = await exportTournament(tournament.id);

    if (outcome.status === 'written') {
      setNotice(`« ${tournament.name} » exporté vers ${outcome.path}`);
    }

    if (outcome.status === 'failed') {
      setNotice(`L'export a échoué : ${outcome.detail}`);
    }
  };

  const runImport = async () => {
    const outcome = await importTournament();

    if (outcome.status === 'invalid') {
      setNotice(IMPORT_FAILURES[outcome.reason] ?? outcome.detail);
      return;
    }

    if (outcome.status === 'read') {
      setIncoming(outcome.tournament);
    }
  };

  const confirmImport = async (mode: 'replace' | 'copy') => {
    if (!incoming) {
      return;
    }

    const id = await adopt(incoming, mode);
    setIncoming(null);
    void navigate(`/tournoi/${id}`);
  };

  const conflicts = incoming !== null && list.some((one) => one.id === incoming.id);

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
        <>
          <Button
            onClick={() => {
              void runImport();
            }}
          >
            Importer
          </Button>
          <Button
            tone="primary"
            onClick={() => {
              setCreationOpen(true);
            }}
          >
            Nouveau tournoi
          </Button>
        </>
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

        {notice !== null && (
          <div className="mb-5 flex items-start gap-3 rounded-panel border border-line bg-surface p-4 text-sm">
            <p className="min-w-0 flex-1 wrap-break-word text-ink-soft">{notice}</p>
            <Button
              onClick={() => {
                setNotice(null);
              }}
            >
              Fermer
            </Button>
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
                  onClick={() => {
                    void runExport(tournament);
                  }}
                >
                  Exporter
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
        open={incoming !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIncoming(null);
          }
        }}
        title={conflicts ? 'Ce tournoi est déjà là' : 'Importer ce tournoi ?'}
        description={
          incoming
            ? conflicts
              ? `« ${incoming.name} » porte l'identifiant d'un tournoi déjà présent. Remplacer efface la version enregistrée ici ; importer une copie garde les deux.`
              : `« ${incoming.name} » sera ajouté à la liste.`
            : undefined
        }
        actions={
          <>
            <Button
              onClick={() => {
                setIncoming(null);
              }}
            >
              Annuler
            </Button>
            {conflicts && (
              <Button
                onClick={() => {
                  void confirmImport('copy');
                }}
              >
                Importer une copie
              </Button>
            )}
            <Button
              tone={conflicts ? 'danger' : 'primary'}
              onClick={() => {
                void confirmImport('replace');
              }}
            >
              {conflicts ? 'Remplacer' : 'Importer'}
            </Button>
          </>
        }
      />

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
