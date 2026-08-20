/**
 * Delivering the Cardex notifications families opted into. SERVER ONLY.
 *
 * `cardex_notify_prefs` has been written by the preferences screen since the
 * secure-Cardex release and read by nothing, so a family could switch incident
 * alerts on — they default on — and never hear anything. This is the half that
 * was missing.
 *
 * One rule governs every message here: **no clinical detail leaves the
 * platform.** Email is not a safe channel for health information, and a subject
 * line is visible on a lock screen. So the mail says that something has been
 * recorded and where to read it; the content stays behind the sign-in, where
 * the column policy and the audit trail apply. That is also why the in-app
 * notification and the email carry the same words — the email is a pointer, not
 * a copy.
 */

const APP_LINK = '/client/dashboard';

/** Did this shift record anything the family asked to hear about immediately? */
export function hasIncident(entry) {
  if (!entry) return false;
  if (String(entry.incidents || '').trim()) return true;
  // A flagged special-needs check is an incident by another name.
  return (entry.special_needs_checks || entry.specialNeedsChecks || []).some(c => c?.flagged);
}

async function prefsFor(db, clientId, patientId) {
  const { data } = await db.from('cardex_notify_prefs')
    .select('*').eq('client_id', clientId);
  const rows = data || [];
  // A row for this specific patient wins; a row with a null patient_id is the
  // account-wide default.
  return rows.find(r => r.patient_id === patientId)
      || rows.find(r => !r.patient_id)
      || null;
}

async function deliver(db, origin, { client, subject, body, type }) {
  await db.from('notifications').insert({
    client_id: client.id, type, subject, body,
    email_to: client.email || null, read: false,
  });

  if (!client.email || !origin) return;
  try {
    await fetch(`${origin}/api/send-email`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: client.email, subject, text: body,
        origin: 'system', relatedClientId: client.id,
      }),
    });
  } catch (err) {
    // The in-app notification stands either way; a failed send must not undo it.
    console.error('[cardexNotify] email failed:', err.message);
  }
}

function firstName(name) {
  return String(name || '').trim().split(/\s+/)[0] || 'there';
}

function patientLabel(client, patientId) {
  const p = (client.patients || []).find(x => x.id === patientId);
  return p?.name ? `for ${p.name}` : 'for your family member';
}

/**
 * Called when an HCA submits a Cardex entry. Sends at most one message: an
 * incident alert if the shift recorded one and the family wants those, or a
 * new-report notice if they asked for every report. Never both.
 */
export async function notifyOnCardexEntry(db, entry, { origin } = {}) {
  if (!entry?.client_id) return { sent: false, reason: 'no_client' };

  const { data: client } = await db.from('clients')
    .select('id, name, email, patients').eq('id', entry.client_id).maybeSingle();
  if (!client) return { sent: false, reason: 'client_not_found' };

  const prefs = await prefsFor(db, client.id, entry.patient_id);
  // Incident alerts default on — that is the platform's promise, and the
  // absence of a preferences row is not a decision to stay silent.
  const wantsIncident = prefs ? prefs.on_incident !== false : true;
  const wantsEvery = Boolean(prefs?.on_new_report);

  const incident = hasIncident(entry);
  const who = patientLabel(client, entry.patient_id);
  const when = new Date(entry.submitted_at || Date.now())
    .toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

  if (incident && wantsIncident) {
    await deliver(db, origin, {
      client, type: 'cardex_incident',
      subject: 'An incident was recorded during a care shift',
      body:
        `Dear ${firstName(client.name)},\n\n` +
        `Your HomeCare Assistant recorded an incident ${who} during the shift ending ${when}.\n\n` +
        `The details are in your Care Reports, which you can open after signing in:\n` +
        `${origin || ''}${APP_LINK}\n\n` +
        `We keep the detail off email because it is health information. If this needs ` +
        `urgent attention, call us on +254 141 888 340.\n\n` +
        `The E-Vive Team`,
    });
    return { sent: true, kind: 'incident' };
  }

  if (wantsEvery) {
    await deliver(db, origin, {
      client, type: 'cardex_report',
      subject: 'A new care report is ready',
      body:
        `Dear ${firstName(client.name)},\n\n` +
        `A new care report ${who} was filed for the shift ending ${when}.\n\n` +
        `Read it in your Care Reports:\n${origin || ''}${APP_LINK}\n\n` +
        `To change how often you hear from us, open Care Reports and choose ` +
        `Notification preferences.\n\n` +
        `The E-Vive Team`,
    });
    return { sent: true, kind: 'report' };
  }

  return { sent: false, reason: 'not_subscribed' };
}

const PERIOD_DAYS = { daily: 1, weekly: 7, monthly: 30 };

/**
 * Send the digests due for one frequency. Counts only — how many reports, how
 * many shifts recorded an incident — with the reading itself behind the
 * sign-in.
 *
 * Returns a summary so the cron route can log what it did.
 */
export async function sendDigests(db, frequency, { origin, now = new Date() } = {}) {
  const days = PERIOD_DAYS[frequency];
  if (!days) return { frequency, sent: 0, skipped: 0, error: 'unknown frequency' };

  const since = new Date(now.getTime() - days * 24 * 3600 * 1000).toISOString();

  const { data: prefs } = await db.from('cardex_notify_prefs')
    .select('*').eq('digest_frequency', frequency);

  let sent = 0, skipped = 0;
  for (const pref of prefs || []) {
    const { data: client } = await db.from('clients')
      .select('id, name, email, patients').eq('id', pref.client_id).maybeSingle();
    if (!client) { skipped++; continue; }

    let q = db.from('cardex_entries')
      .select('id, incidents, special_needs_checks, submitted_at')
      .eq('client_id', pref.client_id)
      .gte('submitted_at', since);
    if (pref.patient_id) q = q.eq('patient_id', pref.patient_id);
    const { data: entries } = await q;

    // Nothing happened; sending "0 reports this week" trains people to ignore
    // the sender.
    if (!entries?.length) { skipped++; continue; }

    const incidents = entries.filter(hasIncident).length;
    const label = { daily: 'daily', weekly: 'weekly', monthly: 'monthly' }[frequency];

    await deliver(db, origin, {
      client, type: 'cardex_digest',
      subject: `Your ${label} care summary`,
      body:
        `Dear ${firstName(client.name)},\n\n` +
        `Here is your ${label} summary ${patientLabel(client, pref.patient_id)}:\n\n` +
        `  • ${entries.length} care report${entries.length === 1 ? '' : 's'} filed\n` +
        `  • ${incidents} shift${incidents === 1 ? '' : 's'} recorded an incident\n\n` +
        `Read them in your Care Reports:\n${origin || ''}${APP_LINK}\n\n` +
        `To change how often you hear from us, open Care Reports and choose ` +
        `Notification preferences.\n\n` +
        `The E-Vive Team`,
    });
    sent++;
  }

  return { frequency, sent, skipped };
}
