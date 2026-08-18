import { test } from 'node:test';
import assert from 'node:assert/strict';
import { supabase } from './supabase.js';

/**
 * The shim's job is to describe a query faithfully enough that /api/db can
 * replay it. These check the shapes lib/store.js actually builds — if one of
 * them drifts, a page silently reads the wrong rows.
 */

test('a plain read carries table, columns, filters and ordering', () => {
  const q = supabase.from('clients').select('*').eq('id', 'c-1')
    .order('created_at', { ascending: false }).limit(10);
  assert.deepEqual(q.req, {
    table: 'clients', action: 'select', columns: '*',
    filters: [{ column: 'id', op: 'eq', value: 'c-1' }],
    order: { column: 'created_at', ascending: false },
    limit: 10,
  });
});

test('ascending defaults to true, matching supabase-js', () => {
  assert.equal(supabase.from('shifts').select('*').order('date').req.order.ascending, true);
  assert.equal(supabase.from('shifts').select('*').order('date', {}).req.order.ascending, true);
});

test('select after a write means "return the affected rows", not a new read', () => {
  const q = supabase.from('shifts').update({ status: 'completed' }).eq('id', 's-1').select().single();
  assert.equal(q.req.action, 'update');
  assert.deepEqual(q.req.payload, { status: 'completed' });
  assert.equal(q.req.single, 'single');
  assert.deepEqual(q.req.filters, [{ column: 'id', op: 'eq', value: 's-1' }]);
});

test('insert, upsert and delete each keep their action', () => {
  assert.equal(supabase.from('emails').insert({ subject: 'x' }).req.action, 'insert');
  assert.equal(supabase.from('pricing_config').upsert({ id: 1 }).req.action, 'upsert');
  assert.equal(supabase.from('shifts').delete().eq('id', '1').req.action, 'delete');
});

test('a head count is carried through', () => {
  const q = supabase.from('invoices').select('*', { count: 'exact', head: true });
  assert.equal(q.req.count, 'exact');
  assert.equal(q.req.head, true);
});

test('every filter operator store.js uses round-trips', () => {
  const q = supabase.from('shifts').select('*')
    .eq('a', 1).neq('b', 2).gt('c', 3).gte('d', 4).lt('e', 5).lte('f', 6)
    .ilike('g', 'x').is('h', null).in('i', [1, 2]);
  assert.deepEqual(q.req.filters.map(f => f.op),
    ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'ilike', 'is', 'in']);
});

test('or() is carried as its own filter entry', () => {
  const q = supabase.from('notifications').select('*').or('client_id.eq.1,client_id.is.null');
  assert.deepEqual(q.req.filters, [{ or: 'client_id.eq.1,client_id.is.null' }]);
});

test('maybeSingle and single are distinguished', () => {
  assert.equal(supabase.from('clients').select('*').maybeSingle().req.single, 'maybeSingle');
  assert.equal(supabase.from('clients').select('*').single().req.single, 'single');
});

test('running server-side throws rather than silently bypassing the gateway', async () => {
  // A hard programmer error, not a data error: it must surface, not land in an
  // `error` field a caller might ignore.
  await assert.rejects(
    () => supabase.from('clients').select('*'),
    /cannot run server-side/,
  );
});
