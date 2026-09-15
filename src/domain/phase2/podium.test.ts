import { describe, expect, it } from 'vitest';
import type { TeamId } from '@/domain/ids';
import { enterScore } from '@/domain/match/entry';
import { phaseMatches } from '@/domain/match/types';
import type { Match } from '@/domain/match/types';
import { addTeam } from '@/domain/tournament/teams';
import { createTournament } from '@/domain/tournament/tournament';
import type { Tournament } from '@/domain/tournament/types';
import { isThirdPlace } from './bracket';
import { bracketComplete, groupOf, podiumOf, resultsReady } from './podium';
import { drawBrackets } from './start';

const t0 = '2026-09-15T09:00:00.000Z';
const t1 = '2026-09-15T10:00:00.000Z';

function qualification(id: number, home: TeamId, away: TeamId, score: [number, number]): Match {
  return {
    id,
    phase: 'phase1',
    round: 1,
    slots: [
      { kind: 'team', team: home },
      { kind: 'team', team: away },
    ],
    status: 'played',
    score,
  };
}

function closed(teamCount: number, matches: Match[]): Tournament {
  const base = Array.from({ length: teamCount }, (_unused, index) => `Equipe ${index + 1}`).reduce(
    (current, name) => addTeam(current, name, t0),
    createTournament('t1', 'Tournoi', t0)
  );

  return { ...base, phase: 'closing', matchCount: 1, matches };
}

function playEveryBracketMatch(tournament: Tournament): Tournament {
  return tournament.matches
    .filter((match) => match.phase !== 'phase1')
    .reduce((current, match) => enterScore(current, match.id, [13, 5], t1), tournament);
}

const eightTeams = () =>
  drawBrackets(
    closed(8, [
      qualification(1, 1, 2, [13, 1]),
      qualification(2, 3, 4, [13, 2]),
      qualification(3, 5, 6, [13, 3]),
      qualification(4, 7, 8, [13, 4]),
    ]),
    42,
    t1
  );

const sixTeams = () =>
  drawBrackets(
    closed(6, [
      qualification(1, 1, 2, [13, 1]),
      qualification(2, 3, 4, [13, 2]),
      qualification(3, 5, 6, [13, 3]),
    ]),
    42,
    t1
  );

const threeTeams = () => drawBrackets(closed(3, [qualification(1, 1, 2, [13, 1])]), 42, t1);

describe('the podium of a bracket', () => {
  it('has nobody while the final is unplayed', () => {
    expect(podiumOf(eightTeams(), 'main')).toEqual({ first: null, second: null, third: null });
    expect(bracketComplete(eightTeams(), 'main')).toBe(false);
    expect(resultsReady(eightTeams())).toBe(false);
  });

  it('R4.13 — the winner of the final is first, the loser second', () => {
    const played = playEveryBracketMatch(eightTeams());
    const podium = podiumOf(played, 'main');
    const final = phaseMatches(played.matches, 'main')
      .filter((match) => !isThirdPlace(match))
      .at(-1);

    expect(final?.status).toBe('played');
    expect(podium.first).not.toBeNull();
    expect(podium.second).not.toBeNull();
    expect(podium.first).not.toBe(podium.second);
  });

  it('R4.14 — the third place comes from the play-off when there is one', () => {
    const played = playEveryBracketMatch(eightTeams());
    const playOff = phaseMatches(played.matches, 'main').find(isThirdPlace);
    const podium = podiumOf(played, 'main');

    expect(playOff).toBeDefined();
    expect(podium.third).not.toBeNull();
    expect([podium.first, podium.second]).not.toContain(podium.third);
  });

  it('R4.15 — a group of three has no play-off and the semi final loser is third', () => {
    const drawn = sixTeams();

    expect(groupOf(drawn, 'main')).toHaveLength(3);
    expect(phaseMatches(drawn.matches, 'main').find(isThirdPlace)).toBeUndefined();

    const played = playEveryBracketMatch(drawn);
    const podium = podiumOf(played, 'main');

    expect(podium.first).not.toBeNull();
    expect(podium.second).not.toBeNull();
    expect(podium.third).not.toBeNull();
    expect(new Set([podium.first, podium.second, podium.third]).size).toBe(3);
  });

  it('R4.15 — a group of one crowns its team outright, with no second or third', () => {
    const drawn = threeTeams();

    expect(groupOf(drawn, 'consolation')).toHaveLength(1);
    expect(podiumOf(drawn, 'consolation')).toEqual({ first: 2, second: null, third: null });
    expect(bracketComplete(drawn, 'consolation')).toBe(true);
  });

  it('R4.15 — a group of two has a final and no third place', () => {
    const played = playEveryBracketMatch(threeTeams());
    const podium = podiumOf(played, 'main');

    expect(groupOf(played, 'main')).toHaveLength(2);
    expect(podium.first).not.toBeNull();
    expect(podium.second).not.toBeNull();
    expect(podium.third).toBeNull();
  });

  it('R4.15 — an empty group blocks nothing', () => {
    const empty = { ...threeTeams(), withdrawn: [1, 2, 3] };

    expect(groupOf(empty, 'main')).toEqual([]);
    expect(podiumOf(empty, 'main')).toEqual({ first: null, second: null, third: null });
    expect(bracketComplete(empty, 'main')).toBe(true);
  });

  it('R4.16 — the results wait for every existing bracket to name its winner', () => {
    const drawn = threeTeams();

    expect(bracketComplete(drawn, 'consolation')).toBe(true);
    expect(bracketComplete(drawn, 'main')).toBe(false);
    expect(resultsReady(drawn)).toBe(false);

    const played = playEveryBracketMatch(drawn);

    expect(resultsReady(played)).toBe(true);
  });

  it('loses the podium again when the final is unlocked', () => {
    const played = playEveryBracketMatch(eightTeams());
    const first = phaseMatches(played.matches, 'main')[0];
    const reopened = enterScore(played, first?.id ?? 0, [5, 13], t1);

    expect(resultsReady(played)).toBe(true);
    expect(resultsReady(reopened)).toBe(false);
    expect(podiumOf(reopened, 'main').first).toBeNull();
  });
});
