import type { MatchId, TeamId } from '@/domain/ids';
import type { Match } from '@/domain/match/types';
import { isThirdPlace } from '@/domain/phase2/bracket';

export const CARD_WIDTH = 190;
export const CARD_HEIGHT = 68;
export const GHOST_HEIGHT = 30;
export const COLUMN_PITCH = 268;
export const ROW_PITCH = 92;
export const LABEL_BAND = 40;

export interface PlacedMatch {
  match: Match;
  x: number;
  y: number;
}

export interface PlacedSeat {
  key: string;
  team: TeamId;
  x: number;
  y: number;
}

export interface BracketLink {
  key: string;
  path: string;
  loser: boolean;
}

export interface RoundColumn {
  round: number;
  x: number;
}

export interface BracketLayout {
  width: number;
  height: number;
  lastRound: number;
  matches: PlacedMatch[];
  seats: PlacedSeat[];
  links: BracketLink[];
  columns: RoundColumn[];
  thirdPlace: PlacedMatch | null;
}

const EMPTY: BracketLayout = {
  width: 0,
  height: 0,
  lastRound: 0,
  matches: [],
  seats: [],
  links: [],
  columns: [],
  thirdPlace: null,
};

function columnX(round: number): number {
  return (round - 1) * COLUMN_PITCH;
}

function centreY(low: number, high: number): number {
  return ((low + high) / 2) * ROW_PITCH + CARD_HEIGHT / 2;
}

export function layoutBracket(matches: readonly Match[]): BracketLayout {
  const knockout = matches.filter((match) => !isThirdPlace(match));

  if (knockout.length === 0) {
    return EMPTY;
  }

  const lastRound = knockout.reduce((highest, match) => Math.max(highest, match.round), 1);
  const finalMatch = knockout.find((match) => match.round === lastRound);

  if (!finalMatch) {
    return EMPTY;
  }

  const byId = new Map<MatchId, Match>(knockout.map((match) => [match.id, match]));
  const placed: PlacedMatch[] = [];
  const seats: PlacedSeat[] = [];
  const centres = new Map<MatchId, number>();

  const place = (match: Match, low: number, high: number): void => {
    const centre = centreY(low, high);
    centres.set(match.id, centre);
    placed.push({ match, x: columnX(match.round), y: centre - CARD_HEIGHT / 2 });

    const size = high - low + 1;

    if (size < 2) {
      return;
    }

    const half = size / 2;

    match.slots.forEach((slot, index) => {
      const childLow = index === 0 ? low : low + half;
      const childHigh = index === 0 ? low + half - 1 : high;

      if (slot.kind === 'winner') {
        const child = byId.get(slot.from);

        if (child) {
          place(child, childLow, childHigh);
        }

        return;
      }

      if (slot.kind === 'team') {
        seats.push({
          key: `${match.id}-${index}`,
          team: slot.team,
          x: columnX(match.round - 1),
          y: centreY(childLow, childHigh) - GHOST_HEIGHT / 2,
        });
      }
    });
  };

  const leaves = 2 ** (lastRound - 1);
  place(finalMatch, 0, leaves - 1);

  const finalCentre = centres.get(finalMatch.id) ?? centreY(0, leaves - 1);
  const thirdPlaceMatch = matches.find(isThirdPlace) ?? null;

  const thirdPlace =
    thirdPlaceMatch && lastRound >= 2
      ? {
          match: thirdPlaceMatch,
          x: columnX(lastRound - 1),
          y: finalCentre - CARD_HEIGHT / 2,
        }
      : null;

  const links: BracketLink[] = [];

  for (const { match } of placed) {
    const from = centres.get(match.id);

    if (from === undefined) {
      continue;
    }

    const feed = match.feeds;

    if (feed) {
      const parent = byId.get(feed.match);
      const to = centres.get(feed.match);

      if (parent && to !== undefined) {
        const start = columnX(match.round) + CARD_WIDTH;
        const end = columnX(parent.round);
        const elbow = Math.round((start + end) / 2);

        links.push({
          key: `winner-${match.id}`,
          loser: false,
          path: `M ${start} ${from} H ${elbow} V ${to} H ${end}`,
        });
      }
    }

    const consolation = match.feedsConsolation;

    if (consolation && consolation.match === thirdPlace?.match.id) {
      const above = from < finalCentre;
      const lane = columnX(match.round) + (above ? 46 : CARD_WIDTH - 46);
      const start = above ? from + CARD_HEIGHT / 2 : from - CARD_HEIGHT / 2;
      const end = above ? finalCentre - CARD_HEIGHT / 2 : finalCentre + CARD_HEIGHT / 2;

      links.push({
        key: `loser-${match.id}`,
        loser: true,
        path: `M ${lane} ${start} V ${end}`,
      });
    }
  }

  const columns: RoundColumn[] = [];

  for (let round = 1; round <= lastRound; round += 1) {
    columns.push({ round, x: columnX(round) });
  }

  return {
    width: columnX(lastRound) + CARD_WIDTH,
    height: (leaves - 1) * ROW_PITCH + CARD_HEIGHT,
    lastRound,
    matches: placed,
    seats,
    links,
    columns,
    thirdPlace,
  };
}
