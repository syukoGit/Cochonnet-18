import { readFileSync } from 'node:fs';
import { replay, splitNames } from '@/domain/replay';
import type { BracketLine, MatchLine, Report } from '@/domain/replay';
import { readScenario } from './scenario';

const REPLAY_TIME = '2026-01-01T00:00:00.000Z';

const BRACKET_TITLES: Record<BracketLine['phase'], string> = {
  main: 'MAIN BRACKET',
  consolation: 'CONSOLATION BRACKET',
};

function pad(value: string, width: number): string {
  return value.length >= width ? value : value + ' '.repeat(width - value.length);
}

function padLeft(value: string, width: number): string {
  return value.length >= width ? value : ' '.repeat(width - value.length) + value;
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

function matchLine(match: MatchLine): string {
  const score = match.score ? `${match.score[0]} - ${match.score[1]}` : match.status;

  const tag = match.thirdPlace ? '  [third place]' : '';

  return `    ${padLeft(String(match.id), 3)}  ${padLeft(match.home ?? '—', 22)}  ${pad(score, 9)}  ${pad(match.away ?? '—', 22)}${tag}`.trimEnd();
}

function rankingBlock(report: Report): string[] {
  const width = Math.max(4, ...report.ranking.map((line) => line.name.length));

  return [
    `  ${padLeft('#', 3)}  ${pad('team', width)}  ${padLeft('diff', 6)}  ${padLeft('bye', 5)}  ${padLeft('won', 4)}  ${padLeft('played', 7)}`,
    ...report.ranking.map(
      (line) =>
        `  ${padLeft(String(line.rank), 3)}  ${pad(line.name, width)}  ${padLeft(signed(line.differential), 6)}  ${padLeft(line.byes > 0 ? signed(line.byeCredit) : '', 5)}  ${padLeft(String(line.wins), 4)}  ${padLeft(String(line.played), 7)}`
    ),
  ];
}

function bracketBlock(bracket: BracketLine): string[] {
  const rounds = [...new Set(bracket.matches.map((match) => match.round))].sort((a, b) => a - b);

  return [
    '',
    `${BRACKET_TITLES[bracket.phase]} — ${bracket.teams.length} team(s)`,
    ...rounds.flatMap((round) => [
      `  round ${round}`,
      ...bracket.matches.filter((match) => match.round === round).map(matchLine),
    ]),
    `  podium  1st ${bracket.podium.first ?? '—'}  ·  2nd ${bracket.podium.second ?? '—'}  ·  3rd ${bracket.podium.third ?? '—'}`,
  ];
}

export function format(report: Report): string {
  const split = splitNames(report.tournament);

  const lines = [
    `${report.name} — ${String(report.teams)} teams, ${String(report.rounds)} qualification round(s)`,
  ];

  if (report.blocked !== null) {
    lines.push('', `stopped: ${report.blocked}`);
    return lines.join('\n');
  }

  lines.push('', 'QUALIFICATION', ...report.qualification.map(matchLine));
  lines.push('', 'RANKING', ...rankingBlock(report));

  if (report.settledTies.length > 0) {
    lines.push(
      '',
      'TIES THE CRITERIA COULD NOT SEPARATE — settled here from the seed, by the organiser in the application',
      ...report.settledTies.map((tie) => `  ${tie.join(' / ')}`)
    );
  }

  if (report.unresolvedTies.length > 0) {
    lines.push('', 'UNSETTLED TIES', ...report.unresolvedTies.map((tie) => `  ${tie.join(' / ')}`));
  }

  lines.push(
    '',
    'SPLIT',
    `  main         ${split.main.join(', ')}`,
    `  consolation  ${split.consolation.join(', ')}`
  );

  for (const bracket of report.brackets) {
    lines.push(...bracketBlock(bracket));
  }

  return lines.join('\n');
}

export function run(argv: readonly string[]): number {
  const path = argv[0];

  if (path === undefined) {
    process.stderr.write('usage: npm run replay -- <scenario.json>\n');
    return 2;
  }

  let contents: string;

  try {
    contents = readFileSync(path, 'utf8');
  } catch (error) {
    process.stderr.write(`cannot read ${path}: ${String(error)}\n`);
    return 2;
  }

  const parsed = readScenario(contents);

  if (!parsed.ok) {
    process.stderr.write(`${path} is not a scenario:\n${parsed.detail}\n`);
    return 2;
  }

  process.stdout.write(`${format(replay(parsed.scenario, REPLAY_TIME))}\n`);

  return 0;
}
