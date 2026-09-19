import { describe, expect, it } from 'vitest';
import { byeCredit } from './bye';

describe('bye credit', () => {
  it('credits nothing to a team that was never exempt', () => {
    expect(byeCredit({ byes: 0, played: 3, differentialFromMatches: 12 }, 'average')).toBe(0);
    expect(byeCredit({ byes: 0, played: 3, differentialFromMatches: 12 }, 'forfeit13')).toBe(0);
  });

  it('credits the team its own average, rounded', () => {
    expect(byeCredit({ byes: 1, played: 3, differentialFromMatches: 12 }, 'average')).toBe(4);
    expect(byeCredit({ byes: 1, played: 3, differentialFromMatches: 10 }, 'average')).toBe(3);
    expect(byeCredit({ byes: 1, played: 2, differentialFromMatches: -7 }, 'average')).toBe(-4);
  });

  it('rounds halves away from zero, symmetrically', () => {
    expect(byeCredit({ byes: 1, played: 2, differentialFromMatches: 7 }, 'average')).toBe(4);
    expect(byeCredit({ byes: 1, played: 2, differentialFromMatches: -7 }, 'average')).toBe(-4);
    expect(byeCredit({ byes: 1, played: 2, differentialFromMatches: 5 }, 'average')).toBe(3);
    expect(byeCredit({ byes: 1, played: 2, differentialFromMatches: -5 }, 'average')).toBe(-3);
  });

  it('credits zero when the team played nothing at all', () => {
    expect(byeCredit({ byes: 1, played: 0, differentialFromMatches: 0 }, 'average')).toBe(0);
  });

  it('honours the other two modes', () => {
    expect(byeCredit({ byes: 1, played: 3, differentialFromMatches: 12 }, 'zero')).toBe(0);
    expect(byeCredit({ byes: 1, played: 3, differentialFromMatches: 12 }, 'forfeit13')).toBe(13);
  });

  it('scales with the number of byes', () => {
    expect(byeCredit({ byes: 2, played: 2, differentialFromMatches: 6 }, 'average')).toBe(6);
    expect(byeCredit({ byes: 2, played: 2, differentialFromMatches: 6 }, 'forfeit13')).toBe(26);
  });
});
