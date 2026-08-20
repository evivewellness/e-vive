import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkRateLimit, recordAttempt, consumeRateLimit, clientIp, LIMITS } from './rateLimit.js';

/** Stand-in for the service-role client: counts and inserts against one bucket. */
function fakeDb({ counts = {}, failWith = null } = {}) {
  const inserted = [];
  return {
    inserted,
    from() {
      return {
        select() { return this; },
        eq(_col, value) { this._bucket = value; return this; },
        gte() {
          if (failWith) return Promise.resolve({ count: null, error: { message: failWith } });
          return Promise.resolve({ count: counts[this._bucket] || 0, error: null });
        },
        insert(row) { inserted.push(row); return Promise.resolve({ error: null }); },
      };
    },
  };
}

test('under the limit is allowed', async () => {
  const db = fakeDb({ counts: { 'login:client:a@b.c': 3 } });
  const r = await checkRateLimit(db, { key: 'login:client:a@b.c', limit: 8, windowSeconds: 900 });
  assert.equal(r.ok, true);
});

test('at the limit is refused, with the window as Retry-After', async () => {
  const db = fakeDb({ counts: { 'login:client:a@b.c': 8 } });
  const r = await checkRateLimit(db, { key: 'login:client:a@b.c', limit: 8, windowSeconds: 900 });
  assert.equal(r.ok, false);
  assert.equal(r.retryAfter, 900);
});

test('over the limit stays refused', async () => {
  const db = fakeDb({ counts: { k: 99 } });
  assert.equal((await checkRateLimit(db, { key: 'k', limit: 8, windowSeconds: 60 })).ok, false);
});

test('buckets are independent — one account being locked does not lock another', async () => {
  const db = fakeDb({ counts: { 'login:client:victim': 8 } });
  assert.equal((await checkRateLimit(db, { key: 'login:client:victim', limit: 8, windowSeconds: 900 })).ok, false);
  assert.equal((await checkRateLimit(db, { key: 'login:client:someone-else', limit: 8, windowSeconds: 900 })).ok, true);
});

test('it fails open when its own storage errors', async () => {
  // A limiter that takes the site down when its table is missing is worse than
  // the attack it prevents.
  const db = fakeDb({ failWith: 'relation "rate_limits" does not exist' });
  const r = await checkRateLimit(db, { key: 'k', limit: 1, windowSeconds: 60 });
  assert.equal(r.ok, true);
});

test('recording an attempt never throws, even when the insert fails', async () => {
  const db = { from() { return { insert() { throw new Error('boom'); } }; } };
  await recordAttempt(db, 'k');   // must not reject
});

test('consume counts the attempt only when it was allowed', async () => {
  const allowed = fakeDb({ counts: { k: 0 } });
  await consumeRateLimit(allowed, { key: 'k', limit: 3, windowSeconds: 60 });
  assert.equal(allowed.inserted.length, 1);

  const refused = fakeDb({ counts: { k: 3 } });
  await consumeRateLimit(refused, { key: 'k', limit: 3, windowSeconds: 60 });
  assert.equal(refused.inserted.length, 0, 'a refused request must not extend its own lockout');
});

test('the client IP comes from the proxy header, first hop first', () => {
  assert.equal(clientIp({ headers: { 'x-forwarded-for': '203.0.113.7, 10.0.0.1' } }), '203.0.113.7');
  assert.equal(clientIp({ headers: { 'x-real-ip': '203.0.113.8' } }), '203.0.113.8');
  assert.equal(clientIp({ headers: {}, socket: { remoteAddress: '198.51.100.2' } }), '198.51.100.2');
  assert.equal(clientIp({ headers: {} }), 'unknown');
});

test('every configured limit is a sane positive window', () => {
  for (const [name, { limit, windowSeconds }] of Object.entries(LIMITS)) {
    assert.ok(limit > 0, `${name} limit`);
    assert.ok(windowSeconds >= 60, `${name} window should be at least a minute`);
  }
  // Sign-in is the one people hit legitimately; it should not be the tightest.
  assert.ok(LIMITS.loginPerAccount.limit >= 5);
  assert.ok(LIMITS.loginPerIp.limit > LIMITS.loginPerAccount.limit);
});
