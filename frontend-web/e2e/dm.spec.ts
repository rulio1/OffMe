import { test, expect } from '@playwright/test';
import { apiLogin, apiRegister, setAuthSession, uniqueUsername } from './helpers';

test('send direct message', async ({ page, request }) => {
  const userA = uniqueUsername('dma');
  const userB = uniqueUsername('dmb');
  const password = 'testpass123';

  await apiRegister({
    username: userA,
    email: `${userA}@e2e.test`,
    password,
    displayName: 'User A',
  });
  await apiRegister({
    username: userB,
    email: `${userB}@e2e.test`,
    password,
    displayName: 'User B',
  });

  const sessionA = await apiLogin(userA, password);

  const startRes = await request.post('/api/v1/conversations', {
    headers: {
      Authorization: `Bearer ${sessionA.accessToken}`,
      'Content-Type': 'application/json',
    },
    data: { username: userB },
  });
  expect(startRes.ok()).toBeTruthy();
  const { conversation } = await startRes.json();

  await setAuthSession(page, sessionA);

  await page.goto(`/messages/${conversation.id}`);
  const message = `Olá DM ${Date.now()}`;
  await page.getByTestId('message-input').fill(message);
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText(message)).toBeVisible({ timeout: 15_000 });
});