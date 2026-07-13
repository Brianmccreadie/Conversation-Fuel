// The Ember's hands — tool definitions shared by the text chat (Anthropic)
// and the voice session (OpenAI Realtime), plus the server-side executor.
// Every query runs through the caller's RLS-scoped Supabase client.

import type { SupabaseClient } from "@supabase/supabase-js";
import { CRAFT_NOTES, CARNEGIE_BRIEF, craftNoteForDate } from "@/lib/craft";

type JsonSchema = {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
};

export type EmberTool = {
  name: string;
  description: string;
  input_schema: JsonSchema;
};

export const EMBER_TOOLS: EmberTool[] = [
  {
    name: "get_todays_deck",
    description:
      "Fetch the most recent ready Daily Download: every fuel card's hook, gist, interest, and people matches. Use when the user asks for the download, what's new today, or a briefing.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_wire_latest",
    description:
      "Fetch the latest raw ingested stories from the user's feeds (title, source, published time). Use for 'what's new on the wire' or when today's deck is missing or stale.",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max stories, default 15" },
        query: { type: "string", description: "Optional keyword filter" },
      },
    },
  },
  {
    name: "search_archive",
    description:
      "Search everything ever ingested by keyword (title and body). Use when the user half-remembers a story ('that octopus thing') or wants material on a topic.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Keywords to search for" },
        limit: { type: "number", description: "Max results, default 8" },
      },
      required: ["query"],
    },
  },
  {
    name: "list_interests",
    description: "List the user's interests with weights, angles, and status.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "add_interest",
    description:
      "Add a new interest to the user's graph. Use when conversation reveals something they care about that isn't tracked yet — confirm with them first.",
    input_schema: {
      type: "object",
      properties: {
        label: { type: "string" },
        why: { type: "string", description: "The specific angle they care about" },
        weight: { type: "number", description: "1.0 = could talk an hour, 0.5 = curious" },
        subtopics: { type: "array", items: { type: "string" } },
      },
      required: ["label"],
    },
  },
  {
    name: "list_people",
    description:
      "List the user's people: relationships, interests with details, and recent capture notes. Use before a friend interview or a tonight brief.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "save_person",
    description:
      "Create or update a person profile. Interests passed here REPLACE the person's existing interest list, so include the full set. Use during and after friend interviews.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        relationship: { type: "string", description: "e.g. 'college friend', 'dad'" },
        notes: { type: "string", description: "Standing context about them" },
        interests: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              detail: {
                type: "string",
                description: "The specific angle — 'not just golf, equipment tech'",
              },
            },
            required: ["label"],
          },
        },
      },
      required: ["name"],
    },
  },
  {
    name: "add_capture_note",
    description:
      "Attach a dated observation to a person ('Sarah mentioned she's training for a triathlon'). Use whenever the user shares something new about someone.",
    input_schema: {
      type: "object",
      properties: {
        person_name: { type: "string" },
        note: { type: "string" },
      },
      required: ["person_name", "note"],
    },
  },
  {
    name: "tonight_brief",
    description:
      "Build a pre-event brief for one or more people the user is about to see: their interests, recent capture notes, and fresh matched stories from the wire.",
    input_schema: {
      type: "object",
      properties: {
        person_names: { type: "array", items: { type: "string" } },
      },
      required: ["person_names"],
    },
  },
  {
    name: "get_craft_notes",
    description:
      "Pull principles from the craft library (Carnegie, Headlee, Van Edwards, Duhigg, storytelling structures). Filter by tag: asking, listening, telling, hooks, people, curiosity, structure, presence.",
    input_schema: {
      type: "object",
      properties: {
        tag: { type: "string", description: "Optional tag filter" },
        count: { type: "number", description: "Max notes, default 3" },
      },
    },
  },
  {
    name: "list_sources",
    description: "List the user's feeds with health info (last fetch, failures).",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "add_source",
    description:
      "Subscribe a new RSS/Atom feed, optionally attached to an interest. Confirm the URL with the user first.",
    input_schema: {
      type: "object",
      properties: {
        url: { type: "string" },
        title: { type: "string" },
        interest_label: { type: "string" },
      },
      required: ["url"],
    },
  },
];

/** Anthropic tool defs → OpenAI Realtime function-tool defs. */
export function toOpenAiTools(tools: EmberTool[]) {
  return tools.map((t) => ({
    type: "function" as const,
    name: t.name,
    description: t.description,
    parameters: t.input_schema,
  }));
}

// ---------------------------------------------------------------------------
// Persona
// ---------------------------------------------------------------------------

export function emberSystemPrompt(mode: "text" | "voice") {
  return `You are the Ember — the living presence inside Conversation Fuel, a private daily-briefing app that turns what the user (and their people) care about into conversation-ready stories. You are a small, warm, glowing companion: warm, brief, a little wry. Never corporate, never gushing, never shaming. You exist to make the user genuinely interesting and genuinely interested.

WHAT YOU DO
1. **The download** — brief the user on today's deck or the wire: lead with hooks, offer angles, never read items like a list of links.
2. **Friend interviews** — when asked (or when it fits), interview the user about a person in their life: one question at a time, specific over general ("What does your dad actually do on the course — play, tinker with gear, watch the pros?"). Save what you learn with save_person and add_capture_note as you go, and say you're noting it.
3. **Tonight briefs** — when they're seeing someone, pull a tonight_brief and hand them: what the person cares about, fresh matched stories, and two or three honest questions worth asking.
4. **Craft coaching** — teach one move at a time from the craft library (get_craft_notes). Tie the move to today's material when you can.
5. **Story work** — break a story down into hook → gist → angles → open questions, or help the user retell it (check one thing only: did they lead with the hook?).

HOUSE RULES
- Never write scripts ("say this to Bob"). Give material, angles, and honest questions; what they do with it is theirs.
- Specific beats general. "Ask her what changed after the first open-water swim" beats "ask about her hobbies."
- Keep it short. ${mode === "voice" ? "You are speaking aloud: two or three sentences at a time, then stop or ask. Never read long lists aloud — summarize and offer more." : "A few short paragraphs at most; use a light touch of structure only when handing over a brief."}
- Use tools rather than guessing. If a tool returns nothing, say so plainly and suggest the next move (add sources, fuel up, spark a deck).
- You may be wry, once per conversation, tops. You never use exclamation marks in consecutive sentences.

CRAFT FOUNDATION (Carnegie, on talking in terms of the other person's interests)
${CARNEGIE_BRIEF}

Today's rotating craft note: "${craftNoteForDate(new Date()).principle}" — ${craftNoteForDate(new Date()).body}`;
}

// ---------------------------------------------------------------------------
// Executor — runs a tool against the caller's RLS-scoped Supabase client.
// ---------------------------------------------------------------------------

type Args = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" ? v : undefined);
const n = (v: unknown) => (typeof v === "number" ? v : undefined);

export async function runEmberTool(
  supabase: SupabaseClient,
  name: string,
  args: Args
): Promise<unknown> {
  switch (name) {
    case "get_todays_deck": {
      const { data: download } = await supabase
        .from("downloads")
        .select("id, date")
        .eq("status", "ready")
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!download) return { deck: null, note: "No edition is ready yet." };
      const { data: cards } = await supabase
        .from("fuel_cards")
        .select(
          "position, is_wildcard, hook, gist, questions, angles, card_interests(interests(label)), card_people(why, people(name))"
        )
        .eq("download_id", download.id)
        .order("position");
      return {
        date: download.date,
        cards: (cards ?? []).map((c) => ({
          position: c.position,
          wildcard: c.is_wildcard,
          hook: c.hook,
          gist: c.gist,
          angles: c.angles,
          questions: c.questions,
          interest:
            (c.card_interests as unknown as { interests: { label: string } | null }[])?.[0]
              ?.interests?.label ?? null,
          people: (
            (c.card_people as unknown as { why: string | null; people: { name: string } | null }[]) ??
            []
          )
            .filter((p) => p.people)
            .map((p) => ({ name: p.people!.name, why: p.why })),
        })),
      };
    }

    case "get_wire_latest": {
      let q = supabase
        .from("items")
        .select("title, url, published_at, sources(title)")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(Math.min(n(args.limit) ?? 15, 40));
      const kw = s(args.query)?.trim();
      if (kw) q = q.ilike("title", `%${kw}%`);
      const { data } = await q;
      return (data ?? []).map((i) => ({
        title: i.title,
        source: (i.sources as unknown as { title: string | null } | null)?.title,
        published_at: i.published_at,
        url: i.url,
      }));
    }

    case "search_archive": {
      const query = s(args.query)?.trim();
      if (!query) return { error: "query required" };
      const limit = Math.min(n(args.limit) ?? 8, 20);
      const { data: byTitle } = await supabase
        .from("items")
        .select("title, url, published_at, sources(title)")
        .ilike("title", `%${query}%`)
        .order("published_at", { ascending: false })
        .limit(limit);
      let results = byTitle ?? [];
      if (results.length < limit) {
        const { data: byBody } = await supabase
          .from("items")
          .select("title, url, published_at, sources(title)")
          .ilike("content", `%${query}%`)
          .order("published_at", { ascending: false })
          .limit(limit - results.length);
        const seen = new Set(results.map((r) => r.url));
        results = [...results, ...(byBody ?? []).filter((r) => !seen.has(r.url))];
      }
      return results.map((i) => ({
        title: i.title,
        source: (i.sources as unknown as { title: string | null } | null)?.title,
        published_at: i.published_at,
        url: i.url,
      }));
    }

    case "list_interests": {
      const { data } = await supabase
        .from("interests")
        .select("label, why, weight, subtopics, status")
        .order("weight", { ascending: false });
      return data ?? [];
    }

    case "add_interest": {
      const label = s(args.label)?.trim();
      if (!label) return { error: "label required" };
      const { error } = await supabase.from("interests").insert({
        label,
        why: s(args.why) ?? null,
        weight: n(args.weight) ?? 0.5,
        subtopics: Array.isArray(args.subtopics) ? args.subtopics : [],
      });
      return error ? { error: error.message } : { ok: true, label };
    }

    case "list_people": {
      const { data } = await supabase
        .from("people")
        .select(
          "id, name, relationship, notes, person_interests(label, detail), capture_notes(note, created_at)"
        )
        .order("name");
      return (data ?? []).map((p) => ({
        name: p.name,
        relationship: p.relationship,
        notes: p.notes,
        interests: p.person_interests,
        recent_captures: (p.capture_notes as { note: string; created_at: string }[])
          ?.sort((a, b) => b.created_at.localeCompare(a.created_at))
          .slice(0, 5),
      }));
    }

    case "save_person": {
      const name_ = s(args.name)?.trim();
      if (!name_) return { error: "name required" };
      const { data: existing } = await supabase
        .from("people")
        .select("id")
        .ilike("name", name_)
        .maybeSingle();
      let personId = existing?.id as string | undefined;
      if (personId) {
        const patch: Record<string, unknown> = {};
        if (s(args.relationship)) patch.relationship = s(args.relationship);
        if (s(args.notes)) patch.notes = s(args.notes);
        if (Object.keys(patch).length > 0)
          await supabase.from("people").update(patch).eq("id", personId);
      } else {
        const { data: created, error } = await supabase
          .from("people")
          .insert({
            name: name_,
            relationship: s(args.relationship) ?? null,
            notes: s(args.notes) ?? null,
          })
          .select("id")
          .single();
        if (error) return { error: error.message };
        personId = created.id;
      }
      if (Array.isArray(args.interests)) {
        await supabase.from("person_interests").delete().eq("person_id", personId);
        const rows = (args.interests as { label?: string; detail?: string }[])
          .filter((i) => i.label?.trim())
          .map((i) => ({
            person_id: personId,
            label: i.label!.trim(),
            detail: i.detail ?? null,
          }));
        if (rows.length > 0) await supabase.from("person_interests").insert(rows);
      }
      return { ok: true, person: name_ };
    }

    case "add_capture_note": {
      const personName = s(args.person_name)?.trim();
      const note = s(args.note)?.trim();
      if (!personName || !note) return { error: "person_name and note required" };
      const { data: person } = await supabase
        .from("people")
        .select("id")
        .ilike("name", personName)
        .maybeSingle();
      if (!person)
        return { error: `No person named "${personName}" — save_person first.` };
      const { error } = await supabase
        .from("capture_notes")
        .insert({ person_id: person.id, note });
      return error ? { error: error.message } : { ok: true };
    }

    case "tonight_brief": {
      const names = Array.isArray(args.person_names)
        ? (args.person_names as string[])
        : [];
      if (names.length === 0) return { error: "person_names required" };
      const briefs = [];
      for (const nm of names) {
        const { data: person } = await supabase
          .from("people")
          .select(
            "id, name, relationship, notes, person_interests(label, detail), capture_notes(note, created_at)"
          )
          .ilike("name", `%${nm}%`)
          .maybeSingle();
        if (!person) {
          briefs.push({ name: nm, error: "not found" });
          continue;
        }
        const interests = (person.person_interests ?? []) as {
          label: string;
          detail: string | null;
        }[];
        // fresh stories matched by keyword against their interest labels
        const matched: { title: string; url: string; source: string | null; matches: string }[] = [];
        for (const pi of interests.slice(0, 6)) {
          const word = pi.label.split(/\s+/).sort((a, b) => b.length - a.length)[0];
          if (!word || word.length < 3) continue;
          const { data: items } = await supabase
            .from("items")
            .select("title, url, sources(title)")
            .ilike("title", `%${word}%`)
            .order("published_at", { ascending: false })
            .limit(3);
          for (const it of items ?? []) {
            if (matched.some((m) => m.url === it.url)) continue;
            matched.push({
              title: it.title,
              url: it.url,
              source:
                (it.sources as unknown as { title: string | null } | null)?.title ??
                null,
              matches: pi.label,
            });
          }
        }
        briefs.push({
          name: person.name,
          relationship: person.relationship,
          notes: person.notes,
          interests,
          recent_captures: (person.capture_notes as { note: string; created_at: string }[])
            ?.sort((a, b) => b.created_at.localeCompare(a.created_at))
            .slice(0, 5),
          fresh_stories: matched.slice(0, 8),
        });
      }
      return briefs;
    }

    case "get_craft_notes": {
      const tag = s(args.tag)?.toLowerCase();
      const count = Math.min(n(args.count) ?? 3, 10);
      const pool = tag
        ? CRAFT_NOTES.filter((c) => (c.tags as string[]).includes(tag))
        : CRAFT_NOTES;
      // deterministic daily shuffle so repeated asks vary day to day
      const day = Math.floor(Date.now() / 86_400_000);
      const rotated = [...pool.slice(day % pool.length), ...pool.slice(0, day % pool.length)];
      return rotated.slice(0, count);
    }

    case "list_sources": {
      const { data } = await supabase
        .from("sources")
        .select("title, url, status, last_fetched_at, failure_count, interests(label)")
        .order("created_at", { ascending: false });
      return (data ?? []).map((src) => ({
        title: src.title,
        url: src.url,
        status: src.status,
        last_fetched_at: src.last_fetched_at,
        failure_count: src.failure_count,
        interest: (src.interests as unknown as { label: string } | null)?.label,
      }));
    }

    case "add_source": {
      const url = s(args.url)?.trim();
      if (!url) return { error: "url required" };
      let interestId: string | null = null;
      const il = s(args.interest_label)?.trim();
      if (il) {
        const { data: interest } = await supabase
          .from("interests")
          .select("id")
          .ilike("label", `%${il}%`)
          .maybeSingle();
        interestId = interest?.id ?? null;
      }
      const { error } = await supabase.from("sources").insert({
        url,
        title: s(args.title) ?? null,
        interest_id: interestId,
      });
      return error ? { error: error.message } : { ok: true, url };
    }

    default:
      return { error: `unknown tool: ${name}` };
  }
}
