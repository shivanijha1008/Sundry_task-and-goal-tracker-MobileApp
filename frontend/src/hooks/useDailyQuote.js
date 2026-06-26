import { useEffect, useState } from "react";
import { api } from "../lib/api";

const STORAGE_KEY = "scheduler.quote.v1";

export function useDailyQuote() {
  const [quote, setQuote] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (cached?.data) return cached.data;
    } catch {
      /* ignore */
    }
    return { text: "Be so good they can't ignore you.", author: "Steve Martin" };
  });

  useEffect(() => {
    // Always refresh on visit
    api
      .getQuote()
      .then((data) => {
        setQuote(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ data }));
      })
      .catch(() => {
        /* keep cached/fallback */
      });
  }, []);

  return quote;
}
