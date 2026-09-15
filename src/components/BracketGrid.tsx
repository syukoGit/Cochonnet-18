import { lastRoundOf, roundLabel, slotLabel } from '@/components/labels';
import type { TeamId } from '@/domain/ids';
import { isReady, occupantsIn, winnerIn } from '@/domain/match/resolve';
import { hasResult } from '@/domain/match/types';
import type { Match } from '@/domain/match/types';
import { isThirdPlace } from '@/domain/phase2/bracket';

interface BracketGridProps {
  matches: Match[];
  allMatches: Match[];
  nameOf: (team: TeamId) => string;
  onSelect: (match: Match) => void;
}

export default function BracketGrid({ matches, allMatches, nameOf, onSelect }: BracketGridProps) {
  const knockout = matches.filter((match) => !isThirdPlace(match));
  const thirdPlace = matches.find(isThirdPlace);
  const rounds = [...new Set(knockout.map((match) => match.round))].sort((a, b) => a - b);
  const lastRound = lastRoundOf(knockout);

  const card = (match: Match) => {
    const winner = winnerIn(allMatches, match);
    const open = isReady(allMatches, match);

    return (
      <li key={match.id}>
        <button
          type="button"
          disabled={!open}
          onClick={() => {
            onSelect(match);
          }}
          className={`w-full rounded-panel border text-left transition-colors disabled:cursor-default ${hasResult(match) ? 'border-line bg-surface' : 'border-dashed border-line bg-surface'} ${open ? 'hover:border-accent' : 'opacity-60'} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
        >
          {([0, 1] as const).map((index) => {
            const occupant = occupantsIn(allMatches, match)[index];
            const isWinner = occupant !== null && occupant === winner;

            return (
              <span
                key={index}
                className={`flex items-center justify-between gap-2 px-3 py-2 text-sm ${index === 0 ? 'border-b border-line-soft' : ''} ${occupant === null ? 'text-ink-faint italic' : ''} ${isWinner ? 'font-semibold' : ''}`}
              >
                <span className="truncate">{slotLabel(allMatches, match, index, nameOf)}</span>
                {match.status === 'forfeit' ? (
                  <span className="text-xs text-warning">
                    {occupant !== null && occupant === match.forfeitBy ? 'forfait' : 'gagne'}
                  </span>
                ) : (
                  match.score && (
                    <span className="tabular-nums text-ink-soft">{match.score[index]}</span>
                  )
                )}
              </span>
            );
          })}
        </button>
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-x-auto">
        <div className="flex min-w-fit gap-4">
          {rounds.map((round) => (
            <section key={round} className="flex min-w-56 flex-1 flex-col gap-2">
              <h3 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
                {roundLabel(round, lastRound)}
              </h3>
              <ul className="flex flex-1 flex-col justify-around gap-2">
                {knockout.filter((match) => match.round === round).map(card)}
              </ul>
            </section>
          ))}
        </div>
      </div>

      {thirdPlace && (
        <section className="flex max-w-56 flex-col gap-2">
          <h3 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
            Petite finale
          </h3>
          <ul>{card(thirdPlace)}</ul>
        </section>
      )}
    </div>
  );
}
