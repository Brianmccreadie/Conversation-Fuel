"use client";

// The Wire — everything ingested, filterable by interest, grouped by day.
// Reads like a wire desk: scan headlines, pull a thread, hand one to the Ember.

import Link from "next/link";
import { useMemo, useState } from "react";
import { Reveal } from "@/components/motion";

export type WireItem = {
  id: string;
  url: string;
  title: string;
  author: string | null;
  published_at: string | null;
  source: string | null;
  interest: string | null;
};

function dayLabel(iso: string | null): string {
  if (!iso) return "Undated";
  const d = new Date(iso);
  const today = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(today) - startOf(d)) / 86_400_000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export function WireList({
  items,
  interests,
}: {
  items: WireItem[];
  interests: string[];
}) {
  const [filter, setFilter] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter(
      (i) =>
        (!filter || i.interest === filter) &&
        (!needle ||
          i.title.toLowerCase().includes(needle) ||
          (i.source ?? "").toLowerCase().includes(needle))
    );
  }, [items, filter, q]);

  const groups = useMemo(() => {
    const map = new Map<string, WireItem[]>();
    for (const item of filtered) {
      const label = dayLabel(item.published_at);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(item);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilter(null)}
          className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-widest transition-all duration-200 ${
            filter === null
              ? "border-ink bg-ink text-paper"
              : "border-rule text-ink-faint hover:-translate-y-0.5 hover:border-ink-faint hover:text-ink"
          }`}
        >
          All
        </button>
        {interests.map((label) => (
          <button
            key={label}
            onClick={() => setFilter(filter === label ? null : label)}
            className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-widest transition-all duration-200 ${
              filter === label
                ? "border-accent bg-accent text-paper"
                : "border-rule text-ink-faint hover:-translate-y-0.5 hover:border-accent/60 hover:text-accent"
            }`}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 border-b border-rule focus-within:border-accent">
          <span className="font-mono text-xs text-ink-faint">⌕</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the wire…"
            className="w-40 bg-transparent py-1 text-sm outline-none placeholder:text-ink-faint"
          />
        </div>
      </div>

      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
        {filtered.length} {filtered.length === 1 ? "story" : "stories"}
        {filter && ` · ${filter}`}
      </p>

      {/* Day groups */}
      {groups.map(([label, group], gi) => (
        <section key={label} className="mt-8">
          <Reveal i={Math.min(gi, 3)}>
            <h2 className="flex items-baseline gap-3 border-b-2 border-ink pb-2 font-mono text-[11px] uppercase tracking-[0.2em]">
              {label}
              <span className="text-ink-faint">{group.length}</span>
            </h2>
          </Reveal>
          <ul className="divide-y divide-rule">
            {group.map((item, i) => (
              <Reveal key={item.id} i={Math.min(i, 8)}>
                <li className="group flex items-baseline gap-3 py-3.5 transition-transform duration-300 ease-[var(--ease-out-expo)] hover:translate-x-1.5">
                  <span className="font-mono text-xs text-rule transition-colors group-hover:text-accent">
                    ▸
                  </span>
                  <div className="min-w-0 flex-1">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-display text-lg leading-snug transition-colors group-hover:text-accent"
                    >
                      {item.title}
                    </a>
                    <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 font-mono text-[10px] uppercase tracking-widest text-ink-faint">
                      {item.source && <span>{item.source}</span>}
                      {item.interest && (
                        <span className="text-accent/80">· {item.interest}</span>
                      )}
                      {item.published_at && (
                        <span>
                          ·{" "}
                          {new Date(item.published_at).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                      {item.author && <span>· {item.author}</span>}
                    </p>
                  </div>
                  <Link
                    href={`/ember?q=${encodeURIComponent(`Break down this story for me: "${item.title}"`)}`}
                    className="shrink-0 rounded-full border border-transparent px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-transparent transition-all duration-200 group-hover:border-accent/40 group-hover:text-accent hover:bg-accent/10"
                    title="Ask the Ember about this story"
                  >
                    Ask ember
                  </Link>
                </li>
              </Reveal>
            ))}
          </ul>
        </section>
      ))}

      {filtered.length === 0 && (
        <p className="py-16 text-center text-sm text-ink-faint">
          Nothing on the wire{q && ` for “${q}”`}. Add sources, or run the ingest.
        </p>
      )}
    </div>
  );
}
