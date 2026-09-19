import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { replay } from '@/domain/replay';
import { format, run } from './replay';
import { readScenario } from './scenario';

let directory: string;

const t0 = '2026-09-17T09:00:00.000Z';

const scenario = {
  name: 'Four teams',
  teams: ['Alpha', 'Bravo', 'Charlie', 'Delta'],
  matchCount: 2,
  seed: 42,
};

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'cochonnet-cli-'));
});

describe('reading a scenario file', () => {
  it('accepts the shape the replay engine expects', () => {
    const parsed = readScenario(JSON.stringify(scenario));

    expect(parsed).toEqual({ ok: true, scenario });
  });

  it('accepts the optional parts', () => {
    const full = {
      ...scenario,
      settings: { minimumGapPhase2: 2 },
      withdrawn: [1],
      scores: { '1': [13, 0] },
    };

    expect(readScenario(JSON.stringify(full)).ok).toBe(true);
  });

  it('refuses something that is not JSON', () => {
    expect(readScenario('nope').ok).toBe(false);
  });

  it('refuses a field of one team, naming the field', () => {
    const parsed = readScenario(JSON.stringify({ ...scenario, teams: ['Seule'] }));

    expect(parsed.ok).toBe(false);
    expect(!parsed.ok && parsed.detail).toContain('teams');
  });

  it('refuses a missing seed rather than inventing one', () => {
    const { seed: _unused, ...without } = scenario;

    expect(readScenario(JSON.stringify(without)).ok).toBe(false);
  });
});

describe('printing a report', () => {
  it('shows the qualification, the ranking, the split and both podiums', () => {
    const printed = format(replay(scenario, t0));

    expect(printed).toContain('QUALIFICATION');
    expect(printed).toContain('RANKING');
    expect(printed).toContain('SPLIT');
    expect(printed).toContain('MAIN BRACKET');
    expect(printed).toContain('CONSOLATION BRACKET');
    expect(printed).toContain('podium  1st');
  });

  it('names every team it was given', () => {
    const printed = format(replay(scenario, t0));

    for (const team of scenario.teams) {
      expect(printed).toContain(team);
    }
  });

  it('says what stopped it instead of printing an empty report', () => {
    const printed = format(
      replay({ ...scenario, teams: ['Seule', 'Deux'], matchCount: 1, withdrawn: [1, 2] }, t0)
    );

    expect(printed).toContain('stopped: not-enough-teams');
    expect(printed).not.toContain('MAIN BRACKET');
  });

  it('marks the third place match, which shares its round with the final', () => {
    const printed = format(
      replay({ ...scenario, teams: Array.from({ length: 12 }, (_u, i) => `E${i + 1}`) }, t0)
    );

    expect(printed).toContain('[third place]');
  });
});

describe('the command line', () => {
  it('refuses to run without a scenario', () => {
    expect(run([])).toBe(2);
  });

  it('refuses a path it cannot read', () => {
    expect(run([join(directory, 'absent.json')])).toBe(2);
  });

  it('refuses a file that is not a scenario', async () => {
    const path = join(directory, 'notes.json');
    await writeFile(path, '{ "hello": true }', 'utf8');

    expect(run([path])).toBe(2);
  });

  it('runs a scenario it can read', async () => {
    const path = join(directory, 'four.json');
    await writeFile(path, JSON.stringify(scenario), 'utf8');

    expect(run([path])).toBe(0);
  });
});
