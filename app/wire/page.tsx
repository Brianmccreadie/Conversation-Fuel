import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/nav";

// Raw feed of ingested items — proves the pipeline works ahead of the
// Daily Download (Phase 2), and doubles as the archive backbone.
export default async function WirePage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("items")
    .select("id, url, title, author, published_at, sources(title)")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(50);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <Nav active="/wire" />
      <h1 className="mt-6 border-b-2 border-ink pb-4 font-display text-4xl font-semibold tracking-tight">
        The Wire
      </h1>
      <p className="mt-3 text-sm text-ink-faint">
        Everything ingested overnight, newest first. The Daily Download will
        distill this.
      </p>

      <ul className="mt-8 divide-y divide-rule border-t border-rule">
        {(items ?? []).map((item) => (
          <li key={item.id} className="py-4">
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="font-display text-lg leading-snug hover:text-accent"
            >
              {item.title}
            </a>
            <p className="mt-1 font-mono text-xs uppercase tracking-widest text-ink-faint">
              {(item.sources as unknown as { title: string | null } | null)?.title ??
                "unknown source"}
              {item.published_at &&
                ` · ${new Date(item.published_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}`}
              {item.author && ` · ${item.author}`}
            </p>
          </li>
        ))}
        {(items ?? []).length === 0 && (
          <li className="py-8 text-center text-sm text-ink-faint">
            Nothing on the wire yet. Add sources and wait for the nightly
            ingest — or trigger it manually.
          </li>
        )}
      </ul>
    </main>
  );
}
