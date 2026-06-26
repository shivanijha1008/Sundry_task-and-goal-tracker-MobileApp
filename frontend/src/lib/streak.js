// Simple streak tracker (localStorage)
const KEY = "scheduler.streak.v1";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function readStreak() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!data) return { count: 0, lastDate: null };
    // If last activity was older than yesterday, streak broken
    if (data.lastDate && data.lastDate !== todayISO() && data.lastDate !== yesterdayISO()) {
      return { count: 0, lastDate: data.lastDate };
    }
    return data;
  } catch {
    return { count: 0, lastDate: null };
  }
}

export function bumpStreak() {
  const cur = readStreak();
  const today = todayISO();
  if (cur.lastDate === today) return cur;
  const yest = yesterdayISO();
  const next =
    cur.lastDate === yest
      ? { count: cur.count + 1, lastDate: today }
      : { count: 1, lastDate: today };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
