export const TARGET = 13;

export type Score = [number, number];

export type RejectionReason = 'draw' | 'below-target' | 'gap-too-small' | 'ended-earlier';

function requiredGap(minimumGap: number): number {
  return Math.max(1, Math.trunc(minimumGap));
}

export function isValidScore(home: number, away: number, minimumGap: number): boolean {
  if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0) {
    return false;
  }

  if (home === away) {
    return false;
  }

  const gap = requiredGap(minimumGap);
  const winner = Math.max(home, away);
  const loser = Math.min(home, away);

  if (winner === TARGET) {
    return loser <= TARGET - gap;
  }

  return gap >= 2 && winner > TARGET && winner - loser === gap;
}

export function rejectionReason(
  home: number,
  away: number,
  minimumGap: number
): RejectionReason | null {
  if (isValidScore(home, away, minimumGap)) {
    return null;
  }

  if (home === away) {
    return 'draw';
  }

  const gap = requiredGap(minimumGap);
  const winner = Math.max(home, away);
  const loser = Math.min(home, away);

  if (winner < TARGET) {
    return 'below-target';
  }

  return winner - loser < gap ? 'gap-too-small' : 'ended-earlier';
}

export function winnerIndex(score: Score): 0 | 1 {
  return score[0] > score[1] ? 0 : 1;
}

export function differential(score: Score): number {
  return Math.abs(score[0] - score[1]);
}
