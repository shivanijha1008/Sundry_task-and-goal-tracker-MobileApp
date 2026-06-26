import { useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Target,
  ChevronDown,
  ChevronRight,
  Check,
  Pencil,
  X,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Sparkles,
  Calendar as CalendarIcon,
  LayoutGrid,
} from "lucide-react";
import {
  LIST_TYPES,
  LIST_META,
  currentMonthKey,
  monthKeyLabel,
  shiftMonth,
} from "../hooks/useMonthlyGoals";
import { MicButton } from "../components/MicButton";
import { MonthlyRecapModal } from "../components/MonthlyRecapModal";
import { downloadIcs } from "../lib/icsExport";
import { toast } from "sonner";

function GoalRow({ item, onToggle, onUpdate, onRemove, readOnly = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.title);

  const save = () => {
    const v = draft.trim();
    if (v && v !== item.title) onUpdate(item.id, { title: v });
    setEditing(false);
  };

  return (
    <li
      data-testid={`monthly-item-${item.id}`}
      className="glass lift p-3 flex items-center gap-3"
    >
      <button
        data-testid={`monthly-toggle-${item.id}`}
        onClick={() => !readOnly && onToggle(item)}
        disabled={readOnly}
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: item.checked
            ? "linear-gradient(135deg,#FFD24A,#FF8A3D)"
            : "transparent",
          border: item.checked ? "none" : "2px solid rgba(255,255,255,0.35)",
          cursor: readOnly ? "default" : "pointer",
        }}
        aria-label="Toggle"
        aria-pressed={item.checked}
      >
        {item.checked && <Check size={12} strokeWidth={3} className="text-black" />}
      </button>

      {editing && !readOnly ? (
        <div className="flex-1 flex items-center gap-2">
          <input
            data-testid={`monthly-edit-input-${item.id}`}
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") {
                setDraft(item.title);
                setEditing(false);
              }
            }}
            className="input-glass"
            style={{ paddingTop: 6, paddingBottom: 6 }}
          />
          <MicButton
            testid={`monthly-edit-${item.id}`}
            onTranscript={(t) => setDraft(t)}
            title="Dictate"
          />
          <button
            data-testid={`monthly-edit-save-${item.id}`}
            onClick={save}
            className="w-8 h-8 rounded-full glass flex items-center justify-center"
            aria-label="Save"
          >
            <Check size={13} strokeWidth={3} />
          </button>
          <button
            data-testid={`monthly-edit-cancel-${item.id}`}
            onClick={() => {
              setDraft(item.title);
              setEditing(false);
            }}
            className="w-8 h-8 rounded-full glass flex items-center justify-center"
            aria-label="Cancel"
          >
            <X size={13} strokeWidth={3} />
          </button>
        </div>
      ) : (
        <>
          <span
            className={`flex-1 font-semibold leading-snug min-w-0 truncate ${
              item.checked ? "line-through opacity-50" : ""
            }`}
            data-testid={`monthly-title-${item.id}`}
            title={item.title}
          >
            {item.title}
          </span>
          {!readOnly && (
            <>
              <button
                data-testid={`monthly-edit-${item.id}`}
                onClick={() => setEditing(true)}
                className="w-8 h-8 rounded-full glass flex items-center justify-center"
                aria-label="Edit"
              >
                <Pencil size={12} strokeWidth={2.5} />
              </button>
              <button
                data-testid={`monthly-remove-${item.id}`}
                onClick={() => onRemove(item.id)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,45,146,0.15)", color: "#FF6BB4" }}
                aria-label="Remove"
              >
                <Trash2 size={12} strokeWidth={2.5} />
              </button>
            </>
          )}
        </>
      )}
    </li>
  );
}

function ListTile({ listType, monthKey, byType, add, toggle, update, remove }) {
  const meta = LIST_META[listType];
  const list = byType(listType, monthKey);
  const [open, setOpen] = useState(true);
  const [text, setText] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    add(listType, text, monthKey);
    setText("");
  };

  const done = list.filter((i) => i.checked).length;
  const total = list.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <section
      data-testid={`monthly-section-${listType}`}
      className="glass p-4 md:p-5 h-full flex flex-col"
    >
      <button
        data-testid={`monthly-section-toggle-${listType}`}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 mb-3"
        aria-expanded={open}
      >
        <span className="text-2xl" aria-hidden="true">
          {meta.emoji}
        </span>
        <div className="flex-1 text-left min-w-0">
          <div className="font-display text-base md:text-lg gradient-text-pink truncate">
            {meta.title}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">
            {done} of {total} done · {pct}%
          </div>
        </div>
        {open ? (
          <ChevronDown size={16} strokeWidth={2.5} className="opacity-70" />
        ) : (
          <ChevronRight size={16} strokeWidth={2.5} className="opacity-70" />
        )}
      </button>

      {/* progress bar */}
      <div className="h-1.5 w-full rounded-full overflow-hidden mb-3" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="h-full transition-all"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg,#FFD24A,#FF2D92)",
          }}
        />
      </div>

      {open && (
        <>
          <form onSubmit={submit} className="flex items-stretch gap-2 mb-3">
            <div className="relative flex-1">
              <input
                data-testid={`monthly-add-input-${listType}`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Add to ${meta.title.toLowerCase()}…`}
                className="input-glass"
                style={{ paddingRight: 48, paddingTop: 9, paddingBottom: 9 }}
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                <MicButton
                  testid={`monthly-add-${listType}`}
                  onTranscript={(t) => setText(t)}
                  title="Dictate"
                />
              </div>
            </div>
            <button
              type="submit"
              data-testid={`monthly-add-btn-${listType}`}
              className="btn-pill btn-pink inline-flex items-center justify-center gap-1 px-4"
            >
              <Plus size={14} strokeWidth={3} />
            </button>
          </form>

          {list.length === 0 ? (
            <div
              data-testid={`monthly-empty-${listType}`}
              className="text-center text-sm opacity-60 py-4 flex-1 flex items-center justify-center"
            >
              Nothing here yet — speak it into existence ✨
            </div>
          ) : (
            <ul className="space-y-2 flex-1">
              {list.map((it) => (
                <GoalRow
                  key={it.id}
                  item={it}
                  onToggle={toggle}
                  onUpdate={update}
                  onRemove={remove}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

function ComparisonColumn({ monthKey, byType, statsForMonth, label }) {
  const stats = statsForMonth(monthKey);
  return (
    <div
      data-testid={`comparison-col-${label}`}
      className="glass p-4 md:p-5 flex flex-col min-w-0"
    >
      <div className="mb-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.25em] opacity-60">
          {label}
        </div>
        <div className="font-display text-xl md:text-2xl gradient-text-pink truncate">
          {monthKeyLabel(monthKey)}
        </div>
        <div className="text-xs opacity-70 mt-0.5">
          {stats.done} / {stats.total} done · <span className="font-bold">{stats.percent}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full overflow-hidden mt-2" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div
            className="h-full transition-all"
            style={{
              width: `${stats.percent}%`,
              background: "linear-gradient(90deg,#FFD24A,#FF2D92)",
            }}
          />
        </div>
      </div>
      <div className="space-y-2">
        {LIST_TYPES.map((lt) => {
          const sub = stats.byList[lt];
          const list = byType(lt, monthKey);
          return (
            <div
              key={lt}
              data-testid={`comparison-${label}-${lt}`}
              className="rounded-xl p-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span aria-hidden="true">{LIST_META[lt].emoji}</span>
                <div className="text-xs font-bold uppercase tracking-wider opacity-80 flex-1 truncate">
                  {LIST_META[lt].title}
                </div>
                <div className="text-[11px] font-bold opacity-90">
                  {sub.done}/{sub.total}
                </div>
              </div>
              {list.length > 0 && (
                <ul className="text-xs opacity-80 space-y-0.5 pl-5">
                  {list.slice(0, 3).map((it) => (
                    <li key={it.id} className={`truncate ${it.checked ? "line-through opacity-50" : ""}`}>
                      • {it.title}
                    </li>
                  ))}
                  {list.length > 3 && <li className="opacity-60">+ {list.length - 3} more</li>}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const MonthlyGoalsPage = ({
  byType,
  add,
  update,
  toggle,
  remove,
  monthsAvailable,
  statsForMonth,
  items,
}) => {
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [view, setView] = useState("tiles"); // 'tiles' | 'compare'
  const [recapOpen, setRecapOpen] = useState(false);

  const months = useMemo(() => monthsAvailable(), [monthsAvailable]);
  const stats = useMemo(() => statsForMonth(monthKey), [statsForMonth, monthKey]);
  const monthItems = useMemo(
    () => (items || []).filter((i) => i.month_key === monthKey),
    [items, monthKey]
  );

  const prevMonthKey = useMemo(() => shiftMonth(monthKey, -1), [monthKey]);

  const goPrev = () => setMonthKey((k) => shiftMonth(k, -1));
  const goNext = () => setMonthKey((k) => shiftMonth(k, +1));
  const goToday = () => setMonthKey(currentMonthKey());

  const exportIcs = () => {
    if (monthItems.length === 0) {
      toast.error("Nothing to export yet for this month.");
      return;
    }
    downloadIcs(monthKey, monthItems);
    toast.success("Calendar file saved 🗓️");
  };

  return (
    <div data-testid="monthly-goals-page" className="slide-up">
      <div className="mb-5">
        <div className="text-[11px] font-bold uppercase tracking-[0.25em] opacity-60 mb-1">
          <Target className="inline mr-1" size={12} /> 30-Day Intentions
        </div>
        <h1 className="font-display text-4xl md:text-5xl gradient-text-pink">Monthly Goals</h1>
        <p className="text-sm opacity-70 mt-1">Five tiny lists. One bigger month.</p>
      </div>

      {/* Month nav + view switch + actions */}
      <div className="glass p-3 md:p-4 mb-4 flex flex-wrap items-center gap-2">
        <button
          data-testid="month-prev-btn"
          onClick={goPrev}
          className="w-9 h-9 rounded-full glass flex items-center justify-center"
          aria-label="Previous month"
        >
          <ChevronLeft size={15} strokeWidth={3} />
        </button>
        <select
          data-testid="month-select"
          value={monthKey}
          onChange={(e) => setMonthKey(e.target.value)}
          className="input-glass text-sm font-bold"
          style={{ paddingTop: 6, paddingBottom: 6, minWidth: 150 }}
        >
          {months.map((mk) => (
            <option key={mk} value={mk}>
              {monthKeyLabel(mk)}
            </option>
          ))}
          {!months.includes(monthKey) && (
            <option value={monthKey}>{monthKeyLabel(monthKey)}</option>
          )}
        </select>
        <button
          data-testid="month-next-btn"
          onClick={goNext}
          className="w-9 h-9 rounded-full glass flex items-center justify-center"
          aria-label="Next month"
        >
          <ChevronRightIcon size={15} strokeWidth={3} />
        </button>
        <button
          data-testid="month-today-btn"
          onClick={goToday}
          className="btn-pill btn-ghost text-xs px-3"
          title="Jump to current month"
        >
          Today
        </button>

        <div className="flex-1 min-w-[120px] text-right text-xs opacity-70">
          <span className="font-bold">{stats.done}</span>/{stats.total} done ·{" "}
          <span className="font-bold gradient-text-pink">{stats.percent}%</span>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div
            className="glass inline-flex items-center p-1 rounded-full"
            data-testid="view-switcher"
          >
            <button
              data-testid="view-tiles-btn"
              onClick={() => setView("tiles")}
              className="px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5"
              style={{
                background:
                  view === "tiles"
                    ? "linear-gradient(135deg,#FF2D92,#B026FF)"
                    : "transparent",
                color: view === "tiles" ? "#fff" : "var(--muted)",
              }}
            >
              <LayoutGrid size={12} strokeWidth={3} /> Tiles
            </button>
            <button
              data-testid="view-compare-btn"
              onClick={() => setView("compare")}
              className="px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5"
              style={{
                background:
                  view === "compare"
                    ? "linear-gradient(135deg,#FF2D92,#B026FF)"
                    : "transparent",
                color: view === "compare" ? "#fff" : "var(--muted)",
              }}
            >
              <Sparkles size={12} strokeWidth={3} /> Compare
            </button>
          </div>
          <button
            data-testid="recap-open-btn"
            onClick={() => setRecapOpen(true)}
            className="btn-pill btn-pink text-xs px-3 inline-flex items-center gap-1.5"
            title="Monthly recap card + PDF"
          >
            <Sparkles size={12} strokeWidth={3} /> Recap
          </button>
          <button
            data-testid="export-ics-btn"
            onClick={exportIcs}
            className="btn-pill btn-ghost text-xs px-3 inline-flex items-center gap-1.5"
            title="Export this month to your calendar"
          >
            <CalendarIcon size={12} strokeWidth={3} /> .ics
          </button>
        </div>
      </div>

      {view === "tiles" && (
        <div
          data-testid="monthly-tiles-grid"
          className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4"
        >
          {LIST_TYPES.map((lt) => (
            <ListTile
              key={lt}
              listType={lt}
              monthKey={monthKey}
              byType={byType}
              add={add}
              toggle={toggle}
              update={update}
              remove={remove}
            />
          ))}
        </div>
      )}

      {view === "compare" && (
        <div
          data-testid="monthly-compare-grid"
          className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4"
        >
          <ComparisonColumn
            monthKey={prevMonthKey}
            byType={byType}
            statsForMonth={statsForMonth}
            label="last"
          />
          <ComparisonColumn
            monthKey={monthKey}
            byType={byType}
            statsForMonth={statsForMonth}
            label="this"
          />
        </div>
      )}

      <MonthlyRecapModal
        open={recapOpen}
        onClose={() => setRecapOpen(false)}
        monthKey={monthKey}
        items={monthItems}
        stats={stats}
      />
    </div>
  );
};
