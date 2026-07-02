import { useEffect, useState } from "react";
import { X, Bell, Clock, PlayCircle, Info } from "lucide-react";
import { toast } from "sonner";
import {
  readPrefs,
  writePrefs,
  reschedule,
  cancelDaily,
  fireTestNudge,
  labelForTime,
  computeNudgeBody,
} from "../lib/dailyNudge";
import { isNative, ensureNotifPermission } from "../lib/native";

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);

export function SettingsModal({ open, onClose, tasksSnapshot }) {
  const [prefs, setPrefs] = useState(() => readPrefs());
  const [busy, setBusy] = useState(false);

  // Refresh prefs when opened (in case they were changed elsewhere)
  useEffect(() => {
    if (open) setPrefs(readPrefs());
  }, [open]);

  if (!open) return null;

  const preview = computeNudgeBody(tasksSnapshot || {});

  const applyChange = async (next, opts = {}) => {
    const merged = writePrefs(next);
    setPrefs(merged);
    setBusy(true);
    try {
      if (merged.enabled) {
        const scheduled = await reschedule(tasksSnapshot || {});
        if (scheduled) {
          toast.success(`Daily nudge set for ${labelForTime(merged.hour, merged.minute)}`);
        } else if (isNative()) {
          toast.error("Notification permission denied — enable in system settings.");
        } else if (opts.notifyWebFallback) {
          toast("Nudges only fire on the installed app 📱", { icon: "ℹ️" });
        }
      } else {
        await cancelDaily();
        toast("Daily nudge paused", { icon: "🌙" });
      }
    } finally {
      setBusy(false);
    }
  };

  const toggle = async () => {
    // Ask for permission on first ENABLE
    if (!prefs.enabled && isNative()) {
      const ok = await ensureNotifPermission();
      if (!ok) {
        toast.error("Please allow notifications in system settings first.");
        return;
      }
    }
    // Show the web-fallback hint on ENABLE only (not on hour changes)
    applyChange({ ...prefs, enabled: !prefs.enabled }, { notifyWebFallback: !prefs.enabled });
  };

  const setHour = (hour) => applyChange({ ...prefs, hour: parseInt(hour, 10) });

  const testFire = async () => {
    if (!isNative()) {
      toast("Test fires only on the installed app 📱", { icon: "ℹ️" });
      return;
    }
    setBusy(true);
    try {
      const r = await fireTestNudge(tasksSnapshot || {});
      if (r.ok) {
        toast.success("Test nudge in 5 seconds ⏱️ — background the app to see it.");
      } else if (r.reason === "denied") {
        toast.error("Permission denied. Enable notifications in system settings.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      data-testid="settings-modal"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-hi max-w-md w-full p-5 md:p-6 slide-up"
        style={{ borderRadius: 24, maxHeight: "90vh", overflow: "auto" }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.25em] opacity-60">
              Settings
            </div>
            <div className="font-display text-2xl gradient-text-pink">Preferences</div>
          </div>
          <button
            data-testid="settings-modal-close"
            onClick={onClose}
            className="w-9 h-9 rounded-full glass flex items-center justify-center"
            aria-label="Close"
          >
            <X size={15} strokeWidth={3} />
          </button>
        </div>

        {/* Daily Nudge section */}
        <section className="glass p-4 mb-3">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: prefs.enabled
                  ? "linear-gradient(135deg,#FF2D92,#B026FF)"
                  : "rgba(255,255,255,0.08)",
                color: "#fff",
              }}
            >
              <Bell size={16} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm">Daily nudge</div>
              <div className="text-[11px] opacity-65">
                One gentle wrap-up notification per day.
              </div>
            </div>
            <button
              data-testid="nudge-toggle"
              onClick={toggle}
              disabled={busy}
              role="switch"
              aria-checked={prefs.enabled}
              className="relative w-12 h-7 rounded-full transition-colors flex-shrink-0"
              style={{
                background: prefs.enabled
                  ? "linear-gradient(135deg,#FF2D92,#B026FF)"
                  : "rgba(255,255,255,0.15)",
              }}
            >
              <span
                className="absolute top-0.5 w-6 h-6 rounded-full bg-white transition-all"
                style={{
                  left: prefs.enabled ? "22px" : "2px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
                }}
              />
            </button>
          </div>

          {/* Time picker + preview */}
          <div
            className={`space-y-3 transition-opacity ${prefs.enabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}
          >
            <div className="flex items-center gap-2">
              <Clock size={13} strokeWidth={2.5} className="opacity-70" />
              <label className="text-[11px] font-bold uppercase tracking-wider opacity-70 flex-1">
                Delivery time
              </label>
              <select
                data-testid="nudge-hour-select"
                value={prefs.hour}
                onChange={(e) => setHour(e.target.value)}
                disabled={busy || !prefs.enabled}
                className="input-glass text-sm font-bold"
                style={{ paddingTop: 6, paddingBottom: 6, width: 100 }}
              >
                {HOUR_OPTIONS.map((h) => (
                  <option key={h} value={h}>
                    {labelForTime(h, 0)}
                  </option>
                ))}
              </select>
            </div>

            <div
              className="rounded-xl p-3 text-xs"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px dashed rgba(255,255,255,0.15)",
              }}
            >
              <div className="flex items-center gap-1.5 opacity-70 mb-1">
                <Info size={11} strokeWidth={2.5} />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Preview at {labelForTime(prefs.hour, 0)}
                </span>
              </div>
              <div
                data-testid="nudge-preview"
                className="italic leading-snug"
              >
                &ldquo;{preview}&rdquo;
              </div>
            </div>

            <button
              data-testid="nudge-test-btn"
              onClick={testFire}
              disabled={busy || !prefs.enabled}
              className="btn-pill btn-ghost w-full inline-flex items-center justify-center gap-2 text-xs"
            >
              <PlayCircle size={13} strokeWidth={3} />
              Send test nudge in 5s
            </button>

            {!isNative() && (
              <div
                data-testid="nudge-web-hint"
                className="text-[10px] opacity-60 text-center leading-relaxed"
              >
                Notifications fire on the installed iOS/Android app. On the web this
                just saves your preference for later.
              </div>
            )}
          </div>
        </section>

        <p className="text-[10px] opacity-50 text-center px-2 leading-relaxed">
          Sundry never sends your data to a push server. All reminders are scheduled
          locally on your device.
        </p>
      </div>
    </div>
  );
}
