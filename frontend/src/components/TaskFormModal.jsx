import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { TIMER_MODES } from "../lib/utils-app";
import { MicButton } from "./MicButton";

const EMPTY = {
  title: "",
  description: "",
  priority: "medium",
  tags: "",
  due_time: "",
  estimated_minutes: 25,
  recurring: false,
  timer_mode: "countdown",
};

export const TaskFormModal = ({ open, onClose, onSave, initial }) => {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    if (initial) setForm({ ...initial, tags: (initial.tags || []).join(", ") });
    else setForm(EMPTY);
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      estimated_minutes: parseInt(form.estimated_minutes, 10) || 25,
      due_time: form.due_time || null,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-3 md:p-6"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        data-testid="task-form-modal"
        className="glass-hi w-full max-w-lg p-5 md:p-6 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl md:text-3xl gradient-text-warm">
            {initial ? "Edit Task" : "New Task"}
          </h2>
          <button
            data-testid="modal-close-btn"
            onClick={onClose}
            className="w-9 h-9 rounded-full glass flex items-center justify-center"
            aria-label="Close"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider opacity-70 block mb-1">Title</label>
            <div className="relative">
              <input
                data-testid="task-title-input"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input-glass"
                style={{ paddingRight: 48 }}
                placeholder="Write proposal..."
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                <MicButton
                  testid="task-title"
                  onTranscript={(t) => setForm((f) => ({ ...f, title: t }))}
                  title="Dictate title"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider opacity-70 block mb-1">Description</label>
            <div className="relative">
              <textarea
                data-testid="task-description-input"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-glass"
                style={{ paddingRight: 48 }}
              />
              <div className="absolute right-1.5 top-2">
                <MicButton
                  testid="task-description"
                  onTranscript={(t) => setForm((f) => ({ ...f, description: t }))}
                  title="Dictate description"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider opacity-70 block mb-1">Priority</label>
              <div className="flex gap-1.5">
                {["high", "medium", "low"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    data-testid={`priority-${p}-btn`}
                    onClick={() => setForm({ ...form, priority: p })}
                    className={`flex-1 py-2 rounded-full font-display text-[11px] uppercase tracking-wider ${
                      form.priority === p ? `pri-${p}` : "glass"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider opacity-70 block mb-1">Timer Mode</label>
              <select
                data-testid="timer-mode-select"
                value={form.timer_mode}
                onChange={(e) => setForm({ ...form, timer_mode: e.target.value })}
                className="input-glass"
              >
                {TIMER_MODES.map((m) => (
                  <option key={m.value} value={m.value} style={{ background: "#1B0A2A" }}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider opacity-70 block mb-1">Due Time</label>
              <input
                data-testid="due-time-input"
                type="time"
                value={form.due_time || ""}
                onChange={(e) => setForm({ ...form, due_time: e.target.value })}
                className="input-glass"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider opacity-70 block mb-1">Duration (min)</label>
              <input
                data-testid="duration-input"
                type="number"
                min={1}
                value={form.estimated_minutes}
                onChange={(e) => setForm({ ...form, estimated_minutes: e.target.value })}
                className="input-glass"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider opacity-70 block mb-1">Tags</label>
            <input
              data-testid="tags-input"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="input-glass"
              placeholder="work, focus"
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer pt-1">
            <input
              data-testid="recurring-checkbox"
              type="checkbox"
              checked={form.recurring}
              onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
              className="w-5 h-5 accent-[var(--pink)]"
            />
            <span className="text-sm font-bold">Repeat daily</span>
          </label>
          <div className="flex gap-3 pt-3">
            <button type="button" data-testid="modal-cancel-btn" onClick={onClose} className="btn-pill btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" data-testid="modal-save-btn" className="btn-pill btn-pink flex-[2]">
              {initial ? "Save" : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
