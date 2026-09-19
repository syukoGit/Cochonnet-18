import { describe, expect, it } from 'vitest';
import { isValidScore, rejectionReason, TARGET } from './validity';

function reachableScores(minimumGap: number, cap: number): Set<string> {
  const required = Math.max(1, minimumGap);
  const over = (home: number, away: number) =>
    Math.max(home, away) >= TARGET && Math.abs(home - away) >= required;

  const finals = new Set<string>();
  const seen = new Set<string>();

  const play = (home: number, away: number) => {
    const key = `${home}-${away}`;

    if (seen.has(key)) {
      return;
    }

    seen.add(key);

    if (over(home, away)) {
      finals.add(key);
      return;
    }

    if (home > cap || away > cap) {
      return;
    }

    play(home + 1, away);
    play(home, away + 1);
  };

  play(0, 0);

  return finals;
}

const CAP = 40;

describe('score validity', () => {
  it('I4 — accepts exactly the scores a game can reach, for every gap from 0 to 16', () => {
    for (let minimumGap = 0; minimumGap <= 16; minimumGap += 1) {
      const reachable = reachableScores(minimumGap, CAP + 5);

      for (let home = 0; home <= CAP; home += 1) {
        for (let away = 0; away <= CAP; away += 1) {
          expect({
            minimumGap,
            score: `${home}-${away}`,
            valid: isValidScore(home, away, minimumGap),
          }).toEqual({
            minimumGap,
            score: `${home}-${away}`,
            valid: reachable.has(`${home}-${away}`),
          });
        }
      }
    }
  });

  it('a score is rejected if and only if it carries a reason', () => {
    for (let minimumGap = 0; minimumGap <= 16; minimumGap += 1) {
      for (let home = 0; home <= CAP; home += 1) {
        for (let away = 0; away <= CAP; away += 1) {
          expect(rejectionReason(home, away, minimumGap) === null).toBe(
            isValidScore(home, away, minimumGap)
          );
        }
      }
    }
  });

  it('refuses a draw whatever the gap', () => {
    expect(rejectionReason(13, 13, 0)).toBe('draw');
    expect(rejectionReason(0, 0, 2)).toBe('draw');
  });

  it('follows the table of R2.4 with no minimum gap', () => {
    expect(isValidScore(13, 12, 0)).toBe(true);
    expect(isValidScore(13, 0, 0)).toBe(true);
    expect(isValidScore(14, 12, 0)).toBe(false);
    expect(isValidScore(14, 13, 0)).toBe(false);
    expect(rejectionReason(12, 10, 0)).toBe('below-target');
    expect(rejectionReason(14, 12, 0)).toBe('ended-earlier');
  });

  it('follows the table of R2.4 with a two point gap', () => {
    expect(isValidScore(13, 12, 2)).toBe(false);
    expect(isValidScore(13, 11, 2)).toBe(true);
    expect(isValidScore(14, 12, 2)).toBe(true);
    expect(isValidScore(15, 13, 2)).toBe(true);
    expect(isValidScore(15, 12, 2)).toBe(false);
    expect(rejectionReason(13, 12, 2)).toBe('gap-too-small');
    expect(rejectionReason(15, 12, 2)).toBe('ended-earlier');
  });

  it('is symmetric in its two arguments', () => {
    for (let minimumGap = 0; minimumGap <= 4; minimumGap += 1) {
      for (let home = 0; home <= 20; home += 1) {
        for (let away = 0; away <= 20; away += 1) {
          expect(isValidScore(home, away, minimumGap)).toBe(isValidScore(away, home, minimumGap));
        }
      }
    }
  });
});
