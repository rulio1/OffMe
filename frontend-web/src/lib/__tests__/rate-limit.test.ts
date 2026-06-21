import { checkRateLimit } from '../rate-limit';

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✗ ${name}`);
    throw err;
  }
}

run('allows requests under limit', () => {
  const key = `test-${Date.now()}-1`;
  const first = checkRateLimit(key, 3, 60_000);
  if (!first.ok || first.remaining !== 2) throw new Error('expected first request ok');
  const second = checkRateLimit(key, 3, 60_000);
  if (!second.ok || second.remaining !== 1) throw new Error('expected second request ok');
});

run('blocks requests over limit', () => {
  const key = `test-${Date.now()}-2`;
  checkRateLimit(key, 2, 60_000);
  checkRateLimit(key, 2, 60_000);
  const third = checkRateLimit(key, 2, 60_000);
  if (third.ok) throw new Error('expected third request blocked');
  if (!third.retryAfter || third.retryAfter < 1) throw new Error('expected retryAfter');
});

console.log('rate-limit tests passed');