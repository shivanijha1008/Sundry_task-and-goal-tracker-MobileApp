import { useMemo, useState } from "react";
import { Plus, Trash2, ShoppingCart } from "lucide-react";
import { MicButton } from "../components/MicButton";

const UNITS = ["pcs", "kg", "g", "lb", "L", "ml", "pack", "box"];
const CATEGORIES = ["general", "produce", "dairy", "bakery", "meat", "pantry", "frozen", "drinks", "household"];

export const ShoppingPage = ({ items, onAdd, onToggle, onRemove, onClearPurchased }) => {
  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState("pcs");
  const [category, setCategory] = useState("general");

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), qty: `${qty} ${unit}`, category });
    setName("");
    setQty("1");
  };

  const total = items.length;
  const done = items.filter((i) => i.purchased).length;

  // Group by category
  const grouped = useMemo(() => {
    const g = {};
    items.forEach((it) => {
      const c = it.category || "general";
      if (!g[c]) g[c] = [];
      g[c].push(it);
    });
    return g;
  }, [items]);

  return (
    <div data-testid="shopping-page" className="slide-up">
      <div className="flex items-end justify-between mb-5 gap-3 flex-wrap">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.25em] opacity-60 mb-1">
            <ShoppingCart className="inline mr-1" size={12} /> Groceries
          </div>
          <h1 className="font-display text-4xl md:text-5xl gradient-text-pink">Shopping</h1>
          <p className="text-sm opacity-70 mt-1">
            {done}/{total} picked up
          </p>
        </div>
        {done > 0 && (
          <button data-testid="clear-purchased-btn" onClick={onClearPurchased} className="btn-pill btn-ghost text-xs">
            Clear bought
          </button>
        )}
      </div>

      <form onSubmit={submit} className="glass p-3 md:p-4 mb-5 space-y-2">
        <div className="relative">
          <input
            data-testid="shopping-name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Add an item..."
            className="input-glass"
            style={{ paddingRight: 48 }}
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
            <MicButton
              testid="shopping-name"
              onTranscript={(t) => setName(t)}
              title="Dictate item name"
            />
          </div>
        </div>
        <div className="grid grid-cols-12 gap-2">
          <input
            data-testid="shopping-qty-input"
            type="number"
            min="0"
            step="0.1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="input-glass col-span-3 text-center"
            placeholder="Qty"
          />
          <select
            data-testid="shopping-unit-select"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="input-glass col-span-3"
          >
            {UNITS.map((u) => (
              <option key={u} value={u} style={{ background: "#1B0A2A" }}>{u}</option>
            ))}
          </select>
          <select
            data-testid="shopping-category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-glass col-span-4"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} style={{ background: "#1B0A2A" }}>{c}</option>
            ))}
          </select>
          <button type="submit" data-testid="shopping-add-btn" className="btn-pill btn-pink col-span-2 inline-flex items-center justify-center gap-1">
            <Plus size={14} strokeWidth={3} />
          </button>
        </div>
      </form>

      {items.length === 0 ? (
        <div data-testid="shopping-empty" className="glass p-10 text-center opacity-70">
          <ShoppingCart size={32} className="mx-auto mb-3 opacity-50" />
          Nothing on your list yet.
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, list]) => (
            <div key={cat}>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-60 mb-2 pl-1">
                {cat} · {list.length}
              </div>
              <ul className="space-y-2">
                {list.map((item) => (
                  <li key={item.id} data-testid={`shopping-item-${item.id}`} className="glass lift p-3 flex items-center gap-3">
                    <button
                      data-testid={`shopping-toggle-${item.id}`}
                      onClick={() => onToggle(item)}
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: item.purchased ? "linear-gradient(135deg,#FFD24A,#FF8A3D)" : "transparent",
                        border: item.purchased ? "none" : "2px solid rgba(255,255,255,0.35)",
                      }}
                      aria-label="Toggle"
                    >
                      {item.purchased && <span className="text-xs text-black font-black">✓</span>}
                    </button>
                    <span className={`flex-1 font-semibold ${item.purchased ? "line-through opacity-50" : ""}`}>
                      {item.name}
                    </span>
                    <span
                      className="text-xs opacity-80 font-mono-display px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                    >
                      {item.qty}
                    </span>
                    <button
                      data-testid={`shopping-remove-${item.id}`}
                      onClick={() => onRemove(item.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(255,45,146,0.15)", color: "#FF6BB4" }}
                      aria-label="Remove"
                    >
                      <Trash2 size={12} strokeWidth={2.5} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
