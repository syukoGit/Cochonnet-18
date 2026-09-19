import type { TeamId } from '@/domain/ids';

interface TeamNumberProps {
  team: TeamId;
  compact?: boolean;
}

export default function TeamNumber({ team, compact = false }: TeamNumberProps) {
  return (
    <span
      aria-label={`Équipe numéro ${team}`}
      className={`shrink-0 rounded bg-sunken px-1.5 py-0.5 font-mono tabular-nums text-ink-faint ${compact ? 'text-[10px]' : 'text-[11px]'}`}
    >
      {team}
    </span>
  );
}
