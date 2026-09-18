import Button from '@/components/Button';
import ScoreInput from '@/components/ScoreInput';
import type { TeamId } from '@/domain/ids';
import { winnerOf } from '@/domain/match/result';
import { opponents } from '@/domain/match/types';
import type { Match } from '@/domain/match/types';
import type { Score } from '@/domain/score/validity';

const MARK_TONES = {
  waiting: 'bg-line',
  played: 'bg-success',
  forfeit: 'bg-warning',
};

interface MatchRowProps {
  match: Match;
  minimumGap: number;
  nameOf: (team: TeamId) => string;
  onScore: (score: Score) => void;
  onForfeit: () => void;
  onClear: () => void;
}

export default function MatchRow({
  match,
  minimumGap,
  nameOf,
  onScore,
  onForfeit,
  onClear,
}: MatchRowProps) {
  const [home, away] = opponents(match);
  const winner = winnerOf(match);

  const nameClass = (team: TeamId | undefined) =>
    team !== undefined && team === winner ? 'truncate font-semibold' : 'truncate';

  return (
    <li className="flex min-h-[58px] items-center gap-3 rounded-card border border-line bg-surface py-2 pr-3 pl-3">
      <span className={`h-7 w-1.5 shrink-0 rounded-full ${MARK_TONES[match.status]}`} />

      <span className={`flex-1 text-right ${nameClass(home)}`}>
        {home === undefined ? '' : nameOf(home)}
      </span>

      {match.status === 'forfeit' ? (
        <span className="max-w-40 shrink-0 truncate rounded-panel border border-warning-line bg-warning-ground px-3 py-1.5 text-xs font-semibold text-warning">
          forfait de {match.forfeitBy === undefined ? '' : nameOf(match.forfeitBy)}
        </span>
      ) : (
        <ScoreInput score={match.score} minimumGap={minimumGap} onCommit={onScore} />
      )}

      <span className={`flex-1 ${nameClass(away)}`}>{away === undefined ? '' : nameOf(away)}</span>

      <span className="flex w-24 shrink-0 justify-end">
        {match.status === 'waiting' ? (
          <Button onClick={onForfeit}>Forfait</Button>
        ) : (
          <Button tone="danger" onClick={onClear}>
            Effacer
          </Button>
        )}
      </span>
    </li>
  );
}
