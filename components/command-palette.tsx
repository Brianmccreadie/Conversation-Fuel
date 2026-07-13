"use client";

// ⌘K — the wire desk. Navigate anywhere, search the archive, fire actions.
// Hand-rolled: no cmdk dependency.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Command = {
  id: string;
  label: string;
  hint?: string;
  section: "Go" | "Do" | "Archive";
  run: () => void;
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const [hits, setHits] = useState<{ id: string; title: string; url: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Open/close wiring
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onClick(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (t.closest("[data-cmdk-trigger]")) {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => {
      setQuery("");
      setSel(0);
      setHits([]);
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [open]);

  // Archive search — debounced title search over everything ever ingested.
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!open || query.trim().length < 3) {
        setHits([]);
        return;
      }
      const supabase = createClient();
      const { data } = await supabase
        .from("items")
        .select("id, title, url")
        .ilike("title", `%${query.trim()}%`)
        .order("published_at", { ascending: false })
        .limit(6);
      setHits(data ?? []);
    }, 180);
    return () => clearTimeout(t);
  }, [query, open]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  const commands = useMemo<Command[]>(() => {
    const base: Command[] = [
      { id: "today", label: "Today's download", hint: "the deck", section: "Go", run: () => go("/") },
      { id: "wire", label: "The Wire", hint: "everything ingested", section: "Go", run: () => go("/wire") },
      { id: "people", label: "People", hint: "your people, their fuel", section: "Go", run: () => go("/people") },
      { id: "ember", label: "Talk to the Ember", hint: "voice or text", section: "Go", run: () => go("/ember") },
      { id: "craft", label: "The Craft", hint: "Carnegie & co.", section: "Go", run: () => go("/craft") },
      { id: "interests", label: "Interests", section: "Go", run: () => go("/interests") },
      { id: "sources", label: "Sources", hint: "feeds", section: "Go", run: () => go("/sources") },
      { id: "fuelup", label: "Fuel up", hint: "add topics", section: "Go", run: () => go("/fuelup") },
      {
        id: "spark",
        label: "Spark a fresh deck",
        hint: "generate now",
        section: "Do",
        run: async () => {
          setOpen(false);
          await fetch("/api/spark", { method: "POST" });
          router.refresh();
        },
      },
      {
        id: "tonight",
        label: "Tonight mode",
        hint: "brief me on who I'm seeing",
        section: "Do",
        run: () => go("/people?tonight=1"),
      },
    ];
    const q = query.trim().toLowerCase();
    const filtered = q
      ? base.filter((c) => (c.label + " " + (c.hint ?? "")).toLowerCase().includes(q))
      : base;
    const archive: Command[] = hits.map((h) => ({
      id: `item-${h.id}`,
      label: h.title,
      hint: "open source",
      section: "Archive",
      run: () => {
        setOpen(false);
        window.open(h.url, "_blank", "noreferrer");
      },
    }));
    return [...filtered, ...archive];
  }, [query, hits, go, router]);

  const selIdx = Math.min(sel, Math.max(0, commands.length - 1));

  if (!open) return null;

  let lastSection: string | null = null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/25 px-4 pt-[16vh] backdrop-blur-[3px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="card-in w-full max-w-lg overflow-hidden rounded-xl border border-rule bg-paper-raised shadow-[var(--shadow-card-hover)]">
        <div className="flex items-center gap-3 border-b border-rule px-4">
          <span className="font-mono text-xs text-accent">▸</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSel((s) => Math.min(s + 1, commands.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setSel((s) => Math.max(s - 1, 0));
              }
              if (e.key === "Enter" && commands[selIdx]) commands[selIdx].run();
            }}
            placeholder="Go anywhere, search the archive…"
            className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-ink-faint"
          />
          <span className="kbd">esc</span>
        </div>
        <div className="max-h-[46vh] overflow-y-auto py-2">
          {commands.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-ink-faint">
              Nothing on the wire for &ldquo;{query}&rdquo;.
            </p>
          )}
          {commands.map((c, i) => {
            const header =
              c.section !== lastSection ? (
                <p className="px-4 pb-1 pt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-faint">
                  {c.section === "Go" ? "Go" : c.section === "Do" ? "Do" : "From the archive"}
                </p>
              ) : null;
            lastSection = c.section;
            return (
              <div key={c.id}>
                {header}
                <button
                  onClick={() => c.run()}
                  onMouseEnter={() => setSel(i)}
                  className={`flex w-full items-baseline justify-between gap-3 px-4 py-2 text-left text-sm transition-colors ${
                    i === selIdx ? "bg-accent/10 text-ink" : "text-ink-soft"
                  }`}
                >
                  <span className="truncate">
                    {i === selIdx && <span className="text-accent">▸ </span>}
                    {c.label}
                  </span>
                  {c.hint && (
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-ink-faint">
                      {c.hint}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
