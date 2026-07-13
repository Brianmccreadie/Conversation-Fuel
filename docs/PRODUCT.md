# Product Plan

## Vision

Charisma is mostly preparation wearing the costume of spontaneity. People who are great in conversation tend to (1) know interesting things and know *why* they're interesting, and (2) ask great questions because they're genuinely curious about the other person. Conversation Fuel systematizes both.

The app's core loop:

1. **You tell it what you care about** (the Interest Interview) and **who you care about** (People Profiles).
2. **It reads the internet for you** overnight (RSS, newsletters, curated feeds).
3. **Each morning it hands you a Daily Download** — a small, high-quality deck of stories, each pre-digested into its most tellable, askable form.
4. **You skim it in five minutes** and walk into your day with fuel.

Guiding principle from Carnegie: *"You can make more friends in two months by becoming interested in other people than you can in two years by trying to get other people interested in you."* The app serves both directions — material for what you bring, and material for entering other people's worlds.

## Core concepts

### 1. Fuel Up (intake — 60 seconds, not an interview)

*(v2 — replaces the interview-first intake. Visual concept: docs/DESIGN.md § The Private Wire, warmed up.)*

Onboarding is one minute of dumping and tapping, not a conversation:

1. **Brain dump** — one screen, one big box: "What are you into? Dump it all." Type, paste, or tap starter chips. No organizing, no explaining. An LLM call parses the dump into a structured interest list.
2. **Calibration** — one interest per screen, three big taps: *Could talk for an hour* (weight 1.0) / *Curious, keep me posted* (0.5) / *Actually… skip it* (drop). For top-weighted interests, one bonus tap captures the "why" as LLM-proposed angle chips ("Golf → your own game? the gear? pro drama? course design?").
3. **The promise + instant spark** — a screen stating exactly what arrives tomorrow ("9 stories · 7 topics · 1 wildcard · 6:00 AM"), plus a "spark 3 stories now" button that ingests and generates a starter mini-deck on the spot. Value in the first minute, not the first morning.

Feeds attach automatically per interest (known feeds, Google News RSS fallback) and appear as toggles — curation, not homework.

The interest-graph output is unchanged from v1: topics with weights, subtopics, and the *why* (captured by angle taps instead of typed prose — it still powers semantic matching).

**The interview survives as "Go deeper"** — optional conversational mode for periodic check-ins ("what's grown stale?") and as the natural intake for People Profiles ("tell me about your dad").

### 2. Sources & ingestion

RSS is the universal adapter — nearly everything worth reading emits it:

- Blogs, news sites, Substack (every Substack has `/feed`)
- Google News topic/search feeds for interests with no dedicated source
- Reddit (any subreddit as `.rss`), Hacker News, arXiv, YouTube channels
- **Newsletters without RSS**: a bridge service (e.g. Kill the Newsletter, or a custom inbound-email address later) converts email newsletters into RSS feeds — so "subscribing to newsletters" just becomes another feed

A nightly job fetches all active feeds, dedupes, extracts article text, embeds it, and stores it. See ARCHITECTURE.md.

### 3. The Daily Download

The centerpiece. Each morning the pipeline scores fresh items against the interest graph and people profiles, selects a small deck (~7–12 items, quality over quantity, with a diversity quota so one noisy topic can't dominate), and generates a **Fuel Card** for each:

- **Gist** — the story in two sentences.
- **The Hook** — the single most surprising, counterintuitive, or delightful element. The thing you'd lead with.
- **Breakdown** — key facts, why it matters, and what's contested or unknown. (Knowing the *limits* of a story keeps you honest and makes you sound smarter, not less.)
- **The Story So Far** — for developing stories, a short recap of the arc: what happened before today, and how today's development changes it. Built from your own archive — related past items are retrieved by similarity and fed into card generation, so context compounds the longer the app runs. A headline is trivia; an arc is a story you can actually tell.
- **Angles** — two or three lenses on the same story: the human story, the big number, the historical echo, the controversy. Different rooms call for different angles.
- **Open Questions** — the genuine questions the story raises. Not scripts — these are for *your* curiosity, and they double as great things to wonder aloud.
- **Depth Ladder** — 30-second version → 2-minute version → link to the full source. You choose how deep to load.
- **Tags** — which of your interests it fuels, and which of your people it maps to.

Structure borrowed from conversation/storytelling craft: lead with the hook, know your key beats, end on a question. The card format *teaches* the craft by repetition rather than lecturing about it.

### 4. People Profiles

Lightweight profiles for the people in your life: name, relationship, their interests (with notes on what *specifically* they care about — "Dad: not just golf, specifically equipment tech and course architecture"), and things they've mentioned recently.

- **Quick-add** (v2): "Who do you see most? Add three people" — name, then tap their topics from your existing interest chips plus their own. Same tap-first pattern as Fuel Up; the conversational "tell me about your dad" interview stays as the optional deep mode.
- The Daily Download includes a **"For Your People"** section: stories matched to each person's interests, so you can enter their world with something real.
- **Tonight Mode** (v2): tap who you're seeing tonight → a sixty-second brief: their interests, fresh matched stories, and a **question bank** — honest curiosity prompts built from their interests and your capture notes ("Last time she mentioned open-water swims scared her — has that changed?"). Carnegie made operational, never scripted lines.
- After a conversation, a quick **capture note** — typed or dictated — ("Sarah mentioned she's training for a triathlon") enriches the profile and tunes future matching.
- A person's profile page shows a running "fuel reserve" — recent matched stories you haven't used yet.

### 4½. The Ember (personality layer, v2)

A small glowing ember character — the app's presence and voice. It appears in intake ("That's my brain →"), watches the deck, and closes each edition ("You're fueled. Go be interesting."). States: dim (unread edition), glowing (deck ready), bright + smiling (deck finished). Strict rules: the Ember never shames, never shrinks punitively, never gamifies with streaks or badges. It exists to make a calm app feel alive, not to make a sticky app feel cute. All microcopy routes through its voice — warm, brief, a little wry.

### 4¾. The Ember Assistant (v3)

The Ember grew a voice. On /ember (and from its perch on every page) you can
type or *speak* to it. Its functions map one-to-one to the product's core
loops: give the download, interview you about your people (and file what it
learns), build tonight briefs, coach one craft move at a time, and break down
or practice-retell any story. It is grounded in the same craft library and
Carnegie principles as the deck's colophon, and it obeys the personality
rules: never shames, never scripts lines, always brief. Full design:
docs/ASSISTANT.md.

### 5. The Craft Layer

A library of principles from Carnegie and modern conversation experts (Celeste Headlee's *10 Ways to Have a Better Conversation*, Vanessa Van Edwards, storytelling structures like the story spine). One rotating **Craft Note** appears in each Daily Download — a single principle, ideally connected to that day's content ("Today's deck has two contested stories — Headlee's rule: don't equate your experience with theirs; ask what it was like for them").

This keeps the advice at the level you asked for: how to break down, summarize, and find the interesting core — never "say this to Bob."

## Additional features worth building

Roughly ordered by value-to-effort for a personal app:

1. **Back Pocket** — star any card into a saved collection; the evergreen stories that work in any room. Searchable archive of every card ever generated.
2. **Pre-Event Brief** — select the people you're about to see (dinner party, family visit, work offsite) → get a one-page brief: their interests, recent matched stories, your recent capture notes about them.
3. **"Used It" tracking** — one tap to mark a story as used in conversation, optionally with "it landed" / "it didn't." Over time this trains selection toward what actually works for you, and prevents the app resurfacing a story you've already told everyone.
4. **Serendipity Slot** — one wildcard card per day deliberately *outside* your interest graph. Guards against the app narrowing your world; the best conversationalists are surprising.
5. **Recap / spaced resurfacing** — great stories fade in a week. Resurface starred cards at intervals so they stay retrievable in live conversation.
6. **Weekly Threads** — a Sunday digest that connects the week's cards: "Three of this week's AI stories all point at the same shift…" Trends are better fuel than single stories.
7. **Story Threads** — the per-story version of the same idea: cards that belong to the same developing storyline link to each other, and a thread page shows the whole arc chronologically. Pairs with "The Story So Far" on each card; also lets a thread you care about get a card even on a slow-news day ("nothing new this week, but here's where it stands").
8. **Backgrounders** — fuel doesn't have to be *new*. Ingestion isn't limited to news feeds: evergreen sources (classic essays, long-form archives, "best of" feeds) are valid sources too, and an occasional deck slot can go to a great backgrounder on one of your interests rather than something published yesterday.
9. **Deck reactions** (v2) — one tap per card, "more like this" / "less like this," feeding the ranker. The mood-slider pattern from consumer wellness apps, applied to curation instead of feelings.
10. **Story Reps** (v2) — active practice for the craft layer: retell today's best story in 30 seconds (type or dictate). The app checks one thing only — did you lead with the hook? — and gives one nudge, never a lecture. Weekly **Set List**: your five best stories going into the weekend, like a comedian's set.
11. **Fast recall** (v2) — semantic search over the archive in natural language: "that story about the octopus." For the moment mid-conversation prep when you know you read it but can't surface it.
12. **Commute Mode** (later) — text-to-speech reading of the Daily Download.
13. **Quality signals** (later) — source-credibility notes on cards; flag single-sourced or thinly-reported stories.

## Single-user now, multi-user later

Design decisions that keep the scale-out door open without paying the cost now:

- All tables carry a `user_id` from day one, with Supabase Row Level Security — trivial for one user, mandatory for many.
- Supabase Auth from day one (a single account: you) rather than a hardcoded bypass.
- Prompt templates and the craft-note library stored as data, not code, so they can become per-user or curated content later.
- Ingestion designed per-source, not per-user — when there are many users, shared sources are fetched once and fanned out.

What we explicitly *don't* build yet: billing, teams, sharing, social features, mobile apps.
