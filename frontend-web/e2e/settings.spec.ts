import { test, expect } from '@playwright/test';
import { apiLogin, apiRegister, setAuthSession, uniqueUsername } from './helpers';

test.describe('Settings', () => {
  test('settings hub and privacy page load', async ({ page }) => {
    const username = uniqueUsername('set');
    const email = `${username}@e2e.test`;
    const password = 'TestPass123!';

    await apiRegister({
      username,
      email,
      password,
      displayName: 'Settings User',
    });
    const session = await apiLogin(email, password);
    await setAuthSession(page, session);

    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Configurações' })).toBeVisible();
    await expect(page.getByText('Convidar amigos')).toBeVisible();

    await page.getByRole('link', { name: 'Privacidade' }).click();
    await expect(page.getByRole('heading', { name: 'Privacidade' })).toBeVisible();
    await expect(page.getByText('Bloqueados')).toBeVisible();
  });

  test('appearance theme toggle', async ({ page }) => {
    const username = uniqueUsername('thm');
    const email = `${username}@e2e.test`;
    const password = 'TestPass123!';

    await apiRegister({ username, email, password, displayName: 'Theme User' });
    const session = await apiLogin(email, password);
    await setAuthSession(page, session);

    await page.goto('/settings/appearance');
    await page.getByRole('button', { name: 'Escuro' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});