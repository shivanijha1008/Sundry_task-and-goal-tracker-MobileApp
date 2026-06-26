import { Plus } from "lucide-react";

export const EmptyState = ({ onAdd }) => (
  <div
    data-testid="empty-state"
    className="nb-border nb-shadow rounded-md bg-[var(--surface)] p-10 text-center"
  >
    <div
      className="w-20 h-20 mx-auto nb-border rounded-md mb-5 flex items-center justify-center"
      style={{ background: "var(--yellow)" }}
    >
      <span className="font-display text-3xl">!</span>
    </div>
    <h3 className="font-display text-3xl mb-2">No tasks yet</h3>
    <p className="opacity-70 mb-6">Drop a task in and let's go. Offline-ready.</p>
    <button
      data-testid="empty-add-task-btn"
      onClick={onAdd}
      className="nb-border nb-shadow rounded-md px-5 py-3 font-display inline-flex items-center gap-2 nb-press-lg"
      style={{ background: "var(--yellow)", color: "black" }}
    >
      <Plus size={18} strokeWidth={3} />
      Add your first task
    </button>
  </div>
);
