import { useCallback, useEffect, useState } from "react";

const KEY = "scheduler.diary.v1";

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

export function useDiary() {
  const [entries, setEntries] = useState(read);

  const persist = useCallback((next) => {
    setEntries(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  useEffect(() => {}, []);

  const add = useCallback(
    (data) => {
      const entry = {
        id: uuid(),
        mood: data.mood || "🙂",
        text: data.text || "",
        tags: data.tags || [],
        created_at: new Date().toISOString(),
      };
      persist([entry, ...entries]);
    },
    [entries, persist]
  );

  const remove = useCallback(
    (id) => persist(entries.filter((e) => e.id !== id)),
    [entries, persist]
  );

  const update = useCallback(
    (id, patch) => persist(entries.map((e) => (e.id === id ? { ...e, ...patch } : e))),
    [entries, persist]
  );

  return { entries, add, remove, update };
}
