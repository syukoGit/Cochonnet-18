import { expect, test } from '@playwright/test';
import {
  addTeams,
  createTournament,
  freshDataDirectory,
  killWithoutWarning,
  launch,
  playEveryBracketMatch,
  playEveryQualificationMatch,
  subtitle,
} from './application';

const TEAMS = [
  'Les Boulistes',
  'Tir et Point',
  'La Bonne Mène',
  'Les Carreaux',
  'Cochonnet Club',
  'Les Pointeurs',
  'Fanny Express',
  'Le Triplette',
];

const NAME = 'Tournoi de bout en bout';

test('a whole tournament survives a brutal shutdown', async () => {
  const dataDirectory = freshDataDirectory();
  const first = await launch(dataDirectory);
  const page = first.page;

  await createTournament(page, NAME);
  await addTeams(page, TEAMS);

  await page.getByRole('button', { name: 'Démarrer la phase 1' }).click();
  await expect(subtitle(page)).toHaveText(/^Phase 1 · /);

  await playEveryQualificationMatch(page);
  await expect(page.getByText('Tous les matchs sont saisis.')).toBeVisible();

  await page.getByRole('button', { name: 'Clôturer la phase 1' }).click();
  await expect(subtitle(page)).toHaveText(/^Clôture · /);

  await page.getByRole('button', { name: 'Tirer les tableaux' }).click();
  await expect(subtitle(page)).toHaveText(/^Phase 2 · /);

  expect(await playEveryBracketMatch(page, 'Tournoi principal')).toBeGreaterThan(0);
  expect(await playEveryBracketMatch(page, 'Consolante')).toBeGreaterThan(0);

  const results = page.getByRole('button', { name: 'Résultats', exact: true });
  await expect(results).toBeEnabled();
  await results.click();
  await expect(subtitle(page)).toHaveText('Résultats');

  const podiums = page.locator('section').filter({ hasText: /^Tournoi principal|^Consolante/ });
  await expect(podiums.first().getByText('1re')).toBeVisible();

  const champion = await page
    .locator('section')
    .filter({ hasText: 'Tournoi principal' })
    .locator('li')
    .first()
    .innerText();

  await killWithoutWarning(first);

  const second = await launch(dataDirectory);
  const reopened = second.page;

  await expect(reopened.getByRole('button', { name: new RegExp(NAME) }).first()).toBeVisible();
  await reopened.getByRole('button', { name: 'Ouvrir' }).first().click();

  await expect(subtitle(reopened)).toHaveText(/^Phase 2 · /);

  const resultsAgain = reopened.getByRole('button', { name: 'Résultats', exact: true });
  await expect(resultsAgain).toBeEnabled();
  await resultsAgain.click();

  const championAgain = await reopened
    .locator('section')
    .filter({ hasText: 'Tournoi principal' })
    .locator('li')
    .first()
    .innerText();

  expect(championAgain).toBe(champion);

  await second.application.close();
});

test('the home screen lists what was created and nothing else', async () => {
  const dataDirectory = freshDataDirectory();
  const running = await launch(dataDirectory);
  const page = running.page;

  await expect(page.getByText('Aucun tournoi')).toBeVisible();

  await createTournament(page, 'Premier');
  await page.getByRole('button', { name: 'Tournois' }).click();
  await createTournament(page, 'Second');
  await page.getByRole('button', { name: 'Tournois' }).click();

  await expect(page.getByRole('button', { name: /Premier/ }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Second/ }).first()).toBeVisible();

  await running.application.close();
});
