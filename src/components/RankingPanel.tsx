import type { TeamId } from '@/domain/ids';
import type { RankingEntry } from '@/domain/phase1/ranking';

interface RankingPanelProps {
  ranking: RankingEntry[];
  nameOf: (team: TeamId) => string;
  provisional: boolean;
  title?: string;
}

const HEAD = 'px-1.5 py-2.5 text-[11.5px] font-semibold tracking-[0.06em] text-ink-faint uppercase';

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

function differentialClass(value: number): string {
  if (value > 0) {
    return 'text-success';
  }

  return value < 0 ? 'text-accent' : 'text-ink-soft';
}

export default function RankingPanel({
  ranking,
  nameOf,
  provisional,
  title = 'Classement',
}: RankingPanelProps) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-card border border-line bg-surface">
      <header className="flex shrink-0 items-center gap-3 border-b border-line-soft px-4 py-3">
        <h2 className="flex-1 font-display text-base font-semibold">{title}</h2>
        {provisional && (
          <span className="rounded-full bg-warning-ground px-2.5 py-1 text-[11.5px] font-semibold tracking-wide text-warning uppercase">
            Provisoire
          </span>
        )}
      </header>

      {provisional && (
        <p className="shrink-0 border-b border-line-soft bg-ground px-4 py-2 text-xs leading-relaxed text-ink-soft">
          Les exemptions ne sont créditées qu&apos;à la clôture de la phase 1.
        </p>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className={`${HEAD} pl-4`}>#</th>
              <th className={HEAD}>Équipe</th>
              <th className={`${HEAD} text-right`}>Diff.</th>
              <th className={`${HEAD} text-right`}>V</th>
              <th className={`${HEAD} text-right`}>J</th>
              <th className={`${HEAD} pr-4 text-right`}>Ex.</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((entry, index) => (
              <tr key={entry.team} className="border-t border-line-soft">
                <td className="py-2 pr-1.5 pl-4 tabular-nums text-ink-faint">{index + 1}</td>
                <td className="max-w-0 truncate px-1.5 py-2">{nameOf(entry.team)}</td>
                <td
                  className={`px-1.5 py-2 text-right font-display font-bold tabular-nums ${differentialClass(entry.differential)}`}
                >
                  {signed(entry.differential)}
                </td>
                <td className="px-1.5 py-2 text-right tabular-nums text-ink-soft">{entry.wins}</td>
                <td className="px-1.5 py-2 text-right tabular-nums text-ink-soft">
                  {entry.played}
                </td>
                <td className="py-2 pr-4 pl-1.5 text-right tabular-nums text-ink-faint">
                  {entry.byes || ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
