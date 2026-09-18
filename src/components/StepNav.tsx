import { IconCheck, IconLock } from '@/components/icons';
import { STEP_LABELS } from '@/components/labels';
import { stepsOf } from '@/domain/navigation';
import type { Step, StepState } from '@/domain/navigation';
import type { Tournament } from '@/domain/tournament/types';

const ROW =
  'flex min-h-[46px] w-full items-center gap-3 rounded-panel px-3 text-left text-[15px] font-medium transition-colors disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const BADGE =
  'flex size-6 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold';

function rowClass(state: StepState, current: boolean): string {
  if (current) {
    return `${ROW} bg-accent text-accent-ink`;
  }

  if (state === 'done') {
    return `${ROW} text-rail-soft`;
  }

  if (state === 'open') {
    return `${ROW} text-rail-ink hover:bg-rail-raised`;
  }

  return `${ROW} text-rail-faint`;
}

function badgeClass(state: StepState, current: boolean): string {
  if (current) {
    return `${BADGE} bg-white/25 text-accent-ink`;
  }

  if (state === 'done') {
    return `${BADGE} bg-success text-rail-ink`;
  }

  return `${BADGE} border border-rail-line text-rail-faint`;
}

interface StepNavProps {
  tournament: Tournament;
  shown: Step;
  onOpen: (step: Step) => void;
}

export default function StepNav({ tournament, shown, onOpen }: StepNavProps) {
  return (
    <nav aria-label="Étapes du tournoi" className="flex flex-col gap-0.5">
      {stepsOf(tournament).map((entry, index) => {
        const current = entry.step === shown;

        return (
          <button
            key={entry.step}
            type="button"
            disabled={entry.state !== 'open'}
            aria-current={current ? 'step' : undefined}
            onClick={() => {
              onOpen(entry.step);
            }}
            className={rowClass(entry.state, current)}
          >
            <span className={badgeClass(entry.state, current)}>
              {entry.state === 'done' && !current ? (
                <IconCheck size={13} />
              ) : entry.state === 'locked' ? (
                <IconLock size={12} />
              ) : (
                index + 1
              )}
            </span>
            {STEP_LABELS[entry.step]}
          </button>
        );
      })}
    </nav>
  );
}
