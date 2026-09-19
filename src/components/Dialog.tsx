import * as RadixDialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  actions: ReactNode;
}

export default function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  actions,
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 bg-black/45" />
        <RadixDialog.Content className="fixed top-1/2 left-1/2 flex w-[min(32rem,calc(100vw-3rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-sheet bg-surface shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
          <div className="px-6 pt-6">
            <RadixDialog.Title className="font-display text-xl font-semibold tracking-tight">
              {title}
            </RadixDialog.Title>
            {description && (
              <RadixDialog.Description className="mt-2 text-sm leading-relaxed text-ink-soft">
                {description}
              </RadixDialog.Description>
            )}
          </div>

          {children && <div className="px-6 pt-4 pb-1">{children}</div>}

          <div className="mt-5 flex justify-end gap-2.5 border-t border-line-soft bg-ground px-6 py-3.5">
            {actions}
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
