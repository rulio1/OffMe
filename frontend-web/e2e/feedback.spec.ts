import { test, expect } from '@playwright/test';
import { apiLogin, apiRegister, setAuthSession, uniqueUsername } from './helpers';

test.describe('Beta feedback', () => {
  test('submit feedback from settings', async ({ page }) => {
    const username = uniqueUsername('fb');
    const email = `${username}@e2e.test`;
    const password = 'TestPass123!';

    await apiRegister({
      username,
      email,
      password,
      displayName: 'Feedback User',
    });
    const session = await apiLogin(email, password);
    await setAuthSession(page, session);

    await page.goto('/settings/feedback');
    await expect(page.getByRole('heading', { name: 'Feedback beta' })).toBeVisible();

    await page.getByLabel('Bug').check();
    await page.getByLabel('Mensagem').fill('Encontrei um problema no feed durante o teste E2E.');
    await page.getByRole('button', { name: 'Enviar feedback' }).click();

    await expect(page.getByText('Obrigado! Seu feedback foi recebido.')).toBeVisible();
  });
});