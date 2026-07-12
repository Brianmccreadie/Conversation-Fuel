import Link from "next/link";

const LINKS = [
  { href: "/", label: "Today" },
  { href: "/wire", label: "The Wire" },
  { href: "/interests", label: "Interests" },
  { href: "/sources", label: "Sources" },
  { href: "/interview", label: "Interview" },
];

export function Nav({ active }: { active: string }) {
  return (
    <nav className="flex gap-5 font-mono text-xs uppercase tracking-widest">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={
            l.href === active
              ? "text-accent"
              : "text-ink-faint transition-colors hover:text-ink"
          }
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
