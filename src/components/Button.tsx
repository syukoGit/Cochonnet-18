import type { ButtonHTMLAttributes } from 'react';

type Tone = 'primary' | 'quiet' | 'danger';

const tones: Record<Tone, string> = {
  primary: 'bg-accent text-accent-ink hover:opacity-90',
  quiet: 'bg-sunken text-ink hover:bg-line-soft',
  danger: 'bg-transparent text-accent hover:bg-sunken',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
}

export default function Button({ tone = 'quiet', className = '', ...rest }: ButtonProps) {
  return (
    <button
      className={`rounded-panel px-3 py-1.5 text-sm font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${tones[tone]} ${className}`}
      {...rest}
    />
  );
}
