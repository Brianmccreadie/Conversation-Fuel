import { createAdminClient } from "@/lib/supabase/admin";
import { createAnthropic, MODEL } from "@/lib/anthropic";
import { cosine, parseVector } from "@/lib/similarity";

const DECK_SIZE = 9;
const PER_INTEREST_CAP = 3;
const ITEM_WINDOW_HOURS = 48;
const CONTEXT_SIMILARITY = 0.62;
const PERSON_MATCH_THRESHOLD = 0.55;
const GENERATION_CONCURRENCY = 3;

const CARD_SCHEMA = {
  type: "object",
  properties: {
    gist: { type: "string", description: "The story in two sentences" },
    hook: {
      type: "string",
      description:
        "The single most surprising, counterintuitive, or delightful element — one sentence you'd lead with. Not a headline restatement.",
    },
    story_so_far: {
      type: ["string", "null"],
      description:
        "For developing stories with prior context: the arc before today and how today changes it, 2-3 sentences. Null for standalone stories.",
    },
    breakdown: {
      type: "object",
      properties: {
        facts: { type: "array", items: { type: "string" }, description: "3-5 key facts" },
        why_it_matters: { type: "string" },
        contested: {
          type: ["string", "null"],
          description: "What's disputed, unknown, or thinly sourced — knowing the limits keeps you honest",
        },
      },
      required: ["facts", "why_it_matters", "contested"],
      additionalProperties: false,
    },
    angles: {
      type: "array",
      items: {
        type: "object",
        properties: {
          lens: { type: "string", description: "e.g. 'The human story', 'The big number', 'The historical echo'" },
          text: { type: "string", description: "The story told through this lens, 1-2 sentences" },
        },
        required: ["lens", "text"],
        additionalProperties: false,
      },
      description: "2-3 different lenses for different rooms",
    },
    questions: {
      type: "array",
      items: { type: "string" },
      description: "2-3 genuine open questions the story raises — curiosity fuel, not scripts",
    },
    depth: {
      type: "object",
      properties: {
        sec30: { type: "string", description: "The 30-second tellable version, ~60-80 words" },
        min2: { type: "string", description: "The 2-minute version, ~250-300 words" },
      },
      required: ["sec30", "min2"],
      additionalProperties: false,
    },
  },
  required: ["gist", "hook", "story_so_far", "breakdown", "angles", "questions", "depth"],
  additionalProperties: false,
} as const;

type ItemRow = {
  id: string;
  title: string;
  url: string;
  content: string | null;
  published_at: string | null;
  embedding: unknown;
};

type Scored = {
  item: ItemRow;
  vector: number[];
  score: number;
  interestId: string | null;
  interestLabel: string | null;
  interestWhy: string | null;
  people: { personId: string; name: string; label: string; relevance: number }[];
};

export async function generateDownload(userId: string, date?: string) {
  const supabase = createAdminClient();
  const today = date ?? new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("downloads")
    .select("id, status")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();
  if (existing?.status === "ready") {
    return { downloadId: existing.id, cards: 0, alreadyReady: true };
  }

  const { data: interests } = await supabase
    .from("interests")
    .select("id, label, why, weight, embedding")
    .eq("user_id", userId)
    .eq("status", "active");
  const interestVecs = (interests ?? [])
    .map((i) => ({ ...i, vector: parseVector(i.embedding) }))
    .filter((i): i is typeof i & { vector: number[] } => i.vector !== null);
  if (interestVecs.length === 0) {
    throw new Error(
      "No embedded interests found. Run Fuel Up first (and check VOYAGE_API_KEY)."
    );
  }

  const { data: personInterests } = await supabase
    .from("person_interests")
    .select("id, person_id, label, embedding, people(name)")
    .eq("user_id", userId);
  const personVecs = (personInterests ?? [])
    .map((p) => ({
      personId: p.person_id,
      label: p.label,
      name: (p.people as unknown as { name: string } | null)?.name ?? "someone",
      vector: parseVector(p.embedding),
    }))
    .filter((p): p is typeof p & { vector: number[] } => p.vector !== null);

  // Fresh items not yet used on a card.
  const since = new Date(Date.now() - ITEM_WINDOW_HOURS * 3600 * 1000).toISOString();
  const { data: items } = await supabase
    .from("items")
    .select("id, title, url, content, published_at, embedding")
    .eq("user_id", userId)
    .gte("created_at", since)
    .not("embedding", "is", null)
    .limit(500);
  const { data: usedRows } = await supabase
    .from("fuel_cards")
    .select("item_id")
    .eq("user_id", userId);
  const used = new Set((usedRows ?? []).map((r) => r.item_id));

  const pool: Scored[] = [];
  for (const item of items ?? []) {
    if (used.has(item.id)) continue;
    if (!item.content || item.content.length < 250) continue;
    const vector = parseVector(item.embedding);
    if (!vector) continue;

    let best = 0;
    let bestInterest: (typeof interestVecs)[number] | null = null;
    for (const interest of interestVecs) {
      const s = cosine(vector, interest.vector) * interest.weight;
      if (s > best) {
        best = s;
        bestInterest = interest;
      }
    }
    const people = personVecs
      .map((p) => ({
        personId: p.personId,
        name: p.name,
        label: p.label,
        relevance: cosine(vector, p.vector),
      }))
      .filter((p) => p.relevance > PERSON_MATCH_THRESHOLD)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 2);

    pool.push({
      item,
      vector,
      score: best,
      interestId: bestInterest?.id ?? null,
      interestLabel: bestInterest?.label ?? null,
      interestWhy: bestInterest?.why ?? null,
      people,
    });
  }

  if (pool.length === 0) {
    throw new Error("No fresh items to build a deck from. Run ingest first.");
  }

  // Select: top scores with a per-interest diversity cap, then one wildcard
  // from the far end of the similarity range (off your map, on purpose).
  pool.sort((a, b) => b.score - a.score);
  const perInterest = new Map<string, number>();
  const selected: Scored[] = [];
  for (const s of pool) {
    if (selected.length >= DECK_SIZE - 1) break;
    const key = s.interestId ?? "none";
    const n = perInterest.get(key) ?? 0;
    if (n >= PER_INTEREST_CAP) continue;
    perInterest.set(key, n + 1);
    selected.push(s);
  }
  const chosen = new Set(selected.map((s) => s.item.id));
  const wildcard = [...pool]
    .filter((s) => !chosen.has(s.item.id) && (s.item.content?.length ?? 0) > 600)
    .sort((a, b) => a.score - b.score)[0];
  if (wildcard) selected.push(wildcard);

  // Create (or reuse) the pending download row.
  let downloadId = existing?.id;
  if (!downloadId) {
    const { data: dl, error } = await supabase
      .from("downloads")
      .insert({ user_id: userId, date: today, status: "pending" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    downloadId = dl.id;
  }

  // Generate fuel cards with bounded concurrency.
  const anthropic = createAnthropic();
  const wildcardId = wildcard?.item.id;
  const results: { s: Scored; card: Record<string, unknown>; context: string[] }[] = [];
  const queue = [...selected];
  await Promise.all(
    Array.from({ length: GENERATION_CONCURRENCY }, async () => {
      while (queue.length > 0) {
        const s = queue.shift();
        if (!s) break;
        try {
          // The Story So Far: nearest older items in the pool as context.
          const context = pool
            .filter((o) => o.item.id !== s.item.id)
            .map((o) => ({ o, sim: cosine(s.vector, o.vector) }))
            .filter((x) => x.sim > CONTEXT_SIMILARITY)
            .sort((a, b) => b.sim - a.sim)
            .slice(0, 3);

          const contextBlock =
            context.length > 0
              ? `\n\nRelated coverage already in the archive (use for "story_so_far" if this is a developing story):\n${context
                  .map((c) => `- ${c.o.item.title}: ${(c.o.item.content ?? "").slice(0, 400)}`)
                  .join("\n")}`
              : "";
          const matchBlock = s.interestLabel
            ? `\nThis matched the reader's interest "${s.interestLabel}"${s.interestWhy ? ` (why they care: ${s.interestWhy})` : ""}.`
            : "";

          const response = await anthropic.messages.create({
            model: MODEL,
            max_tokens: 4096,
            thinking: { type: "adaptive" },
            output_config: { format: { type: "json_schema", schema: CARD_SCHEMA } },
            messages: [
              {
                role: "user",
                content: `You write Fuel Cards for Conversation Fuel — breakdowns that turn an article into a story someone can actually tell in conversation. Lead with what's genuinely surprising. Be concrete: numbers, names, specifics. Never invent facts not in the source.${matchBlock}\n\n<article>\nTitle: ${s.item.title}\n\n${(s.item.content ?? "").slice(0, 6000)}\n</article>${contextBlock}`,
              },
            ],
          });
          if (response.stop_reason === "refusal") continue;
          const text = response.content.find((b) => b.type === "text")?.text;
          if (!text) continue;
          results.push({
            s,
            card: JSON.parse(text),
            context: context.map((c) => c.o.item.id),
          });
        } catch {
          // A failed card never fails the deck — ship what we have.
        }
      }
    })
  );

  if (results.length === 0) {
    throw new Error("Card generation produced no cards (check ANTHROPIC_API_KEY).");
  }

  // Persist: cards, interest links, people links, then flip to ready.
  const ordered = results.sort((a, b) => b.s.score - a.s.score);
  const { data: savedCards, error: cardError } = await supabase
    .from("fuel_cards")
    .insert(
      ordered.map((r, idx) => ({
        user_id: userId,
        download_id: downloadId,
        item_id: r.s.item.id,
        position: idx,
        is_wildcard: r.s.item.id === wildcardId,
        gist: r.card.gist,
        hook: r.card.hook,
        story_so_far: r.card.story_so_far,
        context_item_ids: r.context,
        breakdown: r.card.breakdown,
        angles: r.card.angles,
        questions: r.card.questions,
        depth: r.card.depth,
      }))
    )
    .select("id, item_id");
  if (cardError) throw new Error(cardError.message);

  const cardByItem = new Map((savedCards ?? []).map((c) => [c.item_id, c.id]));
  const interestLinks = ordered
    .filter((r) => r.s.interestId && cardByItem.has(r.s.item.id))
    .map((r) => ({
      card_id: cardByItem.get(r.s.item.id)!,
      interest_id: r.s.interestId!,
      user_id: userId,
      relevance: r.s.score,
    }));
  if (interestLinks.length > 0) await supabase.from("card_interests").insert(interestLinks);

  const peopleLinks = ordered.flatMap((r) =>
    r.s.people
      .filter(() => cardByItem.has(r.s.item.id))
      .map((p) => ({
        card_id: cardByItem.get(r.s.item.id)!,
        person_id: p.personId,
        user_id: userId,
        relevance: p.relevance,
        why: p.label,
      }))
  );
  if (peopleLinks.length > 0) await supabase.from("card_people").insert(peopleLinks);

  await supabase.from("downloads").update({ status: "ready" }).eq("id", downloadId);

  return { downloadId, cards: results.length, alreadyReady: false };
}

export async function generateForAllUsers() {
  const supabase = createAdminClient();
  const { data } = await supabase.from("interests").select("user_id").eq("status", "active");
  const userIds = [...new Set((data ?? []).map((r) => r.user_id))];
  const results = [];
  for (const userId of userIds) {
    try {
      results.push({ userId, ...(await generateDownload(userId)) });
    } catch (e) {
      results.push({ userId, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return results;
}
