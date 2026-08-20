import { test } from 'node:test';
import assert from 'node:assert/strict';
import { log, withLogging } from './log.js';

/** Captures whatever the logger writes, so the output can be asserted on. */
function capture(fn) {
  const lines = [];
  const original = { info: console.info, warn: console.warn, error: console.error };
  console.info = console.warn = console.error = (text) => lines.push(text);
  try {
    return { result: fn(), lines: lines.map(l => JSON.parse(l)) };
  } finally {
    Object.assign(console, original);
  }
}

async function captureAsync(fn) {
  const lines = [];
  const original = { info: console.info, warn: console.warn, error: console.error };
  console.info = console.warn = console.error = (text) => lines.push(text);
  try {
    await fn();
  } finally {
    Object.assign(console, original);
  }
  return lines.map(l => JSON.parse(l));
}

test('every line is JSON with a level, an event and a timestamp', () => {
  const { lines } = capture(() => log.info('request', { route: '/api/db' }));
  assert.equal(lines.length, 1);
  assert.equal(lines[0].level, 'info');
  assert.equal(lines[0].event, 'request');
  assert.equal(lines[0].route, '/api/db');
  assert.ok(!Number.isNaN(Date.parse(lines[0].at)));
});

test('secrets are redacted, whatever they are called', () => {
  const { lines } = capture(() => log.info('login', {
    email: 'jane@example.com',
    password: 'hunter2',
    token: 'abc123',
    secret: 'shh',
    authorization: 'Bearer xyz',
    cookie: 'evive_session=…',
    accessCode: 'K7M2QP',
  }));
  const line = lines[0];
  assert.equal(line.email, 'jane@example.com', 'an identifier is how you find the record');
  for (const key of ['password', 'token', 'secret', 'authorization', 'cookie', 'accessCode']) {
    assert.equal(line[key], '[redacted]', `${key} must never reach a log`);
  }
});

test('redaction reaches nested objects', () => {
  const { lines } = capture(() => log.warn('share', { recipient: { email: 'dr@x.com', access_code: 'ABC123' } }));
  assert.equal(lines[0].recipient.access_code, '[redacted]');
  assert.equal(lines[0].recipient.email, 'dr@x.com');
});

test('long strings are truncated so one line cannot carry a document', () => {
  const { lines } = capture(() => log.info('upload', { dataUrl: 'x'.repeat(5000) }));
  assert.ok(lines[0].dataUrl.length < 250);
  assert.ok(lines[0].dataUrl.endsWith('…'));
});

test('levels map to the right console channel', () => {
  const { lines: a } = capture(() => log.error('boom', {}));
  assert.equal(a[0].level, 'error');
  const { lines: b } = capture(() => log.warn('hmm', {}));
  assert.equal(b[0].level, 'warn');
});

test('a wrapped handler logs one line with the status and duration', async () => {
  const handler = withLogging('/api/test', async (req, res) => { res.statusCode = 201; });
  const lines = await captureAsync(() => handler({ method: 'POST' }, { statusCode: 200 }));
  assert.equal(lines.length, 1);
  assert.equal(lines[0].event, 'request');
  assert.equal(lines[0].route, '/api/test');
  assert.equal(lines[0].status, 201);
  assert.equal(typeof lines[0].ms, 'number');
});

test('an unhandled error becomes a 500 and a log line, not a stack in the response', async () => {
  const sent = {};
  const res = {
    statusCode: 200, headersSent: false,
    status(code) { sent.code = code; return this; },
    json(body) { sent.body = body; return this; },
  };
  const handler = withLogging('/api/boom', async () => { throw new Error('database on fire'); });
  const lines = await captureAsync(() => handler({ method: 'GET' }, res));

  assert.equal(sent.code, 500);
  assert.ok(!JSON.stringify(sent.body).includes('database on fire'),
    'the caller gets a neutral message, not the internal failure');
  assert.equal(lines[0].event, 'unhandled');
  assert.equal(lines[0].message, 'database on fire', 'but the log keeps it');
});

test('a handler that already replied is not written over', async () => {
  const res = { statusCode: 200, headersSent: true, status() { throw new Error('must not be called'); } };
  const handler = withLogging('/api/streamed', async () => { throw new Error('late failure'); });
  await captureAsync(() => handler({ method: 'GET' }, res));   // must not throw
});
