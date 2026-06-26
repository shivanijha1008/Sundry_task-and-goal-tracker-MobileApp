import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

const KEY = "scheduler.monthlyGoals.v2"; // bumped: items now carry month_key

export const LIST_TYPES = ["goals", "skills", "books", "movies", "places"];

export const LIST_META = {
  goals: { title: "Goals for the month", emoji: "🎯", testid: "list-goals" },
  skills: { title: "Skills to be learned", emoji: "🧠", testid: "list-skills" },
  books: { title: "Books to be read", emoji: "📚", testid: "list-books" },
  movies: { title: "Movies / Series to watch", emoji: "🎬", testid: "list-movies" },
  places: { title: "Places to be explored", emoji: "🗺️", testid: "list-places" },
};

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function currentMonthKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function monthKeyLabel(mk) {
  if (!mk) return "—";
  const [y, m] = mk.split("-").map((s) => parseInt(s, 10));
  if (!y || !m) return mk;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}

export function shiftMonth(mk, delta) {
  const [y, m] = mk.split("-").map((s) => parseInt(s, 10));
  const d = new Date(y, m - 1 + delta, 1);
  return currentMonthKey(d);
}

function readCache() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (Array.isArray(raw)) {
      return raw.map((i) => ({ ...i, month_key: i.month_key || currentMonthKey() }));
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function useMonthlyGoals(online) {
  const [items, setItems] = useState(readCache);

  const persist = useCallback((next) => {
    setItems(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  useEffect(() => {
    if (!online) return;
    api
      .listMonthly()
      .then((data) => persist(Array.isArray(data) ? data : []))
      .catch((e) => console.warn("[monthly] sync failed:", e?.message));
  }, [online, persist]);

  const add = useCallback(
    async (list_type, title, monthKey) => {
      const trimmed = (title || "").trim();
      if (!trimmed) return;
      const mk = monthKey || currentMonthKey();
      const order = items.filter((i) => i.list_type === list_type && i.month_key === mk).length;
      const tempId = uuid();
      const item = {
        id: tempId,
        list_type,
        title: trimmed,
        checked: false,
        order,
        month_key: mk,
        created_at: new Date().toISOString(),
      };
      setItems((prev) => {
        const next = [...prev, item];
        localStorage.setItem(KEY, JSON.stringify(next));
        return next;
      });
      if (online) {
        try {
          const created = await api.createMonthly({ list_type, title: trimmed, month_key: mk });
          setItems((prev) => {
            const next = prev.map((i) =>
              i.id === tempId
                ? {
                    ...i,
                    id: created.id,
                    order: created.order ?? i.order,
                    created_at: created.created_at,
                    month_key: created.month_key || mk,
                  }
                : i
            );
            localStorage.setItem(KEY, JSON.stringify(next));
            return next;
          });
        } catch (e) {
          console.warn("[monthly] create failed:", e?.message);
        }
      }
    },
    [items, online]
  );

  const update = useCallback(
    async (id, patch) => {
      persist(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
      if (online) {
        try {
          await api.updateMonthly(id, patch);
        } catch (e) {
          console.warn("[monthly] update failed:", e?.message);
        }
      }
    },
    [items, online, persist]
  );

  const toggle = useCallback(
    (item) => update(item.id, { checked: !item.checked }),
    [update]
  );

  const remove = useCallback(
    async (id) => {
      persist(items.filter((i) => i.id !== id));
      if (online) {
        try {
          await api.deleteMonthly(id);
        } catch (e) {
          console.warn("[monthly] delete failed:", e?.message);
        }
      }
    },
    [items, online, persist]
  );

  const byType = useCallback(
    (lt, monthKey) =>
      items
        .filter((i) => i.list_type === lt && (!monthKey || i.month_key === monthKey))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [items]
  );

  const monthsAvailable = useCallback(() => {
    const set = new Set(items.map((i) => i.month_key).filter(Boolean));
    set.add(currentMonthKey()); // always include current
    return Array.from(set).sort().reverse();
  }, [items]);

  const statsForMonth = useCallback(
    (monthKey) => {
      const slice = items.filter((i) => i.month_key === monthKey);
      const total = slice.length;
      const done = slice.filter((i) => i.checked).length;
      const byList = {};
      for (const lt of LIST_TYPES) {
        const list = slice.filter((i) => i.list_type === lt);
        byList[lt] = {
          total: list.length,
          done: list.filter((i) => i.checked).length,
        };
      }
      return { total, done, byList, percent: total ? Math.round((done / total) * 100) : 0 };
    },
    [items]
  );

  return {
    items,
    byType,
    add,
    update,
    toggle,
    remove,
    monthsAvailable,
    statsForMonth,
  };
}
