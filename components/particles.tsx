"use client";

// Ember sparks — tiny warm particles that drift up from the Ember on the
// end-of-deck screen. Deterministic per mount, CSS-animated, zero libraries.

import { useMemo } from "react";

export function EmberSparks({ count = 22 }: { count?: number }) {
  const sparks = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        // cheap seeded pseudo-random so SSR/CSR agree
        const r = (n: number) => {
          const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453;
          return x - Math.floor(x);
        };
        return {
          left: 18 + r(1) * 64, // %
          size: 2 + r(2) * 4, // px
          delay: r(3) * 4, // s
          duration: 2.8 + r(4) * 3, // s
          drift: (r(5) - 0.5) * 60, // px
          opacity: 0.5 + r(6) * 0.5,
          hue: r(7),
        };
      }),
    [count]
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {sparks.map((s, i) => (
        <span
          key={i}
          className="absolute bottom-[30%] rounded-full"
          style={
            {
              left: `${s.left}%`,
              width: s.size,
              height: s.size,
              background: s.hue > 0.66 ? "#ff8db0" : s.hue > 0.33 ? "#ffb35c" : "#ff5a1f",
              animation: `float-up ${s.duration}s ease-out ${s.delay}s infinite`,
              "--p-drift": `${s.drift}px`,
              "--p-opacity": s.opacity,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
