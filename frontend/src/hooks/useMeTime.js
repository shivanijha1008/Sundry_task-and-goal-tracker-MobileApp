import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

const KEY = "scheduler.metime.v1";
const DEFAULTS = [
  { title: "Deep breathing", duration_minutes: 3, icon: "wind" },
  { title: "Stretch break", duration_minutes: 5, icon: "activity" },
  { title: "Tea ritual", duration_minutes: 10, icon: "coffee" },
  { title: "Walk outside", duration_minutes: 15, icon: "footprints" },
  { title: "Mindful pause", duration_minutes: 5, icon: "heart" },
];

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function read() {
  try {
    const cached = JSON.parse(localStorage.getItem(KEY) || "null");
    if (Array.isArray(cached) && cached.length > 0) return cached;
  } catch {
    /* ignore */
  }
  return DEFAULTS.map((d) => ({ id: uuid(), ...d, created_at: new Date().toISOString() }));
}

export function useMeTime(online) {
  const [items, setItems] = useState(read);

  const persist = useCallback((next) => {
    setItems(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  useEffect(() => {
    if (!online) return;
    api
      .listMeTime()
      .then(persist)
      .catch((e) => console.warn("[me-time] sync failed:", e?.message));
  }, [online, persist]);

  const add = useCallback(
    async (data) => {
      const item = {
        id: uuid(),
        title: data.title,
        duration_minutes: data.duration_minutes || 5,
        icon: data.icon || "heart",
        created_at: new Date().toISOString(),
      };
      persist([...items, item]);
      if (online) {
        try {
          await api.createMeTime({ title: item.title, duration_minutes: item.duration_minutes, icon: item.icon });
        } catch (e) {
          console.warn("[me-time] create failed:", e?.message);
        }
      }
    },
    [items, online, persist]
  );

  const update = useCallback(
    async (id, patch) => {
      persist(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
      if (online) {
        try {
          await api.updateMeTime(id, patch);
        } catch (e) {
          console.warn("[me-time] update failed:", e?.message);
        }
      }
    },
    [items, online, persist]
  );

  const remove = useCallback(
    async (id) => {
      persist(items.filter((i) => i.id !== id));
      if (online) {
        try {
          await api.deleteMeTime(id);
        } catch (e) {
          console.warn("[me-time] delete failed:", e?.message);
        }
      }
    },
    [items, online, persist]
  );

  return { items, add, update, remove };
}
