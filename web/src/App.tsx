import { useState, useEffect, useRef, useCallback } from "react";
import { Shell } from "./components/Shell";

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

type TimerMode = "stopwatch" | "countdown";

const PRESETS = [
  { label: "1 min", seconds: 60 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "25 min", seconds: 1500 },
  { label: "30 min", seconds: 1800 },
  { label: "1 hr", seconds: 3600 },
];

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function App() {
  const [mode, setMode] = useState<TimerMode>("stopwatch");
  const [selectedColor, setSelectedColor] = useState<string>("default");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // stopwatch seconds
  const [countdown, setCountdown] = useState(300); // countdown seconds remaining
  const [countdownInput, setCountdownInput] = useState(300); // what user set
  const [finished, setFinished] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const colorObj = COLORS.find((c) => c.value === selectedColor) ?? COLORS[0];

  const bgStyle =
    colorObj.value === "default"
      ? {}
      : { backgroundColor: colorObj.bg, color: colorObj.text };

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
  }, []);

  const start = useCallback(() => {
    if (running) return;
    setFinished(false);
    setRunning(true);
  }, [running]);

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
  }, [running, mode]);

  const reset = () => {
    stop();
    setFinished(false);
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

  const isDefault = colorObj.value === "default";

  const cardBg = isDefault
    ? "var(--paper)"
    : colorObj.bg;
  const cardText = isDefault ? "var(--ink)" : colorObj.text;
  const mutedText = isDefault ? "var(--muted)" : colorObj.text + "cc";
  const borderCol = isDefault ? "var(--line)" : colorObj.text + "33";
  const btnPrimary = isDefault
    ? { background: "var(--accent)", color: "#fff" }
    : { background: colorObj.text, color: colorObj.bg };
  const btnSecondary = isDefault
    ? { background: "var(--panel)", color: "var(--ink)", border: "1px solid var(--line)" }
    : { background: "transparent", color: colorObj.text, border: `1px solid ${colorObj.text}55` };

  return (
    <Shell>
      {/* Full-page color overlay */}
      <div
        className="min-h-full rounded-2xl transition-colors duration-500"
        style={{ background: isDefault ? "transparent" : colorObj.bg }}
      >
        <div className="max-w-lg mx-auto py-8 px-4 flex flex-col gap-6">

          {/* Mode Switcher */}
          <div
            className="flex rounded-xl p-1 gap-1"
            style={{ background: isDefault ? "var(--panel)" : colorObj.text + "22", border: `1px solid ${borderCol}` }}
          >
            {(["stopwatch", "countdown"] as TimerMode[]).map((m) => (
              <button
                key={m}
                onClick={() => handleModeSwitch(m)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all"
                style={
                  mode === m
                    ? btnPrimary
                    : { background: "transparent", color: cardText }
                }
              >
                {m === "stopwatch" ? "⏱ Stopwatch" : "⏳ Countdown"}
              </button>
            ))}
          </div>

          {/* Timer Display */}
          <div
            className="rounded-2xl flex flex-col items-center justify-center py-12 gap-2 shadow-sm"
            style={{
              background: isDefault ? "var(--panel)" : colorObj.text + "18",
              border: `1px solid ${borderCol}`,
            }}
          >
            {finished && (
              <div
                className="text-sm font-bold px-4 py-1 rounded-full mb-2 animate-bounce"
                style={{ background: isDefault ? "#fef08a" : colorObj.text, color: isDefault ? "#713f12" : colorObj.bg }}
              >
                🎉 Time's up!
              </div>
            )}
            <span
              className="font-bold tabular-nums tracking-tight"
              style={{
                fontFamily: "Fraunces, serif",
                fontSize: "clamp(3.5rem, 14vw, 6rem)",
                color: cardText,
                lineHeight: 1,
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
                {running ? "Counting down…" : countdown === countdownInput ? "Ready" : "Paused"}
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
                {elapsed > 0 || (mode === "countdown" && countdown < countdownInput && countdown > 0)
                  ? "▶ Resume"
                  : "▶ Start"}
              </button>
            ) : (
              <button
                onClick={stop}
                className="flex-1 py-3 rounded-xl font-bold text-base transition-all active:scale-95"
                style={{ background: isDefault ? "#ef4444" : colorObj.text, color: isDefault ? "#fff" : colorObj.bg }}
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
              <p className="text-sm font-semibold" style={{ color: mutedText }}>Quick Presets</p>
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.seconds}
                    onClick={() => applyPreset(p.seconds)}
                    className="py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
                    style={
                      countdownInput === p.seconds
                        ? btnPrimary
                        : btnSecondary
                    }
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <label className="text-sm font-medium shrink-0" style={{ color: cardText }}>
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
              <p className="text-sm font-bold" style={{ color: cardText }}>Laps</p>
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
                      <span className="font-mono font-semibold" style={{ color: cardText }}>
                        {formatTime(split)}
                      </span>
                      <span className="font-mono text-xs" style={{ color: mutedText }}>
                        {formatTime(lapTime)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Colour Picker */}
          <div
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{
              background: isDefault ? "var(--panel)" : colorObj.text + "18",
              border: `1px solid ${borderCol}`,
            }}
          >
            <p className="text-sm font-bold" style={{ color: cardText }}>Background Colour</p>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setSelectedColor(c.value)}
                  title={c.label}
                  className="flex flex-col items-center gap-1 group"
                >
                  <span
                    className="w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center text-xs"
                    style={{
                      background: c.value === "default" ? "var(--paper)" : c.bg,
                      borderColor:
                        selectedColor === c.value
                          ? isDefault ? "var(--accent)" : colorObj.text
                          : "transparent",
                      boxShadow:
                        selectedColor === c.value
                          ? `0 0 0 2px ${isDefault ? "var(--accent)" : colorObj.text}`
                          : "0 0 0 1px rgba(0,0,0,0.1)",
                    }}
                  >
                    {c.value === "default" && (
                      <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>✕</span>
                    )}
                    {selectedColor === c.value && c.value !== "default" && (
                      <span style={{ color: c.text, fontSize: "0.8rem" }}>✓</span>
                    )}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: mutedText, fontSize: "0.65rem" }}
                  >
                    {c.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </Shell>
  );
}
