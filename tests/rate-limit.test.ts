import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkRateLimit } from '../src/lib/rate-limit';

test('checkRateLimit: allows requests up to the limit', () => {
  const key = `test-key-${Date.now()}-a`;
  assert.equal(checkRateLimit(key, 3, 1000).allowed, true);
  assert.equal(checkRateLimit(key, 3, 1000).allowed, true);
  assert.equal(checkRateLimit(key, 3, 1000).allowed, true);
});

test('checkRateLimit: blocks the request that exceeds the limit within the window', () => {
  const key = `test-key-${Date.now()}-b`;
  checkRateLimit(key, 2, 1000);
  checkRateLimit(key, 2, 1000);
  const third = checkRateLimit(key, 2, 1000);
  assert.equal(third.allowed, false);
  assert.equal(third.remaining, 0);
});

test('checkRateLimit: different keys are tracked independently', () => {
  const keyA = `test-key-${Date.now()}-c1`;
  const keyB = `test-key-${Date.now()}-c2`;
  checkRateLimit(keyA, 1, 1000);
  checkRateLimit(keyA, 1, 1000); // keyA now exhausted
  const resultB = checkRateLimit(keyB, 1, 1000);
  assert.equal(resultB.allowed, true, 'keyB must not be affected by keyA being rate-limited');
});

test('checkRateLimit: resets after the window elapses', async () => {
  const key = `test-key-${Date.now()}-d`;
  const windowMs = 100;
  checkRateLimit(key, 1, windowMs);
  const blocked = checkRateLimit(key, 1, windowMs);
  assert.equal(blocked.allowed, false);

  await new Promise((resolve) => setTimeout(resolve, windowMs + 50));

  const afterWindow = checkRateLimit(key, 1, windowMs);
  assert.equal(afterWindow.allowed, true);
});
