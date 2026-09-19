import { IconStopwatch } from '@/components/icons';
import { useElapsed } from '@/components/useElapsed';
import type { MatchId } from '@/domain/ids';
import type { TournamentId } from '@/domain/tournament/types';
import { useTimers } from '@/store/useTimers';

interface MatchTimerProps {
  tournament: TournamentId;
  match: MatchId;
}

export default function MatchTimer({ tournament, match }: MatchTimerProps) {
  const startedAt = useTimers((state) => state.startedAt[`${tournament}#${match}`] ?? null);
  const toggle = useTimers((state) => state.toggle);
  const elapsed = useElapsed(startedAt);
  const running = elapsed !== null;

  return (
    <button
      type="button"
      aria-label={running ? 'Arrêter le chronomètre' : 'Démarrer le chronomètre'}
      title={running ? 'Arrêter le chronomètre' : 'Démarrer le chronomètre'}
      onClick={() => {
        toggle(tournament, match);
      }}
      className={`inline-flex h-9 shrink-0 items-center justify-center rounded-panel border px-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${running ? 'border-warning-line bg-warning-ground text-warning' : 'border-transparent text-ink-faint hover:bg-sunken hover:text-ink'}`}
    >
      {running ? (
        <span className="font-display text-xs font-bold tabular-nums">{elapsed}</span>
      ) : (
        <IconStopwatch size={15} />
      )}
    </button>
  );
}
