import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createAnthropic, MODEL } from "@/lib/anthropic";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 120;

const SCHEMA = {
  type: "object",
  properties: {
    interests: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string", description: "Short topic name, e.g. 'Golf course architecture'" },
          why: { type: "string", description: "Why this interests the user, in their own terms — used for semantic matching" },
          weight: { type: "number", description: "0.1 (mild) to 1.0 (could talk for an hour)" },
          subtopics: { type: "array", items: { type: "string" } },
        },
        required: ["label", "why", "weight", "subtopics"],
        additionalProperties: false,
      },
    },
    suggested_sources: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          url: { type: "string", description: "A real, known RSS/Atom feed URL. Prefer well-known feeds; use Google News RSS (https://news.google.com/rss/search?q=TOPIC) when no dedicated feed exists" },
          interest_label: { type: "string", description: "Which interest this feeds; must match one of the interest labels" },
        },
        required: ["title", "url", "interest_label"],
        additionalProperties: false,
      },
    },
  },
  required: ["interests", "suggested_sources"],
  additionalProperties: false,
} as const;

const EXTRACT_PROMPT = `Below is a transcript of an interest-intake interview. Extract the user's interest graph and suggest content sources.

Rules for interests: capture the WHY, not just the topic — the specific angle they care about. Weight by enthusiasm. Skip topics they said bore them.

Rules for sources: only suggest feed URLs you are confident exist (major publications, official Substacks as https://NAME.substack.com/feed, subreddits as https://www.reddit.com/r/NAME/.rss). When unsure a dedicated feed exists, use a Google News RSS search feed for the topic instead. 1-3 sources per interest.`;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("unauthorized", { status: 401 });

  const { messages } = (await request.json()) as {
    messages: Anthropic.MessageParam[];
  };

  const transcript = messages
    .map((m) => `${m.role.toUpperCase()}: ${typeof m.content === "string" ? m.content : ""}`)
    .join("\n\n");

  const anthropic = createAnthropic();
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8192,
    thinking: { type: "adaptive" },
    output_config: {
      format: { type: "json_schema", schema: SCHEMA },
    },
    messages: [
      { role: "user", content: `${EXTRACT_PROMPT}\n\n<transcript>\n${transcript}\n</transcript>` },
    ],
  });

  if (response.stop_reason === "refusal") {
    return NextResponse.json({ error: "extraction_refused" }, { status: 422 });
  }
  const text = response.content.find((b) => b.type === "text")?.text ?? "{}";
  return NextResponse.json(JSON.parse(text));
}
