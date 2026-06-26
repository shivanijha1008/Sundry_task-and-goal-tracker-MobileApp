export const PRIORITY_STYLES = {
  high: { bg: "#FF3366", text: "#FFFFFF", label: "HIGH" },
  medium: { bg: "#FFCC00", text: "#0A0A0A", label: "MED" },
  low: { bg: "#C8B6FF", text: "#0A0A0A", label: "LOW" },
};

export const TIMER_MODES = [
  { value: "countdown", label: "Countdown" },
  { value: "pomodoro", label: "Pomodoro" },
  { value: "stopwatch", label: "Stopwatch" },
];

export function fmt(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const ss = String(s % 60).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  if (h > 0) return `${h}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

export function todayDateLabel() {
  const d = new Date();
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// 220Hz beep — minimal data URI WAV (1s) at low volume via WebAudio
export function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = "square";
    o.frequency.value = 880;
    g.gain.value = 0.06;
    o.start();
    setTimeout(() => {
      o.frequency.value = 660;
    }, 180);
    setTimeout(() => {
      o.frequency.value = 880;
    }, 360);
    setTimeout(() => {
      o.stop();
      ctx.close();
    }, 600);
  } catch (err) {
    // WebAudio unavailable (e.g., no user gesture yet, unsupported browser)
    console.warn("[playBeep] audio context unavailable:", err?.message || err);
  }
}
