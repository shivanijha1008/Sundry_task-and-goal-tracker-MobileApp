import { Reorder, useDragControls } from "framer-motion";
import { Check, Clock, GripVertical, Pencil, Trash2, Play, Repeat, Tag, Share2 } from "lucide-react";

const PRI_CLASS = { high: "pri-high", medium: "pri-medium", low: "pri-low" };
const BAR_COLOR = { high: "#FF2D92", medium: "#FFD24A", low: "#6FA8FF" };

export const TaskCard = ({ task, onToggle, onEdit, onDelete, onStartTimer, onShare, isActive }) => {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={task}
      dragListener={false}
      dragControls={controls}
      data-testid={`task-card-${task.id}`}
      className="glass lift relative p-4 md:p-5 mb-3 overflow-hidden"
      style={{
        boxShadow: isActive
          ? "0 0 0 2px rgba(255,45,146,0.6), 0 12px 32px rgba(0,0,0,0.4)"
          : undefined,
      }}
    >
      <span className="task-bar" style={{ background: BAR_COLOR[task.priority] || "#FFD24A" }} />

      <div className="flex items-start gap-3 pl-3">
        <button
          data-testid={`drag-handle-${task.id}`}
          onPointerDown={(e) => controls.start(e)}
          className="touch-none cursor-grab active:cursor-grabbing opacity-40 hover:opacity-80 pt-1"
          aria-label="Drag"
        >
          <GripVertical size={18} strokeWidth={2.5} />
        </button>

        <button
          data-testid={`toggle-task-${task.id}`}
          onClick={() => onToggle(task)}
          className="w-7 h-7 mt-0.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
          style={{
            background: task.completed
              ? "linear-gradient(135deg, #FFD24A, #FF8A3D)"
              : "transparent",
            border: task.completed ? "none" : "2px solid rgba(255,255,255,0.35)",
          }}
          aria-label="Complete"
        >
          {task.completed && <Check size={15} strokeWidth={4} className="tick-pop text-[#1a0a0a]" />}
        </button>

        <div className="flex-1 min-w-0">
          <h3
            className={`font-display text-lg md:text-xl leading-tight ${task.completed ? "line-through opacity-50" : ""}`}
          >
            {task.title}
          </h3>
          {task.description && (
            <p className={`text-sm mt-1 opacity-70 ${task.completed ? "line-through" : ""}`}>
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap mt-2">
            <span
              className={`${PRI_CLASS[task.priority] || PRI_CLASS.medium} font-display text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full`}
              data-testid={`priority-badge-${task.id}`}
            >
              {task.priority}
            </span>
            {task.due_time && (
              <span className="text-xs font-bold flex items-center gap-1 opacity-70">
                <Clock size={11} strokeWidth={3} /> {task.due_time}
              </span>
            )}
            <span className="text-xs font-bold opacity-60">{task.estimated_minutes}m</span>
            {task.recurring && (
              <span className="text-xs font-bold flex items-center gap-1 text-[var(--blue)]">
                <Repeat size={11} strokeWidth={3} /> daily
              </span>
            )}
            {(task.tags || []).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <Tag size={9} strokeWidth={3} /> {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Horizontal action row */}
      <div className="flex items-center justify-end gap-1.5 mt-3 pl-3 flex-wrap">
        <button
          data-testid={`start-timer-${task.id}`}
          onClick={() => onStartTimer(task)}
          disabled={task.completed}
          className="h-8 px-3 rounded-full inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-30"
          style={{
            background: "linear-gradient(135deg, #FF2D92, #B026FF)",
            color: "white",
            boxShadow: "0 4px 14px rgba(255,45,146,0.4)",
          }}
          aria-label="Start"
        >
          <Play size={12} strokeWidth={3} /> Start
        </button>
        <button data-testid={`share-task-${task.id}`} onClick={() => onShare(task)} className="w-8 h-8 rounded-full flex items-center justify-center glass" aria-label="Share">
          <Share2 size={12} strokeWidth={2.5} />
        </button>
        <button data-testid={`edit-task-${task.id}`} onClick={() => onEdit(task)} className="w-8 h-8 rounded-full flex items-center justify-center glass" aria-label="Edit">
          <Pencil size={12} strokeWidth={2.5} />
        </button>
        <button
          data-testid={`delete-task-${task.id}`}
          onClick={() => onDelete(task)}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,45,146,0.18)", border: "1px solid rgba(255,45,146,0.4)", color: "#FF6BB4" }}
          aria-label="Delete"
        >
          <Trash2 size={12} strokeWidth={2.5} />
        </button>
      </div>
    </Reorder.Item>
  );
};
