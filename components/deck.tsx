"use client";

import { useCallback, useEffect, useState } from "react";
import { Ember } from "@/components/ember";
import { reactToCard } from "@/app/deck-actions";

export type DeckCard = {
  id: string;
  position: number;
  is_wildcard: boolean;
  gist: string;
  hook: string;
  story_so_far: string | null;
  breakdown: { facts: string[]; why_it_matters: string; contested: string | null };
  angles: { lens: string; text: string }[];
  questions: string[];
  depth: { sec30: string; min2: string };
  url: string;
  source_title: string | null;
  interest_label: string | null;
  people: { name: string; why: string | null }[];
};

function Rung({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-rule">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-2.5 font-mono text-[11px] uppercase tracking-widest text-ink-soft transition-colors hover:text-accent"
      >
        {label}
        <span className="text-ink-faint">{open ? "▴" : "▾"}</span>
      </button>
      {open && <div className="pb-4 text-sm leading-relaxed text-ink-soft">{children}</div>}
    </div>
  );
}

export function Deck({
  cards,
  edition,
  dateLabel,
  peopleCount,
}: {
  cards: DeckCard[];
  edition: number;
  dateLabel: string;
  peopleCount: number;
}) {
  const [idx, setIdx] = useState(0);
  const [reactions, setReactions] = useState<Record<string, Set<string>>>({});
  const done = idx >= cards.length;
  const card = cards[idx];

  const react = useCallback(
    (cardId: string, action: "starred" | "used" | "more" | "less") => {
      setReactions((prev) => {
        const next = { ...prev };
        const set = new Set(next[cardId] ?? []);
        if (set.has(action)) return prev; // one tap each, no spam
        set.add(action);
        next[cardId] = set;
        return next;
      });
      void reactToCard(cardId, action);
    },
    []
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === "j") setIdx((i) => Math.min(i + 1, cards.length));
      if (e.key === "ArrowLeft" || e.key === "k") setIdx((i) => Math.max(i - 1, 0));
      if (e.key === "s" && cards[idx]) react(cards[idx].id, "starred");
      if (e.key === "u" && cards[idx]) react(cards[idx].id, "used");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cards, idx, react]);

  const starred = Object.values(reactions).filter((s) => s.has("starred")).length;

  if (done) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
        <Ember size="lg" state="bright" smiling />
        <p className="mt-9 font-display text-3xl font-semibold tracking-tight">
          You&apos;re fueled. Go be interesting.
        </p>
        <p className="mt-4 font-mono text-xs uppercase leading-loose tracking-widest text-ink-faint">
          {cards.length} stories · {starred} pocketed
          {peopleCount > 0 && ` · ${peopleCount} for your people`}
          <br />
          Next edition: tomorrow morning
        </p>
        <button
          onClick={() => setIdx(0)}
          className="mt-8 font-mono text-xs uppercase tracking-widest text-ink-faint transition-colors hover:text-accent"
        >
          ← Flip back through
        </button>
      </div>
    );
  }

  const mine = reactions[card.id] ?? new Set<string>();

  return (
    <div className="flex flex-1 flex-col">
      {/* Masthead */}
      <div className="flex items-baseline justify-between border-b-2 border-ink pb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
        <span>{dateLabel}</span>
        <span>
          Edition Nº {edition} · {idx + 1}/{cards.length}
        </span>
      </div>

      {/* Card */}
      <article className="flex flex-1 flex-col pt-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
          {card.is_wildcard ? "★ Off your map" : (card.interest_label ?? "The wire")}
          {card.source_title && ` · ${card.source_title}`}
        </p>
        <h2 className="mt-2.5 font-display text-[1.7rem] font-semibold leading-tight tracking-tight [text-wrap:balance]">
          {card.hook}
        </h2>
        <p className="mt-3.5 text-sm leading-relaxed text-ink-soft">{card.gist}</p>

        {card.people.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {card.people.map((p) => (
              <span
                key={p.name}
                className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs"
              >
                {p.name}
                {p.why && <span className="text-ink-faint"> — {p.why}</span>}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 border-t border-rule">
          <Rung label="The 30-second version">{card.depth.sec30}</Rung>
          {card.story_so_far && <Rung label="The story so far">{card.story_so_far}</Rung>}
          <Rung label="Breakdown">
            <ul className="list-disc space-y-1.5 pl-5">
              {card.breakdown.facts.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            <p className="mt-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">
                Why it matters ·{" "}
              </span>
              {card.breakdown.why_it_matters}
            </p>
            {card.breakdown.contested && (
              <p className="mt-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
                  Contested ·{" "}
                </span>
                {card.breakdown.contested}
              </p>
            )}
          </Rung>
          <Rung label="Angles for different rooms">
            <div className="space-y-2.5">
              {card.angles.map((a, i) => (
                <p key={i}>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">
                    {a.lens} ·{" "}
                  </span>
                  {a.text}
                </p>
              ))}
            </div>
          </Rung>
          <Rung label="Questions worth asking">
            <ul className="space-y-1.5 italic">
              {card.questions.map((q, i) => (
                <li key={i}>&ldquo;{q}&rdquo;</li>
              ))}
            </ul>
          </Rung>
          <Rung label="The two-minute version">{card.depth.min2}</Rung>
          <a
            href={card.url}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-between py-2.5 font-mono text-[11px] uppercase tracking-widest text-ink-soft transition-colors hover:text-accent"
          >
            Full source <span>↗</span>
          </a>
        </div>

        {/* Actions */}
        <div className="mt-auto flex items-center justify-between pt-6 font-mono text-[11px] uppercase tracking-widest">
          <button
            onClick={() => react(card.id, "less")}
            className={mine.has("less") ? "text-ink" : "text-ink-faint hover:text-ink"}
          >
            {mine.has("less") ? "Noted ✓" : "Less like this"}
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => react(card.id, "starred")}
              className={mine.has("starred") ? "text-accent" : "text-ink-faint hover:text-accent"}
            >
              {mine.has("starred") ? "Pocketed ✓" : "Back pocket"}
            </button>
            <button
              onClick={() => react(card.id, "more")}
              className={mine.has("more") ? "text-accent" : "text-ink-faint hover:text-accent"}
            >
              {mine.has("more") ? "More ✓" : "More like this"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-5">
          <button
            onClick={() => setIdx(Math.max(0, idx - 1))}
            disabled={idx === 0}
            className="font-mono text-xs uppercase tracking-widest text-ink-faint hover:text-ink disabled:opacity-30"
          >
            ← Prev
          </button>
          <div className="flex gap-1.5">
            {cards.map((_, i) => (
              <span
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i === idx ? "w-4 bg-accent" : "w-1 bg-rule"
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setIdx(idx + 1)}
            className="rounded-full bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-widest text-paper transition-opacity hover:opacity-85"
          >
            {idx + 1 === cards.length ? "Finish" : "Next →"}
          </button>
        </div>
      </article>
    </div>
  );
}
