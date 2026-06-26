import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

const KEY = "scheduler.shopping.v1";

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useShopping(online) {
  const [items, setItems] = useState(read);

  const persist = useCallback((next) => {
    setItems(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  useEffect(() => {
    if (!online) return;
    api
      .listShopping()
      .then(persist)
      .catch((e) => console.warn("[shopping] sync failed:", e?.message));
  }, [online, persist]);

  const add = useCallback(
    async (data) => {
      const item = {
        id: uuid(),
        name: data.name,
        qty: data.qty || "1",
        category: data.category || "general",
        purchased: false,
        created_at: new Date().toISOString(),
      };
      persist([...items, item]);
      if (online) {
        try {
          await api.createShopping({ name: item.name, qty: item.qty, category: item.category });
        } catch (e) {
          console.warn("[shopping] create failed:", e?.message);
        }
      }
    },
    [items, online, persist]
  );

  const toggle = useCallback(
    async (item) => {
      const next = items.map((i) => (i.id === item.id ? { ...i, purchased: !i.purchased } : i));
      persist(next);
      if (online) {
        try {
          await api.updateShopping(item.id, { purchased: !item.purchased });
        } catch (e) {
          console.warn("[shopping] update failed:", e?.message);
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
          await api.deleteShopping(id);
        } catch (e) {
          console.warn("[shopping] delete failed:", e?.message);
        }
      }
    },
    [items, online, persist]
  );

  const clearPurchased = useCallback(async () => {
    const toRemove = items.filter((i) => i.purchased);
    persist(items.filter((i) => !i.purchased));
    if (online) {
      for (const i of toRemove) {
        try {
          await api.deleteShopping(i.id);
        } catch (e) {
          console.warn("[shopping] bulk delete failed:", e?.message);
        }
      }
    }
  }, [items, online, persist]);

  return { items, add, toggle, remove, clearPurchased };
}
