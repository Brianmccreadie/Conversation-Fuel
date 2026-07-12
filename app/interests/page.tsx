import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/nav";
import { toggleInterest, deleteInterest } from "./actions";

export default async function InterestsPage() {
  const supabase = await createClient();
  const { data: interests } = await supabase
    .from("interests")
    .select("id, label, why, weight, subtopics, status")
    .order("weight", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <Nav active="/interests" />
      <h1 className="mt-6 border-b-2 border-ink pb-4 font-display text-4xl font-semibold tracking-tight">
        Interests
      </h1>

      <ul className="mt-8 space-y-6">
        {(interests ?? []).map((i) => (
          <li
            key={i.id}
            className={`border-l-2 pl-4 ${
              i.status === "active" ? "border-accent" : "border-rule opacity-60"
            }`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-xl font-semibold">{i.label}</h2>
              <div className="flex gap-3 font-mono text-xs uppercase tracking-widest">
                <form
                  action={toggleInterest.bind(
                    null,
                    i.id,
                    i.status === "active" ? "paused" : "active"
                  )}
                >
                  <button className="text-ink-faint hover:text-ink">
                    {i.status === "active" ? "Pause" : "Resume"}
                  </button>
                </form>
                <form action={deleteInterest.bind(null, i.id)}>
                  <button className="text-ink-faint hover:text-accent">
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
        ))}
        {(interests ?? []).length === 0 && (
          <li className="py-8 text-center text-sm text-ink-faint">
            No interests yet.{" "}
            <Link href="/interview" className="text-accent hover:underline">
              Run the Interest Interview
            </Link>{" "}
            to set them up.
          </li>
        )}
      </ul>
    </main>
  );
}
