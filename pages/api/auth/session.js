import { getSession } from '../../../lib/serverAuth';

/** Lets the browser discover who the server thinks it is. Never trusted as
 *  authorisation — every protected route re-derives identity from the cookie. */
export default function handler(req, res) {
  const s = getSession(req);
  if (!s) return res.status(200).json({ session: null });
  const { role, id, name, email, canReadWelfareNotes, adminRole, employeeId } = s;
  return res.status(200).json({ session: { role, id, name, email, canReadWelfareNotes, adminRole, employeeId } });
}
