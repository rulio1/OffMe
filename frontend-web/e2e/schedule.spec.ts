import { test, expect } from '@playwright/test';
import { apiLogin, apiRegister, uniqueUsername } from './helpers';

const API_BASE = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:3000/api/v1';

test('schedule post via API', async () => {
  const username = uniqueUsername('sched');
  const password = 'testpass123';

  await apiRegister({
    username,
    email: `${username}@e2e.test`,
    password,
    displayName: 'Scheduler',
  });

  const session = await apiLogin(username, password);
  const scheduledAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const res = await fetch(`${API_BASE}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify({
      text: `Scheduled E2E ${Date.now()}`,
      scheduledAt,
    }),
  });

  expect(res.status).toBe(201);
  const post = await res.json();
  expect(post.id).toBeTruthy();
  expect(post.text).toContain('Scheduled E2E');
});