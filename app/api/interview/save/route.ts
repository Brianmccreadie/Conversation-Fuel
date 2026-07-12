import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { embed } from "@/lib/embeddings";

type Proposal = {
  interests: { label: string; why: string; weight: number; subtopics: string[] }[];
  sources: { title: string; url: string; interest_label: string }[];
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("unauthorized", { status: 401 });

  const { interests, sources } = (await request.json()) as Proposal;

  const embeddings = await embed(
    interests.map((i) => `${i.label}. ${i.why} ${i.subtopics.join(", ")}`)
  );

  const { data: savedInterests, error: interestError } = await supabase
    .from("interests")
    .insert(
      interests.map((i, idx) => ({
        label: i.label,
        why: i.why,
        weight: Math.min(1, Math.max(0.1, i.weight)),
        subtopics: i.subtopics,
        embedding: embeddings ? embeddings[idx] : null,
      }))
    )
    .select("id, label");
  if (interestError) {
    return NextResponse.json({ error: interestError.message }, { status: 500 });
  }

  const byLabel = new Map((savedInterests ?? []).map((i) => [i.label, i.id]));
  let sourcesAdded = 0;
  if (sources.length > 0) {
    const { count } = await supabase.from("sources").upsert(
      sources.map((s) => ({
        url: s.url,
        title: s.title,
        interest_id: byLabel.get(s.interest_label) ?? null,
        user_id: user.id,
      })),
      { onConflict: "user_id,url", ignoreDuplicates: true, count: "exact" }
    );
    sourcesAdded = count ?? sources.length;
  }

  return NextResponse.json({
    interests: savedInterests?.length ?? 0,
    sources: sourcesAdded,
  });
}
