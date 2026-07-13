// The wire ticker — latest headlines crawling under the masthead,
// like the news wire the app is named for. Pure CSS marquee, pauses on hover.

export function Ticker({
  headlines,
}: {
  headlines: { title: string; source: string | null }[];
}) {
  if (headlines.length === 0) return null;
  const loop = [...headlines, ...headlines]; // duplicated for a seamless crawl
  const duration = Math.max(40, headlines.length * 9);

  return (
    <div
      className="ticker relative overflow-hidden border-b border-rule py-1.5"
      aria-hidden="true"
    >
      <div
        className="ticker-track flex w-max items-baseline gap-8 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint"
        style={{ "--ticker-duration": `${duration}s` } as React.CSSProperties}
      >
        {loop.map((h, i) => (
          <span key={i} className="flex items-baseline gap-8">
            <span>
              <span className="text-accent">▸ </span>
              {h.title}
              {h.source && <span className="opacity-60"> — {h.source}</span>}
            </span>
          </span>
        ))}
      </div>
      {/* fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-paper to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-paper to-transparent" />
    </div>
  );
}
