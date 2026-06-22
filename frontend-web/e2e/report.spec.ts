import { test, expect } from '@playwright/test';
import { apiLogin, apiRegister, uniqueUsername } from './helpers';

const API_BASE = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:3000/api/v1';

test('report user via API', async () => {
  const reporter = uniqueUsername('rep');
  const target = uniqueUsername('tgt');
  const password = 'testpass123';

  await apiRegister({
    username: reporter,
    email: `${reporter}@e2e.test`,
    password,
    displayName: 'Reporter',
  });

  await apiRegister({
    username: target,
    email: `${target}@e2e.test`,
    password,
    displayName: 'Target',
  });

  const session = await apiLogin(reporter, password);

  const res = await fetch(`${API_BASE}/users/${target}/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify({ reason: 'abuse' }),
  });

  expect(res.status).toBe(201);
  const body = await res.json();
  expect(body.reported).toBe(true);
});