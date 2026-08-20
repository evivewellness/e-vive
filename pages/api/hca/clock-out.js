/**
 * Clock out of a shift.
 *
 * Location is recorded and checked, but — unlike clock-in — never refused. A
 * carer who cannot end their shift is stuck at work with no way to file their
 * Cardex, and the failure modes here are mundane: the family moved the visit,
 * the phone lost its fix indoors, the coordinates on file are wrong. The record
 * notes where they were and whether it matched; it does not hold them hostage.
 */
import { getSupabaseAdmin, serviceRoleConfigured, configError } from '../../../lib/supabaseAdmin';
import { getSession, sessionSecretConfigured } from '../../../lib/serverAuth';
import { checkClockInLocation, DEFAULT_CLOCK_IN_RADIUS_M } from '../../../lib/geo';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!serviceRoleConfigured() || !sessionSecretConfigured()) return configError(res);

  const session = getSession(req);
  if (!session || session.role !== 'hca') return res.status(401).json({ error: 'Not signed in.' });

  const { shiftId, lat, lng } = req.body || {};
  if (!shiftId) return res.status(400).json({ error: 'shiftId is required.' });

  const db = getSupabaseAdmin();

  // The shift must be this HCA's own.
  const { data: shift } = await db.from('shifts')
    .select('id, hca_id, client_id').eq('id', shiftId).maybeSingle();
  if (!shift || shift.hca_id !== session.id) {
    return res.status(404).json({ error: 'Shift not found.' });
  }

  let client = null;
  if (shift.client_id) {
    const { data } = await db.from('clients').select('lat, lng').eq('id', shift.client_id).maybeSingle();
    client = data;
  }
  const { data: settings } = await db.from('platform_settings')
    .select('clock_in_radius_m').eq('id', 1).maybeSingle();

  const check = checkClockInLocation({
    lat, lng, clientLat: client?.lat, clientLng: client?.lng,
    radiusM: settings?.clock_in_radius_m ?? DEFAULT_CLOCK_IN_RADIUS_M,
  });

  const { data: updated, error } = await db.from('shifts').update({
    status: 'completed',
    clock_out: new Date().toISOString(),
    clock_out_lat: Number.isFinite(Number(lat)) ? Number(lat) : null,
    clock_out_lng: Number.isFinite(Number(lng)) ? Number(lng) : null,
    clock_out_verified: check.verified,
  }).eq('id', shiftId).select().single();
  if (error) return res.status(500).json({ error: error.message });

  await db.from('activity_log').insert({
    type: 'hca_clock_out',
    data: {
      hcaId: session.id, shiftId,
      verified: check.verified,
      distanceM: check.distance == null ? null : Math.round(check.distance),
    },
  }).then(() => {}, () => {});

  return res.status(200).json({
    shift: { id: updated.id, status: updated.status, clockOut: updated.clock_out },
    verified: check.verified,
    distance: check.distance == null ? null : Math.round(check.distance),
  });
}
