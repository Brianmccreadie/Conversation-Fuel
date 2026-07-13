import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runEmberTool } from "@/lib/ember-tools";

// Tool bridge for the voice session: the Realtime model requests a function
// call in the browser, the browser POSTs it here, and the result goes back
// over the data channel. Auth + RLS scope everything to the signed-in user.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("unauthorized", { status: 401 });

  const { name, args } = await req.json();
  if (typeof name !== "string") {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  try {
    const result = await runEmberTool(supabase, name, args ?? {});
    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
