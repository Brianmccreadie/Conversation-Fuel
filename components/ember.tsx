// The Ember — the app's presence. Dim / glow / bright, breathing, blinking.
// Rules: never shames, never shrinks, never counts streaks (docs/PRODUCT.md § 4½).

const SIZES = { sm: 44, md: 88, lg: 120 } as const;

export function Ember({
  size = "md",
  state = "glow",
  smiling = false,
}: {
  size?: keyof typeof SIZES;
  state?: "dim" | "glow" | "bright";
  smiling?: boolean;
}) {
  const px = SIZES[size];
  const glow =
    state === "dim"
      ? "0 0 14px rgba(255,106,40,0.18)"
      : state === "bright"
        ? "0 0 60px rgba(255,106,40,0.6), 0 0 140px rgba(255,106,40,0.28)"
        : "0 0 34px rgba(255,106,40,0.45), 0 0 90px rgba(255,106,40,0.2)";
  const eyeW = Math.max(4, px * 0.08);
  const eyeH = Math.max(6, px * 0.13);
  const eyeGap = px * 0.2;

  return (
    <div
      aria-hidden="true"
      className={`ember-breathe relative rounded-full ${state === "dim" ? "opacity-60 saturate-50" : ""}`}
      style={{
        width: px,
        height: px,
        background:
          "radial-gradient(circle at 32% 28%, #ffd9a8 0%, #ffb35c 36%, #ff5a1f 76%, #d63a0e 100%)",
        boxShadow: glow,
      }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 60% 75%, rgba(255,141,176,0.45), transparent 55%)",
        }}
      />
      <div
        className="absolute left-1/2 flex -translate-x-1/2"
        style={{ top: "38%", gap: eyeGap }}
      >
        <span
          className="ember-blink block rounded-full bg-[#2a1206]"
          style={{ width: eyeW, height: eyeH }}
        />
        <span
          className="ember-blink block rounded-full bg-[#2a1206]"
          style={{ width: eyeW, height: eyeH }}
        />
      </div>
      {smiling && (
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-b-full border-[#2a1206]"
          style={{
            top: "58%",
            width: px * 0.24,
            height: px * 0.11,
            borderWidth: Math.max(2, px * 0.028),
            borderTopWidth: 0,
          }}
        />
      )}
    </div>
  );
}
