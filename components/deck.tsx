"use client";

// The Daily Download deck — cards as physical objects.
// Swipe or drag them like paper, arrow through with keys, finish on purpose.

import { useCallback, useEffect, useRef, useState } from "react";
import { Ember } from "@/components/ember";
import { EmberSparks } from "@/components/particles";
import { FuelGauge } from "@/components/fuel-gauge";
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
        className="group flex w-full items-center justify-between py-2.5 font-mono text-[11px] uppercase tracking-widest text-ink-soft transition-colors hover:text-accent"
      >
        {label}
        <span
          className="text-ink-faint transition-transform duration-300 ease-[var(--ease-spring)] group-hover:text-accent"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        >
          ▾
        </span>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-[var(--ease-out-expo)]"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="pb-4 text-sm leading-relaxed text-ink-soft">{children}</div>
        </div>
      </div>
    </div>
  );
}

function ShortcutsOverlay({ onClose }: { onClose: () => void }) {
  const ROWS: [string, string][] = [
    ["→ / j", "next card"],
    ["← / k", "previous card"],
    ["s", "back pocket"],
    ["u", "used it"],
    ["drag", "throw the card"],
    ["⌘K", "go anywhere"],
    ["?", "this card"],
  ];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/25 px-4 backdrop-blur-[3px]"
      onMouseDown={onClose}
    >
      <div className="card-in w-full max-w-xs rounded-xl border border-rule bg-paper-raised p-6 shadow-[var(--shadow-card-hover)]">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
          House rules
        </p>
        <ul className="mt-4 space-y-2.5">
          {ROWS.map(([key, what]) => (
            <li key={key} className="flex items-baseline justify-between text-sm text-ink-soft">
              <span className="kbd">{key}</span>
              <span>{what}</span>
            </li>
          ))}
        </ul>
      </div>
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
  const [dir, setDir] = useState<1 | -1>(1);
  const [reactions, setReactions] = useState<Record<string, Set<string>>>({});
  const [showKeys, setShowKeys] = useState(false);
  const done = idx >= cards.length;
  const card = cards[idx];

  // -- drag physics ----------------------------------------------------------
  const cardRef = useRef<HTMLElement>(null);
  const drag = useRef<{ startX: number; dx: number; active: boolean }>({
    startX: 0,
    dx: 0,
    active: false,
  });

  const goto = useCallback(
    (next: number) => {
      setDir(next >= idx ? 1 : -1);
      setIdx(Math.max(0, Math.min(next, cards.length)));
    },
    [idx, cards.length]
  );

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest("button, a, input, textarea")) return;
    drag.current = { startX: e.clientX, dx: 0, active: true };
    cardRef.current?.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    drag.current.dx = dx;
    const el = cardRef.current;
    if (el) {
      el.style.transition = "none";
      el.style.transform = `translateX(${dx}px) rotate(${dx * 0.02}deg)`;
      el.style.opacity = String(Math.max(0.35, 1 - Math.abs(dx) / 500));
    }
  }, []);

  const endDrag = useCallback(() => {
    if (!drag.current.active) return;
    const { dx } = drag.current;
    drag.current.active = false;
    const el = cardRef.current;
    if (!el) return;
    if (dx < -90 && idx < cards.length) {
      goto(idx + 1);
    } else if (dx > 90 && idx > 0) {
      goto(idx - 1);
    } else {
      // spring home
      el.style.transition = "transform 0.5s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease";
      el.style.transform = "translateX(0) rotate(0)";
      el.style.opacity = "1";
    }
  }, [idx, cards.length, goto]);

  // -- reactions --------------------------------------------------------------
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

  // -- keyboard ---------------------------------------------------------------
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === "j") goto(idx + 1);
      if (e.key === "ArrowLeft" || e.key === "k") goto(idx - 1);
      if (e.key === "s" && cards[idx]) react(cards[idx].id, "starred");
      if (e.key === "u" && cards[idx]) react(cards[idx].id, "used");
      if (e.key === "?") setShowKeys((v) => !v);
      if (e.key === "Escape") setShowKeys(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cards, idx, react, goto]);

  const starred = Object.values(reactions).filter((s) => s.has("starred")).length;

  // -- end screen -------------------------------------------------------------
  if (done) {
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center py-16 text-center">
        <EmberSparks />
        <div className="rise" style={{ "--rise-i": 0 } as React.CSSProperties}>
          <Ember size="lg" state="bright" smiling />
        </div>
        <p
          className="rise mt-9 font-display text-3xl font-semibold tracking-tight"
          style={{ "--rise-i": 1 } as React.CSSProperties}
        >
          You&apos;re fueled. Go be interesting.
        </p>
        <p
          className="rise mt-4 font-mono text-xs uppercase leading-loose tracking-widest text-ink-faint"
          style={{ "--rise-i": 2 } as React.CSSProperties}
        >
          {cards.length} stories · {starred} pocketed
          {peopleCount > 0 && ` · ${peopleCount} for your people`}
          <br />
          Next edition: tomorrow morning
        </p>
        <button
          onClick={() => goto(0)}
          className="rise mt-8 font-mono text-xs uppercase tracking-widest text-ink-faint transition-colors hover:text-accent"
          style={{ "--rise-i": 3 } as React.CSSProperties}
        >
          ← Flip back through
        </button>
      </div>
    );
  }

  const mine = reactions[card.id] ?? new Set<string>();

  return (
    <div className="flex flex-1 flex-col">
      {showKeys && <ShortcutsOverlay onClose={() => setShowKeys(false)} />}

      {/* Deck masthead */}
      <div className="flex items-center justify-between border-b-2 border-ink pb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
        <span>{dateLabel}</span>
        <span className="flex items-center gap-4">
          <span>Edition Nº {edition}</span>
          <FuelGauge value={idx + 1} total={cards.length} />
        </span>
      </div>

      {/* The card — a physical object; throw it */}
      <article
        key={card.id}
        ref={cardRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={`${dir === 1 ? "card-in" : "card-in-back"} relative mt-5 flex flex-1 cursor-grab touch-pan-y flex-col rounded-xl border bg-paper-raised p-6 shadow-[var(--shadow-card)] active:cursor-grabbing sm:p-7 ${
          card.is_wildcard ? "border-accent/50" : "border-rule"
        }`}
      >
        {card.is_wildcard && (
          <span className="stamp absolute -top-3 right-6 bg-paper-raised font-mono text-[10px] font-bold uppercase text-accent">
            Off your map
          </span>
        )}
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
          {card.is_wildcard ? "★ The wildcard" : (card.interest_label ?? "The wire")}
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
                className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs transition-transform duration-200 hover:-translate-y-0.5"
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

        {/* Reactions */}
        <div className="mt-auto flex items-center justify-between pt-6 font-mono text-[11px] uppercase tracking-widest">
          <button
            onClick={() => react(card.id, "less")}
            className={mine.has("less") ? "text-ink" : "text-ink-faint transition-colors hover:text-ink"}
          >
            {mine.has("less") ? "Noted ✓" : "Less like this"}
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => react(card.id, "starred")}
              className={`transition-transform active:scale-90 ${mine.has("starred") ? "text-accent" : "text-ink-faint hover:text-accent"}`}
            >
              {mine.has("starred") ? "Pocketed ✓" : "Back pocket"}
            </button>
            <button
              onClick={() => react(card.id, "more")}
              className={`transition-transform active:scale-90 ${mine.has("more") ? "text-accent" : "text-ink-faint hover:text-accent"}`}
            >
              {mine.has("more") ? "More ✓" : "More like this"}
            </button>
          </div>
        </div>
      </article>

      {/* Deck controls */}
      <div className="flex items-center justify-between pt-5">
        <button
          onClick={() => goto(idx - 1)}
          disabled={idx === 0}
          className="font-mono text-xs uppercase tracking-widest text-ink-faint transition-colors hover:text-ink disabled:opacity-30"
        >
          ← Prev
        </button>
        <div className="flex gap-1.5">
          {cards.map((c, i) => (
            <button
              key={c.id}
              aria-label={`Card ${i + 1}`}
              onClick={() => goto(i)}
              className={`h-1 rounded-full transition-all duration-300 ease-[var(--ease-spring)] ${
                i === idx
                  ? "w-5 bg-accent"
                  : i < idx
                    ? "w-1.5 bg-accent/40 hover:bg-accent/70"
                    : "w-1.5 bg-rule hover:bg-ink-faint"
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => goto(idx + 1)}
          className="rounded-full bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-widest text-paper transition-[opacity,transform] hover:opacity-85 active:scale-95"
        >
          {idx + 1 === cards.length ? "Finish" : "Next →"}
        </button>
      </div>
      <p className="pt-3 text-center font-mono text-[9px] uppercase tracking-[0.2em] text-ink-faint">
        press <span className="kbd">?</span> for house rules
      </p>
    </div>
  );
}
