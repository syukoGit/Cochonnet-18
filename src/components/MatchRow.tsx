import Button from '@/components/Button';
import ScoreInput from '@/components/ScoreInput';
import type { TeamId } from '@/domain/ids';
import { winnerOf } from '@/domain/match/result';
import { opponents } from '@/domain/match/types';
import type { Match } from '@/domain/match/types';
import type { Score } from '@/domain/score/validity';

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

  const teamClass = (team: TeamId | undefined) =>
    team !== undefined && team === winner ? 'truncate font-semibold' : 'truncate';

  return (
    <li className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-3 px-4 py-3">
      <span className={`${teamClass(home)} text-right`}>
        {home === undefined ? '' : nameOf(home)}
      </span>

      {match.status === 'forfeit' ? (
        <span className="rounded-panel bg-warning-ground px-2 py-1 text-xs font-medium text-warning">
          forfait de {match.forfeitBy === undefined ? '' : nameOf(match.forfeitBy)}
        </span>
      ) : (
        <ScoreInput score={match.score} minimumGap={minimumGap} onCommit={onScore} />
      )}

      <span className={teamClass(away)}>{away === undefined ? '' : nameOf(away)}</span>

      {match.status === 'waiting' ? (
        <Button onClick={onForfeit}>Forfait</Button>
      ) : (
        <Button tone="danger" onClick={onClear}>
          Effacer
        </Button>
      )}
    </li>
  );
}
