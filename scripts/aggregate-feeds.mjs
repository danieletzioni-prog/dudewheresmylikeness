#!/usr/bin/env node
/**
 * Build-time RSS aggregator for the dudewheresmylikeness Feed.
 *
 * Fetches a curated list of feeds, parses with fast-xml-parser, normalizes
 * each entry, applies a keyword whitelist, auto-tags, dedupes, sorts by
 * date desc, and writes to src/data/aggregated-feed.json.
 *
 * Designed to run inside Vercel's build (npm run aggregate && astro build),
 * triggered by a daily cron. Idempotent — safe to re-run.
 *
 * Local test:   node scripts/aggregate-feeds.mjs
 *               # then `npm run dev` to preview /feed
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const OUT_PATH = resolve(REPO_ROOT, 'src/data/aggregated-feed.json');

// ---------- Sources (validated against live RSS as of May 2026) ----------
const SOURCES = [
  { id: 'hollywoodreporter', name: 'The Hollywood Reporter', url: 'https://www.hollywoodreporter.com/feed/' },
  { id: 'variety',           name: 'Variety',                url: 'https://variety.com/feed/' },
  { id: 'verge-policy',      name: 'The Verge — Policy',     url: 'https://www.theverge.com/rss/policy/index.xml' },
  { id: 'techcrunch-ai',     name: 'TechCrunch — AI',        url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { id: 'billboard-business',name: 'Billboard — Business',   url: 'https://www.billboard.com/c/business/feed/' },
  { id: 'sagaftra',          name: 'SAG-AFTRA',              url: 'https://www.sagaftra.org/rss.xml' },
  { id: 'copyright-office',  name: 'U.S. Copyright Office',  url: 'https://www.copyright.gov/rss/newsnet.xml' },
  { id: 'volokh',            name: 'Volokh Conspiracy',      url: 'https://reason.com/volokh/feed/' },
  { id: 'ipwatchdog',        name: 'IPWatchdog',             url: 'https://ipwatchdog.com/feed/' },
  { id: 'fedreg-ai',         name: 'Federal Register — AI',  url: 'https://www.federalregister.gov/api/v1/documents.rss?conditions[term]=artificial+intelligence&order=newest' },
  { id: 'gn-likeness',       name: 'Google News — Likeness', url: 'https://news.google.com/rss/search?q=deepfake+OR+%22right+of+publicity%22+OR+%22digital+replica%22+OR+%22AI+voice+clone%22&hl=en-US&gl=US' },
  { id: 'gn-platforms',      name: 'Google News — Platforms', url: 'https://news.google.com/rss/search?q=%22YouTube%22+OR+%22TikTok%22+OR+%22Meta%22+%22AI+likeness%22+OR+%22synthetic+media%22&hl=en-US&gl=US' },
  { id: 'gn-legislation',    name: 'Google News — Legislation', url: 'https://news.google.com/rss/search?q=%22ELVIS+Act%22+OR+%22NO+FAKES+Act%22+OR+%22AB+2602%22+OR+%22AB+1836%22+legislation&hl=en-US&gl=US' },
  { id: 'gn-litigation',     name: 'Google News — Litigation', url: 'https://news.google.com/rss/search?q=lawsuit+%22right+of+publicity%22+OR+%22deepfake%22+OR+%22digital+replica%22&hl=en-US&gl=US' },
];

// ---------- Filter keywords (case-insensitive) ----------
const KEYWORDS = [
  'deepfake', 'digital replica', 'right of publicity', 'likeness',
  'AI voice', 'voice clone', 'voice cloning',
  'ELVIS Act', 'NO FAKES Act', 'NCII', 'non-consensual intimate',
  'synthetic media', 'AI Act',
  'YouTube AI', 'TikTok AI', 'Meta AI',
  'face swap', 'AI deepfake',
];

// ---------- Tag rules (first match wins; multiple tags allowed) ----------
const TAG_RULES = [
  { tag: 'legislation',     re: /\b(ELVIS Act|NO FAKES Act|AB 2602|AB 1836|HB \d|SB \d|legisl|statute|enact|bill|signed into law|congress|senate|house|federal register|copyright office|rulemaking)\b/i },
  { tag: 'platform-policy', re: /\b(YouTube|TikTok|Meta|Instagram|Facebook|X\.com|Twitter|OpenAI|Anthropic|Spotify|Amazon|Google)\b.{0,80}\b(policy|tool|partner|launch|rolls? out|introduce|announce|expand|detection|allow|permit|ban|removes?|filter)\b/i },
  { tag: 'litigation',      re: /\b(lawsuit|sued|files? suit|complaint|injunction|TRO|class action|verdict|settle|appeals?|circuit|district court|supreme court|judge|ruled|ruling)\b/i },
  { tag: 'industry-news',   re: /\b(SAG-AFTRA|WGA|union|CAA|WME|UTA|Endeavor|Disney|Netflix|Warner|Universal|Sony|Paramount|studio|label|agency|talent)\b/i },
];

const HEADERS = {
  'user-agent': 'Mozilla/5.0 (compatible; dudewheresmylikeness-aggregator/1.0; +https://dudewheresmylikeness.com)',
  accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
};

const FETCH_TIMEOUT_MS = 15000;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  textNodeName: '#text',
  cdataPropName: false,
  trimValues: true,
});

// ---------- Source quality denylist (applied BEFORE dedup) ----------
// These are either social platforms repackaging news, low-signal aggregators,
// or wrappers we couldn't unwrap to a primary outlet URL. Drop them so they
// don't take a slot that should belong to the original publisher.
//
// Match logic:
//   - Exact hostname (e.g., "x.com" matches x.com but NOT subdomain.x.com)
//   - Or trailing-domain pattern starting with "." (e.g., ".substack.com"
//     matches anything.substack.com)
const SOURCE_DENYLIST = [
  'facebook.com',
  'm.facebook.com',
  'x.com',
  'twitter.com',
  'mobile.twitter.com',
  'reddit.com',
  'old.reddit.com',
  'np.reddit.com',
  'linkedin.com',
  'tiktok.com',
  'youtube.com',           // YouTube videos
  'm.youtube.com',
  'youtu.be',
  '.substack.com',         // any *.substack.com
];

// blog.youtube.com is the official YouTube blog — explicitly allowed even
// though youtube.com is denied. Keep this list for any future special-cases.
const SOURCE_ALLOWLIST = [
  'blog.youtube',
  'blog.youtube.com',
];

const isAllowed = (hostname) =>
  SOURCE_ALLOWLIST.some((h) => hostname === h || hostname.endsWith('.' + h));

const isDeniedUrl = (url) => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (isAllowed(host)) return false;
    return SOURCE_DENYLIST.some((d) =>
      d.startsWith('.') ? host.endsWith(d) : host === d,
    );
  } catch {
    return true; // malformed URL → drop
  }
};

// Use the publisher domain for the denylist when available (i.e., for
// Google News items where we can read `<source url>`); fall back to the
// canonical URL otherwise.
const isDenied = (item) => {
  if (item.publisherUrl) return isDeniedUrl(item.publisherUrl);
  return isDeniedUrl(item.url);
};

// ---------- Near-duplicate detection ----------
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'of', 'for', 'to', 'in', 'on', 'and',
]);

// Normalize title → token list for similarity comparison.
const titleTokens = (title) =>
  String(title ?? '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));

const jaccard = (aTokens, bTokens) => {
  const A = new Set(aTokens);
  const B = new Set(bTokens);
  if (A.size === 0 || B.size === 0) return 0;
  let intersect = 0;
  for (const t of A) if (B.has(t)) intersect++;
  return intersect / (A.size + B.size - intersect);
};

const HOURS_48_MS = 48 * 60 * 60 * 1000;

const stripHtml = (s) =>
  String(s ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const truncate = (s, n) => {
  if (!s) return '';
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > n * 0.6 ? cut.slice(0, lastSpace) : cut) + '…';
};

// Google News wraps real URLs. The OLD format used `?url=...`; the modern
// format uses opaque encoded article IDs that can only be resolved by
// actually following the redirect chain at runtime.
const unwrapGoogleNewsQuery = (url) => {
  if (!url) return url;
  if (!url.includes('news.google.com')) return url;
  try {
    const u = new URL(url);
    const direct = u.searchParams.get('url');
    if (direct) return direct;
  } catch {}
  return url; // unchanged — needs live unwrap (see resolveGoogleNewsLive).
};

// Modern Google News article URLs (`/rss/articles/CBMi...`) cannot be
// unwrapped server-side: the encoded ID is an opaque token that Google's
// JS client decodes via a backend RPC call, and the article page contains
// no redirect target in its HTML. Fortunately each GN RSS item carries a
// `<source url="...">` element with the actual publisher domain. We use
// that to apply the denylist correctly while leaving the wrapper URL in
// place for clickthroughs (browsers run the JS redirect transparently).

const canonicalize = (url) => {
  try {
    const u = new URL(unwrapGoogleNewsQuery(url));
    // Strip common tracking params.
    [...u.searchParams.keys()]
      .filter((k) => /^(utm_|fbclid|gclid|mc_cid|mc_eid|s_cid|ocid|amp)/i.test(k))
      .forEach((k) => u.searchParams.delete(k));
    u.hash = '';
    return u.toString();
  } catch {
    return url;
  }
};

const matchesKeyword = (text) => {
  const lc = text.toLowerCase();
  return KEYWORDS.some((kw) => lc.includes(kw.toLowerCase()));
};

const tagsFor = (text) => {
  const tags = TAG_RULES.filter((r) => r.re.test(text)).map((r) => r.tag);
  return tags.length ? tags : ['industry-news'];
};

const parseDate = (raw) => {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const pickField = (...candidates) => {
  for (const c of candidates) {
    if (c == null) continue;
    if (typeof c === 'string' && c.trim()) return c.trim();
    if (typeof c === 'object' && c['#text']) return String(c['#text']).trim();
    if (typeof c === 'object' && c['@_href']) return String(c['@_href']).trim();
  }
  return '';
};

const normalizeItem = (raw, source) => {
  // RSS 2.0 fields
  let title = pickField(raw.title);
  let link = pickField(raw.link);
  // Atom uses <link href="..."/>
  if (!link && Array.isArray(raw.link)) {
    const alt = raw.link.find((l) => !l['@_rel'] || l['@_rel'] === 'alternate');
    link = pickField(alt);
  } else if (!link && raw.link?.['@_href']) {
    link = raw.link['@_href'];
  }
  const summaryRaw =
    pickField(raw.description) ||
    pickField(raw.summary) ||
    pickField(raw['content:encoded']) ||
    pickField(raw.content);
  const dateRaw =
    pickField(raw.pubDate) ||
    pickField(raw.published) ||
    pickField(raw.updated) ||
    pickField(raw['dc:date']);

  if (!title || !link) return null;

  const cleanSummary = stripHtml(summaryRaw);
  const url = canonicalize(link);
  const haystack = `${title} ${cleanSummary}`;

  if (!matchesKeyword(haystack)) return null;

  // Google News RSS includes `<source url="https://variety.com">Variety</source>`
  // — capture that domain so the denylist can run against the real publisher
  // even though the link itself stays wrapped on news.google.com.
  let publisherUrl = null;
  if (source.id.startsWith('gn-')) {
    const srcRaw = raw.source;
    if (typeof srcRaw === 'object' && srcRaw && srcRaw['@_url']) {
      publisherUrl = String(srcRaw['@_url']).trim() || null;
    }
  }

  // Google News bakes the real outlet into the title as " - {Outlet}".
  // Strip it from the title and surface the outlet as the displayed source.
  let displayTitle = stripHtml(title);
  let displaySource = source.name;
  if (source.id.startsWith('gn-') && displayTitle.includes(' - ')) {
    const idx = displayTitle.lastIndexOf(' - ');
    const candidate = displayTitle.slice(idx + 3).trim();
    if (candidate.length >= 2 && candidate.length <= 60) {
      displaySource = candidate;
      displayTitle = displayTitle.slice(0, idx).trim();
    }
  }

  return {
    id: url, // canonical URL is the de-dupe key
    source: displaySource,
    sourceId: source.id,
    title: displayTitle,
    url,
    summary: truncate(cleanSummary, 320),
    publishedAt: parseDate(dateRaw),
    tags: tagsFor(haystack),
    publisherUrl, // null for non-GN sources; used by isDenied()
  };
};

const fetchOne = async (source) => {
  const t0 = Date.now();
  try {
    const ctrl = new AbortController();
    const tm = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(source.url, { headers: HEADERS, redirect: 'follow', signal: ctrl.signal });
    clearTimeout(tm);
    if (!res.ok) {
      console.warn(`  ! ${source.id} HTTP ${res.status} (skipping)`);
      return [];
    }
    const xml = await res.text();
    const parsed = parser.parse(xml);
    // RSS 2.0: rss.channel.item ; Atom: feed.entry
    const items =
      parsed?.rss?.channel?.item ??
      parsed?.RDF?.item ??
      parsed?.feed?.entry ??
      [];
    const list = Array.isArray(items) ? items : [items];
    const norm = list
      .map((it) => normalizeItem(it, source))
      .filter(Boolean);
    console.log(`  ✓ ${source.id.padEnd(20)} fetched=${String(list.length).padStart(3)} kept=${String(norm.length).padStart(3)}  (${Date.now() - t0}ms)`);
    return norm;
  } catch (e) {
    console.warn(`  ! ${source.id} ERR ${e.message}`);
    return [];
  }
};

const main = async () => {
  console.log(`Aggregating ${SOURCES.length} feeds…`);
  const all = (await Promise.all(SOURCES.map(fetchOne))).flat();
  const stage1_keyword = all.length;

  // ---------- Stage 2: source-quality denylist ----------
  // Applied before dedup so a denylisted item never takes a slot that should
  // belong to a higher-quality source covering the same story. For GN items
  // we check the publisher URL captured from `<source url>`; for others we
  // check the canonical URL.
  const denyCount = { byHost: new Map(), total: 0 };
  const afterDenylist = all.filter((it) => {
    if (!isDenied(it)) return true;
    denyCount.total++;
    try {
      const checkUrl = it.publisherUrl || it.url;
      const h = new URL(checkUrl).hostname.toLowerCase();
      denyCount.byHost.set(h, (denyCount.byHost.get(h) || 0) + 1);
    } catch {}
    return false;
  });

  // ---------- Stage 3: exact-URL dedupe (cheap pass before fuzzy) ----------
  const byUrl = new Map();
  for (const it of afterDenylist) {
    const existing = byUrl.get(it.id);
    if (!existing) { byUrl.set(it.id, it); continue; }
    // Merge tags.
    existing.tags = [...new Set([...existing.tags, ...it.tags])];
  }
  const afterUrlDedupe = [...byUrl.values()];

  // ---------- Stage 4: near-duplicate collapse (title similarity + 48h) ----------
  // Sort earliest-first so the iteration keeps the EARLIEST occurrence of a
  // story (the one that broke it) and drops later restatements.
  const sortedAsc = [...afterUrlDedupe].sort((a, b) => {
    const at = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bt = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return at - bt;
  });
  for (const it of sortedAsc) {
    it._tokens = titleTokens(it.title);
    it._timeMs = it.publishedAt ? new Date(it.publishedAt).getTime() : 0;
  }
  const finalItems = [];
  let dupesCollapsed = 0;
  for (const item of sortedAsc) {
    const dupe = finalItems.find((kept) => {
      if (Math.abs(item._timeMs - kept._timeMs) > HOURS_48_MS) return false;
      return jaccard(item._tokens, kept._tokens) > 0.7;
    });
    if (dupe) {
      dupesCollapsed++;
      // Merge tags onto the surviving (earlier) entry.
      dupe.tags = [...new Set([...dupe.tags, ...item.tags])];
    } else {
      finalItems.push(item);
    }
  }

  // Strip the temporary fields (and publisherUrl, which only mattered for
  // the denylist) and sort newest-first for output.
  const items = finalItems
    .map(({ _tokens, _timeMs, publisherUrl, ...rest }) => rest)
    .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''))
    .slice(0, 200);

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  const payload = {
    generatedAt: new Date().toISOString(),
    sourceCount: SOURCES.length,
    itemCount: items.length,
    items,
  };
  writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2) + '\n');

  // ---------- Stage counts ----------
  console.log('');
  console.log('---------------- pipeline counts ----------------');
  console.log(`  after fetch + keyword filter: ${String(stage1_keyword).padStart(4)}`);
  console.log(`  after source denylist:        ${String(afterDenylist.length).padStart(4)}  (-${denyCount.total} denied)`);
  console.log(`  after exact-URL dedupe:       ${String(afterUrlDedupe.length).padStart(4)}  (-${afterDenylist.length - afterUrlDedupe.length} url-dups)`);
  console.log(`  after near-dup collapse:      ${String(finalItems.length).padStart(4)}  (-${dupesCollapsed} near-dups)`);
  console.log(`  FINAL (cap 200):              ${String(items.length).padStart(4)}`);
  if (denyCount.byHost.size > 0) {
    const top = [...denyCount.byHost.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    console.log('  top denied hosts:             ' + top.map(([h, n]) => `${h} (${n})`).join(', '));
  }
  console.log('-------------------------------------------------');
  console.log(`→ Wrote ${items.length} items to ${OUT_PATH.replace(REPO_ROOT, '.')}`);
  console.log(`  Generated at ${payload.generatedAt}`);
};

await main();
