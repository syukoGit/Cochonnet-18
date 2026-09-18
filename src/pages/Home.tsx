import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';
import Dialog from '@/components/Dialog';
import IconButton from '@/components/IconButton';
import Rail, { RailBrand } from '@/components/Rail';
import Shell from '@/components/Shell';
import { IconExport, IconImport, IconPlus, IconTrash, IconWarning } from '@/components/icons';
import { STEP_LABELS } from '@/components/labels';
import { furthestStep, STEPS } from '@/domain/navigation';
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

  const rail = (
    <Rail>
      <RailBrand />
      <div className="flex flex-col gap-2">
        <Button
          tone="primary"
          onClick={() => {
            setCreationOpen(true);
          }}
        >
          <IconPlus size={16} />
          Nouveau tournoi
        </Button>
        <Button
          tone="rail"
          onClick={() => {
            void runImport();
          }}
        >
          <IconImport size={16} />
          Importer un fichier
        </Button>
      </div>

      <p className="mt-auto text-xs text-rail-faint">
        {list.length === 1 ? '1 tournoi enregistré' : `${list.length} tournois enregistrés`}
      </p>
    </Rail>
  );

  return (
    <Shell
      rail={rail}
      title="Tournois"
      lead="Créer un tournoi ne remplace rien : celui de la saison dernière est encore là, avec son podium."
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        {unreadable.length > 0 && (
          <div className="flex gap-3 rounded-card border border-warning-line bg-warning-ground p-4 shadow-[inset_3px_0_0_var(--c-warning)]">
            <IconWarning size={18} className="mt-0.5 shrink-0 text-warning" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-warning">
                {unreadable.length === 1
                  ? '1 fichier de tournoi est illisible'
                  : `${unreadable.length} fichiers de tournoi sont illisibles`}
              </p>
              <ul className="mt-1.5 space-y-1 text-[13.5px] leading-relaxed text-ink-soft">
                {unreadable.map((entry) => (
                  <li key={entry.file}>
                    <span className="font-mono text-xs">{entry.file}</span> — {entry.reason}
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 text-[13.5px] text-ink-soft">
                Les autres tournois restent utilisables.
              </p>
            </div>
          </div>
        )}

        {notice !== null && (
          <div className="flex items-center gap-3 rounded-card border border-line bg-surface p-4">
            <p className="min-w-0 flex-1 text-sm wrap-break-word text-ink-soft">{notice}</p>
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
          <div className="rounded-card border border-dashed border-line px-6 py-14 text-center">
            <p className="font-display text-lg font-semibold">Aucun tournoi</p>
            <p className="mt-1.5 text-sm text-ink-soft">Crée ton premier tournoi pour commencer.</p>
          </div>
        )}

        <ul className="flex flex-col gap-2.5">
          {list.map((tournament) => {
            const step = furthestStep(tournament);
            const reached = STEPS.indexOf(step);

            return (
              <li
                key={tournament.id}
                className="flex min-h-[84px] items-center gap-5 rounded-card border border-line bg-surface px-4 py-3"
              >
                <button
                  type="button"
                  onClick={() => {
                    openTournament(tournament.id);
                  }}
                  className="min-w-0 flex-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <span className="block truncate font-display text-lg font-semibold tracking-tight">
                    {tournament.name}
                  </span>
                  <span className="mt-1 block truncate text-[13.5px] text-ink-soft">
                    {tournament.teams.length} {tournament.teams.length > 1 ? 'équipes' : 'équipe'} ·
                    modifié le {formatDate(tournament.modified)}
                  </span>
                </button>

                <div className="hidden w-[152px] shrink-0 flex-col items-end gap-2 md:flex">
                  <span className="text-xs font-medium text-ink-soft">{STEP_LABELS[step]}</span>
                  <span
                    className="flex gap-1"
                    role="img"
                    aria-label={`Étape ${reached + 1} sur ${STEPS.length}`}
                  >
                    {STEPS.map((one, index) => (
                      <span
                        key={one}
                        className={`h-1.5 w-[18px] rounded-full ${index < reached ? 'bg-success' : index === reached ? 'bg-accent' : 'bg-line'}`}
                      />
                    ))}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    tone="primary"
                    onClick={() => {
                      openTournament(tournament.id);
                    }}
                  >
                    Ouvrir
                  </Button>
                  <IconButton
                    label={`Exporter ${tournament.name}`}
                    onClick={() => {
                      void runExport(tournament);
                    }}
                  >
                    <IconExport />
                  </IconButton>
                  <IconButton
                    tone="danger"
                    label={`Supprimer ${tournament.name}`}
                    onClick={() => {
                      setToRemove(tournament);
                    }}
                  >
                    <IconTrash />
                  </IconButton>
                </div>
              </li>
            );
          })}
        </ul>
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
          className="h-12 w-full rounded-panel border border-line bg-ground px-3.5 focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
        />
      </Dialog>

      <Dialog
        open={incoming !== null}
        onOpenChange={(value) => {
          if (!value) {
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
              tone="primary"
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
        onOpenChange={(value) => {
          if (!value) {
            setToRemove(null);
          }
        }}
        title="Supprimer ce tournoi ?"
        description={
          toRemove
            ? `« ${toRemove.name} », ses sauvegardes et tout ce qu'il contient seront effacés définitivement.`
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
