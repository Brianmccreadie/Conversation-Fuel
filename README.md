# Conversation Fuel

A personal daily briefing app that improves the quality of your information diet — so you always have something genuinely interesting to talk about, and something genuinely interesting to ask about.

Every morning you get a **Daily Download**: a curated set of stories drawn from your interests *and* the interests of the people in your life, each broken down into its most conversation-ready form — the hook, the key facts, the angles, and the open questions worth asking.

Built on the ideas of Dale Carnegie and modern conversation researchers: be genuinely interested in others, talk in terms of the other person's interests, and bring real substance instead of small talk.

## What this is not

- Not a news reader — the unit isn't "article," it's "story you could actually tell."
- Not a script generator — no "say this next time you see your friend." The app breaks stories down (summary, hook, angles, questions); what you do with them is up to you.
- Not social — this is a single-user personal tool first, designed so it *could* become multi-user later.

## Stack

- **Next.js** (App Router) deployed on **Vercel**
- **Supabase** — Postgres, Auth, pgvector for interest matching
- **Vercel Cron** — nightly ingestion + Daily Download generation
- **Anthropic API** — the interview, story breakdown, and matching layer
- **RSS** as the universal intake (newsletters via inbound-email-to-RSS bridge)

## Documentation

| Doc | Contents |
|---|---|
| [docs/PRODUCT.md](docs/PRODUCT.md) | Vision, core concepts, full feature set |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, content pipeline, data model, env vars |
| [docs/DESIGN.md](docs/DESIGN.md) | Visual concept and design language |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Phased build plan |

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase values
npm run dev
```

Database: apply `supabase/migrations/` to your Supabase project (SQL editor, or `supabase db push` with the linked CLI). Create your login under **Authentication → Add user** in the Supabase dashboard — the app uses email + password sign-in.

## Status

Phase 0 (foundation) — app shell, auth, and schema in place. Next: the Interest Interview and the ingestion pipeline (see [docs/ROADMAP.md](docs/ROADMAP.md), Phase 1).
