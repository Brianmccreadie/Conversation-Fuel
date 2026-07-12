"use client";

import { useState, useTransition } from "react";
import { runIngestNow } from "./actions";

type Summary = {
  sources: number;
  added: number;
  failures: string[];
};

export function RunIngestButton() {
  const [pending, startTransition] = useTransition();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run() {
    setSummary(null);
    setError(null);
    startTransition(async () => {
      const result = await runIngestNow();
      if (result.error) setError(result.error);
      else setSummary(result.summary);
    });
  }

  return (
    <div className="text-right">
      <button
        onClick={run}
        disabled={pending}
        className="font-mono text-xs uppercase tracking-widest text-accent hover:underline disabled:opacity-50"
      >
        {pending ? "Fetching feeds…" : "Run ingest now"}
      </button>
      {summary && (
        <p className="mt-1 font-mono text-xs text-ink-faint">
          {summary.sources} feeds checked · {summary.added} new items
          {summary.failures.length > 0 && (
            <span className="text-accent"> · {summary.failures.length} failed</span>
          )}
        </p>
      )}
      {error && <p className="mt-1 text-xs text-accent">{error}</p>}
    </div>
  );
}
