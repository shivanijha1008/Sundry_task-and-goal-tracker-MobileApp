import { useEffect, useMemo, useState } from "react";
import "@/App.css";
import { Reorder } from "framer-motion";
import { Plus, Search, Wifi, WifiOff, Filter } from "lucide-react";
import { Toaster, toast } from "sonner";

import { useTasks } from "./hooks/useTasks";
import { useShopping } from "./hooks/useShopping";
import { useMeTime } from "./hooks/useMeTime";
import { useMonthlyGoals } from "./hooks/useMonthlyGoals";
import { TaskCard } from "./components/TaskCard";
import { TimerWidget } from "./components/TimerWidget";
import { TaskFormModal } from "./components/TaskFormModal";
import { QuoteBanner } from "./components/QuoteBanner";
import { BottomNav } from "./components/BottomNav";
import { ShareModal } from "./components/ShareModal";
import { SmartSuggestions } from "./components/SmartSuggestions";
import { StreakBadge } from "./components/StreakBadge";
import { ShareStreakButton } from "./components/ShareStreakButton";
import { MicButton } from "./components/MicButton";
import { useDiary } from "./hooks/useDiary";
import { ShoppingPage } from "./pages/ShoppingPage";
import { MeTimePage } from "./pages/MeTimePage";
import { DiaryPage } from "./pages/DiaryPage";
import { MonthlyGoalsPage } from "./pages/MonthlyGoalsPage";
import { AuthCallback } from "./components/AuthCallback";
import { ProfileChip } from "./components/ProfileChip";
import { InstallPromo } from "./components/InstallPromo";
import { bumpStreak } from "./lib/streak";
import { todayDateLabel } from "./lib/utils-app";
import {
  isNative,
  applyStatusBarTheme,
  hideSplash,
  hapticTap,
  hapticSelect,
} from "./lib/native";

function StatChip({ label, value, color, testid }) {
  return (
    <div data-testid={testid} className="glass lift p-4 flex-1 min-w-[88px]">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70 mb-1">{label}</div>
      <div className="font-display text-3xl" style={{ color }}>{value}</div>
    </div>
  );
}

function GoogleSignInButton() { return null; }

function TasksView({
  tasks, online, addTask, updateTask, deleteTask, reorderTasks, logSession,
  activeTask, setActiveTask, setModalOpen, setEditing, setShareTarget,
  dayMode, setDayMode,
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const total = tasks.length;
  const done = tasks.filter((t) => t.completed).length;
  const active = total - done;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const filtered = useMemo(() => {
    let list = [...tasks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    if (filter === "active") list = list.filter((t) => !t.completed);
    if (filter === "done") list = list.filter((t) => t.completed);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          (t.tags || []).some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return list;
  }, [tasks, query, filter]);

  const handleToggle = (task) => {
    const willComplete = !task.completed;
    updateTask(task.id, { completed: willComplete, completed_at: willComplete ? new Date().toISOString() : null });
    if (willComplete) bumpStreak();
  };

  const handleQuickAdd = (data) => {
    addTask(data);
    toast.success(`Added: ${data.title}`);
  };

  return (
    <>
      <QuoteBanner />

      <div className="flex items-end justify-between mb-4 gap-3 flex-wrap">
        <div className="slide-up">
          <div className="text-[11px] font-bold uppercase tracking-[0.25em] opacity-60 mb-1 flex items-center gap-2">
            <img
              src="/logo-mark.png"
              alt="Sundry"
              data-testid="brand-mark"
              className="w-5 h-5 rounded-md object-cover"
              style={{ boxShadow: "0 2px 8px rgba(255,45,146,0.35)" }}
            />
            <span className="gradient-text-pink font-display tracking-[0.2em]">SUNDRY</span> · {todayDateLabel()}
          </div>
          <h1 className="font-display text-5xl md:text-6xl leading-[0.95]">
            <span className="gradient-text-pink">My Day</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div
            data-testid="online-status"
            className="glass px-3 h-10 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
            style={{ color: online ? "#5FE3A1" : "#FF6BB4" }}
          >
            {online ? <Wifi size={13} strokeWidth={3} /> : <WifiOff size={13} strokeWidth={3} />}
            {online ? "Online" : "Offline"}
          </div>
          <StreakBadge />
          <button
            data-testid="day-mode-toggle"
            onClick={() => setDayMode((d) => !d)}
            className="glass w-10 h-10 rounded-full flex items-center justify-center text-base"
            title={dayMode ? "Switch to Night" : "Switch to Day"}
            aria-label="Toggle day mode"
          >
            {dayMode ? "🌙" : "☀️"}
          </button>
          <ProfileChip />
          <button
            data-testid="add-task-btn"
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="btn-pill btn-pink inline-flex items-center gap-2"
          >
            <Plus size={16} strokeWidth={3} /> Add Task
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-5">
        <StatChip label="Total" value={total} color="#fff" testid="stat-total" />
        <StatChip label="Done" value={done} color="#5FE3A1" testid="stat-done" />
        <StatChip label="Active" value={active} color="#FF6BB4" testid="stat-active" />
      </div>

      <div className="mb-5">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">Daily Progress</span>
          <span className="font-display text-sm gradient-text-pink">{pct}%</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
          <div data-testid="progress-bar-fill" className="h-full progress-fill" style={{ width: `${pct}%`, transition: "width .4s ease" }} />
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <div className="seg">
          {["all", "active", "done"].map((f) => (
            <button
              key={f}
              data-testid={`filter-${f}-btn`}
              onClick={() => setFilter(f)}
              className={filter === f ? "active" : ""}
            >
              {f === "all" ? `All (${total})` : f === "active" ? `Active (${active})` : `Completed (${done})`}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[160px]">
          <Search size={15} strokeWidth={3} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
          <input
            data-testid="search-input"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-glass pl-9"
            style={{ paddingTop: 8, paddingBottom: 8, paddingRight: 48 }}
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
            <MicButton
              testid="search"
              onTranscript={(t) => setQuery(t)}
              title="Dictate search"
            />
          </div>
        </div>
      </div>

      {activeTask && (
        <div className="mb-5">
          <TimerWidget task={activeTask} onClose={() => setActiveTask(null)} onLogSession={logSession} onUpdateTask={updateTask} />
        </div>
      )}

      <SmartSuggestions onAdd={handleQuickAdd} />
      <ShareStreakButton />

      {filtered.length === 0 ? (
        <div data-testid="empty-state" className="glass p-10 text-center opacity-70">
          <Filter className="mx-auto mb-2 opacity-50" size={28} strokeWidth={2.5} />
          {tasks.length === 0 ? "No tasks yet. Tap Add Task to begin." : "Nothing matches your filter."}
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={filtered}
          onReorder={(newOrder) => {
            if (filter === "all" && !query.trim()) reorderTasks(newOrder);
            else {
              const ids = new Set(newOrder.map((t) => t.id));
              reorderTasks([...newOrder, ...tasks.filter((t) => !ids.has(t.id))]);
            }
          }}
          data-testid="task-list"
        >
          {filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={handleToggle}
              onEdit={(t) => { setEditing(t); setModalOpen(true); }}
              onDelete={(t) => { deleteTask(t.id); if (activeTask?.id === t.id) setActiveTask(null); }}
              onStartTimer={(t) => setActiveTask(t)}
              onShare={(t) => setShareTarget(t)}
              isActive={activeTask?.id === task.id}
            />
          ))}
        </Reorder.Group>
      )}
    </>
  );
}

function App() {
  const { tasks, online, addTask, updateTask, deleteTask, reorderTasks, logSession } = useTasks();
  const shopping = useShopping(online);
  const meTime = useMeTime(online);
  const diary = useDiary();
  const monthly = useMonthlyGoals(online);

  const [tab, setTab] = useState("tasks");
  const [dayMode, setDayMode] = useState(() => {
    // migrate legacy lumora.dayMode key if present
    const legacy = localStorage.getItem("lumora.dayMode");
    if (legacy != null && localStorage.getItem("sundry.dayMode") == null) {
      localStorage.setItem("sundry.dayMode", legacy);
      localStorage.removeItem("lumora.dayMode");
    }
    return localStorage.getItem("sundry.dayMode") === "1";
  });

  useEffect(() => {
    if (dayMode) document.body.classList.add("day-mode");
    else document.body.classList.remove("day-mode");
    localStorage.setItem("sundry.dayMode", dayMode ? "1" : "0");
    applyStatusBarTheme(dayMode);
  }, [dayMode]);

  // Native app boot: hide splash + mark html for CSS targeting
  useEffect(() => {
    if (isNative()) {
      document.documentElement.setAttribute("data-native", "1");
    }
    const t = setTimeout(() => {
      hideSplash();
    }, 400);
    return () => clearTimeout(t);
  }, []);
  const [activeTask, setActiveTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);

  const handleSave = async (data) => {
    if (editing) { await updateTask(editing.id, data); toast.success("Task updated"); }
    else { await addTask(data); toast.success("Task added"); }
    setModalOpen(false); setEditing(null);
  };

  return (
    <div className="App min-h-screen relative" data-testid="app-root">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "rgba(27, 10, 42, 0.95)",
            color: "#F5EAF7",
            border: "1px solid rgba(255,255,255,0.18)",
            backdropFilter: "blur(12px)",
            borderRadius: "14px",
            fontWeight: 700,
          },
        }}
      />

      <div className="max-w-3xl mx-auto px-4 md:px-6 pt-6 pb-32 relative z-10">
        {tab === "tasks" && (
          <TasksView
            tasks={tasks}
            online={online}
            addTask={addTask}
            updateTask={updateTask}
            deleteTask={deleteTask}
            reorderTasks={reorderTasks}
            logSession={logSession}
            activeTask={activeTask}
            setActiveTask={setActiveTask}
            setModalOpen={setModalOpen}
            setEditing={setEditing}
            setShareTarget={setShareTarget}
            dayMode={dayMode}
            setDayMode={setDayMode}
          />
        )}
        {tab === "shopping" && (
          <>
            <ShoppingPage
              items={shopping.items}
              onAdd={shopping.add}
              onToggle={shopping.toggle}
              onRemove={shopping.remove}
              onClearPurchased={shopping.clearPurchased}
            />
            {shopping.items.length > 0 && (
              <div className="mt-4">
                <button
                  data-testid="share-shopping-btn"
                  onClick={() => setShareTarget({ __list: shopping.items.filter((i) => !i.purchased).map((i) => `${i.name} ×${i.qty}`), __title: "Shopping list" })}
                  className="btn-pill btn-ghost"
                >
                  Share list
                </button>
              </div>
            )}
          </>
        )}
        {tab === "metime" && (
          <MeTimePage
            items={meTime.items}
            onAdd={meTime.add}
            onUpdate={meTime.update}
            onRemove={meTime.remove}
          />
        )}
        {tab === "diary" && (
          <DiaryPage entries={diary.entries} onAdd={diary.add} onRemove={diary.remove} />
        )}
        {tab === "goals" && (
          <MonthlyGoalsPage
            byType={monthly.byType}
            add={monthly.add}
            update={monthly.update}
            toggle={monthly.toggle}
            remove={monthly.remove}
            monthsAvailable={monthly.monthsAvailable}
            statsForMonth={monthly.statsForMonth}
            items={monthly.items}
          />
        )}
      </div>

      <BottomNav active={tab} onChange={setTab} />
      <InstallPromo />

      <TaskFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        initial={editing}
      />

      <ShareModal
        open={!!shareTarget}
        onClose={() => setShareTarget(null)}
        task={shareTarget && !shareTarget.__list ? shareTarget : null}
        list={shareTarget?.__list}
        title={shareTarget?.__title || shareTarget?.title}
      />
    </div>
  );
}

export default function Root() {
  // CRITICAL: Detect OAuth callback synchronously during render (NOT in useEffect).
  // useEffect would run after App mounts, causing race conditions with the
  // AuthProvider's /auth/me check.
  if (
    typeof window !== "undefined" &&
    window.location.hash &&
    window.location.hash.includes("session_id=")
  ) {
    return <AuthCallback />;
  }
  return <App />;
}