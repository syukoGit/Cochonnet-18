import { useEffect, useState } from 'react';
import { isValidScore, rejectionReason } from '@/domain/score/validity';
import type { RejectionReason, Score } from '@/domain/score/validity';

const REASON_MESSAGES: Record<RejectionReason, string> = {
  draw: 'Une partie ne peut pas finir à égalité.',
  'below-target': 'Le vainqueur doit atteindre 13.',
  'gap-too-small': "L'écart est insuffisant pour conclure.",
  'ended-earlier': 'La partie se serait arrêtée avant ce score.',
};

interface ScoreInputProps {
  score: Score | undefined;
  minimumGap: number;
  disabled?: boolean;
  onCommit: (score: Score) => void;
}

const field =
  'w-16 rounded-panel border bg-ground px-2 py-1.5 text-center tabular-nums focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:opacity-50';

export default function ScoreInput({ score, minimumGap, disabled, onCommit }: ScoreInputProps) {
  const [home, setHome] = useState(score ? String(score[0]) : '');
  const [away, setAway] = useState(score ? String(score[1]) : '');

  useEffect(() => {
    setHome(score ? String(score[0]) : '');
    setAway(score ? String(score[1]) : '');
  }, [score]);

  const both = home.trim().length > 0 && away.trim().length > 0;
  const pair: Score = [Number(home), Number(away)];
  const reason = both ? rejectionReason(pair[0], pair[1], minimumGap) : null;

  const commit = () => {
    if (both && isValidScore(pair[0], pair[1], minimumGap)) {
      onCommit(pair);
    }
  };

  const borderOf = (filled: boolean) =>
    reason !== null && filled ? 'border-warning' : 'border-line';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          inputMode="numeric"
          aria-label="Score équipe 1"
          value={home}
          disabled={disabled}
          onChange={(changeEvent) => {
            setHome(changeEvent.target.value);
          }}
          onKeyDown={(keyEvent) => {
            if (keyEvent.key === 'Enter') {
              commit();
            }
          }}
          className={`${field} ${borderOf(both)}`}
        />
        <span className="text-ink-faint">—</span>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          aria-label="Score équipe 2"
          value={away}
          disabled={disabled}
          onChange={(changeEvent) => {
            setAway(changeEvent.target.value);
          }}
          onKeyDown={(keyEvent) => {
            if (keyEvent.key === 'Enter') {
              commit();
            }
          }}
          onBlur={commit}
          className={`${field} ${borderOf(both)}`}
        />
      </div>
      {reason && <p className="text-xs text-warning">{REASON_MESSAGES[reason]}</p>}
    </div>
  );
}
