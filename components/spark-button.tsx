"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SparkButton({ label = "Spark today's edition" }: { label?: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "working" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  async function spark() {
    setState("working");
    setMsg(null);
    try {
      const res = await fetch("/api/spark", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Failed (${res.status})`);
      router.refresh();
      setState("idle");
    } catch (e) {
      setState("error");
      setMsg(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={spark}
        disabled={state === "working"}
        className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {state === "working" ? "Fetching & writing your cards… (~2 min)" : label}
      </button>
      {msg && <p className="max-w-sm text-center text-xs text-accent">{msg}</p>}
    </div>
  );
}
