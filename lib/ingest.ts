import { createHash } from "crypto";
import Parser from "rss-parser";
import { extract } from "@extractus/article-extractor";
import { createAdminClient } from "@/lib/supabase/admin";
import { embed } from "@/lib/embeddings";

export const USER_AGENT =
  "ConversationFuel/0.1 (personal RSS reader; +https://github.com/Brianmccreadie/Conversation-Fuel)";

const parser = new Parser({
  headers: { "User-Agent": USER_AGENT },
  timeout: 15000,
});

const MAX_ITEMS_PER_FEED = 25;
const EXTRACT_TIMEOUT_MS = 10000;

type SourceRow = {
  id: string;
  user_id: string;
  url: string;
  title: string | null;
};

function canonicalHash(url: string, title: string) {
  const normalized = url.replace(/[?#].*$/, "").replace(/\/+$/, "").toLowerCase();
  return createHash("sha256").update(`${normalized}|${title.trim()}`).digest("hex");
}

async function extractContent(url: string, feedFallback: string) {
  try {
    const article = await Promise.race([
      extract(url, {}, { headers: { "user-agent": USER_AGENT } }),
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), EXTRACT_TIMEOUT_MS)
      ),
    ]);
    const text = article?.content
      ? article.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
      : "";
    if (text.length > 200) return text;
  } catch {
    // fall through to feed-provided content
  }
  return feedFallback.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function ingestSource(source: SourceRow) {
  const supabase = createAdminClient();
  let found = 0;
  let added = 0;
  let error: string | null = null;

  try {
    const feed = await parser.parseURL(source.url);
    const items = (feed.items ?? []).slice(0, MAX_ITEMS_PER_FEED);
    found = items.length;

    const candidates = items
      .filter((i) => i.link && i.title)
      .map((i) => ({
        url: i.link!,
        title: i.title!,
        author: i.creator ?? i.author ?? null,
        published_at: i.isoDate ?? i.pubDate ?? null,
        feedContent: i["content:encoded"] ?? i.content ?? i.summary ?? "",
        hash: canonicalHash(i.link!, i.title!),
      }));

    // Skip items we already have (cross-source dedupe via unique hash per user).
    const { data: existing } = await supabase
      .from("items")
      .select("canonical_hash")
      .eq("user_id", source.user_id)
      .in("canonical_hash", candidates.map((c) => c.hash));
    const seen = new Set((existing ?? []).map((r) => r.canonical_hash));
    const fresh = candidates.filter((c) => !seen.has(c.hash));

    if (fresh.length > 0) {
      const contents = await Promise.all(
        fresh.map((c) => extractContent(c.url, c.feedContent))
      );
      const embeddings = await embed(
        fresh.map((c, idx) => `${c.title}\n\n${contents[idx].slice(0, 8000)}`)
      );

      const rows = fresh.map((c, idx) => ({
        user_id: source.user_id,
        source_id: source.id,
        url: c.url,
        canonical_hash: c.hash,
        title: c.title,
        author: c.author,
        published_at: c.published_at ? new Date(c.published_at).toISOString() : null,
        content: contents[idx],
        embedding: embeddings ? embeddings[idx] : null,
      }));

      // Race-safe against a concurrent run of the same feed.
      const { error: insertError, count } = await supabase
        .from("items")
        .upsert(rows, {
          onConflict: "user_id,canonical_hash",
          ignoreDuplicates: true,
          count: "exact",
        });
      if (insertError) throw new Error(insertError.message);
      added = count ?? rows.length;
    }

    await supabase
      .from("sources")
      .update({
        last_fetched_at: new Date().toISOString(),
        failure_count: 0,
        title: source.title ?? feed.title ?? null,
      })
      .eq("id", source.id);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    await supabase
      .from("sources")
      .update({ last_fetched_at: new Date().toISOString() })
      .eq("id", source.id);
    // failure_count increment (read-modify-write is fine at this scale)
    const { data } = await supabase
      .from("sources")
      .select("failure_count")
      .eq("id", source.id)
      .single();
    await supabase
      .from("sources")
      .update({ failure_count: (data?.failure_count ?? 0) + 1 })
      .eq("id", source.id);
  }

  await supabase.from("ingest_runs").insert({
    user_id: source.user_id,
    source_id: source.id,
    found,
    added,
    error,
  });

  return { source: source.url, found, added, error };
}

export async function runIngest() {
  const supabase = createAdminClient();
  const { data: sources, error } = await supabase
    .from("sources")
    .select("id, user_id, url, title")
    .eq("status", "active")
    .order("last_fetched_at", { ascending: true, nullsFirst: true });
  if (error) throw new Error(error.message);

  const results: Awaited<ReturnType<typeof ingestSource>>[] = [];
  const CONCURRENCY = 4;
  const queue = [...(sources ?? [])];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const source = queue.shift();
      if (!source) break;
      results.push(await ingestSource(source));
    }
  });
  await Promise.all(workers);
  return results;
}
