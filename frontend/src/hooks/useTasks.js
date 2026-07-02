import { useCallback, useEffect, useState } from "react";
import { api, isBackendOnline } from "../lib/api";
import { storage } from "../lib/storage";
import {
  hapticTap,
  hapticSuccess,
  scheduleNotification,
  cancelNotification,
  idFromString,
} from "../lib/native";

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useTasks() {
  const [tasks, setTasks] = useState(() => storage.getTasks());
  const [online, setOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  const persist = useCallback((next) => {
    setTasks(next);
    storage.setTasks(next);
  }, []);

  // Sync helpers
  const flushPending = useCallback(async () => {
    const pending = storage.getPending();
    if (pending.length === 0) return;
    const remaining = [];
    for (const op of pending) {
      try {
        if (op.type === "create") await api.createTask(op.task);
        else if (op.type === "update") await api.updateTask(op.id, op.patch);
        else if (op.type === "delete") await api.deleteTask(op.id);
        else if (op.type === "reorder") await api.reorder(op.items);
        else if (op.type === "session") await api.logSession(op.session);
      } catch (err) {
        console.warn(`[sync] op '${op.type}' failed, will retry:`, err?.message || err);
        remaining.push(op);
      }
    }
    storage.setPending(remaining);
  }, []);

  const refreshFromServer = useCallback(async () => {
    setSyncing(true);
    try {
      await flushPending();
      const serverTasks = await api.listTasks();
      persist(serverTasks);
    } catch (err) {
      // stay offline-only — backend unreachable
      console.warn("[sync] refresh skipped:", err?.message || err);
    } finally {
      setSyncing(false);
    }
  }, [flushPending, persist]);

  // Daily midnight reset for recurring tasks (idempotent per day)
  useEffect(() => {
    const RESET_KEY = "scheduler.lastResetDate";
    const today = new Date().toISOString().slice(0, 10);
    const last = localStorage.getItem(RESET_KEY);
    if (last === today) return;
    const current = storage.getTasks();
    let changed = false;
    const reset = current.map((t) => {
      if (t.recurring && t.completed) {
        changed = true;
        return { ...t, completed: false, completed_at: null, elapsed_seconds: 0 };
      }
      return t;
    });
    if (changed) {
      setTasks(reset);
      storage.setTasks(reset);
      // best-effort sync each reset to backend (fire and forget)
      reset
        .filter((t) => t.recurring)
        .forEach((t) => {
          api
            .updateTask(t.id, { completed: false, completed_at: null, elapsed_seconds: 0 })
            .catch(() => storage.queueOp({ type: "update", id: t.id, patch: { completed: false, completed_at: null, elapsed_seconds: 0 } }));
        });
    }
    localStorage.setItem(RESET_KEY, today);
  }, []);

  useEffect(() => {
    const checkAndSync = async () => {
      const ok = await isBackendOnline();
      setOnline(ok && navigator.onLine);
      if (ok && navigator.onLine) await refreshFromServer();
    };
    checkAndSync();
    const onOnline = () => checkAndSync();
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    const interval = setInterval(checkAndSync, 30000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      clearInterval(interval);
    };
  }, [refreshFromServer]);

  const addTask = useCallback(
    async (data) => {
      const task = {
        id: uuid(),
        title: data.title,
        description: data.description || "",
        priority: data.priority || "medium",
        tags: data.tags || [],
        due_time: data.due_time || null,
        estimated_minutes: Number(data.estimated_minutes) || 25,
        recurring: !!data.recurring,
        timer_mode: data.timer_mode || "countdown",
        order: tasks.length,
        completed: false,
        elapsed_seconds: 0,
        created_at: new Date().toISOString(),
        completed_at: null,
      };
      const next = [...tasks, task];
      persist(next);
      try {
        if (online) await api.createTask(task);
        else storage.queueOp({ type: "create", task });
      } catch {
        storage.queueOp({ type: "create", task });
      }
      // Schedule local notification if task has a due_time (HH:MM today)
      if (task.due_time && /^\d{2}:\d{2}$/.test(task.due_time)) {
        const [hh, mm] = task.due_time.split(":").map((s) => parseInt(s, 10));
        const at = new Date();
        at.setHours(hh, mm, 0, 0);
        if (at.getTime() > Date.now() + 30000) {
          scheduleNotification(
            idFromString(task.id),
            task.title,
            "Sundry reminder — it's time.",
            at
          );
        }
      }
      return task;
    },
    [tasks, online, persist]
  );

  const updateTask = useCallback(
    async (id, patch) => {
      const prev = tasks.find((t) => t.id === id);
      const next = tasks.map((t) => (t.id === id ? { ...t, ...patch } : t));
      persist(next);
      try {
        if (online) await api.updateTask(id, patch);
        else storage.queueOp({ type: "update", id, patch });
      } catch {
        storage.queueOp({ type: "update", id, patch });
      }
      // Haptic when task is checked off
      if (patch && Object.prototype.hasOwnProperty.call(patch, "completed")) {
        if (patch.completed) hapticSuccess();
        else hapticTap();
        // Cancel any pending reminder once completed
        if (patch.completed && prev) cancelNotification(idFromString(prev.id));
      }
    },
    [tasks, online, persist]
  );

  const deleteTask = useCallback(
    async (id) => {
      const next = tasks.filter((t) => t.id !== id);
      persist(next);
      cancelNotification(idFromString(id));
      try {
        if (online) await api.deleteTask(id);
        else storage.queueOp({ type: "delete", id });
      } catch {
        storage.queueOp({ type: "delete", id });
      }
    },
    [tasks, online, persist]
  );

  const reorderTasks = useCallback(
    async (newList) => {
      const withOrder = newList.map((t, i) => ({ ...t, order: i }));
      persist(withOrder);
      const items = withOrder.map((t) => ({ id: t.id, order: t.order }));
      try {
        if (online) await api.reorder(items);
        else storage.queueOp({ type: "reorder", items });
      } catch {
        storage.queueOp({ type: "reorder", items });
      }
    },
    [online, persist]
  );

  const logSession = useCallback(
    async (taskId, seconds, mode) => {
      const session = { task_id: taskId, seconds, mode };
      storage.addSession({ ...session, id: uuid(), created_at: new Date().toISOString() });
      try {
        if (online) await api.logSession(session);
        else storage.queueOp({ type: "session", session });
      } catch {
        storage.queueOp({ type: "session", session });
      }
    },
    [online]
  );

  return {
    tasks,
    online,
    syncing,
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
    logSession,
    refresh: refreshFromServer,
  };
}
