import { useEffect, useRef, useState } from "react";
import { Plus, Heart, Wind, Coffee, Activity, Footprints, Pencil, Trash2, Play, Pause, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { fmt, playBeep } from "../lib/utils-app";
import { MicButton } from "../components/MicButton";

const ICONS = { heart: Heart, wind: Wind, coffee: Coffee, activity: Activity, footprints: Footprints };

const Breather = ({ item, onClose }) => {
  const total = (item.duration_minutes || 5) * 60;
  const [seconds, setSeconds] = useState(total);
  const [running, setRunning] = useState(true);
  const ref = useRef(null);

  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(ref.current);
  }, [running]);

  useEffect(() => {
    if (seconds === 0 && running) {
      setRunning(false);
      playBeep();
      toast.success("Time well spent on yourself 💗");
    }
  }, [seconds, running]);

  // breath cycle: 4s inhale, 4s hold, 4s exhale
  const cycleT = (total - seconds) % 12;
  const phase = cycleT < 4 ? "Inhale" : cycleT < 8 ? "Hold" : "Exhale";
  const scale = cycleT < 4 ? 1 + cycleT / 4 * 0.5 : cycleT < 8 ? 1.5 : 1.5 - ((cycleT - 8) / 4) * 0.5;

  return (
    <div
      data-testid="breather-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)" }}
    >
      <div className="glass-hi p-8 max-w-sm w-full text-center">
        <button
          data-testid="breather-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full glass flex items-center justify-center"
          aria-label="Close"
        >
          <X size={15} strokeWidth={2.5} />
        </button>
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] opacity-70 mb-2">{item.title}</p>
        <div className="relative w-48 h-48 mx-auto my-6 flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(255,45,146,0.45), rgba(176,38,255,0.15) 70%)",
              transform: `scale(${scale})`,
              transition: "transform 1s ease-in-out",
            }}
          />
          <div className="relative font-display text-2xl">{phase}</div>
        </div>
        <div className="font-mono-display text-5xl gradient-text-warm mb-5">{fmt(seconds)}</div>
        <div className="flex justify-center gap-3">
          <button data-testid="breather-toggle-btn" onClick={() => setRunning((r) => !r)} className="btn-pill btn-pink inline-flex items-center gap-2">
            {running ? <Pause size={14} strokeWidth={3} /> : <Play size={14} strokeWidth={3} />}
            {running ? "Pause" : "Resume"}
          </button>
          <button data-testid="breather-reset-btn" onClick={() => { setSeconds(total); setRunning(true); }} className="btn-pill btn-ghost inline-flex items-center gap-2">
            <RotateCcw size={14} strokeWidth={3} /> Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export const MeTimePage = ({ items, onAdd, onUpdate, onRemove }) => {
  const [active, setActive] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", duration_minutes: 5, icon: "heart" });

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (editing) {
      onUpdate(editing.id, {
        title: form.title.trim(),
        duration_minutes: parseInt(form.duration_minutes, 10) || 5,
        icon: form.icon,
      });
      setEditing(null);
    } else {
      onAdd({
        title: form.title.trim(),
        duration_minutes: parseInt(form.duration_minutes, 10) || 5,
        icon: form.icon,
      });
    }
    setForm({ title: "", duration_minutes: 5, icon: "heart" });
  };

  return (
    <div data-testid="metime-page" className="slide-up">
      <div className="mb-5">
        <div className="text-[11px] font-bold uppercase tracking-[0.25em] opacity-60 mb-1">
          <Heart className="inline mr-1" size={12} /> Self-care
        </div>
        <h1 className="font-display text-4xl md:text-5xl">Me Time</h1>
        <p className="text-sm opacity-70 mt-1">Pick a moment for yourself — tap any to start a guided breather.</p>
      </div>

      <form onSubmit={submit} className="glass p-3 md:p-4 mb-5 grid grid-cols-12 gap-2">
        <div className="relative col-span-6">
          <input
            data-testid="metime-title-input"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={editing ? "Edit ritual..." : "Add a self-care ritual..."}
            className="input-glass"
            style={{ paddingRight: 48 }}
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
            <MicButton
              testid="metime-title"
              onTranscript={(t) => setForm((f) => ({ ...f, title: t }))}
              title="Dictate ritual"
            />
          </div>
        </div>
        <input
          data-testid="metime-duration-input"
          type="number"
          min={1}
          value={form.duration_minutes}
          onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
          className="input-glass col-span-2 text-center"
        />
        <select
          data-testid="metime-icon-select"
          value={form.icon}
          onChange={(e) => setForm({ ...form, icon: e.target.value })}
          className="input-glass col-span-2"
        >
          {Object.keys(ICONS).map((k) => (
            <option key={k} value={k} style={{ background: "#1B0A2A" }}>
              {k}
            </option>
          ))}
        </select>
        <button type="submit" data-testid="metime-add-btn" className="btn-pill btn-pink col-span-2 inline-flex items-center justify-center gap-1">
          <Plus size={14} strokeWidth={3} /> {editing ? "Save" : "Add"}
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((it) => {
          const Icon = ICONS[it.icon] || Heart;
          return (
            <div key={it.id} data-testid={`metime-item-${it.id}`} className="glass lift p-4 flex items-center gap-3">
              <button
                data-testid={`metime-start-${it.id}`}
                onClick={() => setActive(it)}
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, rgba(255,45,146,0.3), rgba(176,38,255,0.3))" }}
                aria-label="Start"
              >
                <Icon size={20} strokeWidth={2.5} className="text-[var(--pink-soft)]" />
              </button>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-lg leading-tight">{it.title}</h3>
                <p className="text-xs opacity-60 font-mono-display">{it.duration_minutes} min</p>
              </div>
              <button
                data-testid={`metime-edit-${it.id}`}
                onClick={() => { setEditing(it); setForm({ title: it.title, duration_minutes: it.duration_minutes, icon: it.icon }); }}
                className="w-9 h-9 rounded-full glass flex items-center justify-center"
                aria-label="Edit"
              >
                <Pencil size={13} strokeWidth={2.5} />
              </button>
              <button
                data-testid={`metime-remove-${it.id}`}
                onClick={() => onRemove(it.id)}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,45,146,0.15)", color: "#FF6BB4" }}
                aria-label="Remove"
              >
                <Trash2 size={13} strokeWidth={2.5} />
              </button>
            </div>
          );
        })}
      </div>

      {active && <Breather item={active} onClose={() => setActive(null)} />}
    </div>
  );
};
