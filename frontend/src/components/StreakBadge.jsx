import { Flame } from "lucide-react";
import { readStreak } from "../lib/streak";

export const StreakBadge = () => {
  const { count } = readStreak();
  const display = count > 0 ? count : 0;
  return (
    <div
      data-testid="streak-badge"
      className="glass lift inline-flex items-center gap-1.5 px-3 h-10 rounded-full"
      style={{
        background:
          count > 0
            ? "linear-gradient(135deg, rgba(255,138,61,0.25), rgba(255,45,146,0.25))"
            : undefined,
      }}
      title={count > 0 ? `${count}-day streak — keep it going!` : "Complete a task to start your streak"}
    >
      <Flame
        size={14}
        strokeWidth={3}
        style={{ color: count > 0 ? "#FF8A3D" : "rgba(255,255,255,0.4)" }}
      />
      <span className="font-display text-sm" data-testid="streak-count">
        {display}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">day{display === 1 ? "" : "s"}</span>
    </div>
  );
};
