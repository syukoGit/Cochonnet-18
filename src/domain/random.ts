export type Seed = number;

export function nextSeed(seed: Seed): Seed {
  return (seed + 0x6d2b79f5) >>> 0;
}

function valueOf(seed: Seed): number {
  let mixed = seed;
  mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
  mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
  return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
}

export function shuffled<T>(items: readonly T[], seed: Seed): T[] {
  const result = [...items];
  let current = seed;

  for (let index = result.length - 1; index > 0; index -= 1) {
    current = nextSeed(current);
    const pick = Math.floor(valueOf(current) * (index + 1));
    const held = result[index];
    const chosen = result[pick];

    if (held !== undefined && chosen !== undefined) {
      result[index] = chosen;
      result[pick] = held;
    }
  }

  return result;
}
