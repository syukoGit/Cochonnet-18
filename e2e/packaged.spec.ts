import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { _electron as electron, expect, test } from '@playwright/test';
import { addTeams, createTournament, freshDataDirectory, subtitle } from './application';

const EXECUTABLE = join('release', 'win-unpacked', 'Cochonnet-18.exe');

test.describe('the packaged application', () => {
  test.skip(
    () => !existsSync(EXECUTABLE),
    'run npm run dist-win first; the packaged traps only appear there'
  );

  test('opens from file:// and runs a tournament through', async () => {
    const application = await electron.launch({
      executablePath: EXECUTABLE,
      args: [`--user-data-dir=${freshDataDirectory()}`],
    });

    const page = await application.firstWindow();
    const complaints: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') {
        complaints.push(message.text());
      }
    });
    page.on('pageerror', (error) => {
      complaints.push(error.message);
    });

    await page.waitForLoadState('domcontentloaded');

    expect(page.url().startsWith('file://')).toBe(true);
    await expect(page.getByRole('heading', { name: 'Cochonnet-18' })).toBeVisible();

    await createTournament(page, 'Tournoi packagé');
    await addTeams(page, ['Alpha', 'Bravo', 'Charlie', 'Delta']);

    await page.getByRole('button', { name: 'Démarrer la phase 1' }).click();
    await expect(subtitle(page)).toHaveText(/^Phase 1 · /);

    await expect(page.locator('body')).toHaveCSS('background-color', /^rgba?\(/);
    expect(complaints).toEqual([]);

    await application.close();
  });
});
