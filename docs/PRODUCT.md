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

### 1. The Interest Interview (intake)

Instead of a settings form with topic checkboxes, onboarding is a conversation. An LLM-driven interview asks the kinds of questions a good friend would:

- What could you talk about for an hour without notes?
- What do you read/watch/listen to already?
- What do you *wish* you knew more about?
- What topics do you avoid because they bore you?
- Who do you talk to most, and what do those conversations tend to be about?

The interview output is structured, not conversational:

- An **interest graph**: topics with weights, sub-topics, and a note on *why* it interests you (the "why" makes matching much smarter than a tag would).
- A **suggested source list**: RSS feeds, newsletters, and subreddits mapped to each interest, which you approve/edit.

The interview is re-runnable — a short "check-in" version periodically asks what's grown stale and what's new.

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
- **Angles** — two or three lenses on the same story: the human story, the big number, the historical echo, the controversy. Different rooms call for different angles.
- **Open Questions** — the genuine questions the story raises. Not scripts — these are for *your* curiosity, and they double as great things to wonder aloud.
- **Depth Ladder** — 30-second version → 2-minute version → link to the full source. You choose how deep to load.
- **Tags** — which of your interests it fuels, and which of your people it maps to.

Structure borrowed from conversation/storytelling craft: lead with the hook, know your key beats, end on a question. The card format *teaches* the craft by repetition rather than lecturing about it.

### 4. People Profiles

Lightweight profiles for the people in your life: name, relationship, their interests (with notes on what *specifically* they care about — "Dad: not just golf, specifically equipment tech and course architecture"), and things they've mentioned recently.

- The Daily Download includes a **"For Your People"** section: stories matched to each person's interests, so you can enter their world with something real.
- After a conversation, a quick **capture note** ("Sarah mentioned she's training for a triathlon") enriches the profile and tunes future matching.
- A person's profile page shows a running "fuel reserve" — recent matched stories you haven't used yet.

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
7. **Commute Mode** (later) — text-to-speech reading of the Daily Download.
8. **Quality signals** (later) — source-credibility notes on cards; flag single-sourced or thinly-reported stories.

## Single-user now, multi-user later

Design decisions that keep the scale-out door open without paying the cost now:

- All tables carry a `user_id` from day one, with Supabase Row Level Security — trivial for one user, mandatory for many.
- Supabase Auth from day one (a single account: you) rather than a hardcoded bypass.
- Prompt templates and the craft-note library stored as data, not code, so they can become per-user or curated content later.
- Ingestion designed per-source, not per-user — when there are many users, shared sources are fetched once and fanned out.

What we explicitly *don't* build yet: billing, teams, sharing, social features, mobile apps.
