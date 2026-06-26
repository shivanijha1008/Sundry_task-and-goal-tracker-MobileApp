import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

const KEY = "scheduler.monthlyGoals.v1";

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

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function useMonthlyGoals(online) {
  const [items, setItems] = useState(read);

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
    async (list_type, title) => {
      const trimmed = (title || "").trim();
      if (!trimmed) return;
      const order = items.filter((i) => i.list_type === list_type).length;
      const tempId = uuid();
      const item = {
        id: tempId,
        list_type,
        title: trimmed,
        checked: false,
        order,
        created_at: new Date().toISOString(),
      };
      // optimistic insert
      setItems((prev) => {
        const next = [...prev, item];
        localStorage.setItem(KEY, JSON.stringify(next));
        return next;
      });
      if (online) {
        try {
          const created = await api.createMonthly({ list_type, title: trimmed });
          // reconcile local id with server-generated id
          setItems((prev) => {
            const next = prev.map((i) =>
              i.id === tempId
                ? { ...i, id: created.id, order: created.order ?? i.order, created_at: created.created_at }
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
    (lt) => items.filter((i) => i.list_type === lt).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [items]
  );

  return { items, byType, add, update, toggle, remove };
}
