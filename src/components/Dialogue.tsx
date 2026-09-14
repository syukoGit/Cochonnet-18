import * as Dialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';

interface DialogueProps {
  ouvert: boolean;
  surFermeture: (ouvert: boolean) => void;
  titre: string;
  description?: string;
  children?: ReactNode;
  actions: ReactNode;
}

export default function Dialogue({
  ouvert,
  surFermeture,
  titre,
  description,
  children,
  actions,
}: DialogueProps) {
  return (
    <Dialog.Root open={ouvert} onOpenChange={surFermeture}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-panneau border border-trait bg-surface p-5 shadow-lg">
          <Dialog.Title className="text-base font-semibold tracking-tight">{titre}</Dialog.Title>
          {description && (
            <Dialog.Description className="mt-1 text-sm text-encre-douce">
              {description}
            </Dialog.Description>
          )}
          {children && <div className="mt-4">{children}</div>}
          <div className="mt-5 flex justify-end gap-2">{actions}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
