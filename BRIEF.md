# dudewheresmylikeness.com — Project Brief

## The one-line pitch
A public watchtower for AI likeness rights: what the laws are, how fast the world is moving, and what just happened.

## Background
Built by Daniel Etzioni, Stanford GSB Sloan Fellow (MSx '26), drawing on 40+ executive interviews at CAA, WME, and UTA about AI likeness rights and digital consent infrastructure. This site is the public-facing companion to that research — a credibility anchor, a conversation starter, and eventually a top-of-funnel for Primetime / the Blue Book licensing thesis.

## Audience (in priority order)
1. **Entertainment industry professionals** — agents, managers, studio execs, producers who need to quickly understand the legal landscape around AI likeness
2. **Working creatives** — actors, voice talent, directors whose livelihoods are affected by AI replication
3. **Policy and press** — journalists, staffers, and legal scholars covering this beat
4. **Tech / AI builders** — founders and PMs working on generative media who want to build responsibly

The tone assumes the reader is smart, busy, and skeptical. Not explainer-tone. Not academic. Closer to Stratechery or Matter — informed, opinionated, direct.

## The three sections

### 1. The Map — "Where does your likeness live?"
An interactive map of all 50 US states. Hover highlights a state; click opens a side panel (or modal) showing that state's current posture on likeness rights.

**Per-state data fields:**
- Right of publicity: statutory / common law / none
- Post-mortem protection: yes/no + duration
- AI/digital replica coverage: explicit / implicit / none
- Key legislation (with links)
- Notable enforcement or cases
- Last updated date

**Build approach:** Data lives in a structured format (one JSON or MDX file per state) that's easy to update as laws change. Initial build ships with placeholder data and a few fully-written states (California, Tennessee, New York as the tentpoles). The rest fill in over time.

**Visual:** Clean, editorial. States color-coded by strength of protection (e.g., weak / moderate / strong / explicit AI coverage). Legend visible. No 3D, no fancy animations — this is a reference tool, not a toy.

### 2. The Clock — "How long has it been?"
A countdown/count-up clock that displays time elapsed since the last flagged unauthorized AI likeness incident. Ashton Kutcher / *Dude, Where's My Car* visual reference — illustrated/stylized (not a photo of Kutcher), in the aesthetic of the film: early-2000s slacker vibe, slightly pixelated or hand-drawn, winking at the source material.

**V1 behavior:** Static — Daniel manually updates the reference incident (date + brief description of what happened and a link). The clock counts up from that timestamp.

**Example display:**
> It has been **3 days, 14 hours, 22 minutes** since [AI likeness incident] was flagged.
> [One-line description + source link]

**V2 (later):** A lightweight admin flow for logging new incidents without redeploying.

**Tone:** Darkly funny. The joke is that the clock never gets to reset for long.

### 3. The Feed — "What just happened"
A curated, editorial feed of industry news about AI and likeness rights — with Daniel's commentary. Each entry is a short post: headline, source, 2–3 sentences of "what happened and why it matters."

Not an RSS aggregator. Quality over quantity. Think of it as public-facing field notes from the research.

**Build approach:** MDX files in a `content/news/` folder. Each post has frontmatter (title, date, source URL, tags). Homepage of the feed shows most recent 10; archive view shows all.

## Homepage
A single-screen entry that orients the visitor:
- Site title + tagline
- Three clear doors: The Map / The Clock / The Feed
- One sentence of context ("A public watchtower for AI likeness rights, built by Daniel Etzioni.")
- A small "about" link for deeper context

Resist the urge to put everything on the homepage. The homepage is a wayfinder.

## Design principles
- **Minimal, editorial, opinionated.** Not a SaaS landing page. Not a law firm site. Closer to a newsroom or a research publication.
- **Fast.** Ships almost no JavaScript. The map can be interactive, but the rest should be static.
- **Typography-forward.** Strong serif for headlines, clean sans for body. Generous whitespace.
- **Dark mode is nice-to-have, not required for v1.**
- **Mobile works but desktop is primary.** The map is a desktop experience.

## Technical stack
- **Framework:** Astro (with MDX support)
- **Styling:** Tailwind
- **Map:** SVG-based (not a mapping library) — lightweight, accessible, themeable
- **Content:** MDX/JSON files in the repo, version-controlled
- **Hosting:** Vercel
- **Domain:** dudewheresmylikeness.com (registered at Spaceship)

## What to build first (v0.1 shippable)
1. Homepage with three section links
2. Map page with all 50 states rendered, clickable, with a side panel — placeholder data for most states, real data for CA / TN / NY
3. Clock page with illustrated hero and manually-editable reference incident
4. Feed page with MDX structure and 2–3 seed posts
5. Deploy to Vercel, custom domain pointed

Everything else (admin panels, auto-detection, newsletter, etc.) is out of scope for v1.

## What's explicitly out of scope for v1
- User accounts / logins
- Newsletter signup (unless trivial to add)
- Comments
- Automated incident detection
- International jurisdictions (US only for now)
- Any AI image generation on the site itself

## Legal / content notes
- Do not use Ashton Kutcher's actual photo. Illustrated pastiche only.
- State-by-state legal information must be cited and dated. Include a prominent "not legal advice" disclaimer site-wide.
- Do not publish claims about specific ongoing cases without sourcing.

## Success criteria for launch
- Site loads in under 2 seconds
- Map is clickable and informative for at least the three tentpole states
- Clock visibly counts up and is easily updated
- Feed has at least three posts
- Daniel can post a new feed entry in under 10 minutes by editing a single MDX file
