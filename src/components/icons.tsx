interface IconProps {
  size?: number;
  className?: string;
}

function frame({ size = 17, className }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 17 17',
    fill: 'none',
    className,
    'aria-hidden': true,
  } as const;
}

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export function IconBoules({ size = 26, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 26 26"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="9" cy="14" r="6.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.5" cy="16.5" r="4.4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="18" cy="7" r="2.6" className="fill-jack" />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...frame(props)}>
      <path d="m4 8.8 3.1 3.2L13 5.8" {...stroke} />
    </svg>
  );
}

export function IconLock(props: IconProps) {
  return (
    <svg {...frame(props)}>
      <rect x="4" y="7.4" width="9" height="6.6" rx="1.6" {...stroke} />
      <path d="M6.4 7.4V5.9a2.1 2.1 0 0 1 4.2 0v1.5" {...stroke} />
    </svg>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <svg {...frame(props)}>
      <path d="M8.5 3.5v10M3.5 8.5h10" {...stroke} />
    </svg>
  );
}

export function IconMinus(props: IconProps) {
  return (
    <svg {...frame(props)}>
      <path d="M3.5 8.5h10" {...stroke} />
    </svg>
  );
}

export function IconImport(props: IconProps) {
  return (
    <svg {...frame(props)}>
      <path d="M8.5 11V2.8M5.2 7.7l3.3 3.3 3.3-3.3M3 13.8h11" {...stroke} />
    </svg>
  );
}

export function IconExport(props: IconProps) {
  return (
    <svg {...frame(props)}>
      <path d="M8.5 2.8V11M5.2 6.1l3.3-3.3 3.3 3.3M3 13.8h11" {...stroke} />
    </svg>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <svg {...frame(props)}>
      <path d="M3.4 4.6h10.2M6.8 4.6V3h3.4v1.6M4.9 4.6l.7 9.1h5.8l.7-9.1" {...stroke} />
    </svg>
  );
}

export function IconBack(props: IconProps) {
  return (
    <svg {...frame(props)}>
      <path d="M10 3.6 5.1 8.5 10 13.4" {...stroke} />
    </svg>
  );
}

export function IconForward(props: IconProps) {
  return (
    <svg {...frame(props)}>
      <path d="M3 8.5h10M9 4.5l4 4-4 4" {...stroke} />
    </svg>
  );
}

export function IconWarning(props: IconProps) {
  return (
    <svg {...frame(props)}>
      <circle cx="8.5" cy="8.5" r="6.6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.5 5.1v4.1M8.5 11.7v.2" {...stroke} />
    </svg>
  );
}

export function IconRules(props: IconProps) {
  return (
    <svg {...frame(props)}>
      <path d="M3.5 4.2h10M3.5 8.5h10M3.5 12.8h6" {...stroke} />
    </svg>
  );
}

export function IconRest(props: IconProps) {
  return (
    <svg {...frame(props)}>
      <circle cx="8.5" cy="8.5" r="6.4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.6 8.5h5.8" {...stroke} />
    </svg>
  );
}
