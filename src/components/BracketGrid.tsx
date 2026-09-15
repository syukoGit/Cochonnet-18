import type { TeamId } from '@/domain/ids';
import { occupantsIn, winnerIn } from '@/domain/match/resolve';
import type { Match } from '@/domain/match/types';
import { isThirdPlace } from '@/domain/phase2/bracket';

interface BracketGridProps {
  matches: Match[];
  allMatches: Match[];
  nameOf: (team: TeamId) => string;
}

function roundLabel(round: number, lastRound: number): string {
  if (round === lastRound) {
    return 'Finale';
  }

  if (round === lastRound - 1) {
    return 'Demi-finales';
  }

  if (round === lastRound - 2) {
    return 'Quarts';
  }

  return `Tour ${round}`;
}

export default function BracketGrid({ matches, allMatches, nameOf }: BracketGridProps) {
  const knockout = matches.filter((match) => !isThirdPlace(match));
  const thirdPlace = matches.find(isThirdPlace);
  const rounds = [...new Set(knockout.map((match) => match.round))].sort((a, b) => a - b);
  const lastRound = rounds.at(-1) ?? 1;

  const slotLabel = (match: Match, index: 0 | 1): string => {
    const occupant = occupantsIn(allMatches, match)[index];

    if (occupant !== null) {
      return nameOf(occupant);
    }

    const slot = match.slots[index];

    if (slot.kind === 'winner') {
      return `vainqueur du match ${slot.from}`;
    }

    if (slot.kind === 'loser') {
      return `perdant du match ${slot.from}`;
    }

    return 'exempte';
  };

  const card = (match: Match) => {
    const winner = winnerIn(allMatches, match);

    return (
      <li key={match.id} className="rounded-panel border border-line bg-surface">
        {([0, 1] as const).map((index) => {
          const occupant = occupantsIn(allMatches, match)[index];
          const isWinner = occupant !== null && occupant === winner;

          return (
            <div
              key={index}
              className={`flex items-center justify-between gap-2 px-3 py-2 text-sm ${index === 0 ? 'border-b border-line-soft' : ''} ${occupant === null ? 'text-ink-faint italic' : ''} ${isWinner ? 'font-semibold' : ''}`}
            >
              <span className="truncate">{slotLabel(match, index)}</span>
              {match.score && (
                <span className="tabular-nums text-ink-soft">{match.score[index]}</span>
              )}
            </div>
          );
        })}
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
