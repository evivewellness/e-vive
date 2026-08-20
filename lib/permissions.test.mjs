import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ROLE_DEFAULTS, ALL_PERMISSIONS, PERMISSION_KEYS, TABLE_PERMISSIONS,
  permissionsFor, hasPermission, permissionForTable,
} from './permissions.js';

test('super_admin holds the wildcard and therefore everything', () => {
  const perms = permissionsFor('super_admin');
  for (const key of PERMISSION_KEYS) {
    assert.ok(hasPermission(perms, key), `super_admin should hold ${key}`);
  }
});

test('a narrow role holds only its own keys', () => {
  const finance = permissionsFor('finance_admin');
  assert.ok(hasPermission(finance, 'finance'));
  assert.ok(!hasPermission(finance, 'clients'), 'finance admin must not manage clients');
  assert.ok(!hasPermission(finance, 'quality'), 'finance admin must not read Cardex');
  assert.ok(!hasPermission(finance, 'settings'), 'finance admin must not grant permissions');
});

test('no role but super_admin can grant permissions', () => {
  for (const [role, { permissions }] of Object.entries(ROLE_DEFAULTS)) {
    if (role === 'super_admin') continue;
    assert.ok(!permissions.includes('settings'), `${role} must not hold settings`);
    assert.ok(!permissions.includes('all'), `${role} must not hold the wildcard`);
  }
});

test('an unknown role grants nothing — a typo fails closed', () => {
  assert.deepEqual(permissionsFor('typo_admin'), []);
  assert.equal(hasPermission(permissionsFor('typo_admin'), 'finance'), false);
  assert.equal(hasPermission(undefined, 'finance'), false);
  assert.equal(hasPermission(['all'], undefined), false);
});

test('an explicit grant overrides the role defaults', () => {
  const perms = permissionsFor('finance_admin', ['clients', 'calendar']);
  assert.deepEqual(perms, ['clients', 'calendar']);
  assert.ok(!hasPermission(perms, 'finance'), 'the grant replaces the defaults, it does not add to them');
});

test('an empty grant falls back to the role rather than locking the account out', () => {
  assert.deepEqual(permissionsFor('hca_manager', []), ROLE_DEFAULTS.hca_manager.permissions);
  assert.deepEqual(permissionsFor('hca_manager', null), ROLE_DEFAULTS.hca_manager.permissions);
});

test('every permission key a role hands out is a real key', () => {
  for (const [role, { permissions }] of Object.entries(ROLE_DEFAULTS)) {
    for (const p of permissions) {
      assert.ok(p === 'all' || PERMISSION_KEYS.includes(p), `${role} grants unknown key "${p}"`);
    }
  }
});

test('every table permission names a real key', () => {
  for (const [table, key] of Object.entries(TABLE_PERMISSIONS)) {
    if (key === null) continue;
    assert.ok(PERMISSION_KEYS.includes(key), `${table} maps to unknown permission "${key}"`);
  }
});

test('the sensitive tables are all gated for writes', () => {
  for (const table of ['clients', 'hca_profiles', 'invoices', 'payroll_payments', 'rbac_rules', 'payments']) {
    assert.ok(permissionForTable(table), `${table} writes must require a permission`);
  }
  // The audit trail is the one deliberate exception: nearly every action writes
  // to it, and gating it would mean an admin's own trail could fail to record.
  assert.equal(permissionForTable('activity_log'), null);
});

test('an unmapped table is ungated rather than crashing the gateway', () => {
  assert.equal(permissionForTable('some_future_table'), null);
});

test('granting rbac_rules writes requires the settings permission', () => {
  assert.equal(permissionForTable('rbac_rules'), 'settings');
  const coordinator = permissionsFor('client_coordinator');
  assert.equal(hasPermission(coordinator, 'settings'), false,
    'a coordinator must not be able to widen their own grant');
});

test('the permission list and its labels stay in step', () => {
  assert.equal(ALL_PERMISSIONS.length, PERMISSION_KEYS.length);
  for (const p of ALL_PERMISSIONS) {
    assert.ok(p.key && p.label, 'every permission needs a key and a label');
  }
  assert.equal(new Set(PERMISSION_KEYS).size, PERMISSION_KEYS.length, 'keys must be unique');
});
