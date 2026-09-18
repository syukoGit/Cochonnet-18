import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';
import Dialog from '@/components/Dialog';
import Rail, { RailBack, RailBrand, RailNote, RailTitle } from '@/components/Rail';
import Shell from '@/components/Shell';
import { IconForward, IconWarning } from '@/components/icons';
import type { TeamId } from '@/domain/ids';
import { rankTeams } from '@/domain/phase1/ranking';
import { liveTies, splitOf } from '@/domain/phase2/split';
import type { Tournament } from '@/domain/tournament/types';
import { useTournaments } from '@/store/useTournaments';

const HEAD = 'px-1.5 py-2.5 text-[11.5px] font-semibold tracking-[0.06em] text-ink-faint uppercase';

const CHIP = 'inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold';

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

interface ClosingProps {
  tournament: Tournament;
  nav: ReactNode;
}

export default function Closing({ tournament, nav }: ClosingProps) {
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
  const inMain = (team: TeamId) => split.main.includes(team);

  const lastMainIndex = entries.reduce(
    (found, entry, index) => (!isWithdrawn(entry.team) && inMain(entry.team) ? index : found),
    -1
  );

  const rail = (
    <Rail>
      <RailBrand />
      <RailTitle name={tournament.name} meta={`${tournament.teams.length} équipes`} />
      {nav}
      <RailNote title="Répartition">
        <dl className="flex flex-col gap-2 text-[13px]">
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-rail-soft">Principal</dt>
            <dd className="font-display text-xl font-bold tabular-nums">{split.main.length}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-rail-soft">Consolante</dt>
            <dd className="font-display text-xl font-bold tabular-nums">
              {split.consolation.length}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-rail-faint">Retirées</dt>
            <dd className="font-display text-xl font-bold text-rail-faint tabular-nums">
              {tournament.withdrawn.length}
            </dd>
          </div>
        </dl>
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
      eyebrow="Étape 3 sur 5"
      title="Clôture"
      lead="La moitié haute part au tableau principal, la moitié basse en consolante. Les exemptions viennent d'être créditées."
      fill
      footer={
        <>
          <p className="mr-auto text-sm text-ink-soft">
            {ties.length > 0 ? (
              <strong className="font-semibold text-warning">
                {ties.length} {ties.length > 1 ? 'égalités restent' : 'égalité reste'} à trancher
              </strong>
            ) : (
              'Répartition prête.'
            )}
          </p>
          <Button onClick={reopenPhase1}>Revenir à la phase 1</Button>
          <Button tone="primary" disabled={ties.length > 0} onClick={drawBrackets}>
            Tirer les tableaux
            <IconForward size={16} />
          </Button>
        </>
      }
    >
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-3.5">
        {ties.length > 0 && (
          <div className="flex shrink-0 gap-3 rounded-card border border-warning-line bg-warning-ground p-4 shadow-[inset_3px_0_0_var(--c-warning)]">
            <IconWarning size={18} className="mt-0.5 shrink-0 text-warning" />
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-semibold text-warning">
                {ties.length > 1
                  ? `${ties.length} égalités que les critères ne départagent pas`
                  : 'Une égalité que les critères ne départagent pas'}
              </p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-ink-soft">
                Victoires, confrontation directe et points marqués donnent le même résultat. Tranche
                au sort, l&apos;application ne le fera pas à ta place.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {ties.map((tie) => (
                  <Button
                    key={tie.join('-')}
                    onClick={() => {
                      setTieToSettle(tie);
                    }}
                  >
                    Trancher : {tie.map(nameOf).join(' / ')}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto rounded-card border border-line bg-surface">
          <table className="w-full text-[14.5px]">
            <thead className="sticky top-0 bg-surface">
              <tr className="text-left">
                <th className={`${HEAD} pl-5`}>#</th>
                <th className={HEAD}>Équipe</th>
                <th className={`${HEAD} text-right`}>Différentiel</th>
                <th className={`${HEAD} text-right`}>dont exempt.</th>
                <th className={HEAD}>Tableau</th>
                <th className={`${HEAD} pr-5 text-right`}>Présence</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => {
                const out = isWithdrawn(entry.team);
                const tie = tieOf(entry.team);
                const main = !out && inMain(entry.team);

                return (
                  <tr
                    key={entry.team}
                    className={`border-t border-line-soft ${index === lastMainIndex + 1 ? 'border-t-2 border-t-line' : ''}`}
                  >
                    <td className="py-2 pr-1.5 pl-5 tabular-nums text-ink-faint">{index + 1}</td>
                    <td className="max-w-0 truncate px-1.5 py-2">
                      <span className={out ? 'text-ink-faint line-through' : 'font-medium'}>
                        {nameOf(entry.team)}
                      </span>
                      {tie && (
                        <span className={`${CHIP} ml-2 bg-warning-ground text-warning`}>
                          à égalité
                        </span>
                      )}
                    </td>
                    <td
                      className={`px-1.5 py-2 text-right font-display font-bold tabular-nums ${out ? 'text-ink-faint' : entry.differential > 0 ? 'text-success' : entry.differential < 0 ? 'text-accent' : 'text-ink-soft'}`}
                    >
                      {signed(entry.differential)}
                    </td>
                    <td className="px-1.5 py-2 text-right tabular-nums text-ink-faint">
                      {entry.byes > 0 ? signed(entry.byeCredit) : ''}
                    </td>
                    <td className="px-1.5 py-2">
                      <span
                        className={`${CHIP} ${out ? 'bg-sunken text-ink-faint' : main ? 'bg-accent-ground text-accent' : 'bg-success-ground text-success'}`}
                      >
                        {out ? 'retirée' : main ? 'Principal' : 'Consolante'}
                      </span>
                    </td>
                    <td className="py-2 pr-5 pl-1.5 text-right">
                      {out ? (
                        <Button
                          onClick={() => {
                            reinstate(entry.team);
                          }}
                        >
                          Réintégrer
                        </Button>
                      ) : (
                        <Button
                          tone="quiet"
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
        onOpenChange={(value) => {
          if (!value) {
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
              className="min-h-[52px] justify-start"
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
