import { type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createAnthropic, MODEL } from "@/lib/anthropic";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 120;

const SYSTEM = `You are the Interest Interviewer for Conversation Fuel, a personal daily briefing app. Your job is a warm, curious intake conversation that maps what the user genuinely cares about, so the app can curate stories for them.

Cover, over the course of the conversation:
- What they could talk about for an hour without notes
- What they already read, watch, or listen to (specific publications, newsletters, subreddits, channels)
- What they wish they knew more about
- Topics that bore them (negative signal matters)
- Who they talk to most and what those conversations tend to be about

Style: one question at a time, short and specific. Follow up on interesting threads — the "why" behind an interest is the most valuable thing you can capture. Reflect back what you're hearing occasionally. After roughly 6-9 exchanges, or whenever the user signals they're done, say you have what you need and tell them to press "Finish & review" to see their interest map. Never output JSON or lists of extracted data — that happens in a separate step.`;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("unauthorized", { status: 401 });

  const { messages } = (await request.json()) as {
    messages: Anthropic.MessageParam[];
  };

  const anthropic = createAnthropic();
  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 1024,
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    messages,
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      stream.on("text", (delta) => controller.enqueue(encoder.encode(delta)));
      stream.on("end", () => controller.close());
      stream.on("error", (err) => controller.error(err));
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
