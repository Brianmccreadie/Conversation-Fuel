"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Ember } from "@/components/ember";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      setPending(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="rise flex justify-center pb-8" style={{ "--rise-i": 0 } as React.CSSProperties}>
          <Ember size="md" state="glow" />
        </div>
        <p className="rise font-mono text-xs uppercase tracking-[0.2em] text-ink-faint" style={{ "--rise-i": 1 } as React.CSSProperties}>
          The Private Wire
        </p>
        <h1 className="rise mt-2 font-display text-4xl font-semibold tracking-tight" style={{ "--rise-i": 2 } as React.CSSProperties}>
          Conversation Fuel<span className="text-accent">.</span>
        </h1>
        <p className="rise mt-3 text-sm leading-relaxed text-ink-soft" style={{ "--rise-i": 3 } as React.CSSProperties}>
          Your morning edition of things worth saying — and asking.
        </p>
        <form
          onSubmit={handleSubmit}
          className="rise mt-6 flex flex-col gap-3 border-t border-rule pt-6"
          style={{ "--rise-i": 4 } as React.CSSProperties}
        >
          <label
            htmlFor="email"
            className="font-mono text-xs uppercase tracking-widest text-ink-faint"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-rule bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <label
            htmlFor="password"
            className="mt-2 font-mono text-xs uppercase tracking-widest text-ink-faint"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-rule bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={pending}
            className="mt-4 bg-ink px-3 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
          {error && <p className="text-sm text-accent">{error}</p>}
        </form>
      </div>
    </main>
  );
}
