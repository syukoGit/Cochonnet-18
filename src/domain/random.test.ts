import { describe, expect, it } from 'vitest';
import { shuffled } from './random';

describe('seeded shuffle', () => {
  it('keeps every item exactly once', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];

    expect([...shuffled(items, 123)].sort((a, b) => a - b)).toEqual(items);
  });

  it('never mutates its input', () => {
    const items = [1, 2, 3, 4];
    shuffled(items, 9);

    expect(items).toEqual([1, 2, 3, 4]);
  });

  it('is deterministic for a given seed', () => {
    expect(shuffled([1, 2, 3, 4, 5], 42)).toEqual(shuffled([1, 2, 3, 4, 5], 42));
  });

  it('differs across seeds', () => {
    const orders = new Set(
      Array.from({ length: 20 }, (_unused, seed) => shuffled([1, 2, 3, 4, 5, 6], seed).join(''))
    );

    expect(orders.size).toBeGreaterThan(1);
  });

  it('handles the empty and single item cases', () => {
    expect(shuffled([], 1)).toEqual([]);
    expect(shuffled(['seul'], 1)).toEqual(['seul']);
  });
});
