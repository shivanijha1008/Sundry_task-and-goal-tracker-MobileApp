import { Target, Clock3, CheckCircle2, Flame } from "lucide-react";
import { fmt } from "../lib/utils-app";

export const StatsPanel = ({ tasks }) => {
  const total = tasks.length;
  const done = tasks.filter((t) => t.completed).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const totalSecondsTracked = tasks.reduce((sum, t) => sum + (t.elapsed_seconds || 0), 0);
  const remaining = total - done;

  const cards = [
    {
      label: "Completed",
      value: `${done}/${total}`,
      icon: CheckCircle2,
      bg: "var(--green)",
      textColor: "black",
      testid: "stat-completed",
    },
    {
      label: "Progress",
      value: `${pct}%`,
      icon: Target,
      bg: "var(--yellow)",
      textColor: "black",
      testid: "stat-progress",
    },
    {
      label: "Time tracked",
      value: fmt(totalSecondsTracked),
      icon: Clock3,
      bg: "var(--lilac)",
      textColor: "black",
      testid: "stat-time",
    },
    {
      label: "Remaining",
      value: remaining,
      icon: Flame,
      bg: "var(--pink)",
      textColor: "white",
      testid: "stat-remaining",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            data-testid={c.testid}
            className="nb-border nb-shadow-sm rounded-md p-4"
            style={{ background: c.bg, color: c.textColor }}
          >
            <c.icon size={20} strokeWidth={3} />
            <div className="font-display text-2xl mt-2">{c.value}</div>
            <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="nb-border nb-shadow-sm rounded-md p-4 bg-[var(--surface)]">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Daily progress</span>
          <span className="font-display text-lg">{pct}%</span>
        </div>
        <div className="h-4 nb-border bg-[var(--bg)] rounded-sm overflow-hidden">
          <div
            data-testid="progress-bar-fill"
            className="h-full"
            style={{
              width: `${pct}%`,
              background: "var(--green)",
              transition: "width .4s ease",
            }}
          />
        </div>
      </div>
    </div>
  );
};
