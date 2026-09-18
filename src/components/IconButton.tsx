import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Tone = 'neutral' | 'danger' | 'ghost';

const tones: Record<Tone, string> = {
  neutral: 'border border-line bg-surface text-ink-soft hover:bg-sunken hover:text-ink',
  danger: 'border border-line bg-surface text-accent hover:bg-accent-ground',
  ghost: 'border border-transparent bg-transparent text-ink-faint hover:bg-sunken hover:text-ink',
};

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  label: string;
  children: ReactNode;
}

export default function IconButton({
  tone = 'neutral',
  label,
  className = '',
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-panel transition-colors disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${tones[tone]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
