# Architecture

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend + API | Next.js (App Router, TypeScript) | Server components for the briefing pages; route handlers for the pipeline |
| Hosting | Vercel | Hobby tier is fine for single-user |
| Database | Supabase (Postgres) | + `pgvector` extension for embeddings |
| Auth | Supabase Auth | Email magic link; single user initially |
| Scheduling | Vercel Cron | Nightly ingest + morning generation |
| LLM | Anthropic API | Interview, Fuel Card generation, interest matching assist |
| Feed parsing | `rss-parser` + a readability extractor | e.g. `@extractus/article-extractor` for full text |
| Styling | Tailwind CSS | Fast to iterate on the design concept |

## System overview

```
                        ┌─────────────────────────────────────────┐
                        │                Vercel                   │
                        │                                         │
  RSS feeds ──────────► │  /api/cron/ingest    (nightly ~2am)     │
  Substack feeds ─────► │    fetch → dedupe → extract → embed     │
  Google News feeds ──► │                                         │
  Newsletter→RSS ─────► │  /api/cron/generate  (morning ~5am)     │
                        │    score → select deck → LLM cards      │
                        │                                         │
                        │  Next.js app (Daily Download UI,        │
                        │  People, Interests, Interview, Archive) │
                        └──────────────┬──────────────────────────┘
                                       │
                                ┌──────▼──────┐
                                │  Supabase   │
                                │  Postgres   │
                                │  + pgvector │
                                │  + Auth     │
                                └─────────────┘
```

## The pipeline

### Stage 1 — Ingest (nightly cron)

1. Fetch every active source's feed (bounded concurrency, per-source error isolation — one dead feed never kills the run).
2. Dedupe by canonical URL + content hash (cross-source dedupe matters: three feeds will carry the same big story).
3. Extract readable article text; store title, url, author, published_at, text, source_id.
4. Generate an embedding per item (store in `items.embedding`, pgvector).
5. Record a run log row (source, items found, items new, errors) for a health dashboard.

### Stage 2 — Generate (morning cron)

1. **Score** each new item against (a) the interest graph and (b) all person-interest profiles — cosine similarity on embeddings, weighted by interest weight and recency.
2. **Select the deck**: top ~7–12 with a per-topic diversity cap, at least one item per "person match" where available, plus one serendipity item sampled from *low*-similarity items.
3. **Retrieve context**: for each selected item, pull the nearest past items/cards from the archive (pgvector similarity, thresholded). This powers "The Story So Far" — the card recaps the arc, not just today's development — and links the card into its story thread. Context quality compounds as the archive grows.
4. **Generate Fuel Cards**: one LLM call per selected item (title + extracted text + retrieved context in, structured JSON out: gist, hook, story-so-far, breakdown, angles, questions, depth ladder). Validate against a schema; retry malformed output once.
5. **Attach matches**: link each card to matched interests and people with a relevance score and a one-line "why this matches" from the scoring stage.
6. **Pick the Craft Note**: rotate through the craft library, preferring notes relevant to the deck's makeup.
7. Mark the download `ready`. The morning page renders instantly from stored rows — no LLM calls at read time.

### The Interview

A chat UI backed by a route handler streaming from the Anthropic API. The system prompt drives a structured interview; a final extraction call converts the transcript into `interests` rows (label, why, weight, subtopics) and `sources` suggestions. The user reviews and approves before anything is saved as active. Same machinery, shorter prompt, powers the periodic "check-in" re-interview and the person-profile intake ("tell me about your dad").

## Data model (v1)

```sql
-- All tables: id uuid pk default gen_random_uuid(), user_id uuid references auth.users,
-- created_at timestamptz default now(). RLS: user_id = auth.uid() on everything.

interests        (label text, why text, weight real, subtopics text[],
                  status text)                    -- active | paused
sources          (interest_id uuid null, type text,   -- rss | newsletter_bridge
                  url text, title text, status text, last_fetched_at timestamptz,
                  failure_count int)
items            (source_id uuid, url text, canonical_hash text, title text,
                  author text, published_at timestamptz, content text,
                  embedding vector(1024))
downloads        (date date, status text,        -- pending | ready
                  craft_note_id uuid)
fuel_cards       (download_id uuid, item_id uuid, position int,
                  gist text, hook text,
                  story_so_far text null,         -- arc recap for developing stories
                  context_item_ids uuid[],        -- past items retrieved as context (thread links)
                  breakdown jsonb,                -- {facts[], why_it_matters, contested}
                  angles jsonb,                   -- [{lens, text}]
                  questions text[],
                  depth jsonb)                    -- {sec30, min2}
card_interests   (card_id uuid, interest_id uuid, relevance real, why text)
people           (name text, relationship text, notes text)
person_interests (person_id uuid, label text, detail text, embedding vector(1024))
card_people      (card_id uuid, person_id uuid, relevance real, why text)
capture_notes    (person_id uuid, note text)      -- post-conversation captures
interactions     (card_id uuid, action text,      -- starred | used | dismissed
                  landed boolean null)
craft_notes      (source_name text, principle text, body text, tags text[])
ingest_runs      (source_id uuid, found int, added int, error text)
```

Notes:

- `user_id` everywhere + RLS from day one is the entire multi-user story for the data layer.
- Embeddings on both `items` and `person_interests` / interest rows makes matching symmetric: one similarity query serves "for me" and "for my people."
- `fuel_cards` stores fully rendered content — downloads are immutable snapshots, cheap to render, and form the archive for free.

## Environment variables

### Required from day one

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + local | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + local | Client-side key (RLS enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel + local, server-only | Cron pipeline writes |
| `ANTHROPIC_API_KEY` | Vercel + local, server-only | Interview + card generation |
| `VOYAGE_API_KEY` *(or `OPENAI_API_KEY`)* | server-only | Embeddings — Anthropic has no embeddings API (it recommends Voyage); OpenAI's works too. Pick one: Roadmap open question #1 |
| `CRON_SECRET` | Vercel | Authorizes Vercel Cron → route handlers. Self-generated: `openssl rand -hex 32` |

### Explicitly NOT needed

- **RSS and all content sources — no keys anywhere.** Blogs, Substack, Google News feeds, Reddit `.rss`, Hacker News, arXiv, YouTube channel feeds, and Kill the Newsletter are all plain public HTTP. The only requirement is a descriptive User-Agent header (a code constant, not a secret) — Reddit in particular throttles anonymous ones.
- **xAI / X (Twitter).** We're not using Grok as the LLM, and X-as-a-source isn't worth it: the free API tier has no meaningful read access and paid tiers start ~$200/mo. Conversation-worthy X content resurfaces through newsletters and aggregators within a day.

### Later phases (add only when the feature lands)

| Variable | Phase | Purpose |
|---|---|---|
| `RESEND_API_KEY` (or Postmark) | 5 | Inbound email for the self-hosted newsletter → RSS bridge |
| TTS provider key (e.g. `ELEVENLABS_API_KEY`) | 5 | Commute Mode text-to-speech |
| `FIRECRAWL_API_KEY` | if needed | Fallback extraction for JS-heavy sites where the readability library fails — only add if that proves to be a real problem |

Setup order: create the Supabase project → run migrations (kept in `supabase/migrations/`) → create the Vercel project linked to this repo → populate env vars → enable crons in `vercel.json`.

## Operational notes

- **Vercel function limits**: ingest across many feeds must be chunked or queued to stay within function duration limits — the run-log table doubles as a work queue (fetch stale sources first, cron runs every 15 min at night until all fresh).
- **Cost control**: card generation is ~10 LLM calls/day; the interview is occasional. Embeddings are the only per-item cost. Single-user cost is trivially low; per-source (not per-user) ingestion keeps multi-user cost sane later.
- **Failure posture**: a morning with a half-empty deck ships anyway; a failed source gets `failure_count`+1 and surfaces in a sources health view rather than failing the run.
