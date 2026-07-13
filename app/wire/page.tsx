import { createClient } from "@/lib/supabase/server";
import { Shell } from "@/components/shell";
import { WireList, type WireItem } from "./wire-list";

// The Wire — the raw intake, redesigned as a proper reading room:
// filter by interest, search, scan by day. The Daily Download distills this.
export default async function WirePage() {
  const supabase = await createClient();

  const [{ data: items }, { data: interests }] = await Promise.all([
    supabase
      .from("items")
      .select("id, url, title, author, published_at, sources(title, interests(label))")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(200),
    supabase
      .from("interests")
      .select("label")
      .eq("status", "active")
      .order("weight", { ascending: false }),
  ]);

  const wireItems: WireItem[] = (items ?? []).map((i) => {
    const src = i.sources as unknown as {
      title: string | null;
      interests: { label: string } | null;
    } | null;
    return {
      id: i.id,
      url: i.url,
      title: i.title,
      author: i.author,
      published_at: i.published_at,
      source: src?.title ?? null,
      interest: src?.interests?.label ?? null,
    };
  });

  return (
    <Shell active="/wire" width="wide" ticker={false}>
      <div className="rise flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">
            The Wire
          </h1>
          <p className="mt-2 text-sm text-ink-faint">
            Everything your feeds carried in, newest first. Tomorrow&apos;s deck
            is distilled from here.
          </p>
        </div>
      </div>
      <div className="mt-7">
        <WireList
          items={wireItems}
          interests={(interests ?? []).map((i) => i.label)}
        />
      </div>
    </Shell>
  );
}
