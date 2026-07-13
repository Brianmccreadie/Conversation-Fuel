"use client";

// The Ember's perch — a floating dock in the corner of every page.
// It breathes, it pulses when it has something for you, and it takes
// you to the fireside when tapped.

import Link from "next/link";
import { useState } from "react";
import { Ember } from "@/components/ember";

export function EmberDock() {
  const [hover, setHover] = useState(false);

  return (
    <Link
      href="/ember"
      aria-label="Talk to the Ember"
      className="fixed bottom-6 right-6 z-40"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span
        className={`pointer-events-none absolute -top-9 right-0 whitespace-nowrap rounded-full border border-rule bg-paper-raised px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-ink-soft shadow-[var(--shadow-card)] transition-all duration-300 ${
          hover ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
        }`}
      >
        Talk to me
      </span>
      <span className="absolute inset-0 rounded-full bg-accent/25 pulse-ring" />
      <span className="block transition-transform duration-300 ease-[var(--ease-spring)] hover:scale-110">
        <Ember size="sm" state={hover ? "bright" : "glow"} smiling={hover} />
      </span>
    </Link>
  );
}
