import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { EMBER_TOOLS, emberSystemPrompt, toOpenAiTools } from "@/lib/ember-tools";

// Mints an ephemeral OpenAI Realtime client secret so the browser can open a
// WebRTC session with the Ember's persona and tools. Voice is optional — when
// OPENAI_API_KEY is absent the client quietly offers text mode only.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("unauthorized", { status: 401 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Voice is not configured — set OPENAI_API_KEY to light it up." },
      { status: 501 }
    );
  }

  const model = process.env.OPENAI_REALTIME_MODEL ?? "gpt-realtime";
  const voice = process.env.EMBER_VOICE ?? "marin";

  const res = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session: {
        type: "realtime",
        model,
        instructions: emberSystemPrompt("voice"),
        tools: toOpenAiTools(EMBER_TOOLS),
        audio: {
          input: { transcription: { model: "gpt-4o-mini-transcribe" } },
          output: { voice },
        },
      },
    }),
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: `Could not start voice session: ${res.status} ${await res.text()}` },
      { status: 502 }
    );
  }
  return NextResponse.json(await res.json());
}
