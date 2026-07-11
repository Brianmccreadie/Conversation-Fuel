# Design Concept

## The concept: "The Private Wire"

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
