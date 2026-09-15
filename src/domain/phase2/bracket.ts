import type { MatchId, TeamId } from '@/domain/ids';
import type { Match, MatchPhase, Slot } from '@/domain/match/types';

export type Seat = TeamId | null;

export interface BracketShape {
  size: number;
  depth: number;
  byes: number;
}

export function bracketShape(teamCount: number): BracketShape {
  if (teamCount < 2) {
    return { size: teamCount, depth: 0, byes: 0 };
  }

  const depth = Math.ceil(Math.log2(teamCount));
  const size = 2 ** depth;

  return { size, depth, byes: size - teamCount };
}

export function firstRoundPairs(size: number): number {
  return size / 2;
}

export function buildBracket(seats: readonly Seat[], phase: MatchPhase, firstId: MatchId): Match[] {
  const teams = seats.filter((seat): seat is TeamId => seat !== null);

  if (teams.length < 2) {
    return [];
  }

  const matches: Match[] = [];
  let nextId = firstId;

  const add = (round: number, slots: [Slot, Slot]): MatchId => {
    const id = nextId++;
    matches.push({ id, phase, round, slots, status: 'waiting' });
    return id;
  };

  let incoming: Slot[] = [];

  for (let pair = 0; pair < seats.length / 2; pair += 1) {
    const home = seats[pair * 2] ?? null;
    const away = seats[pair * 2 + 1] ?? null;

    if (home !== null && away !== null) {
      const id = add(1, [
        { kind: 'team', team: home },
        { kind: 'team', team: away },
      ]);
      incoming.push({ kind: 'winner', from: id });
    } else {
      const surviving = home ?? away;
      incoming.push(surviving === null ? { kind: 'bye' } : { kind: 'team', team: surviving });
    }
  }

  let round = 2;

  while (incoming.length > 1) {
    const next: Slot[] = [];

    for (let pair = 0; pair < incoming.length / 2; pair += 1) {
      const home = incoming[pair * 2];
      const away = incoming[pair * 2 + 1];

      if (!home || !away) {
        continue;
      }

      const id = add(round, [home, away]);
      next.push({ kind: 'winner', from: id });
    }

    incoming = next;
    round += 1;
  }

  linkFeeds(matches);
  addThirdPlace(matches, phase, () => nextId++);

  return matches;
}

function linkFeeds(matches: Match[]): void {
  for (const match of matches) {
    match.slots.forEach((slot, index) => {
      if (slot.kind !== 'winner') {
        return;
      }

      const source = matches.find((candidate) => candidate.id === slot.from);

      if (source) {
        source.feeds = { match: match.id, slot: index === 0 ? 0 : 1 };
      }
    });
  }
}

function addThirdPlace(matches: Match[], phase: MatchPhase, takeId: () => MatchId): void {
  const finalRound = Math.max(...matches.map((match) => match.round));
  const semiFinals = matches.filter((match) => match.round === finalRound - 1);

  if (semiFinals.length !== 2) {
    return;
  }

  const [first, second] = semiFinals;

  if (!first || !second) {
    return;
  }

  const id = takeId();

  matches.push({
    id,
    phase,
    round: finalRound,
    slots: [
      { kind: 'loser', from: first.id },
      { kind: 'loser', from: second.id },
    ],
    status: 'waiting',
  });

  first.feedsConsolation = { match: id, slot: 0 };
  second.feedsConsolation = { match: id, slot: 1 };
}

export function isThirdPlace(match: Match): boolean {
  return match.slots.every((slot) => slot.kind === 'loser');
}
