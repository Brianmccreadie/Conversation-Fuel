import { NextResponse, type NextRequest } from "next/server";
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
          label: { type: "string", description: "Short clean topic name, title case" },
          subtopics: { type: "array", items: { type: "string" }, description: "2-4 subtopics" },
          angles: {
            type: "array",
            items: { type: "string" },
            description:
              "4-5 short tap-choice angles capturing WHY someone might care about this topic, e.g. for Golf: 'My own game', 'Gear & tech', 'Pro tour drama', 'Course design'. Max 4 words each.",
          },
          feeds: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                url: {
                  type: "string",
                  description:
                    "A real RSS/Atom feed URL you are confident exists. When unsure, use Google News RSS: https://news.google.com/rss/search?q=TOPIC",
                },
              },
              required: ["title", "url"],
              additionalProperties: false,
            },
            description: "1-3 feeds for this topic",
          },
        },
        required: ["label", "subtopics", "angles", "feeds"],
        additionalProperties: false,
      },
    },
  },
  required: ["interests"],
  additionalProperties: false,
} as const;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("unauthorized", { status: 401 });

  const { dump } = (await request.json()) as { dump: string };
  if (!dump?.trim()) {
    return NextResponse.json({ error: "empty dump" }, { status: 400 });
  }

  const anthropic = createAnthropic();
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8192,
    thinking: { type: "adaptive" },
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
    messages: [
      {
        role: "user",
        content: `A user brain-dumped everything they're interested in, unstructured. Parse it into distinct interest topics. Merge duplicates/overlaps into one topic. Keep their vocabulary where it's clear, clean it up where it's messy. Order by apparent enthusiasm (mentions with detail or specifics rank higher). For each topic propose tap-choice "angles" (the possible WHYs behind the interest) and real RSS feeds (prefer well-known dedicated feeds — Substack /feed, subreddit .rss — and fall back to Google News RSS search feeds).\n\n<dump>\n${dump.slice(0, 4000)}\n</dump>`,
      },
    ],
  });
  if (response.stop_reason === "refusal") {
    return NextResponse.json({ error: "parse_refused" }, { status: 422 });
  }
  const text = response.content.find((b) => b.type === "text")?.text ?? "{}";
  return NextResponse.json(JSON.parse(text));
}
