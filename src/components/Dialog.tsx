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
        <RadixDialog.Overlay className="fixed inset-0 bg-black/40" />
        <RadixDialog.Content className="fixed top-1/2 left-1/2 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-panel border border-line bg-surface p-5 shadow-lg">
          <RadixDialog.Title className="text-base font-semibold tracking-tight">
            {title}
          </RadixDialog.Title>
          {description && (
            <RadixDialog.Description className="mt-1 text-sm text-ink-soft">
              {description}
            </RadixDialog.Description>
          )}
          {children && <div className="mt-4">{children}</div>}
          <div className="mt-5 flex justify-end gap-2">{actions}</div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
