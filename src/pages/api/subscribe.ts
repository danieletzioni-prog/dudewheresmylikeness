import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * Buttondown subscribe proxy.
 *
 * The browser POSTs { email, tags?: string[] } to /api/subscribe. This
 * function reads the API key from the BUTTONDOWN_API_KEY env var and
 * forwards the subscription to Buttondown's API server-side, so the key
 * is never exposed to the client.
 *
 *   Setup (when ready to go live):
 *     1. Sign up / log in at buttondown.email
 *     2. Settings → Programming → API → copy your API key
 *     3. In the Vercel dashboard: Settings → Environment Variables → add
 *          BUTTONDOWN_API_KEY = <key>
 *        Apply to Production. Redeploy once.
 *
 *   Until BUTTONDOWN_API_KEY is set, the endpoint returns a
 *   `{ ok: true, simulated: true }` response so the UI is testable.
 *   No data is persisted in simulation mode (the email is logged to the
 *   function log only).
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// TODO[buttondown]: confirm this endpoint shape against current Buttondown
// API docs when adding the key. Their tags field has changed shape across
// versions (sometimes objects, sometimes strings).
const BUTTONDOWN_URL = 'https://api.buttondown.email/v1/subscribers';

export const POST: APIRoute = async ({ request }) => {
  let payload: { email?: string; tags?: string[] };
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON body' }, 400);
  }

  const email = (payload?.email ?? '').toString().trim().toLowerCase();
  const tags = Array.isArray(payload?.tags)
    ? payload.tags.filter((t): t is string => typeof t === 'string' && t.length <= 60)
    : [];

  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return json({ ok: false, error: 'Please enter a valid email address.' }, 400);
  }

  const key = process.env.BUTTONDOWN_API_KEY;

  // Simulation mode — no key configured yet. Return success so the UI
  // is fully testable; log the would-be subscriber.
  if (!key) {
    console.log(`[subscribe] simulated: ${email} tags=${JSON.stringify(tags)}`);
    return json({ ok: true, simulated: true });
  }

  try {
    const res = await fetch(BUTTONDOWN_URL, {
      method: 'POST',
      headers: {
        'authorization': `Token ${key}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        // Buttondown accepts either string array or object array depending
        // on plan/version; arr-of-strings is the documented baseline.
        tags,
      }),
    });

    const text = await res.text();

    if (res.status === 201 || res.status === 200) {
      return json({ ok: true });
    }

    // 400 from Buttondown is most often "already subscribed" — treat as success.
    if (res.status === 400 && /already subscribed|already exists/i.test(text)) {
      return json({ ok: true, alreadySubscribed: true });
    }

    console.error(`[subscribe] Buttondown ${res.status}: ${text.slice(0, 300)}`);
    return json({ ok: false, error: 'Subscription failed. Please try again later.' }, 502);
  } catch (err: any) {
    console.error('[subscribe] fetch failed:', err?.message ?? err);
    return json({ ok: false, error: 'Subscription failed. Please try again later.' }, 502);
  }
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
