"use client";

// The Ember, grown up — a canvas halo around the mascot that reacts to
// audio (voice mode), pulses while thinking, and breathes at rest.
// The character stays; the physics arrive.

import { useEffect, useRef } from "react";
import { Ember } from "@/components/ember";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

export function EmberOrb({
  state,
  // Returns instantaneous audio data: level 0..1 plus optional FFT bars.
  getAudio,
  size = 280,
}: {
  state: OrbState;
  getAudio?: () => { level: number; bars: Uint8Array | null };
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<OrbState>(state);
  const getAudioRef = useRef(getAudio);
  useEffect(() => {
    stateRef.current = state;
    getAudioRef.current = getAudio;
  }, [state, getAudio]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cx = size / 2;
    const cy = size / 2;
    const baseR = size * 0.24;
    let raf = 0;
    let smooth = 0;

    const draw = (t: number) => {
      ctx.clearRect(0, 0, size, size);
      const st = stateRef.current;
      const audio = getAudioRef.current?.() ?? { level: 0, bars: null };
      smooth += (audio.level - smooth) * 0.18;

      const breathe = reduced ? 0 : Math.sin(t / 1400) * 0.5 + 0.5; // 0..1
      const active = st === "speaking" || st === "listening";

      // --- outer halo bars: FFT when live, gentle sine at rest -------------
      const N = 72;
      for (let i = 0; i < N; i++) {
        const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
        let v: number;
        if (audio.bars && audio.bars.length > 0 && active) {
          v = audio.bars[Math.floor((i / N) * audio.bars.length)] / 255;
        } else if (st === "thinking") {
          v = 0.18 + 0.14 * Math.sin(t / 160 + i * 0.6);
        } else {
          v = 0.1 + 0.08 * Math.sin(t / 900 + i * 0.35) * breathe;
        }
        const r0 = baseR * 1.55;
        const len = v * size * 0.14 + 2;
        const warm = i / N;
        ctx.strokeStyle =
          warm > 0.78
            ? `rgba(255,141,176,${0.16 + v * 0.5})` // blush
            : warm > 0.4
              ? `rgba(255,179,92,${0.18 + v * 0.55})` // amber
              : `rgba(255,90,31,${0.2 + v * 0.6})`; // flame
        ctx.lineWidth = 2.4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * r0, cy + Math.sin(angle) * r0);
        ctx.lineTo(cx + Math.cos(angle) * (r0 + len), cy + Math.sin(angle) * (r0 + len));
        ctx.stroke();
      }

      // --- soft glow ring ----------------------------------------------------
      const glowR = baseR * (1.28 + smooth * 0.35 + breathe * 0.04);
      const grad = ctx.createRadialGradient(cx, cy, baseR * 0.6, cx, cy, glowR * 1.6);
      grad.addColorStop(0, `rgba(255,106,40,${0.14 + smooth * 0.25})`);
      grad.addColorStop(1, "rgba(255,106,40,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, glowR * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // --- thinking: three orbiting sparks ----------------------------------
      if (st === "thinking" && !reduced) {
        for (let k = 0; k < 3; k++) {
          const a = t / 500 + (k * Math.PI * 2) / 3;
          const rr = baseR * 1.32;
          ctx.fillStyle = k === 1 ? "#ffb35c" : "#ff5a1f";
          ctx.beginPath();
          ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  const emberState = state === "idle" ? "glow" : "bright";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="absolute inset-0"
        aria-hidden
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <Ember size="md" state={emberState} smiling={state === "speaking"} />
      </div>
    </div>
  );
}
