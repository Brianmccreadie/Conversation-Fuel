"use client";

// A little fuel gauge — an arc that fills as you move through the deck.
// The needle sweep is sprung; the readout ticks in mono.

export function FuelGauge({
  value,
  total,
}: {
  value: number; // cards read
  total: number;
}) {
  const R = 15;
  const C = Math.PI * R; // half-circle circumference
  const frac = total > 0 ? Math.min(1, value / total) : 0;

  return (
    <div className="flex items-center gap-2" title={`${value} of ${total} read`}>
      <svg width="40" height="24" viewBox="0 0 40 24" aria-hidden>
        {/* track */}
        <path
          d="M 5 21 A 15 15 0 0 1 35 21"
          fill="none"
          stroke="var(--color-rule)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* fill */}
        <path
          d="M 5 21 A 15 15 0 0 1 35 21"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - frac)}
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.34,1.56,0.64,1)" }}
        />
      </svg>
      <span className="font-mono text-[10px] uppercase tracking-widest text-ink-faint tabular-nums">
        {value}/{total}
      </span>
    </div>
  );
}
