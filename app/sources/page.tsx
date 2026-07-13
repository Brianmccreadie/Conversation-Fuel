import { createClient } from "@/lib/supabase/server";
import { Shell } from "@/components/shell";
import { Reveal } from "@/components/motion";
import { AddSourceForm } from "./add-source-form";
import { RunIngestButton } from "./run-ingest-button";
import { StarterPackButton } from "./starter-pack-button";
import { toggleSource, deleteSource } from "./actions";

// The manual-ingest server action fetches every feed; give it headroom.
export const maxDuration = 300;

export default async function SourcesPage() {
  const supabase = await createClient();
  const { data: sources } = await supabase
    .from("sources")
    .select("id, url, title, status, last_fetched_at, failure_count, interests(label)")
    .order("created_at", { ascending: false });

  const list = sources ?? [];
  const healthy = list.filter((s) => s.failure_count === 0 && s.status === "active");

  return (
    <Shell active="/sources" width="wide" ticker={false}>
      <div className="rise flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">
            Sources
          </h1>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
            {list.length} feeds · {healthy.length} healthy
          </p>
        </div>
        <RunIngestButton />
      </div>

      <Reveal i={1}>
        <div className="mt-7">
          <StarterPackButton />
        </div>
      </Reveal>

      <Reveal i={2}>
        <div className="mt-6">
          <AddSourceForm />
        </div>
      </Reveal>

      <ul className="mt-8 divide-y divide-rule border-t border-rule">
        {list.map((src, i) => (
          <Reveal key={src.id} i={Math.min(i, 8)}>
            <li className="group flex items-center gap-3 py-3 transition-transform duration-300 hover:translate-x-1">
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  src.status !== "active"
                    ? "bg-rule"
                    : src.failure_count > 0
                      ? "bg-amber"
                      : "bg-accent"
                }`}
                title={src.status !== "active" ? "paused" : src.failure_count > 0 ? "failing" : "healthy"}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{src.title ?? src.url}</p>
                <p className="truncate font-mono text-[10px] uppercase tracking-widest text-ink-faint">
                  {(src.interests as unknown as { label: string } | null)?.label && (
                    <span className="text-accent/80">
                      {(src.interests as unknown as { label: string }).label} ·{" "}
                    </span>
                  )}
                  {src.url}
                  {src.last_fetched_at &&
                    ` · fetched ${new Date(src.last_fetched_at).toLocaleDateString()}`}
                  {src.failure_count > 0 && (
                    <span className="text-accent"> · {src.failure_count} failures</span>
                  )}
                </p>
              </div>
              <form
                action={toggleSource.bind(
                  null,
                  src.id,
                  src.status === "active" ? "paused" : "active"
                )}
              >
                <button className="font-mono text-[10px] uppercase tracking-widest text-ink-faint transition-colors hover:text-ink">
                  {src.status === "active" ? "Pause" : "Resume"}
                </button>
              </form>
              <form action={deleteSource.bind(null, src.id)}>
                <button className="font-mono text-[10px] uppercase tracking-widest text-ink-faint transition-colors hover:text-accent">
                  Delete
                </button>
              </form>
            </li>
          </Reveal>
        ))}
        {list.length === 0 && (
          <li className="py-8 text-center text-sm text-ink-faint">
            No sources yet — install the starter pack above, or add any feed URL.
          </li>
        )}
      </ul>
    </Shell>
  );
}
