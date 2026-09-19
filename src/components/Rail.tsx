import type { ReactNode } from 'react';
import { IconBack } from '@/components/icons';

interface RailProps {
  children: ReactNode;
}

export default function Rail({ children }: RailProps) {
  return (
    <aside className="flex w-[268px] shrink-0 flex-col gap-6 bg-rail px-5 py-6 text-rail-ink">
      {children}
    </aside>
  );
}

export function RailBrand() {
  return (
    <div className="flex items-center gap-2.5 text-rail-soft">
      <img
        src="./logo-without-background.png"
        alt=""
        aria-hidden
        className="size-9 shrink-0 object-contain"
      />
      <span className="font-display text-xs font-bold tracking-[0.15em] text-rail-faint uppercase">
        Cochonnet 18
      </span>
    </div>
  );
}

interface RailTitleProps {
  name: string;
  meta: string;
}

export function RailTitle({ name, meta }: RailTitleProps) {
  return (
    <div className="min-w-0">
      <p className="font-display text-xl leading-tight font-semibold break-words">{name}</p>
      <p className="mt-1.5 text-[13px] text-rail-faint">{meta}</p>
    </div>
  );
}

interface RailNoteProps {
  title: string;
  children: ReactNode;
}

export function RailNote({ title, children }: RailNoteProps) {
  return (
    <div className="rounded-card bg-rail-raised p-3.5">
      <p className="mb-2 text-xs font-semibold tracking-[0.08em] text-rail-faint uppercase">
        {title}
      </p>
      {children}
    </div>
  );
}

interface RailBackProps {
  onClick: () => void;
}

export function RailBack({ onClick }: RailBackProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-auto flex min-h-11 items-center gap-2 rounded-panel text-sm text-rail-soft transition-colors hover:text-rail-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <IconBack size={16} />
      Tous les tournois
    </button>
  );
}
