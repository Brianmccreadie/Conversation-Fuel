# The Ember Assistant

The Ember — previously just the app's mascot — is now its voice: a
conversational assistant you can type to or *talk* to. Architecture borrowed
from the Cerulean project (voice operator over WebRTC) and rebranded into this
app's editorial world: same warm orb, now with ears, a mouth, and hands.

## What it does

| Function | How it works |
|---|---|
| **The download** | "Give me today's download" → reads the deck (`get_todays_deck`) and briefs you hook-first, never as a list of links. |
| **Friend interviews** | "Interview me about Sarah" → asks one specific question at a time, saves what it learns as it goes (`save_person`, `add_capture_note`), tells you it's noting things. |
| **Tonight Mode** | "Brief me for tonight" → `tonight_brief` assembles the person's interests, your capture notes, and fresh matched stories, then hands you honest questions worth asking. |
| **Craft coaching** | Teaches one move at a time from the craft library (Carnegie, Headlee, Van Edwards, Duhigg, story structures), tied to today's material when possible. |
| **Story work** | Break any wire story into hook → gist → angles → open questions; practice retells (it checks exactly one thing: did you lead with the hook?). |
| **Curation** | List/add interests and feeds conversationally ("start following the PPA tour"). |

House rules (encoded in the system prompt): never writes scripts ("say this to
Bob"), specific beats general, short answers, wry at most once per
conversation. The persona embeds a distilled brief of Carnegie's "talk in
terms of the other person's interests" chapter — see `lib/craft.ts`.

## Architecture

```
            ┌────────────────────────────────────────────────┐
            │  /ember (EmberClient)                          │
            │  orb · transcript · composer · mic             │
            └───────┬───────────────────────────┬────────────┘
              text  │                     voice │ WebRTC
                    ▼                           ▼
    /api/ember/chat (SSE)          /api/ember/voice-session (mint token)
    Anthropic + tool loop          OpenAI Realtime, same persona/tools
                    │                           │ function calls
                    ▼                           ▼
              lib/ember-tools.ts ◄── /api/ember/tool (bridge)
              12 tools, all through the user's RLS-scoped Supabase client
                    │
                    ▼
              /api/ember/history — the persistent "fireside" thread
              (ember_messages table; voice transcripts persist here too)
```

- **Text mode** (default): streams from the Anthropic API with a tool loop
  (max 8 rounds). Tools execute server-side against the signed-in user's
  Supabase client, so RLS applies everywhere.
- **Voice mode** (optional): the browser mints an ephemeral client secret,
  opens an `RTCPeerConnection` to OpenAI Realtime, and bridges function calls
  back through `/api/ember/tool`. Input and output transcripts render in the
  same thread and persist alongside text messages.
- **One thread**: a single rolling conversation per user ("the fireside").
  "New fire" clears it.
- **Deep links**: `/ember?q=…` auto-asks. Used by the Wire ("Ask ember" per
  story), People (interview/tonight buttons), Craft, and Interests pages.

## Setup

| Env var | Needed for | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | text chat | already required by the pipeline |
| `OPENAI_API_KEY` | voice mode | optional — the Speak button only appears when set |
| `OPENAI_REALTIME_MODEL` | voice | default `gpt-realtime` |
| `EMBER_VOICE` | voice | default `marin` |

Apply `supabase/migrations/20260713000000_ember.sql` (the `ember_messages`
table) along with the earlier migrations.

## Later

- Barge-in polish + push-to-talk for noisy rooms
- Voice capture notes from the person page ("dictate a note")
- Morning wake mode: the Ember reads the deck aloud (Commute Mode's natural home)
- Proactive nudges surfaced in the dock (deck ready, someone's birthday-adjacent
  fuel) — always calm, never a red dot
