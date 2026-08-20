import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cronAuthorised } from './cron.js';

/** Runs fn with CRON_SECRET set (or unset), then restores it. */
function withSecret(value, fn) {
  const previous = process.env.CRON_SECRET;
  if (value === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = value;
  const quiet = console.error;
  console.error = () => {};
  try { return fn(); } finally {
    console.error = quiet;
    if (previous === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = previous;
  }
}

test('Vercel Cron is authorised by its bearer header', () => {
  withSecret('s3cret-value', () => {
    assert.equal(cronAuthorised({ headers: { authorization: 'Bearer s3cret-value' }, query: {} }), true);
  });
});

test('other schedulers can pass the secret in the query string', () => {
  withSecret('s3cret-value', () => {
    assert.equal(cronAuthorised({ headers: {}, query: { k: 's3cret-value' } }), true);
  });
});

test('a wrong secret is refused, by either route', () => {
  withSecret('s3cret-value', () => {
    assert.equal(cronAuthorised({ headers: { authorization: 'Bearer wrong' }, query: {} }), false);
    assert.equal(cronAuthorised({ headers: {}, query: { k: 'wrong' } }), false);
    assert.equal(cronAuthorised({ headers: {}, query: {} }), false);
  });
});

test('a prefix of the secret is not enough', () => {
  withSecret('s3cret-value', () => {
    assert.equal(cronAuthorised({ headers: {}, query: { k: 's3cret' } }), false);
    assert.equal(cronAuthorised({ headers: {}, query: { k: 's3cret-value-extra' } }), false);
  });
});

test('a malformed Authorization header is refused rather than parsed loosely', () => {
  withSecret('s3cret-value', () => {
    for (const authorization of ['s3cret-value', 'Basic s3cret-value', 'Bearer', 'Bearer  s3cret-value']) {
      assert.equal(cronAuthorised({ headers: { authorization }, query: {} }), false, authorization);
    }
  });
});

test('with no secret configured, every caller is refused', () => {
  // Unlike the rate limiter, this fails closed: a job not running for a day
  // means a late message, whereas anyone being able to run it means deleted
  // records.
  withSecret(undefined, () => {
    assert.equal(cronAuthorised({ headers: { authorization: 'Bearer anything' }, query: {} }), false);
    assert.equal(cronAuthorised({ headers: {}, query: { k: '' } }), false);
    assert.equal(cronAuthorised({ headers: {}, query: {} }), false);
  });
  withSecret('', () => {
    assert.equal(cronAuthorised({ headers: {}, query: { k: '' } }), false,
      'an empty secret must not match an empty query parameter');
  });
});

test('a request with no headers or query at all does not throw', () => {
  withSecret('s3cret-value', () => {
    assert.equal(cronAuthorised({}), false);
  });
});
