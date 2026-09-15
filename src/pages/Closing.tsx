import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';
import Dialog from '@/components/Dialog';
import Shell from '@/components/Shell';
import type { TeamId } from '@/domain/ids';
import { rankTeams } from '@/domain/phase1/ranking';
import { liveTies, splitOf } from '@/domain/phase2/split';
import type { Tournament } from '@/domain/tournament/types';
import { useTournaments } from '@/store/useTournaments';

interface ClosingProps {
  tournament: Tournament;
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

export default function Closing({ tournament }: ClosingProps) {
  const navigate = useNavigate();
  const { reopenPhase1, withdraw, reinstate, settleTie, drawBrackets } = useTournaments();
  const [tieToSettle, setTieToSettle] = useState<TeamId[] | null>(null);

  const { entries } = rankTeams(tournament);
  const ties = liveTies(tournament);
  const split = splitOf(tournament);

  const nameOf = (team: TeamId): string =>
    tournament.teams.find((candidate) => candidate.id === team)?.name ?? `Équipe ${team}`;

  const isWithdrawn = (team: TeamId) => tournament.withdrawn.includes(team);
  const tieOf = (team: TeamId) => ties.find((tie) => tie.includes(team)) ?? null;
  const groupOf = (team: TeamId) =>
    isWithdrawn(team) ? null : split.main.includes(team) ? 'principal' : 'consolante';

  return (
    <Shell
      title={tournament.name}
      subtitle={`Clôture · ${split.main.length} au principal, ${split.consolation.length} en consolante`}
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
            {ties.length > 0
              ? `${ties.length} ${ties.length > 1 ? 'égalités restent' : 'égalité reste'} à trancher.`
              : 'Répartition prête.'}
          </span>
          <Button onClick={reopenPhase1}>Revenir à la phase 1</Button>
          <Button tone="primary" disabled={ties.length > 0} onClick={drawBrackets}>
            Tirer les tableaux
          </Button>
        </>
      }
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        {ties.length > 0 && (
          <div className="rounded-panel border border-warning bg-warning-ground p-4 text-sm">
            <p className="font-semibold text-warning">
              Départage impossible sur les critères de classement
            </p>
            <p className="mt-1 text-ink-soft">
              Les critères — victoires, confrontation directe, points marqués — laissent ces équipes
              à égalité. Tranche au sort, l&apos;application ne le fera pas à ta place.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ties.map((tie) => (
                <Button
                  key={tie.join('-')}
                  onClick={() => {
                    setTieToSettle(tie);
                  }}
                >
                  {tie.map(nameOf).join(' / ')}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-panel border border-line bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-faint">
                <th className="py-2 pl-4 pr-2 font-medium">#</th>
                <th className="px-2 py-2 font-medium">Équipe</th>
                <th className="px-2 py-2 text-right font-medium">Diff.</th>
                <th className="px-2 py-2 text-right font-medium">dont exempt.</th>
                <th className="px-2 py-2 font-medium">Tableau</th>
                <th className="py-2 pl-2 pr-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => {
                const group = groupOf(entry.team);
                const tie = tieOf(entry.team);

                return (
                  <tr
                    key={entry.team}
                    className={`border-t border-line-soft ${isWithdrawn(entry.team) ? 'text-ink-faint line-through' : ''}`}
                  >
                    <td className="py-2 pl-4 pr-2 tabular-nums text-ink-faint">{index + 1}</td>
                    <td className="max-w-0 truncate px-2 py-2">
                      {nameOf(entry.team)}
                      {tie && (
                        <span className="ml-2 rounded-panel bg-warning-ground px-1.5 py-0.5 text-xs text-warning">
                          à égalité
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right font-medium tabular-nums">
                      {signed(entry.differential)}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums text-ink-soft">
                      {entry.byes > 0 ? signed(entry.byeCredit) : ''}
                    </td>
                    <td className="px-2 py-2 text-ink-soft">{group ?? 'retirée'}</td>
                    <td className="py-2 pl-2 pr-4 text-right">
                      {isWithdrawn(entry.team) ? (
                        <Button
                          onClick={() => {
                            reinstate(entry.team);
                          }}
                        >
                          Réintégrer
                        </Button>
                      ) : (
                        <Button
                          tone="danger"
                          onClick={() => {
                            withdraw(entry.team);
                          }}
                        >
                          Retirer
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={tieToSettle !== null}
        onOpenChange={(open) => {
          if (!open) {
            setTieToSettle(null);
          }
        }}
        title="Tirage au sort"
        description="Choisis l’équipe qui passe devant. Ta décision est conservée tant que cette égalité porte sur les mêmes équipes."
        actions={
          <Button
            onClick={() => {
              setTieToSettle(null);
            }}
          >
            Annuler
          </Button>
        }
      >
        <div className="flex flex-col gap-2">
          {tieToSettle?.map((team) => (
            <Button
              key={team}
              onClick={() => {
                settleTie(tieToSettle, [team, ...tieToSettle.filter((one) => one !== team)]);
                setTieToSettle(null);
              }}
            >
              {nameOf(team)} devant
            </Button>
          ))}
        </div>
      </Dialog>
    </Shell>
  );
}
