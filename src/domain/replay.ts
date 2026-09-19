import type { MatchId, TeamId } from '@/domain/ids';
import { enterScore } from '@/domain/match/entry';
import { occupantsIn, isReady } from '@/domain/match/resolve';
import { BRACKET_PHASES, hasResult, isBye, phaseMatches } from '@/domain/match/types';
import type { BracketPhase, Match, MatchStatus } from '@/domain/match/types';
import { rankTeams } from '@/domain/phase1/ranking';
import { recordDecision } from '@/domain/phase1/tiebreak';
import { startBlocker, startPhase1 } from '@/domain/phase1/start';
import type { StartBlocker } from '@/domain/phase1/start';
import { isThirdPlace } from '@/domain/phase2/bracket';
import { groupOf, podiumOf } from '@/domain/phase2/podium';
import { closePhase1, liveTies, splitOf, withdraw } from '@/domain/phase2/split';
import { drawBrackets, phase2Blocker } from '@/domain/phase2/start';
import type { Phase2Blocker } from '@/domain/phase2/start';
import { nextSeed, shuffled, unitAt } from '@/domain/random';
import type { Seed } from '@/domain/random';
import { TARGET } from '@/domain/score/validity';
import type { Score } from '@/domain/score/validity';
import { addTeam } from '@/domain/tournament/teams';
import { minimumGapFor } from '@/domain/tournament/settings';
import type { Settings } from '@/domain/tournament/settings';
import { createTournament } from '@/domain/tournament/tournament';
import type { Timestamp, Tournament } from '@/domain/tournament/types';

export interface Scenario {
  name: string;
  teams: string[];
  matchCount: number;
  seed: Seed;
  settings?: Partial<Settings>;
  withdrawn?: TeamId[];
  scores?: Record<string, Score>;
}

export interface RankingLine {
  rank: number;
  team: TeamId;
  name: string;
  differential: number;
  byeCredit: number;
  wins: number;
  played: number;
  byes: number;
}

export interface MatchLine {
  id: MatchId;
  round: number;
  home: string | null;
  away: string | null;
  score: Score | null;
  status: MatchStatus;
  thirdPlace: boolean;
}

export interface Podium {
  first: string | null;
  second: string | null;
  third: string | null;
}

export interface BracketLine {
  phase: BracketPhase;
  teams: string[];
  matches: MatchLine[];
  podium: Podium;
}

export interface Report {
  name: string;
  teams: number;
  rounds: number;
  blocked: StartBlocker | Phase2Blocker | null;
  ranking: RankingLine[];
  unresolvedTies: string[][];
  settledTies: string[][];
  qualification: MatchLine[];
  brackets: BracketLine[];
  tournament: Tournament;
}

const MAX_PASSES = 64;

function seeded(seed: Seed): () => number {
  let current = seed;

  return () => {
    current = nextSeed(current);
    return unitAt(current);
  };
}

function invented(random: () => number, gap: number): Score {
  const ceiling = TARGET - Math.max(1, gap);
  const loser = Math.floor(random() * (ceiling + 1));

  return random() < 0.5 ? [TARGET, loser] : [loser, TARGET];
}

function scoreFor(
  scenario: Scenario,
  match: Match,
  random: () => number,
  settings: Settings
): Score {
  return (
    scenario.scores?.[String(match.id)] ?? invented(random, minimumGapFor(settings, match.phase))
  );
}

function playable(tournament: Tournament, match: Match): boolean {
  return !isBye(match) && !hasResult(match) && isReady(tournament.matches, match);
}

function playAll(tournament: Tournament, scenario: Scenario, now: Timestamp): Tournament {
  const random = seeded(scenario.seed);
  let current = tournament;

  for (let pass = 0; pass < MAX_PASSES; pass += 1) {
    const pending = current.matches
      .filter((match) => playable(current, match))
      .sort((a, b) => a.id - b.id);

    if (pending.length === 0) {
      return current;
    }

    for (const match of pending) {
      current = enterScore(
        current,
        match.id,
        scoreFor(scenario, match, random, current.settings),
        now
      );
    }
  }

  return current;
}

function nameOf(tournament: Tournament, team: TeamId | null): string | null {
  if (team === null) {
    return null;
  }

  return tournament.teams.find((candidate) => candidate.id === team)?.name ?? `#${team}`;
}

function lineOf(tournament: Tournament, match: Match): MatchLine {
  const [home, away] = occupantsIn(tournament.matches, match);

  return {
    id: match.id,
    round: match.round,
    home: nameOf(tournament, home),
    away: nameOf(tournament, away),
    score: match.score ?? null,
    status: match.status,
    thirdPlace: isThirdPlace(match),
  };
}

function bracketOf(tournament: Tournament, phase: BracketPhase): BracketLine {
  const podium = podiumOf(tournament, phase);

  return {
    phase,
    teams: groupOf(tournament, phase).flatMap((team) => {
      const name = nameOf(tournament, team);
      return name === null ? [] : [name];
    }),
    matches: phaseMatches(tournament.matches, phase).map((match) => lineOf(tournament, match)),
    podium: {
      first: nameOf(tournament, podium.first),
      second: nameOf(tournament, podium.second),
      third: nameOf(tournament, podium.third),
    },
  };
}

function settleTies(tournament: Tournament, seed: Seed, now: Timestamp): Tournament {
  let current = tournament;
  let salt = seed;

  for (let pass = 0; pass < MAX_PASSES; pass += 1) {
    const tie = liveTies(current)[0];

    if (tie === undefined) {
      return current;
    }

    salt = nextSeed(salt);
    current = {
      ...current,
      tieBreaks: recordDecision(current.tieBreaks, { teams: tie, order: shuffled(tie, salt) }),
      modified: now,
    };
  }

  return current;
}

function reportOf(
  scenario: Scenario,
  tournament: Tournament,
  blocked: StartBlocker | Phase2Blocker | null,
  settled: TeamId[][] = []
): Report {
  const ranking = rankTeams(tournament);
  const qualification = phaseMatches(tournament.matches, 'phase1');

  return {
    name: scenario.name,
    teams: tournament.teams.length,
    rounds: qualification.reduce((highest, match) => Math.max(highest, match.round), 0),
    blocked,
    ranking: ranking.entries.map((entry, index) => ({
      rank: index + 1,
      team: entry.team,
      name: nameOf(tournament, entry.team) ?? `#${entry.team}`,
      differential: entry.differential,
      byeCredit: entry.byeCredit,
      wins: entry.wins,
      played: entry.played,
      byes: entry.byes,
    })),
    unresolvedTies: ranking.unresolvedTies.map((tie) =>
      tie.flatMap((team) => {
        const name = nameOf(tournament, team);
        return name === null ? [] : [name];
      })
    ),
    settledTies: settled.map((tie) =>
      tie.flatMap((team) => {
        const name = nameOf(tournament, team);
        return name === null ? [] : [name];
      })
    ),
    qualification: qualification.map((match) => lineOf(tournament, match)),
    brackets: BRACKET_PHASES.map((phase) => bracketOf(tournament, phase)),
    tournament,
  };
}

export function replay(scenario: Scenario, now: Timestamp): Report {
  const seeded = scenario.teams.reduce(
    (current, name) => addTeam(current, name, now),
    createTournament('replay', scenario.name, now)
  );

  const configured: Tournament = {
    ...seeded,
    matchCount: scenario.matchCount,
    settings: { ...seeded.settings, ...scenario.settings },
  };

  const blocker = startBlocker(configured);

  if (blocker !== null) {
    return reportOf(scenario, configured, blocker);
  }

  const qualified = playAll(startPhase1(configured, scenario.seed, now), scenario, now);
  const reduced = (scenario.withdrawn ?? []).reduce(
    (current, team) => withdraw(current, team, now),
    closePhase1(qualified, now)
  );

  const contested = liveTies(reduced);
  const arbitrated = settleTies(reduced, scenario.seed, now);
  const stopped = phase2Blocker(arbitrated);

  if (stopped !== null) {
    return reportOf(scenario, arbitrated, stopped, contested);
  }

  return reportOf(
    scenario,
    playAll(drawBrackets(arbitrated, scenario.seed, now), scenario, now),
    null,
    contested
  );
}

export function splitNames(tournament: Tournament): { main: string[]; consolation: string[] } {
  const split = splitOf(tournament);
  const names = (teams: readonly TeamId[]) =>
    teams.flatMap((team) => {
      const name = nameOf(tournament, team);
      return name === null ? [] : [name];
    });

  return { main: names(split.main), consolation: names(split.consolation) };
}
