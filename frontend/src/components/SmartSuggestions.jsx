import { useEffect } from "react";
import { Sparkles } from "lucide-react";
import { getSuggestions } from "../lib/suggestions";

export const SmartSuggestions = ({ onAdd }) => {
  const items = getSuggestions(new Date(), 4);
  useEffect(() => {}, []); // refresh on mount
  if (items.length === 0) return null;
  return (
    <div data-testid="smart-suggestions" className="mb-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.25em] opacity-60 mb-2 flex items-center gap-1">
        <Sparkles size={11} strokeWidth={3} className="text-[var(--yellow)]" />
        Smart suggestions for now
      </div>
      <div className="flex gap-2 flex-wrap">
        {items.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              data-testid={`suggestion-${s.id}-btn`}
              onClick={() =>
                onAdd({
                  title: s.title,
                  description: "",
                  priority: "medium",
                  tags: ["suggested"],
                  estimated_minutes: s.duration,
                  timer_mode: s.mode,
                  recurring: false,
                  due_time: null,
                })
              }
              className="glass lift inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{ borderColor: "rgba(255,210,74,0.35)" }}
            >
              <Icon size={12} strokeWidth={2.5} className="text-[var(--pink-soft)]" />
              {s.title} <span className="opacity-60 font-mono-display">{s.duration}m</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
