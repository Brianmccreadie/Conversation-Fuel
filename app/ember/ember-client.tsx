"use client";

// The fireside — talk to the Ember by text or voice.
// Text runs through Anthropic with the Ember's tools; voice opens a WebRTC
// Realtime session (same persona, same tools, bridged through /api/ember/tool).

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EmberOrb, type OrbState } from "@/components/ember-orb";

type Msg = { role: "user" | "assistant"; content: string; live?: boolean };

const TOOL_PHRASES: Record<string, string> = {
  get_todays_deck: "opening today's edition",
  get_wire_latest: "scanning the wire",
  search_archive: "digging through the archive",
  list_interests: "checking your interests",
  add_interest: "noting a new interest",
  list_people: "flipping through your people",
  save_person: "updating a profile",
  add_capture_note: "jotting that down",
  tonight_brief: "building tonight's brief",
  get_craft_notes: "consulting the craft library",
  list_sources: "checking your feeds",
  add_source: "wiring up a new feed",
};

const OPENERS = [
  "Give me today's download.",
  "Interview me about a friend.",
  "Brief me for tonight.",
  "Teach me one craft move.",
  "What's new on the wire?",
];

export function EmberClient({ voiceAvailable }: { voiceAvailable: boolean }) {
  const params = useSearchParams();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const [orb, setOrb] = useState<OrbState>("idle");
  const [voice, setVoice] = useState<"off" | "connecting" | "live">("off");
  const [error, setError] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const autoSent = useRef(false);

  // -- voice plumbing ---------------------------------------------------------
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const outAnalyserRef = useRef<AnalyserNode | null>(null);
  const orbRef = useRef<OrbState>("idle");
  orbRef.current = orb;

  const getAudio = useCallback(() => {
    const analyser =
      orbRef.current === "speaking" ? outAnalyserRef.current : micAnalyserRef.current;
    if (!analyser) return { level: 0, bars: null };
    const bars = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(bars);
    let sum = 0;
    for (let i = 0; i < bars.length; i++) sum += bars[i];
    return { level: Math.min(1, sum / bars.length / 110), bars };
  }, []);

  // -- history ----------------------------------------------------------------
  useEffect(() => {
    fetch("/api/ember/history")
      .then((r) => r.json())
      .then((j) =>
        setMessages(
          (j.messages ?? []).map((m: { role: Msg["role"]; content: string }) => ({
            role: m.role,
            content: m.content,
          }))
        )
      )
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, toolStatus]);

  // -- text chat --------------------------------------------------------------
  const sendText = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || busy) return;
      setError(null);
      setBusy(true);
      setOrb("thinking");
      setInput("");

      const history = [...messages, { role: "user" as const, content }];
      setMessages([...history, { role: "assistant", content: "", live: true }]);

      try {
        const res = await fetch("/api/ember/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        if (!res.ok || !res.body) throw new Error(`The Ember flickered (${res.status}).`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const evt = JSON.parse(line.slice(6));
            if (evt.type === "text") {
              setToolStatus(null);
              setOrb("speaking");
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.live) last.content += evt.text;
                return next;
              });
            } else if (evt.type === "tool") {
              setToolStatus(TOOL_PHRASES[evt.name] ?? evt.name);
              setOrb("thinking");
            } else if (evt.type === "error") {
              throw new Error(evt.message);
            }
          }
        }
        setMessages((prev) =>
          prev
            .map((m) => ({ ...m, live: false }))
            .filter((m) => m.content.trim().length > 0)
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setMessages((prev) => prev.filter((m) => !m.live));
      } finally {
        setToolStatus(null);
        setBusy(false);
        setOrb(voice === "live" ? "listening" : "idle");
      }
    },
    [busy, messages, voice]
  );

  // Deep link: /ember?q=… auto-asks once history has loaded.
  useEffect(() => {
    const q = params.get("q");
    if (q && historyLoaded && !autoSent.current) {
      autoSent.current = true;
      void sendText(q);
    }
  }, [params, historyLoaded, sendText]);

  // -- voice session ----------------------------------------------------------
  const persist = useCallback((role: Msg["role"], content: string) => {
    void fetch("/api/ember/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, content, mode: "voice" }),
    });
  }, []);

  const appendVoice = useCallback((role: Msg["role"], content: string) => {
    if (!content.trim()) return;
    setMessages((prev) => [...prev, { role, content }]);
  }, []);

  const stopVoice = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    micRef.current?.getTracks().forEach((t) => t.stop());
    micRef.current = null;
    void audioCtxRef.current?.close();
    audioCtxRef.current = null;
    micAnalyserRef.current = null;
    outAnalyserRef.current = null;
    setVoice("off");
    setOrb("idle");
  }, []);

  const startVoice = useCallback(async () => {
    setError(null);
    setVoice("connecting");
    setOrb("thinking");
    try {
      const sessionResp = await fetch("/api/ember/voice-session", { method: "POST" });
      const session = await sessionResp.json();
      if (!sessionResp.ok) throw new Error(session.error ?? "voice unavailable");
      const clientSecret = session.value ?? session.client_secret?.value;
      if (!clientSecret) throw new Error("No session token returned.");

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;

      const audioEl = new Audio();
      audioEl.autoplay = true;
      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
        const src = audioCtx.createMediaStreamSource(e.streams[0]);
        const an = audioCtx.createAnalyser();
        an.fftSize = 256;
        src.connect(an);
        outAnalyserRef.current = an;
      };

      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      micRef.current = mic;
      mic.getTracks().forEach((track) => pc.addTrack(track, mic));
      const micSrc = audioCtx.createMediaStreamSource(mic);
      const micAn = audioCtx.createAnalyser();
      micAn.fftSize = 256;
      micSrc.connect(micAn);
      micAnalyserRef.current = micAn;

      const dc = pc.createDataChannel("oai-events");
      const liveAssistant: Record<string, string> = {};

      dc.onmessage = async (ev) => {
        const evt = JSON.parse(ev.data);

        // Ember starts / stops talking
        if (evt.type === "output_audio_buffer.started") setOrb("speaking");
        if (evt.type === "output_audio_buffer.stopped" || evt.type === "response.done")
          setOrb("listening");

        // Your words, transcribed
        if (
          evt.type === "conversation.item.input_audio_transcription.completed" &&
          typeof evt.transcript === "string"
        ) {
          appendVoice("user", evt.transcript);
          persist("user", evt.transcript);
        }

        // The Ember's words, transcribed (GA + legacy event names)
        if (
          (evt.type === "response.output_audio_transcript.done" ||
            evt.type === "response.audio_transcript.done") &&
          typeof evt.transcript === "string"
        ) {
          appendVoice("assistant", evt.transcript);
          persist("assistant", evt.transcript);
          delete liveAssistant[evt.response_id];
        }

        // Tool calls → server bridge → result back over the channel
        if (evt.type === "response.function_call_arguments.done" && evt.name) {
          setToolStatus(TOOL_PHRASES[evt.name] ?? evt.name);
          let output = "{}";
          try {
            const r = await fetch("/api/ember/tool", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: evt.name,
                args: JSON.parse(evt.arguments || "{}"),
              }),
            });
            const j = await r.json();
            output = JSON.stringify(j.result ?? j);
          } catch (e) {
            output = JSON.stringify({ error: String(e) });
          }
          setToolStatus(null);
          dc.send(
            JSON.stringify({
              type: "conversation.item.create",
              item: {
                type: "function_call_output",
                call_id: evt.call_id,
                output: output.slice(0, 24_000),
              },
            })
          );
          dc.send(JSON.stringify({ type: "response.create" }));
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const sdpResp = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${clientSecret}`,
          "Content-Type": "application/sdp",
        },
      });
      if (!sdpResp.ok) throw new Error(`WebRTC handshake failed (${sdpResp.status}).`);
      await pc.setRemoteDescription({ type: "answer", sdp: await sdpResp.text() });

      setVoice("live");
      setOrb("listening");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      stopVoice();
    }
  }, [appendVoice, persist, stopVoice]);

  useEffect(() => stopVoice, [stopVoice]); // teardown on unmount

  const newFire = useCallback(async () => {
    await fetch("/api/ember/history", { method: "DELETE" });
    setMessages([]);
  }, []);

  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-1 flex-col items-center">
      {/* The orb */}
      <div className="rise relative mt-2">
        <EmberOrb state={orb} getAudio={getAudio} size={250} />
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
        {voice === "live"
          ? orb === "speaking"
            ? "· speaking ·"
            : orb === "thinking"
              ? "· thinking ·"
              : "· listening ·"
          : busy
            ? toolStatus
              ? `· ${toolStatus} ·`
              : "· thinking ·"
            : "the ember"}
      </p>

      {/* Controls */}
      <div className="mt-4 flex items-center gap-3">
        {voiceAvailable &&
          (voice === "off" ? (
            <button
              onClick={startVoice}
              className="rounded-full border border-accent/50 bg-accent/10 px-5 py-2 font-mono text-[11px] uppercase tracking-widest text-accent transition-all hover:-translate-y-0.5 hover:bg-accent/20"
            >
              ◉ Speak to it
            </button>
          ) : (
            <button
              onClick={stopVoice}
              className="rounded-full border border-rule px-5 py-2 font-mono text-[11px] uppercase tracking-widest text-ink-soft transition-colors hover:border-accent hover:text-accent"
            >
              {voice === "connecting" ? "Lighting…" : "■ End voice"}
            </button>
          ))}
        {messages.length > 0 && (
          <button
            onClick={newFire}
            className="font-mono text-[10px] uppercase tracking-widest text-ink-faint transition-colors hover:text-accent"
          >
            New fire
          </button>
        )}
      </div>

      {error && (
        <p className="mt-3 max-w-md text-center text-xs text-accent">{error}</p>
      )}

      {/* Transcript */}
      <div className="mt-8 w-full max-w-xl flex-1">
        {messages.length === 0 && historyLoaded && (
          <div className="text-center">
            <p className="font-display text-xl font-semibold tracking-tight text-ink-soft">
              What would you like — fuel, or craft?
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {OPENERS.map((o, i) => (
                <button
                  key={o}
                  onClick={() => sendText(o)}
                  className="rise rounded-full border border-rule bg-paper-raised px-4 py-2 text-xs text-ink-soft shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/50 hover:text-accent"
                  style={{ "--rise-i": i + 1 } as React.CSSProperties}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-5 pb-6">
          {messages.map((m, i) => (
            <div
              key={i}
              className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              {m.role === "user" ? (
                <p className="max-w-[85%] rounded-2xl rounded-br-sm border border-rule bg-paper-deep px-4 py-2.5 text-sm leading-relaxed">
                  {m.content}
                </p>
              ) : (
                <div className="max-w-[92%]">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
                    the ember
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
                    {m.content}
                    {m.live && <span className="caret text-accent">▌</span>}
                  </p>
                </div>
              )}
            </div>
          ))}
          {toolStatus && !voice.startsWith("l") && (
            <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-faint">
              <span className="thinking-dot inline-block h-1 w-1 rounded-full bg-accent" />
              <span className="thinking-dot inline-block h-1 w-1 rounded-full bg-accent" />
              <span className="thinking-dot inline-block h-1 w-1 rounded-full bg-accent" />
              {toolStatus}…
            </p>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void sendText(input);
        }}
        className="sticky bottom-4 w-full max-w-xl"
      >
        <div className="flex items-center gap-2 rounded-full border border-rule bg-paper-raised py-1.5 pl-5 pr-1.5 shadow-[var(--shadow-card-hover)] backdrop-blur transition-colors focus-within:border-accent/60">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={voice === "live" ? "Voice is live — or type…" : "Ask the Ember…"}
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-faint"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="rounded-full bg-ink px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-paper transition-[opacity,transform] hover:opacity-85 active:scale-95 disabled:opacity-30"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
