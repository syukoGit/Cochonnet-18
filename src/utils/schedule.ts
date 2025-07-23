export interface Match {
  teamA: string;
  teamB: string;
  scoreA?: number;
  scoreB?: number;
}

export type Round = Match[];

// Fisher-Yates shuffle
function shuffle<T>(array: T[]): T[] {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateRounds(teams: string[], roundsCount: number): Round[] | null {
  if (teams.length < 2) {
    return null;
  }
  const teamList = shuffle(teams);
  const n = teamList.length;
  const maxRounds = n - 1;
  if (roundsCount > maxRounds) {
    return null;
  }

  const list = teamList.slice();
  const rounds: Round[] = [];
  for (let r = 0; r < roundsCount; r++) {
    const round: Round = [];
    for (let i = 0; i < Math.floor(n / 2); i++) {
      const teamA = list[i];
      const teamB = list[n - 1 - i];
      round.push({ teamA, teamB });
    }
    rounds.push(round);
    // rotate except first team
    const last = list.pop()!;
    list.splice(1, 0, last);
  }
  return rounds;
}
