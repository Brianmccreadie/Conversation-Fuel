"use client";

import { useState, useTransition } from "react";
import { addSource } from "./actions";

export function AddSourceForm() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.set("url", url);
    startTransition(async () => {
      const result = await addSource(formData);
      if (result?.error) setError(result.error);
      else setUrl("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/feed.xml"
          className="flex-1 border border-rule bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={pending}
          className="bg-ink px-4 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {pending ? "Checking…" : "Add feed"}
        </button>
      </div>
      {error && <p className="text-sm text-accent">{error}</p>}
      <p className="text-xs text-ink-faint">
        Any RSS/Atom URL works: blogs, Substack (`/feed`), subreddits (`.rss`),
        Google News searches, YouTube channels.
      </p>
    </form>
  );
}
