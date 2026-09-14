import type { ReactNode } from 'react';

interface ShellProps {
  titre: string;
  sousTitre?: string;
  actions?: ReactNode;
  barre?: ReactNode;
  children: ReactNode;
}

export default function Shell({ titre, sousTitre, actions, barre, children }: ShellProps) {
  return (
    <div className="flex h-full flex-col bg-fond text-encre">
      <header className="flex shrink-0 items-center gap-4 border-b border-trait bg-surface px-6 py-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold tracking-tight">{titre}</h1>
          {sousTitre && <p className="truncate text-sm text-encre-douce">{sousTitre}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">{children}</main>

      {barre && (
        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-trait bg-surface px-6 py-3">
          {barre}
        </footer>
      )}
    </div>
  );
}
