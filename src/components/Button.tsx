import type { ButtonHTMLAttributes } from 'react';

type Tone = 'primary' | 'secondary' | 'quiet' | 'danger' | 'rail';

const tones: Record<Tone, string> = {
  primary: 'border border-transparent bg-accent text-accent-ink hover:brightness-110',
  secondary: 'border border-line bg-surface text-ink hover:bg-sunken',
  quiet: 'border border-transparent bg-transparent text-ink-soft hover:bg-sunken',
  danger: 'border border-transparent bg-transparent text-accent hover:bg-accent-ground',
  rail: 'border border-rail-line bg-transparent text-rail-ink hover:bg-rail-raised',
};

const BUTTON_BASE =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-panel px-4 text-[14.5px] font-medium transition-colors disabled:cursor-not-allowed disabled:border-transparent disabled:bg-sunken disabled:text-ink-faint disabled:hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
}

export default function Button({ tone = 'secondary', className = '', ...rest }: ButtonProps) {
  return (
    <button type="button" className={`${BUTTON_BASE} ${tones[tone]} ${className}`} {...rest} />
  );
}
