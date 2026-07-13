# Roadmap

Each phase ships something usable. Bias: get real fuel into real mornings as early as possible, then improve the craft of the cards.

## Phase 0 — Foundation

- [x] Repo + planning docs
- [x] Scaffold Next.js (App Router, TypeScript, Tailwind v4)
- [x] `supabase/migrations/` with the v1 schema + `pgvector` + RLS policies
- [x] Vercel project linked to the repo; Supabase env vars populated
- [x] Auth: email + password, single user (no magic link — personal app; Supabase Auth keeps `auth.uid()`/RLS real for later multi-user)
- [x] Skeleton UI shell with the design language (paper/ink palette, Fraunces/Inter/JetBrains Mono, masthead + login)

**Owner setup remaining**: run the migration against the Supabase project, create your user (Dashboard → Authentication → Add user), add `ANTHROPIC_API_KEY` + embeddings key + `CRON_SECRET` when Phase 1 starts.

## Phase 1 — Interests & ingestion

- [x] Interest Interview (streaming chat → structured extraction → review/approve screen)
- [x] Manual source management (add/pause/delete a feed; feed URL validated on add)
- [x] Nightly ingest cron (`/api/cron/ingest`, 7:00 UTC): fetch, dedupe, extract, embed
- [x] Sources health view (last fetch, failure count)
- [x] The Wire — raw ingested item list
- [x] Interests page (list, pause, delete)

**Owner setup for Phase 1**: add `ANTHROPIC_API_KEY`, `VOYAGE_API_KEY`, and `CRON_SECRET` to Vercel env vars (and `.env.local`). `CRON_SECRET`: `openssl rand -hex 32`.

**Milestone: the app reads your feeds every night.**

## Phase 1.5 — Fuel Up (v2 intake redesign)

*Driven by owner feedback: intake should be 60 seconds of dumping and tapping, not an interview. See PRODUCT.md § 1 and DESIGN.md § Concept Nº 2.*

- [x] Brain dump screen (big box + starter chips → LLM parse into interests)
- [x] Tap calibration (one interest per screen: hour / curious / skip; angle chips for "hour" topics)
- [x] Feeds auto-attached per interest (LLM-suggested + Google News fallback)
- [x] Promise screen + "spark now" instant first deck
- [x] The Ember v0 (breathing, blinking, dim/glow/bright + smile) + microcopy voice
- [x] Interview demoted to optional "Go deeper" entry point

## Phase 2 — The Daily Download

- [x] Scoring + deck selection (interest-embedding similarity × weight, per-interest diversity cap, wildcard slot, person matching)
- [x] Fuel Card generation (structured LLM output: gist, hook, story-so-far with archive context, breakdown, angles, questions, depth ladder)
- [x] Morning generate cron (7:45 UTC, after ingest); download marked ready
- [x] The deck UI: masthead, card-at-a-time, hook-as-pull-quote, depth ladder, keyboard nav (arrows/j/k/s/u), end screen with the Ember
- [x] Deck reactions (more/less) + back-pocket star + used-it — logged to `interactions` (ranker consumes them in a later pass)
- [ ] Reactions actually adjust scoring (more/less nudges interest weights)

**Milestone: you skim a real Daily Download with coffee. This is the moment to use it daily for 2 weeks and let the annoyances drive Phase 3+ priorities.**

## Phase 2.5 — v3 redesign + the Ember assistant *(shipped)*

*Driven by owner feedback: make it award-worthy, add a Cerulean-style assistant in this app's own brand. See DESIGN.md § Concept Nº 3 and ASSISTANT.md.*

- [x] Design system v3: grain, spring motion primitives, live masthead + ticker, shared Shell, ⌘K command palette
- [x] Deck v2: drag/throw physics, fuel gauge, wildcard stamp, spark end screen, shortcuts overlay
- [x] The Wire v2: interest filter chips, day grouping, search, per-story "Ask ember"
- [x] The Ember assistant: text chat (Anthropic + 12 tools), optional voice (OpenAI Realtime/WebRTC), persistent fireside thread, audio-reactive orb
- [x] People v1 (pulled forward from Phase 3): quick-add, person pages with fuel reserve + capture notes, Tonight Mode via the Ember
- [x] The Craft page: 37-note library as data (`lib/craft.ts`), daily rotating note, tag browsing
- [x] Starter pack: owner's 7 interests + 33 live-verified feeds, one-tap install from Sources

**Owner setup**: apply `supabase/migrations/20260713000000_ember.sql`; optionally add `OPENAI_API_KEY` (+ `EMBER_VOICE`) for voice mode.

## Phase 3 — People

- [x] People quick-add (form + Ember interview mode)
- [ ] Person matching in deck selection; "For Your People" section + people chips *(chips render; matcher needs person embeddings wired into generate)*
- [x] Tonight Mode: pre-event brief with fresh fuel + question bank (via the Ember)
- [x] Capture notes after conversations (typed; dictation later)
- [x] Person page with fuel reserve

## Phase 4 — Craft & retention

- [x] Craft-note library (37 notes: Carnegie, Headlee, Van Edwards, Duhigg, Brooks, Fine, story structures) + daily rotation
- [ ] Back Pocket (starred collection) + fast semantic recall over the archive
- [ ] Story Reps (30-second retell practice, hook-first check) + weekly Set List
- [ ] Spaced resurfacing of starred cards
- [ ] Weekly Threads digest

## Phase 5 — Polish & scale-out readiness

- [ ] Design polish pass (motion, dark "evening edition", keyboard shortcuts)
- [ ] Newsletter bridge: dedicated inbound email → RSS (replaces third-party bridge)
- [ ] Commute Mode (TTS)
- [ ] Multi-user hardening: onboarding flow generalized, shared-source fan-out, prompt/craft content as managed data
- [ ] Then, and only then: think about other people using it

## Open questions (decide during Phase 0–1)

1. **Embeddings provider** — Supabase's built-in gte-small via Edge Functions (free, lower quality) vs. an external API (Voyage/OpenAI). Leaning external for matching quality; it's the heart of the product.
2. **Newsletter bridge** — start with Kill the Newsletter (zero code) vs. building inbound email early. Leaning: third-party first, replace in Phase 5.
3. **Deck size & timing** — 7–12 cards at 5am is a guess; tune after two weeks of real use.
4. **Interview model UX** — one long interview vs. progressive (5 min now, deepen over the first week). Leaning progressive.
