import { useEffect, useState } from 'react';
import { isValidScore, rejectionReason } from '@/domain/score/validity';
import type { RejectionReason, Score } from '@/domain/score/validity';

const REASON_MESSAGES: Record<RejectionReason, string> = {
  draw: 'Une partie ne peut pas finir à égalité.',
  'below-target': 'Le vainqueur doit atteindre 13.',
  'gap-too-small': "L'écart est insuffisant pour conclure.",
  'ended-earlier': 'La partie se serait arrêtée avant ce score.',
};

const FIELD =
  'h-11 w-14 rounded-panel border text-center font-display text-[22px] font-bold tabular-nums transition-colors focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:opacity-50';

interface ScoreInputProps {
  score: Score | undefined;
  minimumGap: number;
  disabled?: boolean;
  onCommit: (score: Score) => void;
}

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

  const fieldClass = (value: string) => {
    if (reason !== null && both) {
      return `${FIELD} border-warning bg-warning-ground text-warning`;
    }

    if (value.trim().length === 0) {
      return `${FIELD} border-dashed border-line bg-surface text-ink-faint`;
    }

    return `${FIELD} border-line bg-sunken text-ink`;
  };

  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5">
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
          className={fieldClass(home)}
        />
        <span className="h-0.5 w-2.5 rounded-full bg-line" />
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
          className={fieldClass(away)}
        />
      </div>
      {reason && (
        <p className="max-w-54 text-center text-xs leading-snug text-balance text-warning">
          {REASON_MESSAGES[reason]}
        </p>
      )}
    </div>
  );
}
