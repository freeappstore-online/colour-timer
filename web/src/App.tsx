import { useState, useEffect, useRef, useCallback } from "react";
import { Shell } from "./components/Shell";

// ── Colours ──────────────────────────────────────────────────────────────────
const COLORS = [
  { label: "Default", value: "default", bg: "", text: "" },
  { label: "Sky Blue", value: "sky", bg: "#0ea5e9", text: "#ffffff" },
  { label: "Emerald", value: "emerald", bg: "#10b981", text: "#ffffff" },
  { label: "Violet", value: "violet", bg: "#7c3aed", text: "#ffffff" },
  { label: "Rose", value: "rose", bg: "#f43f5e", text: "#ffffff" },
  { label: "Amber", value: "amber", bg: "#f59e0b", text: "#1a1a1a" },
  { label: "Slate", value: "slate", bg: "#475569", text: "#ffffff" },
  { label: "Coral", value: "coral", bg: "#ff6b6b", text: "#ffffff" },
  { label: "Mint", value: "mint", bg: "#6ee7b7", text: "#1a1a1a" },
  { label: "Indigo", value: "indigo", bg: "#4f46e5", text: "#ffffff" },
  { label: "Peach", value: "peach", bg: "#fb923c", text: "#ffffff" },
  { label: "Teal", value: "teal", bg: "#0d9488", text: "#ffffff" },
];

// ── Patterns ─────────────────────────────────────────────────────────────────
const PATTERNS = [
  { label: "None", value: "none", css: "" },
  {
    label: "Dots",
    value: "dots",
    css: `radial-gradient(circle, currentColor 1.5px, transparent 1.5px)`,
    size: "24px 24px",
  },
  {
    label: "Grid",
    value: "grid",
    css: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
    size: "28px 28px",
  },
  {
    label: "Stripes",
    value: "stripes",
    css: `repeating-linear-gradient(45deg, currentColor 0px, currentColor 2px, transparent 2px, transparent 14px)`,
    size: undefined,
  },
  {
    label: "Zigzag",
    value: "zigzag",
    css: `linear-gradient(135deg, currentColor 25%, transparent 25%) -10px 0,
          linear-gradient(225deg, currentColor 25%, transparent 25%) -10px 0,
          linear-gradient(315deg, currentColor 25%, transparent 25%),
          linear-gradient(45deg, currentColor 25%, transparent 25%)`,
    size: "20px 20px",
  },
  {
    label: "Waves",
    value: "waves",
    css: `repeating-radial-gradient(circle at 0 0, transparent 0, transparent 10px, currentColor 10px, currentColor 11px)`,
    size: undefined,
  },
  {
    label: "Checker",
    value: "checker",
    css: `linear-gradient(45deg, currentColor 25%, transparent 25%, transparent 75%, currentColor 75%),
          linear-gradient(45deg, currentColor 25%, transparent 25%, transparent 75%, currentColor 75%)`,
    size: "20px 20px",
    pos: "0 0, 10px 10px",
  },
  {
    label: "Diamonds",
    value: "diamonds",
    css: `linear-gradient(45deg, currentColor 30%, transparent 30%),
          linear-gradient(-45deg, currentColor 30%, transparent 30%)`,
    size: "20px 20px",
  },
];

// ── Presets ───────────────────────────────────────────────────────────────────
const PRESETS = [
  { label: "1 min", seconds: 60 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "25 min", seconds: 1500 },
  { label: "30 min", seconds: 1800 },
  { label: "1 hr", seconds: 3600 },
];

type TimerMode = "stopwatch" | "countdown";

// ── Confetti particle ─────────────────────────────────────────────────────────
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  shape: "circle" | "rect" | "star";
  size: number;
  rotation: number;
  rotSpeed: number;
  opacity: number;
}

const CONFETTI_COLORS = [
  "#f43f5e", "#f59e0b", "#10b981", "#0ea5e9",
  "#7c3aed", "#fb923c", "#6ee7b7", "#4f46e5",
  "#fbbf24", "#34d399", "#60a5fa", "#f9a8d4",
];

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 50 + (Math.random() - 0.5) * 10,
    y: 50 + (Math.random() - 0.5) * 10,
    vx: (Math.random() - 0.5) * 8,
    vy: -(Math.random() * 12 + 4),
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    shape: (["circle", "rect", "star"] as const)[Math.floor(Math.random() * 3)],
    size: Math.random() * 12 + 6,
    rotation: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 15,
    opacity: 1,
  }));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getPatternStyle(
  patternValue: string,
  patternOpacity: number,
  textColor: string
): React.CSSProperties {
  const p = PATTERNS.find((p) => p.value === patternValue);
  if (!p || p.value === "none" || !p.css) return {};
  const opacity = patternOpacity / 100;
  return {
    backgroundImage: p.css,
    backgroundSize: p.size ?? "auto",
    backgroundPosition: p.pos ?? "0 0",
    // We use a pseudo-trick: overlay a coloured div
  } as React.CSSProperties;
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode] = useState<TimerMode>("stopwatch");
  const [selectedColor, setSelectedColor] = useState("default");
  const [selectedPattern, setSelectedPattern] = useState("none");
  const [patternOpacity, setPatternOpacity] = useState(15);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [countdown, setCountdown] = useState(300);
  const [countdownInput, setCountdownInput] = useState(300);
  const [finished, setFinished] = useState(false);
  const [exploding, setExploding] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [laps, setLaps] = useState<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  const colorObj = COLORS.find((c) => c.value === selectedColor) ?? COLORS[0];
  const isDefault = colorObj.value === "default";
  const cardText = isDefault ? "var(--ink)" : colorObj.text;
  const mutedText = isDefault ? "var(--muted)" : colorObj.text + "bb";
  const borderCol = isDefault ? "var(--line)" : colorObj.text + "33";
  const btnPrimary = isDefault
    ? { background: "var(--accent)", color: "#fff" }
    : { background: colorObj.text, color: colorObj.bg };
  const btnSecondary = isDefault
    ? { background: "var(--panel)", color: "var(--ink)", border: "1px solid var(--line)" }
    : { background: "transparent", color: colorObj.text, border: `1px solid ${colorObj.text}55` };

  // ── Explosion animation ───────────────────────────────────────────────────
  const triggerExplosion = useCallback(() => {
    setExploding(true);
    const initial = makeParticles(80);
    particlesRef.current = initial;
    setParticles([...initial]);

    const gravity = 0.4;
    const friction = 0.98;

    const animate = () => {
      particlesRef.current = particlesRef.current
        .map((p) => ({
          ...p,
          x: p.x + p.vx * 0.6,
          y: p.y + p.vy * 0.6,
          vx: p.vx * friction,
          vy: (p.vy + gravity) * friction,
          rotation: p.rotation + p.rotSpeed,
          opacity: p.opacity - 0.012,
        }))
        .filter((p) => p.opacity > 0);

      setParticles([...particlesRef.current]);

      if (particlesRef.current.length > 0) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setExploding(false);
      }
    };
    animRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // ── Timer logic ───────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        if (mode === "stopwatch") {
          setElapsed((e) => e + 1);
        } else {
          setCountdown((c) => {
            if (c <= 1) {
              clearInterval(intervalRef.current!);
              intervalRef.current = null;
              setRunning(false);
              setFinished(true);
              triggerExplosion();
              return 0;
            }
            return c - 1;
          });
        }
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, mode, triggerExplosion]);

  const start = useCallback(() => {
    if (running) return;
    setFinished(false);
    setRunning(true);
  }, [running]);

  const reset = () => {
    stop();
    setFinished(false);
    setExploding(false);
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setParticles([]);
    if (mode === "stopwatch") {
      setElapsed(0);
      setLaps([]);
    } else {
      setCountdown(countdownInput);
    }
  };

  const lap = () => {
    if (mode === "stopwatch" && running) {
      setLaps((prev) => [elapsed, ...prev]);
    }
  };

  const handleModeSwitch = (m: TimerMode) => {
    stop();
    setMode(m);
    setElapsed(0);
    setCountdown(countdownInput);
    setFinished(false);
    setExploding(false);
    setParticles([]);
    setLaps([]);
  };

  const applyPreset = (seconds: number) => {
    stop();
    setCountdownInput(seconds);
    setCountdown(seconds);
    setFinished(false);
  };

  const handleCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      setCountdownInput(val * 60);
      setCountdown(val * 60);
      setFinished(false);
      stop();
    }
  };

  const displayTime = mode === "stopwatch" ? elapsed : countdown;

  // ── Pattern overlay style ─────────────────────────────────────────────────
  const patternObj = PATTERNS.find((p) => p.value === selectedPattern) ?? PATTERNS[0];
  const patternColor = isDefault ? "#1a1a1a" : colorObj.text;

  // Build CSS for pattern overlay
  let patternOverlayStyle: React.CSSProperties = {};
  if (patternObj.value !== "none" && patternObj.css) {
    // Replace "currentColor" with actual rgba color
    const rgba = hexToRgba(patternColor, patternOpacity / 100);
    const css = patternObj.css.replace(/currentColor/g, rgba);
    patternOverlayStyle = {
      backgroundImage: css,
      backgroundSize: patternObj.size ?? "auto",
      backgroundPosition: patternObj.pos ?? "0 0",
    };
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Shell>
      {/* Full-page wrapper */}
      <div
        className="relative min-h-full rounded-2xl overflow-hidden transition-colors duration-500"
        style={{ background: isDefault ? "transparent" : colorObj.bg }}
      >
        {/* Pattern overlay */}
        {patternObj.value !== "none" && (
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={patternOverlayStyle}
          />
        )}

        {/* Explosion particles */}
        {exploding && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl" style={{ zIndex: 50 }}>
            {particles.map((p) => (
              <div
                key={p.id}
                className="absolute"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: p.shape === "rect" ? p.size * 1.5 : p.size,
                  height: p.size,
                  background: p.color,
                  borderRadius: p.shape === "circle" ? "50%" : p.shape === "star" ? "2px" : "2px",
                  opacity: p.opacity,
                  transform: `rotate(${p.rotation}deg) ${p.shape === "star" ? "scale(1.2)" : ""}`,
                  boxShadow: p.shape === "star" ? `0 0 6px ${p.color}` : "none",
                  transition: "none",
                }}
              />
            ))}
          </div>
        )}

        {/* Content */}
        <div className="relative max-w-lg mx-auto py-8 px-4 flex flex-col gap-6" style={{ zIndex: 1 }}>

          {/* Mode Switcher */}
          <div
            className="flex rounded-xl p-1 gap-1"
            style={{
              background: isDefault ? "var(--panel)" : colorObj.text + "22",
              border: `1px solid ${borderCol}`,
            }}
          >
            {(["stopwatch", "countdown"] as TimerMode[]).map((m) => (
              <button
                key={m}
                onClick={() => handleModeSwitch(m)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all"
                style={mode === m ? btnPrimary : { background: "transparent", color: cardText }}
              >
                {m === "stopwatch" ? "⏱ Stopwatch" : "⏳ Countdown"}
              </button>
            ))}
          </div>

          {/* Timer Display */}
          <div
            className={`rounded-2xl flex flex-col items-center justify-center py-12 gap-2 shadow-sm transition-all ${
              exploding ? "scale-110" : "scale-100"
            }`}
            style={{
              background: isDefault ? "var(--panel)" : colorObj.text + "18",
              border: `1px solid ${borderCol}`,
              transition: "transform 0.15s ease",
            }}
          >
            {finished && !exploding && (
              <div
                className="text-sm font-bold px-4 py-1 rounded-full mb-2"
                style={{
                  background: isDefault ? "#fef08a" : colorObj.text,
                  color: isDefault ? "#713f12" : colorObj.bg,
                }}
              >
                💥 Boom! Time's up!
              </div>
            )}
            {exploding && (
              <div className="text-2xl mb-1 animate-bounce">💥</div>
            )}
            <span
              className={`font-bold tabular-nums tracking-tight transition-all ${
                exploding ? "animate-ping" : ""
              }`}
              style={{
                fontFamily: "Fraunces, serif",
                fontSize: "clamp(3.5rem, 14vw, 6rem)",
                color: cardText,
                lineHeight: 1,
                animationDuration: exploding ? "0.4s" : undefined,
                animationIterationCount: exploding ? "3" : undefined,
              }}
            >
              {formatTime(displayTime)}
            </span>
            {mode === "stopwatch" && (
              <span className="text-sm" style={{ color: mutedText }}>
                {running ? "Running…" : elapsed === 0 ? "Press Start" : "Paused"}
              </span>
            )}
            {mode === "countdown" && !finished && (
              <span className="text-sm" style={{ color: mutedText }}>
                {running
                  ? "Counting down…"
                  : countdown === countdownInput
                  ? "Ready"
                  : "Paused"}
              </span>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            {!running ? (
              <button
                onClick={start}
                disabled={mode === "countdown" && countdown === 0}
                className="flex-1 py-3 rounded-xl font-bold text-base transition-all active:scale-95 disabled:opacity-40"
                style={btnPrimary}
              >
                {elapsed > 0 ||
                (mode === "countdown" && countdown < countdownInput && countdown > 0)
                  ? "▶ Resume"
                  : "▶ Start"}
              </button>
            ) : (
              <button
                onClick={stop}
                className="flex-1 py-3 rounded-xl font-bold text-base transition-all active:scale-95"
                style={{
                  background: isDefault ? "#ef4444" : colorObj.text,
                  color: isDefault ? "#fff" : colorObj.bg,
                }}
              >
                ⏸ Pause
              </button>
            )}
            {mode === "stopwatch" && running && (
              <button
                onClick={lap}
                className="px-5 py-3 rounded-xl font-semibold text-base transition-all active:scale-95"
                style={btnSecondary}
              >
                Lap
              </button>
            )}
            <button
              onClick={reset}
              className="px-5 py-3 rounded-xl font-semibold text-base transition-all active:scale-95"
              style={btnSecondary}
            >
              Reset
            </button>
          </div>

          {/* Countdown Presets */}
          {mode === "countdown" && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold" style={{ color: mutedText }}>
                Quick Presets
              </p>
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.seconds}
                    onClick={() => applyPreset(p.seconds)}
                    className="py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
                    style={countdownInput === p.seconds ? btnPrimary : btnSecondary}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <label
                  className="text-sm font-medium shrink-0"
                  style={{ color: cardText }}
                >
                  Custom (min):
                </label>
                <input
                  type="number"
                  min={1}
                  max={999}
                  defaultValue={Math.round(countdownInput / 60)}
                  onChange={handleCustomInput}
                  className="w-24 px-3 py-2 rounded-xl text-sm font-semibold outline-none"
                  style={{
                    background: isDefault ? "var(--panel)" : colorObj.text + "22",
                    color: cardText,
                    border: `1px solid ${borderCol}`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Laps */}
          {mode === "stopwatch" && laps.length > 0 && (
            <div
              className="rounded-2xl p-4 flex flex-col gap-2"
              style={{
                background: isDefault ? "var(--panel)" : colorObj.text + "18",
                border: `1px solid ${borderCol}`,
              }}
            >
              <p className="text-sm font-bold" style={{ color: cardText }}>
                Laps
              </p>
              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                {laps.map((lapTime, i) => {
                  const lapNum = laps.length - i;
                  const prev = laps[i + 1] ?? 0;
                  const split = lapTime - prev;
                  return (
                    <div
                      key={i}
                      className="flex justify-between items-center py-1 px-2 rounded-lg text-sm"
                      style={{ borderBottom: `1px solid ${borderCol}` }}
                    >
                      <span style={{ color: mutedText }}>Lap {lapNum}</span>
                      <span
                        className="font-mono font-semibold"
                        style={{ color: cardText }}
                      >
                        {formatTime(split)}
                      </span>
                      <span
                        className="font-mono text-xs"
                        style={{ color: mutedText }}
                      >
                        {formatTime(lapTime)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Colour Picker ── */}
          <div
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{
              background: isDefault ? "var(--panel)" : colorObj.text + "18",
              border: `1px solid ${borderCol}`,
            }}
          >
            <p className="text-sm font-bold" style={{ color: cardText }}>
              Background Colour
            </p>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setSelectedColor(c.value)}
                  title={c.label}
                  className="flex flex-col items-center gap-1"
                >
                  <span
                    className="w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center text-xs"
                    style={{
                      background:
                        c.value === "default" ? "var(--paper)" : c.bg,
                      borderColor:
                        selectedColor === c.value
                          ? isDefault
                            ? "var(--accent)"
                            : colorObj.text
                          : "transparent",
                      boxShadow:
                        selectedColor === c.value
                          ? `0 0 0 2px ${isDefault ? "var(--accent)" : colorObj.text}`
                          : "0 0 0 1px rgba(0,0,0,0.1)",
                    }}
                  >
                    {c.value === "default" && (
                      <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
                        ✕
                      </span>
                    )}
                    {selectedColor === c.value && c.value !== "default" && (
                      <span style={{ color: c.text, fontSize: "0.8rem" }}>✓</span>
                    )}
                  </span>
                  <span
                    style={{ color: mutedText, fontSize: "0.65rem" }}
                  >
                    {c.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Pattern Picker ── */}
          <div
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{
              background: isDefault ? "var(--panel)" : colorObj.text + "18",
              border: `1px solid ${borderCol}`,
            }}
          >
            <p className="text-sm font-bold" style={{ color: cardText }}>
              Background Pattern
            </p>
            <div className="grid grid-cols-4 gap-2">
              {PATTERNS.map((pat) => {
                const isSelected = selectedPattern === pat.value;
                // Build a mini preview style
                let previewStyle: React.CSSProperties = {
                  background: isDefault ? "var(--panel)" : colorObj.bg,
                  border: `2px solid ${
                    isSelected
                      ? isDefault
                        ? "var(--accent)"
                        : colorObj.text
                      : borderCol
                  }`,
                  boxShadow: isSelected
                    ? `0 0 0 2px ${isDefault ? "var(--accent)" : colorObj.text}`
                    : "none",
                };
                if (pat.value !== "none" && pat.css) {
                  const previewColor = isDefault ? "#1a1a1a" : colorObj.text;
                  const rgba = hexToRgba(previewColor, 0.25);
                  const css = pat.css.replace(/currentColor/g, rgba);
                  previewStyle = {
                    ...previewStyle,
                    backgroundImage: css,
                    backgroundSize: pat.size ?? "auto",
                    backgroundPosition: pat.pos ?? "0 0",
                  };
                }
                return (
                  <button
                    key={pat.value}
                    onClick={() => setSelectedPattern(pat.value)}
                    className="flex flex-col items-center gap-1"
                  >
                    <span
                      className="w-12 h-12 rounded-xl transition-all"
                      style={previewStyle}
                    />
                    <span style={{ color: mutedText, fontSize: "0.65rem" }}>
                      {pat.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Opacity slider */}
            {selectedPattern !== "none" && (
              <div className="flex items-center gap-3 mt-1">
                <label className="text-xs font-medium shrink-0" style={{ color: cardText }}>
                  Intensity
                </label>
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={patternOpacity}
                  onChange={(e) => setPatternOpacity(Number(e.target.value))}
                  className="flex-1 accent-current"
                  style={{ accentColor: isDefault ? "var(--accent)" : colorObj.text }}
                />
                <span className="text-xs w-8 text-right" style={{ color: mutedText }}>
                  {patternOpacity}%
                </span>
              </div>
            )}
          </div>

        </div>
      </div>
    </Shell>
  );
}

// ── Utility ───────────────────────────────────────────────────────────────────
function hexToRgba(hex: string, alpha: number): string {
  // Handle named/var colors gracefully
  if (!hex.startsWith("#")) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
