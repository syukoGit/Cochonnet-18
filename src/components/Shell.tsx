import type { ReactNode } from 'react';

interface ShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export default function Shell({ title, subtitle, actions, footer, children }: ShellProps) {
  return (
    <div className="flex h-full flex-col bg-ground text-ink">
      <header className="flex shrink-0 items-center gap-4 border-b border-line bg-surface px-6 py-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="truncate text-sm text-ink-soft">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">{children}</main>

      {footer && (
        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-line bg-surface px-6 py-3">
          {footer}
        </footer>
      )}
    </div>
  );
}
