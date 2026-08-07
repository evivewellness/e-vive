import { clearedSessionCookie } from '../../../lib/serverAuth';

export default function handler(req, res) {
  res.setHeader('Set-Cookie', clearedSessionCookie());
  return res.status(200).json({ ok: true });
}
