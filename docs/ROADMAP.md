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

- [ ] Brain dump screen (big box + starter chips → LLM parse into interests)
- [ ] Tap calibration (one interest per screen: hour / curious / skip; angle chips for top interests)
- [ ] Auto-attached feeds shown as toggles (known feeds + Google News fallback)
- [ ] Promise screen + "spark 3 stories now" instant starter deck
- [ ] The Ember v0 (CSS orb: breathing, blinking, three states) + microcopy voice
- [ ] Demote interview to optional "Go deeper" entry point

## Phase 2 — The Daily Download

- [ ] Scoring + deck selection (similarity, diversity cap, serendipity slot)
- [ ] Fuel Card generation (structured LLM output, schema-validated)
- [ ] Morning generate cron; download marked ready
- [ ] The deck UI: masthead, card-at-a-time, hook-as-pull-quote, depth ladder, end screen with the Ember
- [ ] Deck reactions ("more/less like this") + star / used-it interactions feeding the ranker

**Milestone: you skim a real Daily Download with coffee. This is the moment to use it daily for 2 weeks and let the annoyances drive Phase 3+ priorities.**

## Phase 3 — People

- [ ] People quick-add (tap-first: name → topic chips), interview as optional deep mode
- [ ] Person matching in deck selection; "For Your People" section + people chips
- [ ] Tonight Mode: one-tap pre-event brief with fresh fuel + question bank
- [ ] Capture notes after conversations (typed; dictation later)
- [ ] Person page with fuel reserve

## Phase 4 — Craft & retention

- [ ] Craft-note library (seeded from Carnegie, Headlee, et al.) + daily rotation
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
