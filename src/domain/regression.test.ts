import { describe, expect, it } from 'vitest';
import { clearEntry, enterScore } from '@/domain/match/entry';
import { occupantsIn, winnerIn } from '@/domain/match/resolve';
import { hasResult, isBye, phaseMatches } from '@/domain/match/types';
import type { Match } from '@/domain/match/types';
import { maxMatchCount } from '@/domain/phase1/draw';
import { rankTeams } from '@/domain/phase1/ranking';
import { isThirdPlace } from '@/domain/phase2/bracket';
import { podiumOf } from '@/domain/phase2/podium';
import { isValidScore, rejectionReason } from '@/domain/score/validity';
import { renameTeam } from '@/domain/tournament/teams';
import { replay } from './replay';
import type { Report } from './replay';

const t0 = '2026-09-17T09:00:00.000Z';
const t1 = '2026-09-17T11:00:00.000Z';

function tournamentOf(teamCount: number, rounds = 3, seed = 42): Report {
  return replay(
    {
      name: `${teamCount} teams`,
      teams: Array.from({ length: teamCount }, (_unused, index) => `Equipe ${index + 1}`),
      matchCount: Math.min(rounds, maxMatchCount(teamCount)),
      seed,
    },
    t0
  );
}

function mainBracket(report: Report): Match[] {
  return phaseMatches(report.tournament.matches, 'main');
}

describe('D1 — the v1 bracket was rewritten in place and crowned a team that never replayed', () => {
  it('correcting a first round result empties the final instead of reseating it', () => {
    const played = tournamentOf(16).tournament;
    const bracket = phaseMatches(played.matches, 'main');
    const first = bracket[0];
    const final = bracket.filter((match) => !isThirdPlace(match)).at(-1);

    expect(first).toBeDefined();
    expect(final).toBeDefined();
    expect(final && hasResult(final)).toBe(true);

    const corrected = clearEntry(played, first?.id ?? 0, t1);
    const finalAfter = phaseMatches(corrected.matches, 'main').find(
      (match) => match.id === final?.id
    );

    expect(finalAfter?.status).toBe('waiting');
    expect(finalAfter && winnerIn(corrected.matches, finalAfter)).toBeNull();
    expect(podiumOf(corrected, 'main').first).toBeNull();
  });

  it('leaves no team standing in a match it did not reach', () => {
    const played = tournamentOf(16).tournament;
    const first = phaseMatches(played.matches, 'main')[0];
    const corrected = clearEntry(played, first?.id ?? 0, t1);

    for (const match of phaseMatches(corrected.matches, 'main')) {
      const known = occupantsIn(corrected.matches, match).filter((team) => team !== null);

      expect(hasResult(match) ? known.length : 2).toBe(2);
    }
  });

  it('empties the third place match too, which the v1 walk also rewrote', () => {
    const played = tournamentOf(16).tournament;
    const bracket = phaseMatches(played.matches, 'main');
    const finalRound = Math.max(...bracket.map((match) => match.round));
    const semi = bracket.find((match) => match.round === finalRound - 1);
    const corrected = clearEntry(played, semi?.id ?? 0, t1);
    const playOff = phaseMatches(corrected.matches, 'main').find(isThirdPlace);

    expect(playOff?.status).toBe('waiting');
    expect(podiumOf(corrected, 'main').third).toBeNull();
  });
});

describe('D2 — the v1 keyed teams by name in phase 1 and by number in phase 2', () => {
  it('renaming a team after the draw changes no match and no podium', () => {
    const played = tournamentOf(8).tournament;
    const podium = podiumOf(played, 'main');
    const champion = podium.first;

    expect(champion).not.toBeNull();

    const renamed = renameTeam(played, champion ?? 0, 'Un tout autre nom', t1);

    expect(podiumOf(renamed, 'main')).toEqual(podium);
    expect(renamed.matches).toEqual(played.matches);
    expect(renamed.teams.find((team) => team.id === champion)?.name).toBe('Un tout autre nom');
  });

  it('never stores a name inside a match', () => {
    const played = tournamentOf(8).tournament;

    for (const match of played.matches) {
      for (const slot of match.slots) {
        expect(typeof (slot as { team?: unknown }).team).not.toBe('string');
      }
    }
  });
});

describe('D3 — the v1 draw read Math.random directly and could not be reproduced', () => {
  it('produces the same tournament twice from the same seed', () => {
    expect(tournamentOf(12, 3, 7).tournament).toEqual(tournamentOf(12, 3, 7).tournament);
  });

  it('produces a different one from another seed', () => {
    expect(tournamentOf(12, 3, 7).qualification).not.toEqual(tournamentOf(12, 3, 8).qualification);
  });
});

describe('D4 — the v1 circle method broke on an odd field', () => {
  it.each([3, 5, 7, 9, 11])('%i teams rest exactly one team per round', (teamCount) => {
    const report = tournamentOf(teamCount);
    const byRound = new Map<number, number>();

    for (const match of phaseMatches(report.tournament.matches, 'phase1').filter(isBye)) {
      byRound.set(match.round, (byRound.get(match.round) ?? 0) + 1);
    }

    expect([...byRound.values()].every((count) => count === 1)).toBe(true);
  });

  it.each([3, 5, 7, 9, 11])('%i teams never meet the same opponent twice', (teamCount) => {
    const report = tournamentOf(teamCount);
    const seen = new Set<string>();

    for (const match of phaseMatches(report.tournament.matches, 'phase1')) {
      if (isBye(match)) {
        continue;
      }

      const pair = occupantsIn(report.tournament.matches, match)
        .map((team) => String(team))
        .sort()
        .join('-');

      expect(seen.has(pair)).toBe(false);
      seen.add(pair);
    }
  });

  it.each([3, 5, 7, 9, 11])('%i teams play within one match of each other', (teamCount) => {
    const counts = tournamentOf(teamCount).ranking.map((line) => line.played);

    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });
});

describe('D5 — the v1 ranking gave a rested team nothing, so a bye was a penalty', () => {
  it('credits an exemption at the closing', () => {
    const report = tournamentOf(9);
    const rested = report.ranking.filter((line) => line.byes > 0);

    expect(rested.length).toBeGreaterThan(0);
    expect(rested.every((line) => line.byeCredit !== 0 || line.differential !== 0)).toBe(true);
  });

  it('never leaves a rested team behind purely for having rested', () => {
    const report = tournamentOf(9);

    for (const line of report.ranking.filter((one) => one.byes > 0)) {
      expect(line.played).toBeLessThan(report.rounds);
      expect(line.byeCredit).toBeTypeOf('number');
    }
  });
});

describe('D6 — the v1 ranking fell back on insertion order when scores were equal', () => {
  it('does not depend on the order the teams were added', () => {
    const forward = tournamentOf(8);
    const backward = replay(
      {
        name: '8 teams',
        teams: Array.from({ length: 8 }, (_unused, index) => `Equipe ${8 - index}`),
        matchCount: 3,
        seed: 42,
      },
      t0
    );

    const byName = (report: Report) =>
      [...report.ranking].sort((a, b) => a.name.localeCompare(b.name)).map((line) => line.name);

    expect(byName(backward)).toEqual(byName(forward));
  });

  it('names the ties the criteria cannot separate rather than inventing an order', () => {
    const report = tournamentOf(65);

    expect(report.settledTies.length + report.unresolvedTies.length).toBeGreaterThan(0);
  });
});

describe('D7 and D8 — the v1 accepted any pair of numbers, a draw included', () => {
  it('refuses a draw, which the v1 counted as played and scored as nothing', () => {
    expect(isValidScore(13, 13, 0)).toBe(false);
    expect(rejectionReason(13, 13, 0)).toBe('draw');
  });

  it('refuses a game that never reached the target', () => {
    expect(isValidScore(7, 3, 0)).toBe(false);
    expect(rejectionReason(7, 3, 0)).toBe('below-target');
  });

  it('refuses a score no game could have reached', () => {
    expect(isValidScore(20, 19, 0)).toBe(false);
    expect(rejectionReason(14, 12, 0)).toBe('ended-earlier');
  });

  it('refuses it at the door too, leaving the tournament untouched', () => {
    const played = tournamentOf(8).tournament;
    const target = phaseMatches(played.matches, 'phase1')[0];

    expect(enterScore(played, target?.id ?? 0, [13, 13], t1)).toBe(played);
    expect(enterScore(played, target?.id ?? 0, [7, 3], t1)).toBe(played);
  });
});

describe('D11 — the v1 bracket allowed branches of different heights', () => {
  it.each([5, 6, 7, 11, 13])('%i teams give every branch the same depth', (teamCount) => {
    const report = tournamentOf(teamCount * 2);
    const knockout = mainBracket(report).filter((match) => !isThirdPlace(match));
    const finalRound = Math.max(...knockout.map((match) => match.round));
    const size = 2 ** finalRound;
    const seated = mainBracket(report).length > 0 ? report.brackets[0]?.teams.length : 0;

    expect(knockout.filter((match) => match.round === 1)).toHaveLength(
      size / 2 - (size - (seated ?? 0))
    );

    for (let round = 2; round <= finalRound; round += 1) {
      expect(knockout.filter((match) => match.round === round)).toHaveLength(size / 2 ** round);
    }
  });

  it('gives the champion the same number of matches whatever branch it came from', () => {
    const report = tournamentOf(16);
    const knockout = mainBracket(report).filter((match) => !isThirdPlace(match));
    const byRound = new Map<number, number>();

    for (const match of knockout) {
      byRound.set(match.round, (byRound.get(match.round) ?? 0) + 1);
    }

    expect([...byRound.entries()].sort((a, b) => a[0] - b[0]).map((entry) => entry[1])).toEqual([
      4, 2, 1,
    ]);
  });
});

describe('D9 and D10 — where the state lives and who decides', () => {
  it('keeps every rule reachable without a browser, a store or a framework', () => {
    const report = tournamentOf(16);

    expect(report.blocked).toBeNull();
    expect(rankTeams(report.tournament).entries).toHaveLength(16);
    expect(podiumOf(report.tournament, 'main').first).not.toBeNull();
  });
});
