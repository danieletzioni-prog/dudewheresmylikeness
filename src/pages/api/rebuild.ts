import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * Cron-triggered redeploy endpoint.
 *
 * Vercel hits this URL once a day (see vercel.json `crons`). We POST to a
 * Vercel Deploy Hook URL stored in the `DEPLOY_HOOK_URL` env var, which
 * triggers a fresh build of the project. The build runs `npm run build`,
 * which runs `aggregate` first → fetches all RSS feeds → writes a fresh
 * src/data/aggregated-feed.json → then `astro build` produces the static
 * site with the new feed embedded.
 *
 * The endpoint returns 200 even on failure of the deploy-hook POST so
 * Vercel doesn't retry-storm. Failures are logged to the function log.
 *
 * Setup:
 *   1. In Vercel dashboard → Project → Settings → Git → "Deploy Hooks":
 *      create a hook (any name; ref = main).
 *   2. Copy the URL it gives you (https://api.vercel.com/v1/integrations/deploy/...).
 *   3. Add it as Project → Settings → Environment Variables:
 *        DEPLOY_HOOK_URL = <the URL>
 *      Apply to Production. Redeploy once so the env var takes effect.
 *
 * Optional shared-secret: set CRON_SECRET, then Vercel automatically adds
 * `Authorization: Bearer $CRON_SECRET` to the cron request and we verify it.
 */
export const GET: APIRoute = async ({ request }) => {
  const url = process.env.DEPLOY_HOOK_URL;
  const secret = process.env.CRON_SECRET;

  if (secret) {
    const auth = request.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${secret}`) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  if (!url) {
    console.error('[cron] DEPLOY_HOOK_URL is not set; skipping redeploy.');
    return new Response(
      JSON.stringify({ ok: false, reason: 'DEPLOY_HOOK_URL not configured' }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }

  try {
    const res = await fetch(url, { method: 'POST' });
    const body = await res.text();
    console.log(`[cron] deploy hook responded ${res.status}: ${body.slice(0, 200)}`);
    return new Response(
      JSON.stringify({ ok: res.ok, hookStatus: res.status, body: body.slice(0, 500) }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('[cron] deploy hook fetch failed:', err?.message ?? err);
    return new Response(
      JSON.stringify({ ok: false, reason: 'fetch failed', error: String(err?.message ?? err) }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }
};
