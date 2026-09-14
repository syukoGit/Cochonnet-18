import type { ButtonHTMLAttributes } from 'react';

type Ton = 'principal' | 'discret' | 'danger';

const styles: Record<Ton, string> = {
  principal: 'bg-accent text-accent-contraste hover:opacity-90',
  discret: 'bg-creux text-encre hover:bg-trait-doux',
  danger: 'bg-transparent text-accent hover:bg-creux',
};

interface BoutonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ton?: Ton;
}

export default function Bouton({ ton = 'discret', className = '', ...reste }: BoutonProps) {
  return (
    <button
      className={`rounded-panneau px-3 py-1.5 text-sm font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${styles[ton]} ${className}`}
      {...reste}
    />
  );
}
