import { test, expect } from '@playwright/test';
import { apiRegister, uniqueUsername } from './helpers';

test('login with registered user', async ({ page }) => {
  const username = uniqueUsername('e2e');
  const email = `${username}@e2e.test`;
  const password = 'testpass123';

  await apiRegister({
    username,
    email,
    password,
    displayName: 'E2E User',
  });

  await page.goto('/login');
  await page.getByLabel('E-mail ou usuário').fill(username);
  await page.getByLabel('Senha').fill(password);
  await page.getByTestId('login-submit').click();

  await expect(page).toHaveURL('/');
});