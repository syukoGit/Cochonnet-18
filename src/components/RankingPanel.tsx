import type { TeamId } from '@/domain/ids';
import type { RankingEntry } from '@/domain/phase1/ranking';

interface RankingPanelProps {
  ranking: RankingEntry[];
  nameOf: (team: TeamId) => string;
  provisional: boolean;
  title?: string;
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

export default function RankingPanel({
  ranking,
  nameOf,
  provisional,
  title = 'Classement',
}: RankingPanelProps) {
  return (
    <section className="overflow-hidden rounded-panel border border-line bg-surface">
      <header className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3">
        <h2 className="font-semibold">{title}</h2>
        {provisional && (
          <span className="rounded-panel bg-warning-ground px-2 py-0.5 text-xs font-medium text-warning">
            provisoire
          </span>
        )}
      </header>

      {provisional && (
        <p className="border-b border-line-soft px-4 py-2 text-xs text-ink-soft">
          Les exemptions ne sont créditées qu&apos;à la clôture de la phase 1.
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-faint">
              <th className="py-2 pl-4 pr-2 font-medium">#</th>
              <th className="px-2 py-2 font-medium">Équipe</th>
              <th className="px-2 py-2 text-right font-medium">Diff.</th>
              <th className="px-2 py-2 text-right font-medium">V</th>
              <th className="px-2 py-2 text-right font-medium">J</th>
              <th className="py-2 pl-2 pr-4 text-right font-medium">Ex.</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((entry, index) => (
              <tr key={entry.team} className="border-t border-line-soft">
                <td className="py-2 pl-4 pr-2 tabular-nums text-ink-faint">{index + 1}</td>
                <td className="max-w-0 truncate px-2 py-2">{nameOf(entry.team)}</td>
                <td className="px-2 py-2 text-right font-medium tabular-nums">
                  {signed(entry.differential)}
                </td>
                <td className="px-2 py-2 text-right tabular-nums text-ink-soft">{entry.wins}</td>
                <td className="px-2 py-2 text-right tabular-nums text-ink-soft">{entry.played}</td>
                <td className="py-2 pl-2 pr-4 text-right tabular-nums text-ink-soft">
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
