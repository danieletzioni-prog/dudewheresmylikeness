# HANDOFF.md

**Purpose**: orient a future Claude Code session in 5 minutes. Read this before doing anything.

Last updated: **May 10, 2026**

---

## TL;DR — where things stand

- **Live URL**: https://www.dudewheresmylikeness.ai (also `https://dudewheresmylikeness.ai` and the `.com` apex/`www` redirect to it)
- **Repo**: `github.com/danieletzioni-prog/dudewheresmylikeness` on `main`
- **Last successful production deploy**: commit `a37247a` ("Fix: button text disappears on hover") — auto-deployed via Vercel on push.
- **Working tree right now**: `KutcherWidget.astro` and `global.css` modified, **uncommitted**, mid-task. See § Mid-flight work below.
- **No known production bugs** as of `a37247a`.

---

## Mid-flight work (uncommitted)

A multi-part homepage update is in progress. Part 1 of 2 is done locally:

- **Part 1 — DONE locally**: Kutcher widget renamed "The Kutcher Clock" with new title treatment. Widget bumped to 380px wide × `scale-90` (effective ~342px), title on one line in navy blue Fredoka One, caption wraps to 3 lines in 14.875px amber, counter on one line in text-3xl. User approved the visual.
- **Part 2 — NOT YET STARTED**: editorial intro block (4 paragraphs, pull-quote, ordered list, hyperlinks, bold/italic) between Kutcher Clock hero area and the Map; closing block ("So just like Ashton Kutcher eventually found his car…") below the map. Spec is in the user's chat, not in a file. If picking this up cold, ask the user to re-paste.
- **Combined commit message** when both parts are done: `"Add Kutcher Clock title; editorial intro with pull-quote, bold anchors, hyperlinks; Dude Where's My Car closer below map"`

**Don't push** until Part 2 is also done — they're going as one commit.

---

## Architecture overview

### Stack

- **Framework**: Astro 6 (static-by-default, with one serverless fn)
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` — **uses CSS cascade layers** (see Gotchas)
- **Hosting**: Vercel (Pro plan not required; free tier sufficient)
- **Adapter**: `@astrojs/vercel` — needed for the serverless `/api/*` routes; the rest of the site is pre-rendered static
- **Content**: per-state JSON files under `src/content/states/` via Astro Content Collections (typed schema in `src/content.config.ts`)
- **RSS aggregation**: build-time Node script `scripts/aggregate-feeds.mjs` writes `src/data/aggregated-feed.json`. Daily Vercel cron triggers a redeploy.
- **Email capture**: Buttondown via serverless proxy `/api/subscribe` (key in env var, never client-side)

### Layout map

```
src/
├─ pages/
│  ├─ index.astro              ← homepage: hero, Map (USMap component), post-mortem teaser, feed preview, email capture
│  ├─ post-mortem-terms.astro  ← full sortable/filterable post-mortem table
│  ├─ feed/index.astro         ← /feed full archive of aggregated items + tag-chip filter
│  ├─ states/[abbr].astro      ← /states/{abbr} dedicated state page (51 generated)
│  └─ api/
│     ├─ rebuild.ts            ← Vercel cron hits this; POSTs to DEPLOY_HOOK_URL
│     └─ subscribe.ts          ← /api/subscribe → Buttondown proxy
├─ components/
│  ├─ Header.astro             ← sticky nav (Map / Post-Mortem Terms / Feed)
│  ├─ Footer.astro             ← disclaimer + LinkedIn credit + footer subscribe form
│  ├─ KutcherWidget.astro      ← floating bottom-right card (THE Kutcher Clock — see mid-flight work)
│  ├─ USMap.astro              ← server-rendered geographic SVG via us-atlas + d3-geo
│  └─ SubscribeForm.astro      ← reusable, three variants: banded / compact / footer
├─ layouts/Layout.astro        ← base HTML, head meta (OG/Twitter), header + descriptor + main + footer + KutcherWidget + shared subscribe init <script>
├─ styles/global.css           ← @theme palette + @layer base element rules + utility classes
├─ content/states/*.json       ← 51 state JSONs (50 + DC) — data only
├─ content.config.ts           ← Zod schema for state JSON
├─ config/launch.ts            ← `SITE_LAUNCH_ISO` — anchor for the Kutcher Clock count-up
├─ data/
│  ├─ post-mortem.ts           ← typed array for the post-mortem table
│  ├─ aggregated-feed.json     ← build artifact, regenerated on every prod build
│  ├─ state-fips.ts            ← FIPS code → state abbr for USMap
│  └─ state-grid.ts            ← legacy tile-grid layout (no longer used; safe to delete)
public/images/                 ← hero.png, og-image.jpg, logo.png, kutcher-placeholder.svg (last is unused now)
scripts/aggregate-feeds.mjs    ← RSS aggregator
docs/
├─ RSS_AND_DEPLOY.md           ← cron + env var setup walkthrough
└─ HANDOFF.md                  ← (this file)
vercel.json                    ← cron schedule "0 14 * * *" → /api/rebuild
astro.config.mjs               ← site URL set to https://dudewheresmylikeness.ai; Vercel adapter
```

### Categorization scheme (3 categories used + 4th = stub)

| Cat | Label | Color | States |
|---|---|---|---|
| 1 | Comprehensive AI-era statute | `--color-cat-1` deep navy | CA, TN, NY |
| 2 | Strong publicity statute, AI coverage developing | `--color-cat-2` medium blue | IL, WA, FL, IN, NV, UT, TX, LA, MA, RI, WI, HI |
| 3 | Traditional publicity statute, no AI-specific overlay | `--color-cat-3` gold | OH, PA, KY, VA |
| 4 | Common law or unverified | `--color-cat-4` light gray | everything else + DC (32 jurisdictions) |

`category` is a numeric field (1–4) on each state JSON. Drives the map color via `USMap.astro` and the badge on `/states/{abbr}`.

---

## Recent commits (latest first)

| SHA | Message | What it changed |
|---|---|---|
| `a37247a` | Fix: button text disappears on hover (CSS cascade-layer bug). | Wrapped element-selector rules in `@layer base` so Tailwind utilities can override on individual buttons. |
| `b17447e` | Remove featured section; May 2026 sweep updates for TN, CA, FL. | Deleted `featured-stories.json`, stripped featured rendering, added denylist + near-dup collapse to aggregator, applied AI Personhood Act / pending CA bills / FL AI Bill of Rights died-twice content; bumped lastVerified on 3 states. |
| `d01ef53` | Move post-mortem table to its own page, replace homepage with teaser, update Kutcher copy. | New `/post-mortem-terms` route; homepage replaced with teaser card; nav added "Post-Mortem Terms"; Kutcher copy changed to "This site has used Ashton Kutcher's likeness without permission for:". |
| `da81d28` | Add Open Graph + Twitter Card meta tags for social sharing. | Set `astro.config.mjs` site URL; generated optimized og-image.jpg (1200×675); Layout.astro emits canonical + og:* + twitter:* tags. |
| `07b16af` | Restore us-atlas + topojson-client + d3-geo deps stripped from package.json. | Re-added the three runtime deps for USMap that had been silently removed from package.json (locally still in node_modules → builds passed locally but Vercel cold-install failed). |
| `8759343` | Add Buttondown email capture in three placements (preview mode pending API key). | Three forms (banded / compact / footer), shared init in Layout.astro, `/api/subscribe` Vercel function, simulation mode if no key. |
| `102f467` | Major site update: 4-category schema, 51 state pages, post-mortem table, footer disclaimer, RSS feed aggregation. Local-only, ready to deploy. | Schema overhaul, 19 verified states + 32 Cat 4 stubs + DC, USMap geographic SVG, post-mortem table with sort/filter, RSS aggregator with 14 sources, Vercel cron config, full docs. |
| `3b80df0` | feat: initial v0.1 scaffold for dudewheresmylikeness.com | Initial Astro+Tailwind+MDX scaffold per the original BRIEF.md. |

---

## Outstanding TODOs

### High value, defined

- **Maryland** — held pending Gov. Wes Moore signature confirmation on **SB 8** (deepfake identity-fraud) and **SB 141** (election deepfakes). When confirmed, **categorization stays at Cat 4** but `aiCoverage` and `whatsInteresting` need updating per the suggested content in `state-updates-may-2026.md` (see § Where verified content lives). Apply only after verifying signing on `governor.maryland.gov`.
- **Part 2 of mid-flight work** — editorial intro + closing block (see § Mid-flight work).

### Operational

- **Buttondown API key rotation** — the current key was pasted in chat during initial setup. Should be rotated and the new one set via `vercel env add BUTTONDOWN_API_KEY production`, then `vercel --prod`.
- **Custom-domain canonical mismatch (low priority)** — Vercel currently serves `www.dudewheresmylikeness.ai` as canonical (apex 307s to www). The OG/canonical metadata in `Layout.astro` uses the apex (`https://dudewheresmylikeness.ai`). Either flip Vercel to apex-canonical (cleaner) or update `astro.config.mjs` `site` to include `www`. Not urgent — both URLs work.
- **Google News URL display** — items pulled from GN keyword queries have wrapped `news.google.com/rss/articles/{id}` URLs in the JSON. They JS-redirect on click in browsers (work fine), but they're ugly in the data. Modern GN encoding can't be unwrapped server-side without protobuf decoding tricks. Live with it; the **denylist runs against `<source url>` from the GN RSS, not the wrapper URL**, so quality filtering is correct.

### Nice-to-have

- `src/data/state-grid.ts` is leftover from the early tile-grid map; now unused. Safe to delete.
- `public/images/kutcher-placeholder.svg` is leftover from when the widget showed a placeholder image. Now unused. Safe to delete.
- 24 of 32 Cat 4 states still have generic stub content. Add state-specific AI statute citations as research yields them.

---

## Where verified content lives

The user maintains research docs **outside the repo** on their Desktop. They paste relevant chunks into Claude Code when applying updates.

- **`/Users/danieletzioni/Desktop/state-updates-may-2026.md`** — May 2026 sweep instructions for TN, CA, FL plus Maryland-pending. Format: per-state instructions specifying what to append to `whatsInteresting` and what to add to `primarySources`. **The doc is a transcribed-instruction format, not raw content** — read carefully.
- **Original verified state content (May 4, 2026 batch)** — pasted in chat during the May 4 commit (`102f467`); not saved as a standalone doc. The 19 priority states (Cat 1, 2, 3) were populated from that paste.
- **Future updates** — expect more `state-updates-{month}-{year}.md` files on the user's Desktop. Always paste the doc into Claude Code chat (don't try to read it from outside the repo).

---

## Important conventions

### Content

- **`lastVerified` date format**: ISO date string, e.g., `"2026-05-09"`. Bump only on the states whose content actually changed in a given sweep. Other states keep their previous date.
- **`primarySources` format**: array of strings. Markdown link syntax `[text](url)` is allowed inside the strings — the page renderer (`src/pages/states/[abbr].astro` `renderInline()`) parses it and emits `<a target="_blank" rel="noopener noreferrer">` tags.
- **`whatsInteresting` format**: single paragraph string. New sweeps **append** at the end (don't replace). Em-dashes are real `—` characters, not `--`.
- **Bold/italic** in JSON content: use `**bold**` and `*italic*` markdown syntax — `renderInline()` converts to HTML tags. Conservative regex (won't match stars in case names like *Hirsch v. S.C. Johnson*).

### UI

- **No featured/curation layer** in the feed — the user explicitly removed it on May 9 and doesn't want it back. The aggregator + chronological order does the work.
- **Hyperlinks**: external links open `target="_blank" rel="noopener noreferrer"`. The footer LinkedIn link and the editorial intro hyperlinks all follow this.
- **No pop-ups, no modals, no exit-intent, no floating bars** for email capture — three inline placements only (banded on homepage, compact on each state page tagged `via:{state-slug}`, single line in footer).
- **State page tag for Buttondown** is `via:{state-name-lowercased-hyphenated}` — e.g., `via:tennessee`, `via:north-carolina`, `via:district-of-columbia`. Set in `src/pages/states/[abbr].astro`.
- **"Report a correction"** mailto link at the bottom of every state page goes to `hello@dudewheresmylikeness.com`. Forwarding for that address is set up at Spaceship.

### CSS

- **All element-selector rules (html, body, h1-h4, p, a, etc.) MUST be inside `@layer base`** in `global.css`. Otherwise they're unlayered and outrank ALL Tailwind utility classes (cascade-layer ordering trumps specificity). This bit us twice — once for `text-white` button color, once for `text-3xl` overriding the global h2 size.
- **Class-based selectors (`.poster-card`, `.poster-bar`, `.display`, `.cloud`, `.state-path`, etc.) can stay unlayered** — they don't conflict with Tailwind utilities.
- **Color tokens** are CSS variables defined in the `@theme` block: `--color-blue` / `--color-orange` / `--color-orange-deep` / `--color-ink` / `--color-mustard` / `--color-cat-1..4` / etc. Always reference via `var(...)` or via Tailwind arbitrary values like `text-[var(--color-blue)]`.

---

## Common gotchas (a future session will hit at least one of these)

1. **Working directory drift**: the project is at `~/Desktop/code/dudewheresmylikeness` (NOT `~/code/...`). The user's terminal sometimes opens at `~`. Always `cd` first or pass full paths to file tools.
2. **macOS Node version warning**: the user has Node 25 locally; Vercel only supports Node 24. Builds emit a warning but succeed. Don't try to "fix" by changing engines.
3. **Long heredoc commit messages with apostrophes break bash**: `git commit -m "$(cat <<'EOF' ... EOF)"` chokes on certain quote-in-quote interactions. **Always write commit messages to `/tmp/commit-msg.txt` and use `git commit -F /tmp/commit-msg.txt`**. Saves a retry every time.
4. **Vercel env vars don't propagate to existing deployments**: after adding/changing an env var, you must redeploy (`vercel --prod --yes`) for serverless functions to see it. Caught us with `DEPLOY_HOOK_URL`.
5. **Sensitive Vercel env vars can't be pulled locally**: `vercel env pull` returns empty values for vars marked sensitive. Test endpoint behavior, not values.
6. **Chrome MCP allowlist**: only localhost and a handful of dev domains. **vercel.com, github.com, spaceship.com, buttondown.email, dudewheresmylikeness.ai are all blocked.** Cannot drive these via the browser tool. Use CLI (Vercel CLI is logged in) or curl.
7. **Tailwind v4 cascade layers**: see "All element-selector rules MUST be inside `@layer base`" above. This is the #1 cause of "why isn't my CSS applying" surprises on this project.
8. **Astro `bash` and `cd`**: my Bash tool's working directory persists across calls but resets if a previous call errored. Re-`cd` or use absolute paths to be safe.

---

## Useful commands

```bash
# Always start here
cd ~/Desktop/code/dudewheresmylikeness

# Local dev
npm run dev                           # http://127.0.0.1:4321
npm run aggregate                     # refresh src/data/aggregated-feed.json
npm run build:no-aggregate            # fast prod build (skip the RSS step)
npm run build                         # full prod build (= aggregate + astro build)

# Vercel CLI is logged in (project linked via `vercel link` in earlier session)
vercel env ls production
vercel env add KEY_NAME production    # value via stdin: `echo -n VALUE | ...`
vercel --prod --yes                   # deploy current local code to prod

# Git
git status -sb
git log --oneline -10
git push origin main                  # triggers Vercel auto-deploy

# Live verification
curl -sS -o /dev/null -w "%{http_code}\n" https://www.dudewheresmylikeness.ai/
curl -sS https://www.dudewheresmylikeness.ai/api/rebuild   # expect 401 (CRON_SECRET enforced)
```

---

## Where to get unstuck

- **"How do I deploy?"** — push to `main`. Vercel webhook auto-builds.
- **"How do I add an env var?"** — `vercel env add KEY production`, then `vercel --prod --yes` to bake it into a new deployment.
- **"How do I add a state?"** — create `src/content/states/{abbr}.json` matching the schema in `src/content.config.ts`. Astro auto-generates `/states/{abbr}` static page on next build.
- **"How do I update existing state content?"** — edit the JSON in place. **Always bump `lastVerified`** on touched states.
- **"How do I add an RSS source?"** — append to `SOURCES` array in `scripts/aggregate-feeds.mjs`. Verify it returns valid RSS first: `curl -sSL <url> | head -50`.
- **"How do I check the cron actually runs?"** — Vercel dashboard → project → Observability → Cron Jobs (run history shows past invocations).
- **"How do I verify Buttondown is working?"** — `curl -X POST https://www.dudewheresmylikeness.ai/api/subscribe -H "content-type: application/json" -d '{"email":"deploy-check@example.com","tags":["test"]}'`. Should return `{"ok":true}` (no `simulated:true`). Then delete the test subscriber via the Buttondown API.

---

*If anything in this file is wrong or stale, fix it before doing the work — this doc is the user's first line of defense against repeated mistakes across sessions.*
