import { STEP_LABELS } from '@/components/labels';
import { stepsOf } from '@/domain/navigation';
import type { Step } from '@/domain/navigation';
import type { Tournament } from '@/domain/tournament/types';

interface StepNavProps {
  tournament: Tournament;
  shown: Step;
  onOpen: (step: Step) => void;
}

const STATE_CLASSES = {
  done: 'text-ink-faint',
  open: 'text-ink hover:bg-sunken',
  locked: 'text-ink-faint opacity-40',
};

export default function StepNav({ tournament, shown, onOpen }: StepNavProps) {
  return (
    <nav className="flex items-center gap-1">
      {stepsOf(tournament).map((entry) => (
        <button
          key={entry.step}
          type="button"
          disabled={entry.state !== 'open'}
          aria-current={entry.step === shown ? 'step' : undefined}
          onClick={() => {
            onOpen(entry.step);
          }}
          className={`rounded-panel px-2.5 py-1 text-sm font-medium transition-colors disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${entry.step === shown ? 'bg-accent text-accent-ink' : STATE_CLASSES[entry.state]}`}
        >
          {STEP_LABELS[entry.step]}
        </button>
      ))}
    </nav>
  );
}
