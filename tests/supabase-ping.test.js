import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import handler from '../api/ping.js';

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };
afterEach(() => {
  globalThis.fetch = originalFetch;
  process.env = { ...originalEnv };
});

function response() {
  return {
    headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
  };
}
function configure() {
  process.env.SUPABASE_URL = 'https://example.supabase.co/rest/v1/';
  process.env.SUPABASE_ANON_KEY = 'test-anon-key';
  delete process.env.CRON_SECRET;
}
const request = { method: 'GET', headers: { 'user-agent': 'vercel-cron/1.0' } };

test('cron queries the DB, accepts an empty RLS result, and disables caching', async () => {
  configure();
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://example.supabase.co/rest/v1/categories?select=id&limit=1');
    assert.ok(options.signal);
    return { ok: true, json: async () => [] };
  };
  const res = response();
  await handler(request, res);
  assert.equal(res.code, 200);
  assert.equal(res.body.trigger, 'vercel-cron');
  assert.equal(res.headers['Cache-Control'], 'no-store');
});

test('a failed database query cannot be masked by a root endpoint fallback', async () => {
  configure();
  let calls = 0;
  globalThis.fetch = async () => { calls++; return { ok: false, status: 401 }; };
  const res = response();
  await handler(request, res);
  assert.equal(res.code, 502);
  assert.equal(res.body.success, false);
  assert.equal(res.body.upstreamStatus, 401);
  assert.equal(calls, 1);
});

test('transient network errors are retried once', async () => {
  configure();
  let calls = 0;
  globalThis.fetch = async () => {
    if (++calls === 1) throw new Error('timeout');
    return { ok: true, json: async () => [] };
  };
  const res = response();
  await handler(request, res);
  assert.equal(res.code, 200);
  assert.equal(res.body.attempts, 2);
});

test('persistent upstream failures terminate after two attempts', async () => {
  configure();
  globalThis.fetch = async () => ({ ok: false, status: 503 });
  const res = response();
  await handler(request, res);
  assert.equal(res.code, 502);
  assert.equal(res.body.attempts, 2);
});

test('configuration, method and optional cron authentication are checked', async () => {
  configure();
  globalThis.fetch = async () => assert.fail('must not query');
  const post = response();
  await handler({ ...request, method: 'POST' }, post);
  assert.equal(post.code, 405);
  process.env.CRON_SECRET = 'test-secret';
  const unauthorized = response();
  await handler(request, unauthorized);
  assert.equal(unauthorized.code, 401);
  delete process.env.CRON_SECRET;
  delete process.env.SUPABASE_URL;
  delete process.env.VITE_SUPABASE_URL;
  const missing = response();
  await handler(request, missing);
  assert.equal(missing.code, 503);
});

test('browser failure preserves last success, retries after cooldown and deduplicates calls', async () => {
  const values = new Map();
  let now = Date.now();
  let calls = 0;
  let fail = true;
  const query = { select() { return this; }, limit() { return this; }, async abortSignal() {
    calls++;
    return { error: fail ? { message: 'database unavailable' } : null };
  } };
  const module = { exports: {} };
  const source = ts.transpileModule(readFileSync(new URL('../src/lib/supabasePing.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  class Clock extends Date { static now() { return now; } }
  vm.runInNewContext(source, {
    exports: module.exports,
    require: () => ({ supabase: { from: () => query }, isSupabaseConfigured: () => true, supabaseUrl: 'https://example.supabase.co' }),
    localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) },
    window: { dispatchEvent() {} }, CustomEvent: class {},
    Date: Clock, performance, AbortSignal, console,
  });
  const ping = module.exports;
  const previousSuccess = now - 4 * 86400000;
  values.set('ft_supabase_last_ping', String(previousSuccess));
  assert.equal(await ping.checkAndTriggerAutoPing(), false);
  assert.equal(values.get('ft_supabase_last_ping'), String(previousSuccess));
  assert.equal(await ping.checkAndTriggerAutoPing(), false);
  assert.equal(calls, 1);
  now += 5 * 60 * 1000;
  fail = false;
  const results = await Promise.all([ping.checkAndTriggerAutoPing(), ping.checkAndTriggerAutoPing()]);
  assert.deepEqual(results, [true, false]);
  assert.equal(values.get('ft_supabase_last_ping'), String(now));
  assert.equal(await ping.checkAndTriggerAutoPing(), false);
  assert.equal(calls, 2);
});
