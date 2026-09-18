import type { ReactNode } from 'react';

interface ShellProps {
  rail?: ReactNode;
  eyebrow?: string;
  eyebrowTone?: 'warning' | 'success';
  title: string;
  lead?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  fill?: boolean;
  children: ReactNode;
}

export default function Shell({
  rail,
  eyebrow,
  eyebrowTone = 'warning',
  title,
  lead,
  actions,
  footer,
  fill = false,
  children,
}: ShellProps) {
  return (
    <div className="flex h-full bg-ground text-ink">
      {rail}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-end gap-5 border-b border-line px-9 pt-7 pb-4">
          <div className="min-w-0 flex-1">
            {eyebrow && (
              <p
                className={`mb-1 font-display text-xs font-semibold tracking-[0.12em] uppercase ${eyebrowTone === 'success' ? 'text-success' : 'text-warning'}`}
              >
                {eyebrow}
              </p>
            )}
            <h1 className="truncate font-display text-3xl font-semibold tracking-tight">{title}</h1>
          </div>
          {lead && (
            <p className="hidden max-w-[352px] shrink-0 text-right text-[13.5px] leading-relaxed text-ink-soft xl:block">
              {lead}
            </p>
          )}
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>

        <main
          className={
            fill
              ? 'flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-9 py-4'
              : 'min-h-0 flex-1 overflow-y-auto px-9 py-6'
          }
        >
          {children}
        </main>

        {footer && (
          <footer className="flex shrink-0 items-center gap-3 border-t border-line bg-surface px-9 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
