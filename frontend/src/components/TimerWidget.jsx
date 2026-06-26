import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, X, Coffee, Zap } from "lucide-react";
import { fmt, playBeep } from "../lib/utils-app";
import { toast } from "sonner";

const POMODORO_WORK = 25 * 60;
const POMODORO_BREAK = 5 * 60;

export const TimerWidget = ({ task, onClose, onLogSession, onUpdateTask }) => {
  const mode = task.timer_mode || "countdown";
  const initial =
    mode === "stopwatch" ? 0 : mode === "pomodoro" ? POMODORO_WORK : (task.estimated_minutes || 25) * 60;

  const [seconds, setSeconds] = useState(initial);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState("work");
  const [cycles, setCycles] = useState(0);
  const tickRef = useRef(null);

  useEffect(() => {
    setSeconds(initial);
    setRunning(false);
    setPhase("work");
    setCycles(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id]);

  useEffect(() => {
    if (!running) return;
    tickRef.current = setInterval(() => {
      setSeconds((s) => (mode === "stopwatch" ? s + 1 : s - 1));
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [running, mode]);

  useEffect(() => {
    if (mode === "stopwatch") return;
    if (seconds <= 0 && running) {
      setRunning(false);
      playBeep();
      if (mode === "pomodoro") {
        if (phase === "work") {
          onLogSession?.(task.id, POMODORO_WORK, "pomodoro");
          onUpdateTask?.(task.id, { elapsed_seconds: (task.elapsed_seconds || 0) + POMODORO_WORK });
          toast.success("Pomodoro done! Time for a break ☕");
          setPhase("break");
          setSeconds(POMODORO_BREAK);
          setCycles((c) => c + 1);
        } else {
          toast.success("Break over. Back to it ⚡");
          setPhase("work");
          setSeconds(POMODORO_WORK);
        }
      } else {
        onLogSession?.(task.id, (task.estimated_minutes || 25) * 60, "countdown");
        onUpdateTask?.(task.id, {
          elapsed_seconds: (task.elapsed_seconds || 0) + (task.estimated_minutes || 25) * 60,
        });
        toast.success("Timer complete! 🎉");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, running, mode]);

  const handleStop = () => {
    if (running && mode === "stopwatch" && seconds > 0) {
      onLogSession?.(task.id, seconds, "stopwatch");
      onUpdateTask?.(task.id, { elapsed_seconds: (task.elapsed_seconds || 0) + seconds });
    }
    setRunning(false);
    setSeconds(initial);
    setPhase("work");
  };

  const total =
    mode === "pomodoro"
      ? phase === "work"
        ? POMODORO_WORK
        : POMODORO_BREAK
      : mode === "countdown"
      ? (task.estimated_minutes || 25) * 60
      : 60;
  const progress = mode === "stopwatch" ? (seconds % 60) / 60 : 1 - seconds / total;

  return (
    <div
      data-testid="timer-widget"
      className="glass-hi p-6 md:p-7 relative overflow-hidden"
      style={{
        background:
          mode === "pomodoro" && phase === "break"
            ? "linear-gradient(135deg, rgba(111,168,255,0.25), rgba(95,227,161,0.18))"
            : "linear-gradient(135deg, rgba(255,45,146,0.25), rgba(176,38,255,0.20))",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-80 flex items-center gap-2">
            {mode === "pomodoro" && phase === "break" ? <Coffee size={12} strokeWidth={3} /> : <Zap size={12} strokeWidth={3} />}
            {mode === "pomodoro" ? `${phase === "work" ? "Focus" : "Break"} · #${cycles + 1}` : mode}
          </div>
          <h2 className="font-display text-xl mt-1 max-w-[260px] leading-tight">{task.title}</h2>
        </div>
        <button
          data-testid="timer-close-btn"
          onClick={onClose}
          className="w-9 h-9 rounded-full glass flex items-center justify-center"
          aria-label="Close"
        >
          <X size={15} strokeWidth={2.5} />
        </button>
      </div>

      <div
        data-testid="timer-display"
        className="font-mono-display text-6xl md:text-7xl font-extrabold text-center leading-none my-5 gradient-text-warm"
      >
        {fmt(seconds)}
      </div>

      <div className="h-3 rounded-full overflow-hidden mb-5" style={{ background: "rgba(255,255,255,0.1)" }}>
        <div
          className="h-full progress-fill"
          style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%`, transition: "width .9s linear" }}
        />
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          data-testid="timer-play-pause-btn"
          onClick={() => setRunning((r) => !r)}
          className="btn-pill btn-pink inline-flex items-center gap-2"
        >
          {running ? <Pause size={16} strokeWidth={3} /> : <Play size={16} strokeWidth={3} />}
          {running ? "Pause" : "Start"}
        </button>
        <button data-testid="timer-reset-btn" onClick={handleStop} className="btn-pill btn-ghost inline-flex items-center gap-2">
          <RotateCcw size={14} strokeWidth={3} />
          Reset
        </button>
      </div>
    </div>
  );
};
