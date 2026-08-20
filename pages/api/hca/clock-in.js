/**
 * Clock in to a shift, with the location check enforced here rather than in
 * the browser.
 *
 * The check existed before, in `pages/hca/dashboard.jsx`, which made it advice:
 * anyone willing to open devtools could clock in from anywhere, and the shift
 * row recorded coordinates nobody had actually compared to anything. It now
 * runs server-side, against the client's recorded position, at a radius the
 * business can configure.
 *
 * The outcome is recorded either way. A clock-in that could not be verified —
 * no device location, no coordinates on file for the client — is allowed and
 * marked unverified, because refusing to let a carer start work over a missing
 * database field would be the wrong failure. Payroll can see which is which.
 */
import { getSupabaseAdmin, serviceRoleConfigured, configError } from '../../../lib/supabaseAdmin';
import { getSession, sessionSecretConfigured } from '../../../lib/serverAuth';
import { checkClockInLocation, DEFAULT_CLOCK_IN_RADIUS_M } from '../../../lib/geo';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!serviceRoleConfigured() || !sessionSecretConfigured()) return configError(res);

  const session = getSession(req);
  if (!session || session.role !== 'hca') return res.status(401).json({ error: 'Not signed in.' });

  const { clientId, patientId, lat, lng } = req.body || {};
  const db = getSupabaseAdmin();
  const today = todayIso();
  const now = new Date().toISOString();

  // The HCA must actually be placed with this family. Without this, the
  // location check is the only thing standing between an HCA and clocking in
  // against someone else's placement.
  let client = null;
  if (clientId) {
    const [{ data: placements }, { data: clientRow }] = await Promise.all([
      db.from('placements').select('id, status')
        .eq('hca_id', session.id).eq('client_id', clientId).neq('status', 'cancelled'),
      db.from('clients').select('id, lat, lng, assigned_hca_id').eq('id', clientId).maybeSingle(),
    ]);
    const placed = (placements || []).length > 0 || clientRow?.assigned_hca_id === session.id;
    if (!placed) {
      return res.status(403).json({ error: 'You are not placed with this client.' });
    }
    client = clientRow;
  }

  // Radius is a business decision, not a source constant.
  const { data: settings } = await db.from('platform_settings')
    .select('clock_in_radius_m').eq('id', 1).maybeSingle();
  const radiusM = settings?.clock_in_radius_m ?? DEFAULT_CLOCK_IN_RADIUS_M;

  const check = checkClockInLocation({
    lat, lng, clientLat: client?.lat, clientLng: client?.lng, radiusM,
  });

  if (!check.allowed) {
    return res.status(403).json({
      error: `You are about ${Math.round(check.distance)} m from the client's address. `
           + `You need to be within ${radiusM} m to clock in.`,
      distance: Math.round(check.distance),
      radiusM,
    });
  }

  const patch = {
    status: 'in-progress',
    clock_in: now,
    clock_in_lat: Number.isFinite(Number(lat)) ? Number(lat) : null,
    clock_in_lng: Number.isFinite(Number(lng)) ? Number(lng) : null,
    clock_in_verified: check.verified,
    clock_in_distance_m: check.distance == null ? null : Math.round(check.distance),
  };

  // Prefer the shift already scheduled for today; otherwise open one.
  const { data: existing } = await db.from('shifts')
    .select('id').eq('hca_id', session.id).eq('date', today).eq('status', 'scheduled').maybeSingle();

  let shift;
  if (existing) {
    const { data, error } = await db.from('shifts').update(patch).eq('id', existing.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    shift = data;
  } else {
    const { data, error } = await db.from('shifts').insert({
      hca_id: session.id,
      client_id: clientId || null,
      patient_id: patientId || null,
      date: today,
      type: 'day',
      start_time: '07:00',
      ...patch,
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    shift = data;
  }

  await db.from('activity_log').insert({
    type: 'hca_clock_in',
    data: {
      hcaId: session.id, shiftId: shift.id, clientId: clientId || null,
      verified: check.verified, distanceM: patch.clock_in_distance_m, reason: check.reason,
    },
  }).then(() => {}, () => {});

  return res.status(200).json({
    shift: { id: shift.id, status: shift.status, clockIn: shift.clock_in },
    verified: check.verified,
    distance: patch.clock_in_distance_m,
    reason: check.reason,
  });
}
