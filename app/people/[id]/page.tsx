import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Shell } from "@/components/shell";
import { Reveal } from "@/components/motion";
import {
  addCaptureNote,
  addPersonInterest,
  deletePerson,
  deletePersonInterest,
} from "../actions";

// A person's page — their world, your notes, and the fuel reserve:
// fresh stories from the wire that map to what they care about.
export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: person } = await supabase
    .from("people")
    .select(
      "id, name, relationship, notes, person_interests(id, label, detail), capture_notes(id, note, created_at)"
    )
    .eq("id", id)
    .maybeSingle();
  if (!person) notFound();

  const interests = (person.person_interests ?? []) as {
    id: string;
    label: string;
    detail: string | null;
  }[];
  const captures = ((person.capture_notes ?? []) as {
    id: string;
    note: string;
    created_at: string;
  }[]).sort((a, b) => b.created_at.localeCompare(a.created_at));

  // Fuel reserve — recent wire items matching their interest keywords.
  const reserve: { title: string; url: string; source: string | null; label: string }[] = [];
  for (const pi of interests.slice(0, 6)) {
    const word = pi.label.split(/\s+/).sort((a, b) => b.length - a.length)[0];
    if (!word || word.length < 3) continue;
    const { data: items } = await supabase
      .from("items")
      .select("title, url, sources(title)")
      .ilike("title", `%${word}%`)
      .order("published_at", { ascending: false })
      .limit(3);
    for (const it of items ?? []) {
      if (reserve.some((r) => r.url === it.url)) continue;
      reserve.push({
        title: it.title,
        url: it.url,
        source:
          (it.sources as unknown as { title: string | null } | null)?.title ?? null,
        label: pi.label,
      });
    }
  }

  return (
    <Shell active="/people" ticker={false}>
      <div className="rise flex items-end justify-between">
        <div>
          <Link
            href="/people"
            className="font-mono text-[10px] uppercase tracking-widest text-ink-faint transition-colors hover:text-accent"
          >
            ← Your people
          </Link>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">
            {person.name}
          </h1>
          {person.relationship && (
            <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-ink-faint">
              {person.relationship}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/ember?q=${encodeURIComponent(`Interview me about ${person.name} — help me map what they care about.`)}`}
            className="rounded-full border border-accent/50 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-accent transition-all hover:-translate-y-0.5 hover:bg-accent/10"
          >
            Interview me
          </Link>
          <Link
            href={`/ember?q=${encodeURIComponent(`Build me a tonight brief for ${person.name}.`)}`}
            className="rounded-full bg-accent px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-paper transition-all hover:-translate-y-0.5"
          >
            Tonight brief
          </Link>
        </div>
      </div>

      {person.notes && (
        <p className="mt-5 border-l-2 border-accent pl-4 text-sm leading-relaxed text-ink-soft">
          {person.notes}
        </p>
      )}

      {/* Their world */}
      <Reveal i={1}>
        <section className="mt-9">
          <h2 className="border-b-2 border-ink pb-2 font-mono text-[11px] uppercase tracking-[0.2em]">
            Their world
          </h2>
          <ul className="mt-4 space-y-2.5">
            {interests.map((pi) => (
              <li key={pi.id} className="group flex items-baseline gap-3">
                <span className="font-mono text-xs text-accent">▸</span>
                <div className="flex-1">
                  <span className="text-sm font-medium">{pi.label}</span>
                  {pi.detail && (
                    <span className="text-sm text-ink-faint"> — {pi.detail}</span>
                  )}
                </div>
                <form action={deletePersonInterest.bind(null, person.id, pi.id)}>
                  <button className="font-mono text-[10px] uppercase tracking-widest text-transparent transition-colors group-hover:text-ink-faint hover:!text-accent">
                    Remove
                  </button>
                </form>
              </li>
            ))}
            {interests.length === 0 && (
              <li className="text-sm italic text-ink-faint">
                Nothing mapped yet — add topics below, or let the Ember interview you.
              </li>
            )}
          </ul>
          <form
            action={addPersonInterest.bind(null, person.id)}
            className="mt-4 flex gap-3"
          >
            <input
              name="label"
              required
              placeholder="Topic — 'peptides'"
              className="w-36 border-b border-rule bg-transparent py-1.5 text-sm outline-none transition-colors focus:border-accent"
            />
            <input
              name="detail"
              placeholder="The specific angle — 'BPC-157 for his shoulder'"
              className="flex-1 border-b border-rule bg-transparent py-1.5 text-sm outline-none transition-colors focus:border-accent"
            />
            <button className="font-mono text-[10px] uppercase tracking-widest text-ink-faint transition-colors hover:text-accent">
              Add
            </button>
          </form>
        </section>
      </Reveal>

      {/* Fuel reserve */}
      <Reveal i={2}>
        <section className="mt-9">
          <h2 className="flex items-baseline justify-between border-b-2 border-ink pb-2 font-mono text-[11px] uppercase tracking-[0.2em]">
            Fuel reserve
            <span className="text-ink-faint">{reserve.length} fresh</span>
          </h2>
          <ul className="mt-2 divide-y divide-rule">
            {reserve.slice(0, 8).map((r) => (
              <li key={r.url} className="group py-3 transition-transform duration-300 hover:translate-x-1.5">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-display text-base leading-snug transition-colors group-hover:text-accent"
                >
                  {r.title}
                </a>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-faint">
                  {r.source && `${r.source} · `}
                  <span className="text-accent/80">{r.label}</span>
                </p>
              </li>
            ))}
            {reserve.length === 0 && (
              <li className="py-4 text-sm italic text-ink-faint">
                No matched stories yet — the reserve fills as the wire runs.
              </li>
            )}
          </ul>
        </section>
      </Reveal>

      {/* Capture notes */}
      <Reveal i={3}>
        <section className="mt-9">
          <h2 className="border-b-2 border-ink pb-2 font-mono text-[11px] uppercase tracking-[0.2em]">
            Capture notes
          </h2>
          <form action={addCaptureNote.bind(null, person.id)} className="mt-4 flex gap-3">
            <input
              name="note"
              required
              placeholder={`"${person.name} mentioned…"`}
              className="flex-1 border-b border-rule bg-transparent py-1.5 text-sm outline-none transition-colors focus:border-accent"
            />
            <button className="font-mono text-[10px] uppercase tracking-widest text-ink-faint transition-colors hover:text-accent">
              Capture
            </button>
          </form>
          <ul className="mt-4 space-y-3">
            {captures.map((c) => (
              <li key={c.id} className="flex items-baseline gap-3 text-sm">
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-ink-faint">
                  {new Date(c.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="leading-relaxed text-ink-soft">{c.note}</span>
              </li>
            ))}
          </ul>
        </section>
      </Reveal>

      <form action={deletePerson.bind(null, person.id)} className="mt-12 text-center">
        <button className="font-mono text-[10px] uppercase tracking-widest text-ink-faint transition-colors hover:text-accent">
          Remove {person.name}
        </button>
      </form>
    </Shell>
  );
}
