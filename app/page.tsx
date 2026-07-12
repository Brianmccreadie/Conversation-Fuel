import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/nav";
import { Ember } from "@/components/ember";
import { Deck, type DeckCard } from "@/components/deck";
import { SparkButton } from "@/components/spark-button";

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "long",
  month: "long",
  day: "numeric",
};

export default async function Home() {
  const supabase = await createClient();

  const { count: interestCount } = await supabase
    .from("interests")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  const { data: download } = await supabase
    .from("downloads")
    .select("id, date")
    .eq("status", "ready")
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  // State 1 — brand new: no interests yet.
  if (!interestCount) {
    return (
      <Shell active="/">
        <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
          <Ember size="md" state="dim" />
          <h1 className="mt-9 font-display text-4xl font-semibold tracking-tight [text-wrap:balance]">
            Nothing on the wire yet.
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
            Tell me what you&apos;re into — sixty seconds, one brain dump, a few
            taps — and fresh conversation fuel arrives every morning.
          </p>
          <Link
            href="/fuelup"
            className="mt-8 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition-opacity hover:opacity-85"
          >
            Fuel up →
          </Link>
        </div>
      </Shell>
    );
  }

  // State 2 — interests exist but no edition is ready yet.
  if (!download) {
    return (
      <Shell active="/">
        <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
          <Ember size="md" state="glow" />
          <h1 className="mt-9 font-display text-4xl font-semibold tracking-tight [text-wrap:balance]">
            Your first edition is coming.
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
            The wire runs every morning. Or don&apos;t wait —
          </p>
          <div className="mt-7">
            <SparkButton label="Spark it now" />
          </div>
        </div>
      </Shell>
    );
  }

  // State 3 — the deck.
  const { data: cardRows } = await supabase
    .from("fuel_cards")
    .select(
      "id, position, is_wildcard, gist, hook, story_so_far, breakdown, angles, questions, depth, items(url, sources(title)), card_interests(interests(label)), card_people(why, people(name))"
    )
    .eq("download_id", download.id)
    .order("position");

  const { count: editionCount } = await supabase
    .from("downloads")
    .select("id", { count: "exact", head: true })
    .lte("date", download.date);

  const cards: DeckCard[] = (cardRows ?? []).map((row) => {
    const item = row.items as unknown as {
      url: string;
      sources: { title: string | null } | null;
    } | null;
    const interests = row.card_interests as unknown as
      | { interests: { label: string } | null }[]
      | null;
    const people = row.card_people as unknown as
      | { why: string | null; people: { name: string } | null }[]
      | null;
    return {
      id: row.id,
      position: row.position,
      is_wildcard: row.is_wildcard,
      gist: row.gist,
      hook: row.hook,
      story_so_far: row.story_so_far,
      breakdown: row.breakdown,
      angles: row.angles,
      questions: row.questions,
      depth: row.depth,
      url: item?.url ?? "#",
      source_title: item?.sources?.title ?? null,
      interest_label: interests?.[0]?.interests?.label ?? null,
      people: (people ?? [])
        .filter((p) => p.people)
        .map((p) => ({ name: p.people!.name, why: p.why })),
    };
  });

  const peopleCount = cards.filter((c) => c.people.length > 0).length;
  const dateLabel = new Date(`${download.date}T12:00:00Z`).toLocaleDateString(
    "en-US",
    DATE_FORMAT
  );

  return (
    <Shell active="/">
      <Deck
        cards={cards}
        edition={editionCount ?? 1}
        dateLabel={dateLabel}
        peopleCount={peopleCount}
      />
    </Shell>
  );
}

async function Shell({
  active,
  children,
}: {
  active: string;
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-6 py-10">
      <div className="mb-8">
        <Nav active={active} />
      </div>
      {children}
      <footer className="mt-12 flex items-center justify-between border-t border-rule pt-4 font-mono text-xs text-ink-faint">
        <span>{user?.email}</span>
        <form action="/auth/signout" method="post">
          <button type="submit" className="hover:text-accent">
            Sign out
          </button>
        </form>
      </footer>
    </main>
  );
}
