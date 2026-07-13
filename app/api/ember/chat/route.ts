import { createClient } from "@/lib/supabase/server";
import { createAnthropic, MODEL } from "@/lib/anthropic";
import { EMBER_TOOLS, emberSystemPrompt, runEmberTool } from "@/lib/ember-tools";
import type Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 120;

type InMessage = { role: "user" | "assistant"; content: string };

// The Ember, text mode — streams SSE events:
//   {type:"text", text}         incremental assistant prose
//   {type:"tool", name}         a tool is being consulted
//   {type:"done"} | {type:"error", message}
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("unauthorized", { status: 401 });

  const { messages }: { messages: InMessage[] } = await req.json();
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("messages required", { status: 400 });
  }

  const anthropic = createAnthropic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));

      try {
        const convo: Anthropic.MessageParam[] = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));
        let assistantText = "";

        // Tool loop — keep going until the Ember stops asking for tools.
        for (let turn = 0; turn < 8; turn++) {
          const msgStream = anthropic.messages.stream({
            model: MODEL,
            max_tokens: 1600,
            system: emberSystemPrompt("text"),
            tools: EMBER_TOOLS,
            messages: convo,
          });

          msgStream.on("text", (delta) => {
            assistantText += delta;
            send({ type: "text", text: delta });
          });

          const final = await msgStream.finalMessage();

          if (final.stop_reason !== "tool_use") break;

          const toolUses = final.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
          );
          const results: Anthropic.ToolResultBlockParam[] = [];
          for (const tu of toolUses) {
            send({ type: "tool", name: tu.name });
            let result: unknown;
            try {
              result = await runEmberTool(
                supabase,
                tu.name,
                (tu.input ?? {}) as Record<string, unknown>
              );
            } catch (e) {
              result = { error: e instanceof Error ? e.message : String(e) };
            }
            results.push({
              type: "tool_result",
              tool_use_id: tu.id,
              content: JSON.stringify(result).slice(0, 24_000),
            });
          }
          convo.push({ role: "assistant", content: final.content });
          convo.push({ role: "user", content: results });
        }

        // Persist the exchange to the fireside thread.
        const lastUser = messages[messages.length - 1];
        const rows = [];
        if (lastUser?.role === "user")
          rows.push({ role: "user", mode: "text", content: lastUser.content });
        if (assistantText.trim())
          rows.push({ role: "assistant", mode: "text", content: assistantText });
        if (rows.length > 0) await supabase.from("ember_messages").insert(rows);

        send({ type: "done" });
      } catch (e) {
        send({
          type: "error",
          message: e instanceof Error ? e.message : String(e),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
