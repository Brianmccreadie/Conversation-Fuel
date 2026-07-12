import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/nav";

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toLocaleDateString("en-US", DATE_FORMAT);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <div className="mb-6">
        <Nav active="/" />
      </div>
      {/* Masthead */}
      <header className="border-b-2 border-ink pb-6">
        <div className="flex items-baseline justify-between font-mono text-xs uppercase tracking-[0.2em] text-ink-faint">
          <span>{today}</span>
          <span>Edition Nº 1</span>
        </div>
        <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight">
          Conversation Fuel
        </h1>
        <p className="mt-2 text-sm text-ink-soft">Your private wire service.</p>
      </header>

      {/* Empty state until the pipeline exists (Phase 1–2) */}
      <section className="mt-16 text-center">
        <p className="font-display text-2xl text-ink-soft">No fuel yet.</p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-faint">
          The Daily Download arrives once your interests are set and the
          ingestion pipeline is running. Next up: the Interest Interview.
        </p>
      </section>

      {/* Footer / session */}
      <footer className="mt-24 flex items-center justify-between border-t border-rule pt-4 font-mono text-xs text-ink-faint">
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
