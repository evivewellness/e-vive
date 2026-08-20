/**
 * File uploads, out of Postgres and into object storage.
 *
 * Certificates and profile photos were base64 strings inside
 * `hca_applications.form_data`. A row could carry several megabytes, so any
 * query that touched the column had to read all of it — which is what caused
 * the live statement timeout on the applications list. Excluding the column
 * from list queries treated the symptom; this moves the files.
 *
 * The bucket is private. Nothing here returns a public URL: reads go through
 * /api/uploads/[...path], which mints a short-lived signed URL after checking
 * who is asking.
 *
 * **It falls back.** If the bucket does not exist — a deployment where the
 * storage step has not been run — the route says so and the caller keeps the
 * inline base64 it already has. An applicant should not lose their certificates
 * because an ops step is outstanding.
 */
import { getSupabaseAdmin, serviceRoleConfigured, configError } from '../../lib/supabaseAdmin';
import { getSession } from '../../lib/serverAuth';
import { consumeRateLimit, clientIp, tooManyRequests, LIMITS } from '../../lib/rateLimit';
import { randomBytes } from 'crypto';

export const BUCKET = 'hca-documents';

const MAX_BYTES = 10 * 1024 * 1024;   // same 10 MB the form enforces
const ALLOWED = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

// Bodies are base64 data URLs; Next's default 1 MB parser limit would reject
// most real certificate scans.
export const config = { api: { bodyParser: { sizeLimit: '14mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!serviceRoleConfigured()) return configError(res);

  const db = getSupabaseAdmin();

  // Applicants have no account, so uploading is open — and therefore throttled
  // by source, on the same budget as submitting an application.
  const session = getSession(req);
  if (!session) {
    const gate = await consumeRateLimit(db, { key: `upload:ip:${clientIp(req)}`, ...LIMITS.applicationPerIp });
    if (!gate.ok) return tooManyRequests(res, gate.retryAfter, 'Too many uploads from here. Please try again later.');
  }

  const { dataUrl, kind = 'certificate' } = req.body || {};
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return res.status(400).json({ error: 'Expected a base64 data URL.' });

  const { mime, buffer } = parsed;
  const ext = ALLOWED[mime];
  if (!ext) return res.status(415).json({ error: 'Only JPG, PNG, WebP and PDF files are accepted.' });
  if (buffer.length > MAX_BYTES) {
    return res.status(413).json({ error: 'That file is larger than 10 MB.' });
  }

  // Unguessable path: the object key is never a credential on its own, but
  // there is no reason to make it enumerable either.
  const folder = kind === 'photo' ? 'photos' : 'certificates';
  const path = `${folder}/${new Date().toISOString().slice(0, 7)}/${randomBytes(16).toString('hex')}.${ext}`;

  const { error } = await db.storage.from(BUCKET).upload(path, buffer, {
    contentType: mime,
    upsert: false,
  });

  if (error) {
    // A missing bucket is an ops step, not a user error. Say so plainly and let
    // the caller keep what it has.
    const missing = /not found|does not exist/i.test(error.message || '');
    console.error('[uploads] storage upload failed:', error.message);
    return res.status(missing ? 503 : 500).json({
      error: missing
        ? `Storage bucket "${BUCKET}" does not exist. Create it (private) in the Supabase dashboard.`
        : 'Could not store the file. Please try again.',
      fallback: true,
    });
  }

  return res.status(200).json({ path, mime, size: buffer.length });
}

/** data:<mime>;base64,<payload> → { mime, buffer }, or null. */
function parseDataUrl(value) {
  if (typeof value !== 'string') return null;
  const m = /^data:([\w/+.-]+);base64,(.+)$/s.exec(value);
  if (!m) return null;
  try {
    return { mime: m[1], buffer: Buffer.from(m[2], 'base64') };
  } catch {
    return null;
  }
}
