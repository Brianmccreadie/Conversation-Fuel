import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { WireClock } from "@/components/motion";
import { Ticker } from "@/components/ticker";
import { EmberDock } from "@/components/ember-dock";
import { CommandPalette } from "@/components/command-palette";

const LINKS = [
  { href: "/", label: "Today" },
  { href: "/wire", label: "The Wire" },
  { href: "/people", label: "People" },
  { href: "/ember", label: "Ember" },
  { href: "/craft", label: "Craft" },
  { href: "/interests", label: "Interests" },
  { href: "/sources", label: "Sources" },
];

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
};

// The masthead shell — every page is a section of the same paper.
export async function Shell({
  active,
  children,
  width = "reading",
  ticker = true,
}: {
  active: string;
  children: React.ReactNode;
  width?: "reading" | "wide";
  ticker?: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let headlines: { title: string; source: string | null }[] = [];
  if (ticker) {
    const { data } = await supabase
      .from("items")
      .select("title, sources(title)")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(12);
    headlines = (data ?? []).map((i) => ({
      title: i.title,
      source:
        (i.sources as unknown as { title: string | null } | null)?.title ?? null,
    }));
  }

  const maxW = width === "wide" ? "max-w-4xl" : "max-w-2xl";
  const today = new Date().toLocaleDateString("en-US", DATE_FORMAT);

  return (
    <main className={`mx-auto flex min-h-dvh w-full ${maxW} flex-col px-6 pb-10 pt-7`}>
      {/* Masthead */}
      <header className="rise">
        <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
          <span suppressHydrationWarning>{today}</span>
          <span className="flex items-center gap-3">
            <WireClock />
            <span className="hidden sm:inline">· the private wire</span>
          </span>
        </div>
        <div className="mt-2 flex items-end justify-between">
          <Link
            href="/"
            className="font-display text-2xl font-semibold tracking-tight transition-colors hover:text-accent"
          >
            Conversation Fuel<span className="text-accent">.</span>
          </Link>
          <button
            data-cmdk-trigger
            className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-faint transition-colors hover:text-ink sm:flex"
          >
            Anywhere <span className="kbd">⌘K</span>
          </button>
        </div>
        <div className="masthead-rule mt-3" />
        <nav className="flex flex-wrap gap-x-5 gap-y-2 py-3 font-mono text-[11px] uppercase tracking-widest">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              data-active={l.href === active}
              className={`link-draw ${
                l.href === active
                  ? "text-accent"
                  : "text-ink-faint transition-colors hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        {ticker && <Ticker headlines={headlines} />}
      </header>

      <div className="flex flex-1 flex-col pt-8">{children}</div>

      <footer className="mt-14 flex items-center justify-between border-t border-rule pt-4 font-mono text-[10px] uppercase tracking-widest text-ink-faint">
        <span>{user?.email}</span>
        <span className="flex items-center gap-4">
          <Link href="/fuelup" className="transition-colors hover:text-accent">
            Fuel up
          </Link>
          <form action="/auth/signout" method="post">
            <button type="submit" className="uppercase tracking-widest transition-colors hover:text-accent">
              Sign out
            </button>
          </form>
        </span>
      </footer>

      {active !== "/ember" && <EmberDock />}
      <CommandPalette />
    </main>
  );
}
