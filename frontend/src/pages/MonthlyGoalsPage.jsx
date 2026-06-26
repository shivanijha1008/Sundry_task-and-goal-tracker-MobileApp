import { useState } from "react";
import { Plus, Trash2, Target, ChevronDown, ChevronRight, Check, Pencil, X } from "lucide-react";
import { LIST_TYPES, LIST_META } from "../hooks/useMonthlyGoals";
import { MicButton } from "../components/MicButton";

function GoalRow({ item, onToggle, onUpdate, onRemove }) {
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
        onClick={() => onToggle(item)}
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: item.checked
            ? "linear-gradient(135deg,#FFD24A,#FF8A3D)"
            : "transparent",
          border: item.checked ? "none" : "2px solid rgba(255,255,255,0.35)",
        }}
        aria-label="Toggle"
        aria-pressed={item.checked}
      >
        {item.checked && (
          <Check size={12} strokeWidth={3} className="text-black" />
        )}
      </button>

      {editing ? (
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
            className={`flex-1 font-semibold leading-snug ${
              item.checked ? "line-through opacity-50" : ""
            }`}
            data-testid={`monthly-title-${item.id}`}
          >
            {item.title}
          </span>
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
    </li>
  );
}

function ListSection({ listType, byType, add, toggle, update, remove }) {
  const meta = LIST_META[listType];
  const list = byType(listType);
  const [open, setOpen] = useState(true);
  const [text, setText] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    add(listType, text);
    setText("");
  };

  const done = list.filter((i) => i.checked).length;
  const total = list.length;

  return (
    <section data-testid={`monthly-section-${listType}`} className="glass p-4 md:p-5">
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
          <div className="font-display text-lg md:text-xl gradient-text-pink truncate">
            {meta.title}
          </div>
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-60">
            {done} of {total} done
          </div>
        </div>
        {open ? (
          <ChevronDown size={18} strokeWidth={2.5} className="opacity-70" />
        ) : (
          <ChevronRight size={18} strokeWidth={2.5} className="opacity-70" />
        )}
      </button>

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
                style={{ paddingRight: 48, paddingTop: 10, paddingBottom: 10 }}
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
              className="text-center text-sm opacity-60 py-4"
            >
              Nothing here yet — speak it into existence ✨
            </div>
          ) : (
            <ul className="space-y-2">
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

export const MonthlyGoalsPage = ({ byType, add, update, toggle, remove }) => {
  return (
    <div data-testid="monthly-goals-page" className="slide-up">
      <div className="mb-5">
        <div className="text-[11px] font-bold uppercase tracking-[0.25em] opacity-60 mb-1">
          <Target className="inline mr-1" size={12} /> 30-Day Intentions
        </div>
        <h1 className="font-display text-4xl md:text-5xl gradient-text-pink">
          Monthly Goals
        </h1>
        <p className="text-sm opacity-70 mt-1">
          Five tiny lists. One bigger month.
        </p>
      </div>

      <div className="space-y-4">
        {LIST_TYPES.map((lt) => (
          <ListSection
            key={lt}
            listType={lt}
            byType={byType}
            add={add}
            toggle={toggle}
            update={update}
            remove={remove}
          />
        ))}
      </div>
    </div>
  );
};
