import { useState } from "react";
import { BookHeart, Trash2, Smile } from "lucide-react";
import { MicButton } from "../components/MicButton";

const MOODS = ["😊", "😄", "🥳", "😌", "🙂", "😐", "😕", "😢", "😡", "😴", "🤩", "🥰", "😎", "🤔", "🫶", "🔥", "💪", "🌱", "☀️", "🌧️"];

export const DiaryPage = ({ entries, onAdd, onRemove }) => {
  const [mood, setMood] = useState("🙂");
  const [text, setText] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd({ mood, text: text.trim() });
    setText("");
  };

  const fmt = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  return (
    <div data-testid="diary-page" className="slide-up">
      <div className="mb-5">
        <div className="text-[11px] font-bold uppercase tracking-[0.25em] opacity-60 mb-1">
          <BookHeart className="inline mr-1" size={12} /> Daily Feeling Dump
        </div>
        <h1 className="font-display text-4xl md:text-5xl gradient-text-pink">Journal</h1>
        <p className="text-sm opacity-70 mt-1">How are you really feeling? No rules, just dump it.</p>
      </div>

      <form onSubmit={submit} className="glass p-4 mb-5 space-y-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-70 mb-2 flex items-center gap-1">
            <Smile size={12} /> Mood
          </div>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m}
                type="button"
                data-testid={`diary-mood-${m}-btn`}
                onClick={() => setMood(m)}
                className="text-2xl w-11 h-11 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: mood === m ? "linear-gradient(135deg, rgba(255,45,146,0.3), rgba(176,38,255,0.3))" : "rgba(255,255,255,0.05)",
                  border: mood === m ? "1px solid rgba(255,107,180,0.6)" : "1px solid rgba(255,255,255,0.1)",
                  transform: mood === m ? "scale(1.1)" : "scale(1)",
                }}
                aria-label={`Mood ${m}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="relative">
          <textarea
            data-testid="diary-text-input"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Today I felt... what's on your mind?"
            className="input-glass"
            style={{ paddingRight: 48 }}
          />
          <div className="absolute right-1.5 top-2">
            <MicButton
              testid="diary-text"
              onTranscript={(t) => setText(t)}
              title="Dictate your diary entry"
            />
          </div>
        </div>
        <button type="submit" data-testid="diary-add-btn" className="btn-pill btn-pink inline-flex items-center gap-1.5">
          {mood} Save entry
        </button>
      </form>

      {entries.length === 0 ? (
        <div data-testid="diary-empty" className="glass p-10 text-center opacity-70">
          <BookHeart size={32} className="mx-auto mb-3 opacity-50" />
          No entries yet. Your first dump is one tap away.
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((e) => (
            <div key={e.id} data-testid={`diary-entry-${e.id}`} className="glass lift p-4 flex gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
                style={{ background: "linear-gradient(135deg, rgba(255,210,74,0.2), rgba(255,138,61,0.2))" }}
              >
                {e.mood}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">{fmt(e.created_at)}</div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{e.text}</p>
              </div>
              <button
                data-testid={`diary-remove-${e.id}`}
                onClick={() => onRemove(e.id)}
                className="w-8 h-8 rounded-full flex items-center justify-center self-start"
                style={{ background: "rgba(255,45,146,0.15)", color: "#FF6BB4" }}
                aria-label="Remove"
              >
                <Trash2 size={12} strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
