import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/nav";
import { AddSourceForm } from "./add-source-form";
import { toggleSource, deleteSource } from "./actions";

export default async function SourcesPage() {
  const supabase = await createClient();
  const { data: sources } = await supabase
    .from("sources")
    .select("id, url, title, status, last_fetched_at, failure_count")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <Nav active="/sources" />
      <h1 className="mt-6 border-b-2 border-ink pb-4 font-display text-4xl font-semibold tracking-tight">
        Sources
      </h1>

      <div className="mt-8">
        <AddSourceForm />
      </div>

      <ul className="mt-8 divide-y divide-rule border-t border-rule">
        {(sources ?? []).map((s) => (
          <li key={s.id} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {s.title ?? s.url}
              </p>
              <p className="truncate font-mono text-xs text-ink-faint">
                {s.url}
                {s.last_fetched_at &&
                  ` · fetched ${new Date(s.last_fetched_at).toLocaleDateString()}`}
                {s.failure_count > 0 && (
                  <span className="text-accent"> · {s.failure_count} failures</span>
                )}
              </p>
            </div>
            <form
              action={toggleSource.bind(
                null,
                s.id,
                s.status === "active" ? "paused" : "active"
              )}
            >
              <button className="font-mono text-xs uppercase tracking-widest text-ink-faint hover:text-ink">
                {s.status === "active" ? "Pause" : "Resume"}
              </button>
            </form>
            <form action={deleteSource.bind(null, s.id)}>
              <button className="font-mono text-xs uppercase tracking-widest text-ink-faint hover:text-accent">
                Delete
              </button>
            </form>
          </li>
        ))}
        {(sources ?? []).length === 0 && (
          <li className="py-8 text-center text-sm text-ink-faint">
            No sources yet. Add a feed above, or run the Interview to get
            suggestions.
          </li>
        )}
      </ul>
    </main>
  );
}
