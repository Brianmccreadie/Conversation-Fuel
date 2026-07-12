"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Ember } from "@/components/ember";

type ParsedInterest = {
  label: string;
  subtopics: string[];
  angles: string[];
  feeds: { title: string; url: string }[];
};
type Calibration = {
  weight: number | null; // 1.0 hour · 0.5 curious · null skip
  pickedAngles: string[];
};

const STARTERS = [
  "space", "AI", "true crime", "golf", "investing", "movies", "cooking",
  "history", "music", "fitness", "travel", "science", "sports", "books",
];

export default function FuelUpPage() {
  const router = useRouter();
  const [step, setStep] = useState<"dump" | "calibrate" | "promise">("dump");
  const [dump, setDump] = useState("");
  const [starters, setStarters] = useState<string[]>([]);
  const [parsing, setParsing] = useState(false);
  const [interests, setInterests] = useState<ParsedInterest[]>([]);
  const [cals, setCals] = useState<Calibration[]>([]);
  const [idx, setIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sparking, setSparking] = useState<"idle" | "working" | "done">("idle");
  const [sparkMsg, setSparkMsg] = useState<string | null>(null);

  async function parse() {
    const fullDump = [dump, ...starters].filter(Boolean).join(", ");
    if (!fullDump.trim()) return;
    setParsing(true);
    setError(null);
    try {
      const res = await fetch("/api/fuelup/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dump: fullDump }),
      });
      if (!res.ok) throw new Error(`Couldn't parse that (${res.status}) — try again.`);
      const data = await res.json();
      const parsed: ParsedInterest[] = data.interests ?? [];
      if (parsed.length === 0) throw new Error("Nothing came through — add a bit more.");
      setInterests(parsed);
      setCals(parsed.map(() => ({ weight: null, pickedAngles: [] })));
      setIdx(0);
      setStep("calibrate");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setParsing(false);
    }
  }

  function setWeight(weight: number | null) {
    const next = [...cals];
    next[idx] = { ...next[idx], weight };
    setCals(next);
    // "hour" pauses for angle picks; curious/skip advance immediately.
    if (weight !== 1.0) advance(next);
  }

  function toggleAngle(angle: string) {
    const next = [...cals];
    const picked = next[idx].pickedAngles;
    next[idx] = {
      ...next[idx],
      pickedAngles: picked.includes(angle)
        ? picked.filter((a) => a !== angle)
        : [...picked, angle],
    };
    setCals(next);
  }

  async function advance(current = cals) {
    if (idx + 1 < interests.length) {
      setIdx(idx + 1);
    } else {
      await save(current);
    }
  }

  async function save(current: Calibration[]) {
    setSaving(true);
    setError(null);
    const kept = interests
      .map((interest, i) => ({ interest, cal: current[i] }))
      .filter(({ cal }) => cal.weight !== null);
    try {
      const res = await fetch("/api/interview/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interests: kept.map(({ interest, cal }) => ({
            label: interest.label,
            why:
              cal.pickedAngles.length > 0
                ? `Cares about: ${cal.pickedAngles.join(", ")}`
                : `Interested in ${interest.label}`,
            weight: cal.weight,
            subtopics: interest.subtopics,
          })),
          sources: kept.flatMap(({ interest }) =>
            interest.feeds.map((f) => ({ ...f, interest_label: interest.label }))
          ),
        }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      setStep("promise");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function spark() {
    setSparking("working");
    setSparkMsg(null);
    try {
      const res = await fetch("/api/spark", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Spark failed (${res.status})`);
      setSparking("done");
      setSparkMsg(`${data.cards} stories ready.`);
      setTimeout(() => router.push("/"), 900);
    } catch (e) {
      setSparking("idle");
      setSparkMsg(e instanceof Error ? e.message : "Spark failed — the nightly run will cover it.");
    }
  }

  const kept = cals.filter((c) => c.weight !== null).length;
  const current = interests[idx];
  const currentCal = cals[idx];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-10">
      {step === "dump" && (
        <>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-faint">
            Fuel Up · 1 of 3
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            What are you into? Dump it all.
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            Don&apos;t organize. Don&apos;t explain. Just list.
          </p>
          <textarea
            value={dump}
            onChange={(e) => setDump(e.target.value)}
            placeholder="golf course design, F1 strategy, smoking brisket, AI tools, my kids' soccer…"
            className="mt-5 min-h-36 w-full resize-y rounded-xl border-2 border-rule bg-paper-raised p-4 text-sm leading-relaxed outline-none focus:border-accent"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() =>
                  setStarters(
                    starters.includes(s)
                      ? starters.filter((x) => x !== s)
                      : [...starters, s]
                  )
                }
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  starters.includes(s)
                    ? "border-accent bg-accent/10 text-ink"
                    : "border-rule text-ink-soft hover:border-accent"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={parse}
            disabled={parsing || (!dump.trim() && starters.length === 0)}
            className="mt-8 rounded-full bg-ink py-3.5 text-sm font-semibold text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {parsing ? "Reading your brain…" : "That's my brain →"}
          </button>
          <p className="mt-3 text-center text-xs text-ink-faint">
            You can always add more later. Prefer a conversation?{" "}
            <Link href="/interview" className="text-accent hover:underline">
              Go deeper
            </Link>
          </p>
          {error && <p className="mt-3 text-center text-sm text-accent">{error}</p>}
        </>
      )}

      {step === "calibrate" && current && (
        <>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-faint">
            Calibrate · {idx + 1} of {interests.length}
          </p>
          <h1 className="mt-10 text-center font-display text-4xl font-semibold tracking-tight">
            {current.label}
          </h1>
          <p className="mt-2 text-center text-sm text-ink-soft">
            How deep does this one go?
          </p>
          <div className="mx-auto mt-7">
            <Ember size="sm" state={currentCal?.weight === 1 ? "bright" : "glow"} />
          </div>

          <div className="mt-7 flex flex-col gap-2.5">
            <button
              onClick={() => setWeight(1.0)}
              className={`rounded-2xl border-2 p-3.5 text-left text-sm font-semibold transition-colors ${
                currentCal?.weight === 1
                  ? "border-accent bg-accent/10"
                  : "border-rule bg-paper-raised hover:border-accent"
              }`}
            >
              Could talk for an hour
              <span className="block text-xs font-normal text-ink-faint">
                Front of the deck, every day
              </span>
            </button>
            <button
              onClick={() => setWeight(0.5)}
              className="rounded-2xl border-2 border-rule bg-paper-raised p-3.5 text-left text-sm font-semibold transition-colors hover:border-accent"
            >
              Curious, keep me posted
              <span className="block text-xs font-normal text-ink-faint">
                Only the genuinely great stuff
              </span>
            </button>
            <button
              onClick={() => setWeight(null)}
              className="rounded-2xl border-2 border-rule bg-paper-raised p-3.5 text-left text-sm font-semibold transition-colors hover:border-accent"
            >
              Actually… skip it
              <span className="block text-xs font-normal text-ink-faint">
                No hard feelings
              </span>
            </button>
          </div>

          {currentCal?.weight === 1 && current.angles.length > 0 && (
            <div className="mt-6">
              <p className="text-center font-mono text-xs uppercase tracking-widest text-ink-faint">
                What&apos;s the angle? Tap all that fit
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {current.angles.map((a) => (
                  <button
                    key={a}
                    onClick={() => toggleAngle(a)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      currentCal.pickedAngles.includes(a)
                        ? "border-accent bg-accent/10 text-ink"
                        : "border-rule text-ink-soft hover:border-accent"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <button
                onClick={() => advance()}
                disabled={saving}
                className="mt-6 w-full rounded-full bg-ink py-3 text-sm font-semibold text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
              >
                {saving
                  ? "Saving…"
                  : idx + 1 < interests.length
                    ? "Next topic →"
                    : "Finish →"}
              </button>
            </div>
          )}

          <div className="mt-auto flex justify-center gap-1.5 pt-8">
            {interests.map((_, i) => (
              <span
                key={i}
                className={`h-1 w-4 rounded-full ${i < idx ? "bg-accent" : i === idx ? "bg-ink" : "bg-rule"}`}
              />
            ))}
          </div>
          {error && <p className="mt-3 text-center text-sm text-accent">{error}</p>}
        </>
      )}

      {step === "promise" && (
        <>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-faint">
            Conversation Fuel · Ready
          </p>
          <h1 className="mt-12 text-center font-display text-4xl font-semibold leading-tight tracking-tight">
            Your wire is live. First edition:{" "}
            <em className="italic text-accent">tomorrow, 7 AM.</em>
          </h1>
          <div className="mx-auto mt-8 border-y border-rule px-4 py-4 text-center font-mono text-xs uppercase leading-loose tracking-widest text-ink-faint">
            {kept} topics on the wire
            <br />
            fresh stories every morning
            <br />1 wildcard, off your map
          </div>
          <div className="mx-auto mt-10">
            <Ember size="md" state={sparking === "done" ? "bright" : "glow"} smiling={sparking === "done"} />
          </div>
          <button
            onClick={spark}
            disabled={sparking !== "idle"}
            className="mt-10 rounded-full bg-ink py-3.5 text-sm font-semibold text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {sparking === "working"
              ? "Sparking your first stories… (~1 min)"
              : sparking === "done"
                ? "Ready — opening your deck"
                : "Can't wait — spark stories now"}
          </button>
          {sparkMsg && (
            <p className="mt-3 text-center text-sm text-ink-soft">{sparkMsg}</p>
          )}
          <Link
            href="/"
            className="mt-4 text-center font-mono text-xs uppercase tracking-widest text-ink-faint hover:text-ink"
          >
            Or just wait for tomorrow →
          </Link>
        </>
      )}
    </main>
  );
}
