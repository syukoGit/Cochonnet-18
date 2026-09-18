import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron, expect } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';

export interface Running {
  application: ElectronApplication;
  page: Page;
}

export const WRITE_SETTLED_MS = 1500;

export function subtitle(page: Page) {
  return page.locator('header p').first();
}

export function freshDataDirectory(): string {
  return mkdtempSync(join(tmpdir(), 'cochonnet-e2e-'));
}

export async function launch(dataDirectory: string): Promise<Running> {
  const application = await electron.launch({
    args: ['.', `--user-data-dir=${dataDirectory}`],
  });

  const page = await application.firstWindow();
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByRole('heading', { name: 'Cochonnet-18' })).toBeVisible();

  return { application, page };
}

export async function killWithoutWarning(running: Running): Promise<void> {
  await running.page.waitForTimeout(WRITE_SETTLED_MS);
  running.application.process().kill();
  await running.application.waitForEvent('close').catch(() => undefined);
}

export async function createTournament(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: 'Nouveau tournoi' }).click();
  await page.getByPlaceholder('Tournoi du 14 septembre').fill(name);
  await page.getByRole('button', { name: 'Créer' }).click();
  await expect(subtitle(page)).toHaveText(/^Configuration · /);
}

export async function addTeams(page: Page, names: readonly string[]): Promise<void> {
  const field = page.getByPlaceholder("Nom de l'équipe, puis Entrée");

  for (const name of names) {
    await field.fill(name);
    await field.press('Enter');
  }

  await expect(subtitle(page)).toHaveText(`Configuration · ${String(names.length)} équipes`);
}

async function enterScore(page: Page, row: number, home: number, away: number): Promise<void> {
  await page.getByLabel('Score équipe 1').nth(row).fill(String(home));
  const second = page.getByLabel('Score équipe 2').nth(row);
  await second.fill(String(away));
  await second.press('Enter');
}

export async function playEveryQualificationMatch(page: Page): Promise<void> {
  const rounds = await page.getByRole('button', { name: /^Tour \d+ ·/ }).count();

  for (let round = 0; round < rounds; round += 1) {
    await page
      .getByRole('button', { name: /^Tour \d+ ·/ })
      .nth(round)
      .click();

    const rows = await page.getByLabel('Score équipe 1').count();

    for (let row = 0; row < rows; row += 1) {
      await enterScore(page, row, 13, (row % 12) + 0);
    }
  }
}

export async function playEveryBracketMatch(page: Page, bracket: string): Promise<number> {
  await page.getByRole('button', { name: new RegExp(`^${bracket} ·`) }).click();

  let played = 0;

  for (let attempt = 0; attempt < 32; attempt += 1) {
    const open = page.locator('section li button:not([disabled])').filter({
      hasNot: page.locator('.tabular-nums'),
    });

    if ((await open.count()) === 0) {
      return played;
    }

    await open.first().click();
    await page.getByLabel('Score équipe 1').fill('13');
    const second = page.getByLabel('Score équipe 2');
    await second.fill(String(played % 12));
    await second.press('Enter');
    played += 1;
  }

  throw new Error(`${bracket}: the bracket never filled up`);
}
