import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Shell } from "@/components/shell";
import { Reveal } from "@/components/motion";
import { addPerson } from "./actions";

// People — the other half of the thesis. Their interests are your fuel.
export default async function PeoplePage() {
  const supabase = await createClient();
  const { data: people } = await supabase
    .from("people")
    .select(
      "id, name, relationship, person_interests(label), capture_notes(created_at)"
    )
    .order("name");

  const list = people ?? [];

  return (
    <Shell active="/people" ticker={false}>
      <div className="rise">
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Your people
        </h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-faint">
          Carnegie&apos;s royal road: talk in terms of the other person&apos;s
          interests. Add the people you see most; the wire starts carrying
          fuel for them too.
        </p>
      </div>

      {/* Quick add — name, relationship, a few topics. Sixty seconds. */}
      <Reveal i={1}>
        <form
          action={addPerson}
          className="mt-8 rounded-xl border border-rule bg-paper-raised p-5 shadow-[var(--shadow-card)]"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            Quick add
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              name="name"
              required
              placeholder="Name"
              className="border-b border-rule bg-transparent py-2 text-sm outline-none transition-colors focus:border-accent"
            />
            <input
              name="relationship"
              placeholder="Who they are — 'college friend', 'dad'"
              className="border-b border-rule bg-transparent py-2 text-sm outline-none transition-colors focus:border-accent"
            />
          </div>
          <input
            name="topics"
            placeholder="What they're into, comma-separated — 'peptides, pickleball, BJJ'"
            className="mt-3 w-full border-b border-rule bg-transparent py-2 text-sm outline-none transition-colors focus:border-accent"
          />
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-ink-faint">
              Or let the Ember interview you — it asks better questions.
            </p>
            <div className="flex gap-2">
              <Link
                href={`/ember?q=${encodeURIComponent("Interview me about one of my friends.")}`}
                className="rounded-full border border-accent/50 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-accent transition-all hover:-translate-y-0.5 hover:bg-accent/10"
              >
                Interview me
              </Link>
              <button
                type="submit"
                className="rounded-full bg-ink px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-paper transition-[opacity,transform] hover:opacity-85 active:scale-95"
              >
                Add
              </button>
            </div>
          </div>
        </form>
      </Reveal>

      {/* Tonight mode */}
      {list.length > 0 && (
        <Reveal i={2}>
          <div className="mt-6 flex items-center justify-between rounded-xl border border-accent/30 bg-accent/5 px-5 py-4">
            <div>
              <p className="font-display text-lg font-semibold">Seeing someone tonight?</p>
              <p className="text-xs text-ink-faint">
                Get a sixty-second brief: their world, fresh stories, real questions.
              </p>
            </div>
            <Link
              href={`/ember?q=${encodeURIComponent("Brief me for tonight — ask me who I'm seeing.")}`}
              className="shrink-0 rounded-full bg-accent px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-paper transition-all hover:-translate-y-0.5"
            >
              Tonight mode
            </Link>
          </div>
        </Reveal>
      )}

      {/* The roster */}
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {list.map((p, i) => {
          const interests = (p.person_interests ?? []) as { label: string }[];
          const captures = (p.capture_notes ?? []) as { created_at: string }[];
          return (
            <Reveal key={p.id} i={Math.min(i + 2, 8)}>
              <Link
                href={`/people/${p.id}`}
                className="group block h-full rounded-xl border border-rule bg-paper-raised p-5 shadow-[var(--shadow-card)] transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
              >
                <div className="flex items-baseline justify-between">
                  <h2 className="font-display text-xl font-semibold tracking-tight transition-colors group-hover:text-accent">
                    {p.name}
                  </h2>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-ink-faint">
                    {captures.length > 0 ? `${captures.length} notes` : "no notes yet"}
                  </span>
                </div>
                {p.relationship && (
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-faint">
                    {p.relationship}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {interests.slice(0, 5).map((pi) => (
                    <span
                      key={pi.label}
                      className="rounded-full border border-rule px-2.5 py-0.5 text-[11px] text-ink-soft"
                    >
                      {pi.label}
                    </span>
                  ))}
                  {interests.length === 0 && (
                    <span className="text-xs italic text-ink-faint">
                      Interests unknown — interview time.
                    </span>
                  )}
                </div>
              </Link>
            </Reveal>
          );
        })}
      </ul>
      {list.length === 0 && (
        <p className="mt-10 text-center text-sm text-ink-faint">
          Nobody here yet. Add the three people you see most.
        </p>
      )}
    </Shell>
  );
}
