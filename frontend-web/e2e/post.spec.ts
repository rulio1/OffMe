import { test, expect } from '@playwright/test';
import { apiLogin, apiRegister, setAuthSession, uniqueUsername } from './helpers';

test('create post from composer', async ({ page }) => {
  const username = uniqueUsername('post');
  const password = 'testpass123';

  await apiRegister({
    username,
    email: `${username}@e2e.test`,
    password,
    displayName: 'Poster',
  });

  const session = await apiLogin(username, password);
  await setAuthSession(page, session);

  await page.goto('/');
  const postText = `E2E post ${Date.now()}`;
  await page.getByPlaceholder('O que está acontecendo?').click();
  await page.getByPlaceholder('O que está acontecendo?').fill(postText);
  await page.getByTestId('composer-submit').click();

  await page.goto(`/profile/${username}`);
  await expect(page.getByText(postText)).toBeVisible({ timeout: 15_000 });
});