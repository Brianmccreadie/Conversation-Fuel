# Design Concept

## Concept Nº 3: "The Private Wire, electrified" (current)

The v3 pass keeps everything Concept Nº 2 stood for — editorial where you
read, playful where you touch — and makes the paper feel *alive*:

- **Grain** — a faint animated paper-noise overlay on every screen; the app is
  printed on real stock.
- **Physics, not transitions** — deck cards drag and throw with spring
  physics; buttons are magnetic; craft cards tilt toward the cursor; chips
  lift on hover. All hand-rolled (no animation library) and fully disabled
  under `prefers-reduced-motion`.
- **The living masthead** — every page shares one masthead: date line, live
  mono clock (with a blinking second colon), brand wordmark, nav with a
  drawn-underline active state, and a crawling **headline ticker** of the
  latest wire items (pauses on hover).
- **The fuel gauge** — a small arc gauge in the deck masthead fills as you
  read; progress dots are scrubbable.
- **Ember sparks** — the end-of-deck screen drifts warm particles off the
  Ember. Reward, not gamification.
- **⌘K everywhere** — a command palette (editorial styling, no library):
  navigate, fire actions (spark a deck, tonight mode), and search the full
  archive inline.
- **The Ember dock** — the mascot perches bottom-right on every page,
  breathing; hover makes it smile; tap opens the fireside (see ASSISTANT.md).
- **The orb** — on /ember the mascot gains a canvas halo: 72 radial bars that
  render live audio FFT in voice mode, orbiting sparks while thinking, and a
  sine breath at rest. The character stays; the physics arrive.
- **Wildcard stamp** — the serendipity card wears a rotated "OFF YOUR MAP"
  stamp and an accent border.

Everything below still applies.

## Concept Nº 2: "The Private Wire, warmed up" (current)

The v2 evolution, driven by owner feedback and consumer-app inspiration (playful mascot onboarding, one-question-at-a-time quiz cards, big tap targets, delight-first microcopy). The synthesis:

> **Editorial where you read. Playful where you touch.**

- **Reading surfaces keep the broadsheet soul** — serif hooks set like pull quotes, hairline rules, mono metadata, finishable decks. Nothing from v1's reading experience is discarded.
- **Input surfaces go tap-first** — every question the app asks is one screen, one question, two-to-four big honest buttons. Typing is reserved for the brain dump (and optional capture notes). The interview-style intake is demoted to an optional "Go deeper" mode; the default intake is **Fuel Up**: brain dump → tap calibration → promise screen + instant starter deck (see PRODUCT.md § 1).
- **The Ember** — the app's mascot and voice: a small glowing gradient orb (flame-orange core `#FF5A1F` → amber `#FFB35C`, a blush of `#FF8DB0`), softly breathing, blinking occasionally. It bridges the two worlds: consumer-app warmth rendered in this app's own accent. States: dim / glowing (deck ready) / bright + smiling (deck done). It never shames, never shrinks, never counts streaks.
- **Delight beats, placed deliberately**: the promise screen after intake ("Your wire is live. First edition: tomorrow, 6:00 AM"), the end-of-deck ember, one-tap deck reactions. Between those beats, the app stays calm.

Reference mockup: the "Concept Nº 2" board (phone frames: brain dump, calibration, promise, fuel card, evening end-screen, Tonight mode).

## The concept: "The Private Wire" (v1 foundation)

The metaphor: you have a personal wire service — like a head of state's morning intelligence brief, but for dinner parties. The design language borrows from two worlds and fuses them:

1. **Editorial print** — the confidence of a beautifully typeset broadsheet: strong serif display type, real typographic hierarchy, generous whitespace, hairline rules, small caps for metadata. Content that *looks* important reads as important — and you retain it better.
2. **The briefing deck** — cards as physical objects. The Daily Download is a deck you move through one card at a time (keyboard arrows / swipe), each card a single story at full attention. No infinite scroll, ever. The deck has an *end* — "You're fueled. Go talk to people." A finite information diet is the whole point.

## Type & color

- **Display**: a high-contrast editorial serif (e.g. *Fraunces*, *Newsreader*, or *Source Serif 4*) for hooks and headlines.
- **Text**: a quiet humanist sans (e.g. *Inter* or *General Sans*) for breakdowns and UI.
- **Mono accent** (e.g. *JetBrains Mono*) for metadata: dates, source names, tags — the "wire service" voice.
- **Palette**: paper and ink first — warm off-white (#FAF7F2-ish), near-black ink, one saturated accent (a flame orange or editorial red) used *sparingly*: the hook, the active card indicator, the "used it" action. Dark mode is "evening edition": deep charcoal paper, warm ink.
- Texture over decoration: subtle paper grain, real shadows on cards, no gradients-for-gradients'-sake.

## Signature elements

- **The Masthead**: the Daily Download opens like a front page — date in small caps ("THURSDAY, JULY 11 · EDITION Nº 214"), a one-line weather-report-style summary of the deck ("9 stories · 3 for your people · 1 wildcard").
- **The Hook, set like a pull quote**: each card leads with the hook in large display serif — the way a magazine sets its best sentence. You should be able to read *only* the hooks and still be fueled.
- **Depth Ladder as physical depth**: the 30-second version sits on the card face; the 2-minute version unfolds below it; the source link is the bottom rung. Progressive disclosure mirrors the conversational skill it teaches.
- **People chips**: when a card matches a person, their name appears as a small chip with the one-line "why" ("Sarah — triathlon training"). Human names in the margins of the news — that's the app's whole thesis in one UI detail.
- **The Wildcard**: the serendipity card gets a visually distinct treatment (inverted colors or a rotated stamp — "OFF YOUR MAP") so surprise is framed as a feature.
- **Craft Note as colophon**: the day's craft principle closes the deck, typeset like a colophon or epigraph — quiet, aphoristic, attributed.
- **End of deck**: a deliberate full-stop screen. Edition number, a "back pocket" count, nothing else. The app *ends* on purpose.

## Feel

- Fast, keyboard-first on desktop (j/k or arrows through the deck, `s` to star, `u` for used-it), thumb-first on mobile.
- Motion: cards settle with slight physicality (spring, not slide). Nothing bounces for attention; the app never begs.
- No badges, no streaks, no red dots. The product is calm by conviction: it competes with doomscrolling by being *finishable*, not by being stickier.
