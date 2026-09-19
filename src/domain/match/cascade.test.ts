import { describe, expect, it } from 'vitest';
import { buildBracket } from '@/domain/phase2/bracket';
import { downstreamOf, invalidatedBy } from './cascade';
import type { Match } from './types';

const eight = () => buildBracket([1, 2, 3, 4, 5, 6, 7, 8], 'main', 1);

function idsOf(matches: readonly Match[], round: number): number[] {
  return matches.filter((match) => match.round === round).map((match) => match.id);
}

describe('cascade over the outgoing links', () => {
  it('reaches the semi final, the final and the play-off from a first round match', () => {
    const matches = eight();
    const first = idsOf(matches, 1)[0] ?? 0;

    expect(downstreamOf(matches, first)).toEqual([
      ...idsOf(matches, 2).slice(0, 1),
      ...idsOf(matches, 3),
    ]);
  });

  it('reaches both the final and the play-off from a semi final', () => {
    const matches = eight();
    const semi = idsOf(matches, 2)[0] ?? 0;
    const downstream = downstreamOf(matches, semi);

    expect(downstream).toHaveLength(2);
    expect(downstream).toEqual(idsOf(matches, 3));
  });

  it('reaches nothing from the final', () => {
    const matches = eight();
    const final = idsOf(matches, 3)[0] ?? 0;

    expect(downstreamOf(matches, final)).toEqual([]);
  });

  it('never reports the match it starts from', () => {
    const matches = eight();

    for (const match of matches) {
      expect(downstreamOf(matches, match.id)).not.toContain(match.id);
    }
  });

  it('reports nothing for an unknown match', () => {
    expect(downstreamOf(eight(), 9999)).toEqual([]);
  });

  it('lists only the downstream matches that actually hold a result', () => {
    const matches = eight();
    const semi = idsOf(matches, 2)[0] ?? 0;
    const [final, playOff] = idsOf(matches, 3);

    const played = matches.map((match) =>
      match.id === final
        ? { ...match, status: 'played' as const, score: [13, 5] as [number, number] }
        : match
    );

    expect(invalidatedBy(played, semi).map((match) => match.id)).toEqual([final]);
    expect(playOff).toBeDefined();
    expect(invalidatedBy(matches, semi)).toEqual([]);
  });
});
