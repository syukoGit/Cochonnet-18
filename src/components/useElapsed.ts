import { useEffect, useState } from 'react';

function elapsedLabel(milliseconds: number): string {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function useElapsed(startedAt: number | null): string | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (startedAt === null) {
      return;
    }

    setNow(Date.now());
    const tick = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      clearInterval(tick);
    };
  }, [startedAt]);

  return startedAt === null ? null : elapsedLabel(now - startedAt);
}
