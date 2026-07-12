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

- [ ] Interest Interview (chat UI → structured interests + suggested sources → review/approve screen)
- [ ] Manual source management (add/pause/delete a feed; validate feed URL on add)
- [ ] Nightly ingest cron: fetch, dedupe, extract, embed
- [ ] Sources health view (last fetch, failures) — plain, functional
- [ ] Raw item list view — proves ingestion works before any LLM polish

**Milestone: the app reads your feeds every night.**

## Phase 2 — The Daily Download

- [ ] Scoring + deck selection (similarity, diversity cap, serendipity slot)
- [ ] Fuel Card generation (structured LLM output, schema-validated)
- [ ] Morning generate cron; download marked ready
- [ ] The deck UI: masthead, card-at-a-time, hook-as-pull-quote, depth ladder, end screen
- [ ] Star / used-it / dismissed interactions

**Milestone: you skim a real Daily Download with coffee. This is the moment to use it daily for 2 weeks and let the annoyances drive Phase 3+ priorities.**

## Phase 3 — People

- [ ] People profiles + person-interest intake (interview-style, "tell me about your dad")
- [ ] Person matching in deck selection; "For Your People" section + people chips
- [ ] Capture notes after conversations
- [ ] Person page with fuel reserve

## Phase 4 — Craft & retention

- [ ] Craft-note library (seeded from Carnegie, Headlee, et al.) + daily rotation
- [ ] Back Pocket (starred collection) + full archive search
- [ ] Pre-Event Brief
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
