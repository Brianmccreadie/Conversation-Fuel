import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Shell } from "@/components/shell";
import { Reveal } from "@/components/motion";
import { toggleInterest, deleteInterest } from "./actions";

export default async function InterestsPage() {
  const supabase = await createClient();
  const { data: interests } = await supabase
    .from("interests")
    .select("id, label, why, weight, subtopics, status")
    .order("weight", { ascending: false });

  const list = interests ?? [];

  return (
    <Shell active="/interests" ticker={false}>
      <div className="rise">
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Interests
        </h1>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
          {list.filter((i) => i.status === "active").length} active · weight
          steers the morning deck
        </p>
      </div>

      <ul className="mt-8 space-y-6">
        {list.map((i, idx) => (
          <Reveal key={i.id} i={Math.min(idx, 8)}>
            <li
              className={`border-l-2 pl-4 transition-opacity ${
                i.status === "active" ? "border-accent" : "border-rule opacity-60"
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-xl font-semibold">{i.label}</h2>
                <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest">
                  {/* weight bar */}
                  <span
                    className="hidden h-1 w-14 overflow-hidden rounded-full bg-rule sm:block"
                    title={`weight ${i.weight}`}
                  >
                    <span
                      className="block h-full rounded-full bg-accent transition-[width] duration-700 ease-[var(--ease-out-expo)]"
                      style={{ width: `${Math.round(i.weight * 100)}%` }}
                    />
                  </span>
                  <form
                    action={toggleInterest.bind(
                      null,
                      i.id,
                      i.status === "active" ? "paused" : "active"
                    )}
                  >
                    <button className="text-ink-faint transition-colors hover:text-ink">
                      {i.status === "active" ? "Pause" : "Resume"}
                    </button>
                  </form>
                  <form action={deleteInterest.bind(null, i.id)}>
                    <button className="text-ink-faint transition-colors hover:text-accent">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
              {i.why && (
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{i.why}</p>
              )}
              {i.subtopics?.length > 0 && (
                <p className="mt-2 font-mono text-xs text-ink-faint">
                  {i.subtopics.join(" · ")}
                </p>
              )}
            </li>
          </Reveal>
        ))}
        {list.length === 0 && (
          <li className="py-8 text-center text-sm text-ink-faint">
            No interests yet.{" "}
            <Link href="/fuelup" className="text-accent hover:underline">
              Fuel up
            </Link>{" "}
            — sixty seconds, a few taps — or install the starter pack under{" "}
            <Link href="/sources" className="text-accent hover:underline">
              Sources
            </Link>
            .
          </li>
        )}
      </ul>
      <p className="mt-10 text-center font-mono text-xs uppercase tracking-widest text-ink-faint">
        <Link href="/fuelup" className="transition-colors hover:text-accent">
          Add more topics
        </Link>
        {" · "}
        <Link href="/interview" className="transition-colors hover:text-accent">
          Go deeper with the interview
        </Link>
        {" · "}
        <Link
          href={`/ember?q=${encodeURIComponent("Look at my interests and suggest what's missing or stale.")}`}
          className="transition-colors hover:text-accent"
        >
          Ask the Ember
        </Link>
      </p>
    </Shell>
  );
}
