"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/nav";

type ChatMessage = { role: "user" | "assistant"; content: string };
type Interest = { label: string; why: string; weight: number; subtopics: string[]; keep: boolean };
type Source = { title: string; url: string; interest_label: string; keep: boolean };

const OPENER =
  "Let's map out what you actually care about. First question: what's a topic you could talk about for an hour, no notes, and still have more to say?";

export default function InterviewPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: OPENER },
  ]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<"chat" | "extracting" | "review" | "saving">("chat");
  const [streaming, setStreaming] = useState(false);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, phase]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || streaming) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: input.trim() }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);
    setError(null);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistant = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        assistant += decoder.decode(value, { stream: true });
        setMessages([...next, { role: "assistant", content: assistant }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setMessages(next);
    } finally {
      setStreaming(false);
    }
  }

  async function finish() {
    setPhase("extracting");
    setError(null);
    try {
      const res = await fetch("/api/interview/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      if (!res.ok) throw new Error(`Extraction failed (${res.status})`);
      const data = await res.json();
      setInterests(
        (data.interests ?? []).map((i: Omit<Interest, "keep">) => ({ ...i, keep: true }))
      );
      setSources(
        (data.suggested_sources ?? []).map((s: Omit<Source, "keep">) => ({
          ...s,
          keep: true,
        }))
      );
      setPhase("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed.");
      setPhase("chat");
    }
  }

  async function save() {
    setPhase("saving");
    setError(null);
    try {
      const res = await fetch("/api/interview/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interests: interests.filter((i) => i.keep).map(({ keep: _keep, ...i }) => i),
          sources: sources.filter((s) => s.keep).map(({ keep: _keep, ...s }) => s),
        }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      router.push("/interests");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
      setPhase("review");
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-6 py-12">
      <Nav active="/interview" />
      <h1 className="mt-6 border-b-2 border-ink pb-4 font-display text-4xl font-semibold tracking-tight">
        The Interest Interview
      </h1>

      {(phase === "chat" || phase === "extracting") && (
        <>
          <div className="mt-8 flex-1 space-y-6">
            {messages.map((m, idx) => (
              <div key={idx}>
                <p className="font-mono text-xs uppercase tracking-widest text-ink-faint">
                  {m.role === "assistant" ? "Interviewer" : "You"}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                  {m.content || "…"}
                </p>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="sticky bottom-0 mt-8 border-t border-rule bg-paper pb-2 pt-4">
            <form onSubmit={send} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Your answer…"
                disabled={streaming || phase === "extracting"}
                className="flex-1 border border-rule bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <button
                type="submit"
                disabled={streaming || phase === "extracting"}
                className="bg-ink px-4 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
              >
                Send
              </button>
            </form>
            {messages.length > 2 && (
              <button
                onClick={finish}
                disabled={streaming || phase === "extracting"}
                className="mt-3 font-mono text-xs uppercase tracking-widest text-accent hover:underline disabled:opacity-50"
              >
                {phase === "extracting" ? "Building your interest map…" : "Finish & review →"}
              </button>
            )}
            {error && <p className="mt-2 text-sm text-accent">{error}</p>}
          </div>
        </>
      )}

      {(phase === "review" || phase === "saving") && (
        <div className="mt-8">
          <h2 className="font-display text-2xl font-semibold">Your interest map</h2>
          <p className="mt-1 text-sm text-ink-faint">
            Uncheck anything that doesn&apos;t fit. You can edit everything later.
          </p>

          <ul className="mt-6 space-y-4">
            {interests.map((i, idx) => (
              <li key={idx} className="flex gap-3 border-l-2 border-accent pl-4">
                <input
                  type="checkbox"
                  checked={i.keep}
                  onChange={() =>
                    setInterests(
                      interests.map((x, j) => (j === idx ? { ...x, keep: !x.keep } : x))
                    )
                  }
                  className="mt-1 accent-[--color-accent]"
                />
                <div className={i.keep ? "" : "opacity-50"}>
                  <p className="font-display text-lg font-semibold">{i.label}</p>
                  <p className="text-sm text-ink-soft">{i.why}</p>
                  {i.subtopics.length > 0 && (
                    <p className="mt-1 font-mono text-xs text-ink-faint">
                      {i.subtopics.join(" · ")}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <h3 className="mt-10 font-display text-xl font-semibold">Suggested feeds</h3>
          <ul className="mt-4 space-y-2">
            {sources.map((s, idx) => (
              <li key={idx} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={s.keep}
                  onChange={() =>
                    setSources(
                      sources.map((x, j) => (j === idx ? { ...x, keep: !x.keep } : x))
                    )
                  }
                  className="accent-[--color-accent]"
                />
                <div className={`min-w-0 ${s.keep ? "" : "opacity-50"}`}>
                  <p className="truncate text-sm font-medium">
                    {s.title}{" "}
                    <span className="font-mono text-xs text-ink-faint">
                      ({s.interest_label})
                    </span>
                  </p>
                  <p className="truncate font-mono text-xs text-ink-faint">{s.url}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex items-center gap-4">
            <button
              onClick={save}
              disabled={phase === "saving"}
              className="bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {phase === "saving" ? "Saving…" : "Save interest map"}
            </button>
            <button
              onClick={() => setPhase("chat")}
              disabled={phase === "saving"}
              className="font-mono text-xs uppercase tracking-widest text-ink-faint hover:text-ink"
            >
              ← Back to interview
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-accent">{error}</p>}
        </div>
      )}
    </main>
  );
}
