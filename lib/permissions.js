/**
 * Admin permissions: the roles, the keys, and which key governs what.
 *
 * This module is deliberately pure — no database, no secrets — so the same
 * definitions serve the API routes that *enforce* permissions and the dashboard
 * that *reflects* them. Before this existed the keys were declared, displayed,
 * and never checked.
 *
 * The model:
 *
 *   - Every admin has a role. A role carries a default set of permission keys.
 *   - A grant in `rbac_rules`, keyed by the admin's email, overrides those
 *     defaults for that person.
 *   - `'all'` is a wildcard, held by super_admin.
 *   - Permissions are resolved once, at sign-in, into the signed session cookie.
 *     Nothing re-reads them per request, and nothing trusts the browser's copy.
 *
 * Reads and writes are governed differently, and on purpose. Any signed-in
 * admin may *read* the operational tables, because almost every screen composes
 * across them — an Overview that could not count clients would be useless. What
 * an admin may *change* is governed by these keys, and so is which tabs they
 * see. The genuinely sensitive reads are gated separately and more tightly:
 * Cardex behind `quality`, and staff welfare notes behind
 * `admin_users.can_read_welfare_notes`, which no role grants implicitly.
 */

export const ROLE_DEFAULTS = {
  super_admin:        { label: 'Super Admin',          permissions: ['all'] },
  finance_admin:      { label: 'Finance Admin',        permissions: ['finance', 'pricing', 'overview'] },
  client_coordinator: { label: 'Client Coordinator',   permissions: ['clients', 'calendar', 'messages', 'overview'] },
  hca_manager:        { label: 'HCA Account Manager',  permissions: ['hcas', 'calendar', 'quality', 'overview'] },
  hr_admin:           { label: 'HR / Training Admin',  permissions: ['training', 'calendar', 'hcas', 'hub', 'overview'] },
};

/** One key per dashboard area, so the RBAC screen describes the whole surface. */
export const ALL_PERMISSIONS = [
  { key: 'overview',      label: 'Overview / Dashboard' },
  { key: 'messages',      label: 'Messages'             },
  { key: 'hcas',          label: 'HCA Management'       },
  { key: 'clients',       label: 'Client Management'    },
  { key: 'quality',       label: 'Care Quality'         },
  { key: 'training',      label: 'Training'             },
  { key: 'calendar',      label: 'Calendar / HR'        },
  { key: 'finance',       label: 'Finance'              },
  { key: 'announcements', label: 'Announcements'        },
  { key: 'newsletter',    label: 'Newsletter'           },
  { key: 'pricing',       label: 'Pricing & Offers'     },
  { key: 'hub',           label: 'Family Hub'           },
  { key: 'map',           label: 'Map View'             },
  { key: 'settings',      label: 'Settings / RBAC'      },
];

export const PERMISSION_KEYS = ALL_PERMISSIONS.map(p => p.key);

/**
 * Which permission governs *changing* a table. Reads are open to any admin;
 * see the note at the top of this file for why.
 */
export const TABLE_PERMISSIONS = {
  clients:             'clients',
  notifications:       'clients',
  hca_profiles:        'hcas',
  hca_applications:    'hcas',
  placements:          'calendar',
  shifts:              'calendar',
  calendar_events:     'calendar',
  invoices:            'finance',
  expenses:            'finance',
  payroll_payments:    'finance',
  payments:            'finance',
  pricing_config:      'pricing',
  discount_codes:      'pricing',
  emails:              'messages',
  announcements:       'announcements',
  newsletters:         'newsletter',
  lms_courses:         'training',
  lms_enrollments:     'training',
  lms_submissions:     'training',
  hub_referrals:       'hub',
  hub_access_requests: 'hub',
  map_markers:         'map',
  rbac_rules:          'settings',
  // activity_log is append-only and written by nearly every action; gating it
  // would mean an admin's own audit trail could fail to record.
  activity_log:        null,
};

/**
 * The permissions an admin actually holds: an explicit grant if there is one,
 * otherwise their role's defaults. An unknown role grants nothing, so a typo in
 * the database fails closed.
 */
export function permissionsFor(role, explicitGrant) {
  if (Array.isArray(explicitGrant) && explicitGrant.length) return explicitGrant;
  return ROLE_DEFAULTS[role]?.permissions || [];
}

/**
 * Does this set of permissions include `perm`?
 *
 * Accepts either a permission array or a role key, because the dashboard has
 * both to hand in different places.
 */
export function hasPermission(roleOrPerms, perm) {
  if (!roleOrPerms || !perm) return false;
  const perms = Array.isArray(roleOrPerms)
    ? roleOrPerms
    : (ROLE_DEFAULTS[roleOrPerms]?.permissions || []);
  return perms.includes('all') || perms.includes(perm);
}

/** The permission needed to write this table, or null if writes are ungated. */
export function permissionForTable(table) {
  return Object.prototype.hasOwnProperty.call(TABLE_PERMISSIONS, table)
    ? TABLE_PERMISSIONS[table]
    : null;
}
