import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// The fireside thread: GET recent history, POST a message (voice transcripts
// persist through here), DELETE to start a new fire.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("unauthorized", { status: 401 });

  const { data } = await supabase
    .from("ember_messages")
    .select("role, mode, content, created_at")
    .order("created_at", { ascending: false })
    .limit(60);
  return NextResponse.json({ messages: (data ?? []).reverse() });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("unauthorized", { status: 401 });

  const { role, content, mode } = await req.json();
  if (!["user", "assistant"].includes(role) || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "bad message" }, { status: 400 });
  }
  await supabase.from("ember_messages").insert({
    role,
    content: content.trim(),
    mode: mode === "voice" ? "voice" : "text",
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("unauthorized", { status: 401 });

  await supabase.from("ember_messages").delete().neq("id", crypto.randomUUID());
  return NextResponse.json({ ok: true });
}
