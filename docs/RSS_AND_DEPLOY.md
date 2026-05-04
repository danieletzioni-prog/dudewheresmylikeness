# RSS Feed Aggregator & Vercel Cron Setup

Build-time RSS aggregation. The site is fully static; the only dynamic
piece is one tiny serverless endpoint (`/api/rebuild`) that Vercel hits
once a day to trigger a rebuild, which re-fetches all feeds.

---

## How it works

```
            ┌──────────────────────┐
   cron ──► │  /api/rebuild        │ ── POST ──► Vercel Deploy Hook ──► new build
            └──────────────────────┘                                       │
                                                                           ▼
                                                          ┌────────────────────────┐
                                                          │  npm run build         │
                                                          │   1. aggregate-feeds   │  ◄── 14 RSS feeds
                                                          │      → src/data/       │
                                                          │        aggregated-     │
                                                          │        feed.json       │
                                                          │   2. astro build       │
                                                          └────────────────────────┘
                                                                           │
                                                                           ▼
                                                              static site, fresh feed
```

**Why Option A (build-time)** — site stays purely static (fast, cheap, no
cold starts), feed updates daily (more than enough for editorial-pace
news), zero managed infra beyond Vercel itself.

---

## Files

| File | Role |
|---|---|
| `scripts/aggregate-feeds.mjs` | Fetches all RSS feeds, normalizes, filters by keyword whitelist, auto-tags, dedupes, writes `src/data/aggregated-feed.json`. Idempotent. |
| `src/data/aggregated-feed.json` | Build artifact — 200 most recent matching items. **Committed** (so dev runs without an aggregate first; CI overwrites). |
| `src/data/featured-stories.json` | **Hand-curated** featured cards. Pinned to the top of `/feed` and the homepage section. Edit this to add/remove featured stories. |
| `src/pages/feed/index.astro` | Full archive view at `/feed`. Featured section + filterable list. |
| `src/pages/index.astro` (feed section) | Homepage preview — featured + 6 most recent. |
| `src/pages/api/rebuild.ts` | Serverless endpoint Vercel cron hits daily; POSTs to a Deploy Hook. |
| `vercel.json` | Cron schedule (`0 14 * * *` = 14:00 UTC daily). |
| `astro.config.mjs` | Adds `@astrojs/vercel` adapter so the API endpoint compiles as a serverless function. The site is otherwise static. |

---

## Sources (validated against live RSS as of May 2026)

12 sources, 14 endpoints. See `SOURCES` in `scripts/aggregate-feeds.mjs`.

| ID | Source | Notes |
|---|---|---|
| `hollywoodreporter` | The Hollywood Reporter | General feed; matches happen when they cover the beat directly |
| `variety` | Variety | Same |
| `verge-policy` | The Verge — Policy | Section feed |
| `techcrunch-ai` | TechCrunch — AI | Section feed |
| `billboard-business` | Billboard — Business | Section feed |
| `sagaftra` | SAG-AFTRA | Union news; lower volume |
| `copyright-office` | U.S. Copyright Office | Govt; low volume but high-signal |
| `volokh` | Volokh Conspiracy | Legal blog; commentary |
| `ipwatchdog` | IPWatchdog | IP-law focused |
| `fedreg-ai` | Federal Register — AI | Govt rulemaking |
| `gn-likeness` | Google News — likeness/deepfake/replica | Keyword-scoped |
| `gn-platforms` | Google News — YouTube/TikTok/Meta + AI likeness | Keyword-scoped |
| `gn-legislation` | Google News — ELVIS Act/NO FAKES/AB 2602/AB 1836 | Keyword-scoped |
| `gn-litigation` | Google News — lawsuit + ROP/deepfake/replica | Keyword-scoped |

**Dropped:**
- Mondaq IP feed — all entrypoints return 404. Replaced by IPWatchdog + Google News.
- Law360 IP — paywalled, RSS not publicly accessible.
- Per-state legislature feeds (CA / TN / NY / IL / WA) — none expose general legislative RSS in a useful way. Replaced by `gn-legislation` keyword query.

---

## Filter & tagging

**Keyword whitelist** (any match keeps the item — see `KEYWORDS` in the
script): `deepfake`, `digital replica`, `right of publicity`, `likeness`,
`AI voice`, `voice clone`, `voice cloning`, `ELVIS Act`, `NO FAKES Act`,
`NCII`, `non-consensual intimate`, `synthetic media`, `AI Act`, `YouTube AI`,
`TikTok AI`, `Meta AI`, `face swap`, `AI deepfake`.

**Tag rules** — each item gets one or more of: `legislation`,
`platform-policy`, `litigation`, `industry-news`. See `TAG_RULES`.

---

## Local commands

```bash
npm run aggregate          # fetch feeds and write aggregated-feed.json
npm run dev                # preview at http://127.0.0.1:4321/
npm run build              # aggregate + astro build (full prod build)
npm run build:no-aggregate # skip aggregate (faster local rebuilds)
```

Editing `src/data/featured-stories.json` is a content edit — no code change
needed. Changes appear on the next dev hot-reload or build.

---

## Deploy + cron setup (do this once, in the Vercel dashboard)

> **Prerequisite:** project pushed to GitHub and imported into Vercel.
> The site builds locally as-is — these steps are for going live.

### 1. Import the project into Vercel
1. Push the repo to GitHub.
2. Vercel dashboard → **Add New** → **Project** → import the GitHub repo.
3. Framework preset auto-detects as **Astro**. Leave defaults; the
   `@astrojs/vercel` adapter handles the rest.
4. Click **Deploy**. First deploy will run `npm run build` which includes
   the aggregator — should take ~30 seconds.

### 2. Create a Deploy Hook
1. In the deployed project: **Settings** → **Git** → scroll to **Deploy Hooks**.
2. **Create Hook**:
   - Hook Name: `daily-rss-rebuild`
   - Git Branch Name: `main` (or whatever your production branch is)
3. Click **Create Hook**. Vercel gives you a URL like
   `https://api.vercel.com/v1/integrations/deploy/prj_XXX/YYY`.
4. **Copy the URL.**

### 3. Add the URL as an environment variable
1. **Settings** → **Environment Variables**.
2. **Add**:
   - Key: `DEPLOY_HOOK_URL`
   - Value: paste the URL from step 2
   - Environments: ✅ **Production** (uncheck Preview / Development)
3. Click **Save**.
4. *(Optional, recommended)* Add a second variable `CRON_SECRET` with a
   random value (e.g., `openssl rand -hex 32`). Vercel automatically
   passes this as a Bearer token to scheduled cron requests, and our
   endpoint will reject calls that don't have it. Without it, anyone who
   knows the URL can trigger a rebuild.

### 4. Trigger one redeploy so the env var takes effect
**Deployments** → top-right `…` on the latest production deployment →
**Redeploy**. This bakes the env var into the running function.

### 5. Verify the cron is registered
1. **Settings** → **Cron Jobs**. You should see one entry:
   - Path: `/api/rebuild`
   - Schedule: `0 14 * * *` (14:00 UTC daily)
2. Click the **▶ Run** button next to it to manually trigger it once.
3. Within ~10s, **Deployments** should show a new deployment in progress
   with source "Deploy Hook." That's the proof of life.

### Changing the schedule

Edit the `schedule` cron expression in `vercel.json` and redeploy.
Examples:
- `0 14 * * *` — once daily at 14:00 UTC (current)
- `0 */6 * * *` — every 6 hours
- `0 13 * * 1-5` — weekdays only at 13:00 UTC

> Vercel's free tier supports up to 2 cron jobs. Daily is fine on free.

---

## Adding / removing feeds

Edit `SOURCES` in `scripts/aggregate-feeds.mjs`. Validate the new feed
returns 200 + valid XML first:

```bash
curl -sSL -o /tmp/check.xml -w '%{http_code}\n' "https://example.com/feed/" && \
  grep -E '<(rss|feed|RDF)\b' /tmp/check.xml > /dev/null && echo "valid xml"
```

Then `npm run aggregate` to verify it pulls items locally.

## Pinning a featured story

Edit `src/data/featured-stories.json`. The `items[]` array shape:

```json
{
  "id": "https://canonical-url-here",
  "featured": true,
  "source": "TechCrunch",
  "title": "...",
  "url": "https://...",
  "summary": "1–3 sentences",
  "blurb": "Editorial commentary, italicized in the card",
  "publishedAt": "2026-04-21T00:00:00.000Z",
  "tags": ["platform-policy", "industry-news"],
  "primarySourceUrl": "https://blog.youtube/...",     // optional
  "primarySourceLabel": "YouTube blog post"           // optional
}
```

If `id` matches an item also picked up by the auto-aggregator, the
featured version wins (the auto version is filtered out).

---

## Cost & operational notes

- **Aggregator runtime**: ~5–10s. All fetches in parallel.
- **Build time impact**: ~5s on top of normal Astro build.
- **Vercel function invocations**: 1/day for cron + 1/build during
  deploys. Effectively free.
- **Cache**: each aggregator run is fresh — no caching layer. Could add
  conditional GET (`If-Modified-Since`) per feed if you want to be
  polite to publishers. Not needed at this volume.

---

## Failure modes

| Symptom | Likely cause | Fix |
|---|---|---|
| Cron runs but no new deploy | `DEPLOY_HOOK_URL` not set or wrong | Re-check env var; redeploy once after adding it |
| Cron returns 401 | `CRON_SECRET` set but Vercel header doesn't match | Vercel adds the header automatically — make sure it's the same value as the env var |
| Aggregator skips a feed silently | That feed returned non-2xx or invalid XML | Check build logs for `! {sourceId} HTTP NNN`; remove or fix the source |
| Feed shows stale dates | Aggregator ran but most items lack `pubDate` | Some sources don't expose dates well — those items sort to the bottom |
| Build fails with `DEPLOY_HOOK_URL not configured` | Aggregator script has nothing to do with this — it's the cron endpoint at runtime | Set the env var; the build itself doesn't need it |
