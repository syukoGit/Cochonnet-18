import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { MatchId, TeamId } from '@/domain/ids';
import { buildBracket } from '@/domain/phase2/bracket';
import { addTeam } from '@/domain/tournament/teams';
import { createTournament } from '@/domain/tournament/tournament';
import type { Tournament } from '@/domain/tournament/types';
import { clearEntry, enterForfeit, enterScore } from './entry';
import { isReady, occupantsIn, loserIn, winnerIn } from './resolve';
import { bracketMatches, hasResult } from './types';
import type { Match } from './types';

const t0 = '2026-09-15T09:00:00.000Z';
const t1 = '2026-09-15T10:00:00.000Z';

function bracketOf(teams: TeamId[]): Tournament {
  const base = teams
    .map((team) => `Equipe ${team}`)
    .reduce((current, name) => addTeam(current, name, t0), createTournament('t1', 'Tournoi', t0));

  return {
    ...base,
    phase: 'phase2',
    matches: buildBracket(teams, 'main', 1),
  };
}

function idsOf(tournament: Tournament, round: number): MatchId[] {
  return tournament.matches.filter((match) => match.round === round).map((match) => match.id);
}

function must<T>(value: T | undefined, what: string): T {
  if (value === undefined) {
    throw new Error(`missing ${what}`);
  }

  return value;
}

function matchOf(tournament: Tournament, id: MatchId): Match {
  return must(
    tournament.matches.find((match) => match.id === id),
    `match ${id}`
  );
}

function playThrough(tournament: Tournament): Tournament {
  return tournament.matches.reduce(
    (current, match) => enterScore(current, match.id, [13, 5], t1),
    tournament
  );
}

const eight = () => bracketOf([1, 2, 3, 4, 5, 6, 7, 8]);

describe('entering a phase 2 result', () => {
  it('qualifies the winner for the match it feeds', () => {
    const tournament = eight();
    const first = must(idsOf(tournament, 1)[0], 'first round match');
    const after = enterScore(tournament, first, [13, 5], t1);
    const semi = must(idsOf(after, 2)[0], 'semi final');

    expect(winnerIn(after.matches, matchOf(after, first))).toBe(1);
    expect(occupantsIn(after.matches, matchOf(after, semi))[0]).toBe(1);
  });

  it('refuses a score on a match whose qualifiers are unknown', () => {
    const tournament = eight();
    const semi = must(idsOf(tournament, 2)[0], 'semi final');

    expect(isReady(tournament.matches, matchOf(tournament, semi))).toBe(false);
    expect(enterScore(tournament, semi, [13, 5], t1)).toBe(tournament);
    expect(enterForfeit(tournament, semi, 1, t1)).toBe(tournament);
  });

  it('R5.3 — a forfeit qualifies the opponent and propagates like a score', () => {
    const tournament = eight();
    const first = must(idsOf(tournament, 1)[0], 'first round match');
    const after = enterForfeit(tournament, first, 1, t1);
    const semi = must(idsOf(after, 2)[0], 'semi final');

    expect(matchOf(after, first).status).toBe('forfeit');
    expect(occupantsIn(after.matches, matchOf(after, semi))[0]).toBe(2);
  });

  it('refuses a forfeit from a team that is not in the match', () => {
    const tournament = eight();
    const first = must(idsOf(tournament, 1)[0], 'first round match');

    expect(enterForfeit(tournament, first, 42, t1)).toBe(tournament);
  });

  it('R4.9 — it applies the phase 2 gap, not the phase 1 one', () => {
    const base = eight();
    const strict = {
      ...base,
      settings: { ...base.settings, minimumGapPhase1: 0, minimumGapPhase2: 2 },
    };
    const first = must(idsOf(strict, 1)[0], 'first round match');

    expect(enterScore(strict, first, [13, 12], t1)).toBe(strict);
    expect(enterScore(strict, first, [14, 12], t1)).not.toBe(strict);
  });

  it('R4.11 — correcting the first match empties the whole path to the title', () => {
    const played = playThrough(eight());
    const first = must(idsOf(played, 1)[0], 'first round match');

    expect(played.matches.every(hasResult)).toBe(true);

    const corrected = enterScore(played, first, [5, 13], t1);
    const final = must(idsOf(corrected, 3)[0], 'final');

    expect(matchOf(corrected, first).score).toEqual([5, 13]);
    expect(matchOf(corrected, final).status).toBe('waiting');
    expect(winnerIn(corrected.matches, matchOf(corrected, final))).toBeNull();
  });

  it('R4.11 — correcting a semi final empties the final and the play-off alike', () => {
    const played = playThrough(eight());
    const semi = must(idsOf(played, 2)[0], 'semi final');
    const corrected = clearEntry(played, semi, t1);

    for (const id of idsOf(corrected, 3)) {
      expect(matchOf(corrected, id).status).toBe('waiting');
    }
  });

  it('re-entering the very same score changes nothing downstream', () => {
    const played = playThrough(eight());
    const first = must(idsOf(played, 1)[0], 'first round match');

    expect(enterScore(played, first, [13, 5], t1)).toBe(played);
  });

  it('leaves the matches of the other bracket alone', () => {
    const base = eight();
    const consolation = buildBracket([9, 10], 'consolation', 100);
    const tournament = { ...base, matches: [...base.matches, ...consolation] };
    const first = must(idsOf(tournament, 1)[0], 'first round match');

    const played = enterScore(enterScore(tournament, 100, [13, 2], t1), first, [13, 5], t1);

    expect(matchOf(played, 100).status).toBe('played');
  });
});

describe('I8 — nothing downstream survives a correction', () => {
  it('holds after any sequence of entries and corrections', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(fc.integer({ min: 1, max: 8 }), fc.boolean()), { maxLength: 24 }),
        (steps) => {
          const start = eight();

          const after = steps.reduce((current, [index, homeWins]) => {
            const id = must(current.matches[index - 1], 'match').id;

            return enterScore(current, id, homeWins ? [13, 5] : [5, 13], t1);
          }, start);

          for (const match of after.matches.filter(hasResult)) {
            expect(isReady(after.matches, match)).toBe(true);
          }
        }
      )
    );
  });
});

describe('I9 — no team appears where it did not earn its place', () => {
  it('holds after any sequence of entries and corrections', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(fc.integer({ min: 1, max: 8 }), fc.boolean()), { maxLength: 24 }),
        (steps) => {
          const after = steps.reduce((current, [index, homeWins]) => {
            const id = must(current.matches[index - 1], 'match').id;

            return enterScore(current, id, homeWins ? [13, 5] : [5, 13], t1);
          }, eight());

          for (const match of bracketMatches(after.matches)) {
            match.slots.forEach((slot, index) => {
              const occupant = occupantsIn(after.matches, match)[index === 0 ? 0 : 1];

              if (slot.kind === 'winner') {
                expect(occupant).toBe(winnerIn(after.matches, matchOf(after, slot.from)));
              }

              if (slot.kind === 'loser') {
                expect(occupant).toBe(loserIn(after.matches, matchOf(after, slot.from)));
              }
            });
          }
        }
      )
    );
  });
});
