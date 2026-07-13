import Link from "next/link";
import { Shell } from "@/components/shell";
import { Reveal, Tilt } from "@/components/motion";
import { CRAFT_NOTES, craftNoteForDate, type CraftTag } from "@/lib/craft";

const TAGS: CraftTag[] = [
  "hooks",
  "telling",
  "asking",
  "listening",
  "people",
  "curiosity",
  "structure",
  "presence",
];

// The Craft — the library behind the colophon. Carnegie, Headlee,
// Van Edwards, Duhigg, Brooks, and the storytellers. One move at a time.
export default async function CraftPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const active = TAGS.includes(tag as CraftTag) ? (tag as CraftTag) : null;
  const today = craftNoteForDate(new Date());
  const notes = (active
    ? CRAFT_NOTES.filter((n) => n.tags.includes(active))
    : CRAFT_NOTES
  ).filter((n) => n.id !== today.id);

  return (
    <Shell active="/craft" width="wide" ticker={false}>
      <div className="rise">
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          The Craft
        </h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-faint">
          {CRAFT_NOTES.length} moves from the people who wrote the book on
          being interesting — and interested. One rotates through your deck
          each morning.
        </p>
      </div>

      {/* Today's note — set like a colophon */}
      <Reveal i={1}>
        <blockquote className="relative mt-8 rounded-xl border border-accent/30 bg-accent/5 p-7">
          <span className="stamp absolute -top-3 left-6 bg-paper font-mono text-[9px] font-bold uppercase text-accent">
            Today&apos;s move
          </span>
          <p className="font-display text-2xl font-semibold leading-snug tracking-tight [text-wrap:balance]">
            {today.principle}
          </p>
          <p className="drop-cap mt-4 max-w-xl text-sm leading-relaxed text-ink-soft">
            {today.body}
          </p>
          <footer className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            — {today.source}
          </footer>
        </blockquote>
      </Reveal>

      {/* Tag filter */}
      <div className="mt-9 flex flex-wrap gap-2">
        <Link
          href="/craft"
          className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-widest transition-all duration-200 ${
            !active
              ? "border-ink bg-ink text-paper"
              : "border-rule text-ink-faint hover:-translate-y-0.5 hover:text-ink"
          }`}
        >
          All
        </Link>
        {TAGS.map((t) => (
          <Link
            key={t}
            href={`/craft?tag=${t}`}
            className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-widest transition-all duration-200 ${
              active === t
                ? "border-accent bg-accent text-paper"
                : "border-rule text-ink-faint hover:-translate-y-0.5 hover:border-accent/60 hover:text-accent"
            }`}
          >
            {t}
          </Link>
        ))}
      </div>

      {/* The library */}
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        {notes.map((n, i) => (
          <Reveal key={n.id} i={Math.min(i, 7)}>
            <Tilt className="h-full rounded-xl">
              <article className="flex h-full flex-col rounded-xl border border-rule bg-paper-raised p-5 shadow-[var(--shadow-card)] transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]">
                <h2 className="font-display text-lg font-semibold leading-snug tracking-tight">
                  {n.principle}
                </h2>
                <p className="mt-2.5 flex-1 text-sm leading-relaxed text-ink-soft">
                  {n.body}
                </p>
                <footer className="mt-4 flex items-baseline justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                    {n.source}
                  </span>
                  <span className="flex gap-1.5">
                    {n.tags.slice(0, 3).map((t) => (
                      <Link
                        key={t}
                        href={`/craft?tag=${t}`}
                        className="font-mono text-[9px] uppercase tracking-widest text-accent/70 transition-colors hover:text-accent"
                      >
                        {t}
                      </Link>
                    ))}
                  </span>
                </footer>
              </article>
            </Tilt>
          </Reveal>
        ))}
      </div>

      <p className="mt-10 text-center">
        <Link
          href={`/ember?q=${encodeURIComponent("Teach me one craft move and help me practice it on a story from today's wire.")}`}
          className="font-mono text-[11px] uppercase tracking-widest text-ink-faint transition-colors hover:text-accent"
        >
          Practice with the Ember →
        </Link>
      </p>
    </Shell>
  );
}
