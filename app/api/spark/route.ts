import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runIngest } from "@/lib/ingest";
import { generateDownload } from "@/lib/generate";

export const maxDuration = 300;

// "Spark now": ingest fresh items, then build today's edition on the spot.
// Used right after Fuel Up (instant first deck) and from the home empty state.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("unauthorized", { status: 401 });

  try {
    const ingest = await runIngest();
    const result = await generateDownload(user.id);
    return NextResponse.json({
      ingested: ingest.reduce((n, r) => n + r.added, 0),
      cards: result.cards,
      alreadyReady: result.alreadyReady,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
