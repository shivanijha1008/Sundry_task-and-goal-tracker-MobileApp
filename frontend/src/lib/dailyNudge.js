// Daily "gentle nudge" — one local notification per day (default 8pm) summarising
// what's left for today. Reschedules whenever the task/goal state changes.
// Web = silent no-op (guard via native.js isNative()).

import {
  scheduleNotification,
  cancelNotification,
  ensureNotifPermission,
  isNative,
  idFromString,
} from "./native";

export const DAILY_NUDGE_ID = idFromString("sundry.dailyNudge.v1");

const LS_KEY = "sundry.dailyNudge";

const DEFAULT_PREFS = {
  enabled: true,
  hour: 20, // 8pm
  minute: 0,
};

// ---------------- Prefs ----------------
export function readPrefs() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || "null");
    if (raw && typeof raw === "object") {
      return { ...DEFAULT_PREFS, ...raw };
    }
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_PREFS };
}

export function writePrefs(prefs) {
  const merged = { ...DEFAULT_PREFS, ...prefs };
  localStorage.setItem(LS_KEY, JSON.stringify(merged));
  return merged;
}

// ---------------- Copy generation ----------------
const OPEN_TASK = (t) => t && !t.completed;

/**
 * Given today's snapshot, produce a friendly notification body.
 * @param {{tasks: Array, monthlyItems: Array}} snapshot
 */
export function computeNudgeBody(snapshot) {
  const { tasks = [], monthlyItems = [] } = snapshot || {};
  const openTasks = tasks.filter(OPEN_TASK).length;
  const openGoals = monthlyItems.filter((i) => !i.checked).length;

  // Perfect day
  if (openTasks === 0 && openGoals === 0 && tasks.length + monthlyItems.length > 0) {
    return "You did everything today. Legend. ⭐";
  }
  // Empty day / new user
  if (tasks.length + monthlyItems.length === 0) {
    return "Clean slate today ✨ Set an intention for tomorrow?";
  }
  if (openTasks > 0 && openGoals > 0) {
    return `${openTasks} task${openTasks === 1 ? "" : "s"} and ${openGoals} intention${openGoals === 1 ? "" : "s"} left. Plan tomorrow?`;
  }
  if (openTasks > 0) {
    if (openTasks === 1) return "One task left today — one more push? 🌙";
    return `${openTasks} tasks still open. Wrap up or roll over to tomorrow?`;
  }
  if (openGoals > 0) {
    return `${openGoals} monthly intention${openGoals === 1 ? "" : "s"} waiting for you.`;
  }
  return "Sundry: your day is winding down. 🌙";
}

// ---------------- Scheduling ----------------
function nextFireDate(hour, minute) {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= now.getTime() + 30 * 1000) {
    // If already past, schedule for tomorrow
    target.setDate(target.getDate() + 1);
  }
  return target;
}

/**
 * Cancel and re-schedule the daily nudge with a fresh body derived from `snapshot`.
 * Returns true if scheduled, false if disabled / web / no permission.
 */
export async function reschedule(snapshot) {
  const prefs = readPrefs();
  if (!prefs.enabled) {
    await cancelDaily();
    return false;
  }
  if (!isNative()) return false;

  const granted = await ensureNotifPermission();
  if (!granted) return false;

  const at = nextFireDate(prefs.hour, prefs.minute);
  const body = computeNudgeBody(snapshot);

  await cancelNotification(DAILY_NUDGE_ID); // idempotent
  await scheduleNotification(
    DAILY_NUDGE_ID,
    "Sundry — daily wrap-up",
    body,
    at
  );
  return true;
}

export async function cancelDaily() {
  await cancelNotification(DAILY_NUDGE_ID);
}

// ---------------- Debounced reschedule ----------------
let _rescheduleTimer = null;
export function rescheduleDebounced(snapshot, delayMs = 1800) {
  if (_rescheduleTimer) clearTimeout(_rescheduleTimer);
  _rescheduleTimer = setTimeout(() => {
    reschedule(snapshot).catch(() => {
      /* silent */
    });
  }, delayMs);
}

// ---------------- Test-fire (5s from now) ----------------
export async function fireTestNudge(snapshot) {
  if (!isNative()) return { ok: false, reason: "web" };
  const granted = await ensureNotifPermission();
  if (!granted) return { ok: false, reason: "denied" };
  const at = new Date(Date.now() + 5000);
  const body = computeNudgeBody(snapshot);
  await scheduleNotification(
    idFromString("sundry.dailyNudge.TEST"),
    "Sundry — test nudge",
    body,
    at
  );
  return { ok: true };
}

// Utility for UI
export function labelForTime(hour, minute) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
