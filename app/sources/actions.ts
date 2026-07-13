"use server";

import { revalidatePath } from "next/cache";
import Parser from "rss-parser";
import { createClient } from "@/lib/supabase/server";
import { USER_AGENT } from "@/lib/ingest";

export async function addSource(formData: FormData) {
  const url = String(formData.get("url") ?? "").trim();
  if (!url) return { error: "Enter a feed URL." };

  // Validate that the URL is actually a parseable feed before saving.
  const parser = new Parser({ headers: { "User-Agent": USER_AGENT }, timeout: 12000 });
  let title: string | null = null;
  try {
    const feed = await parser.parseURL(url);
    title = feed.title ?? null;
  } catch {
    return { error: "That URL doesn't look like a valid RSS/Atom feed." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("sources").insert({ url, title });
  if (error) {
    return {
      error: error.code === "23505" ? "That feed is already added." : error.message,
    };
  }
  revalidatePath("/sources");
  return { error: null };
}

export async function runIngestNow() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized", summary: null };

  const { runIngest } = await import("@/lib/ingest");
  const results = await runIngest();
  revalidatePath("/sources");
  revalidatePath("/wire");
  return {
    error: null,
    summary: {
      sources: results.length,
      added: results.reduce((n, r) => n + r.added, 0),
      failures: results.filter((r) => r.error).map((r) => `${r.source}: ${r.error}`),
    },
  };
}

export async function toggleSource(id: string, status: "active" | "paused") {
  const supabase = await createClient();
  await supabase.from("sources").update({ status }).eq("id", id);
  revalidatePath("/sources");
}

export async function deleteSource(id: string) {
  const supabase = await createClient();
  await supabase.from("sources").delete().eq("id", id);
  revalidatePath("/sources");
}

// Install the starter pack: interests + live-verified feeds in one tap.
// Idempotent — existing interests are matched by label, feeds by URL.
export async function installStarterPack() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized", added: 0 };

  const { STARTER_PACK } = await import("@/lib/starter-pack");
  const { embed } = await import("@/lib/embeddings");

  let added = 0;
  for (const pack of STARTER_PACK) {
    // interest: reuse by label, create if missing
    const { data: existing } = await supabase
      .from("interests")
      .select("id")
      .ilike("label", pack.label)
      .maybeSingle();
    let interestId = existing?.id as string | undefined;
    if (!interestId) {
      let embedding: number[] | null = null;
      try {
        const vecs = await embed(
          [`${pack.label}. ${pack.why} ${pack.subtopics.join(", ")}`],
          "document"
        );
        embedding = vecs?.[0] ?? null;
      } catch {
        // embeddings backfill later; matching quality degrades gracefully
      }
      const { data: created, error } = await supabase
        .from("interests")
        .insert({
          label: pack.label,
          why: pack.why,
          weight: pack.weight,
          subtopics: pack.subtopics,
          ...(embedding ? { embedding } : {}),
        })
        .select("id")
        .single();
      if (error || !created) continue;
      interestId = created.id;
    }

    for (const feed of pack.feeds) {
      const { error } = await supabase.from("sources").insert({
        url: feed.url,
        title: feed.title,
        interest_id: interestId,
      });
      if (!error) added++;
    }
  }
  revalidatePath("/sources");
  revalidatePath("/interests");
  return { error: null, added };
}
