"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { installStarterPack } from "./actions";
import { STARTER_PACK } from "@/lib/starter-pack";

// One tap: install the curated interest + feed pack (live-verified feeds).
export function StarterPackButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  const feedCount = STARTER_PACK.reduce((n, p) => n + p.feeds.length, 0);

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-display text-lg font-semibold">The starter pack</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-faint">
            {STARTER_PACK.length} interests · {feedCount} feeds, each verified live —
            performance creative, Meta AI ads, vibe coding, pickleball, Kill Tony,
            peptides, Modern Wisdom.
          </p>
        </div>
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const r = await installStarterPack();
              setResult(
                r.error
                  ? r.error
                  : r.added > 0
                    ? `Wired up ${r.added} feeds. The next ingest fills the wire.`
                    : "Already installed — nothing new to add."
              );
              router.refresh();
            })
          }
          className={`shrink-0 rounded-full bg-accent px-5 py-2.5 font-mono text-[10px] uppercase tracking-widest text-paper transition-all hover:-translate-y-0.5 disabled:opacity-50 ${pending ? "shimmer" : ""}`}
        >
          {pending ? "Wiring…" : "Install"}
        </button>
      </div>
      {result && <p className="mt-3 text-xs text-ink-soft">{result}</p>}
    </div>
  );
}
