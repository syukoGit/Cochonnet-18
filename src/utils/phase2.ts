export interface BracketMatch {
  teamA?: string;
  teamB?: string;
  scoreA?: number;
  scoreB?: number;
  winner?: string;
}

export type BracketRound = BracketMatch[];

export function splitPhase2Groups(
  teams: string[]
): { winners: string[]; consolation: string[] } {
  const n = teams.length;
  if (n === 0) return { winners: [], consolation: [] };

  let winnersCount: number;
  let consolationCount: number;

  if (n % 2 === 1) {
    winnersCount = Math.ceil(n / 2);
    consolationCount = n - winnersCount;
  } else {
    winnersCount = n / 2;
    consolationCount = n / 2;
    if (n % 4 !== 0) {
      winnersCount += 1;
      consolationCount -= 1;
    }
  }

  const winners = teams.slice(0, winnersCount);
  const consolation = teams.slice(winnersCount, winnersCount + consolationCount);
  return { winners, consolation };
}

export function generateBracket(teams: string[]): BracketRound[] {
  let current = teams.slice();
  const rounds: BracketRound[] = [];
  while (current.length > 1) {
    const round: BracketMatch[] = [];
    const next: string[] = [];
    for (let i = 0; i < current.length; i += 2) {
      const teamA = current[i];
      const teamB = current[i + 1];
      const match: BracketMatch = { teamA, teamB };
      if (!teamB) {
        match.winner = teamA;
        next.push(teamA);
      } else {
        next.push('');
      }
      round.push(match);
    }
    rounds.push(round);
    current = next;
  }
  return rounds;
}
