// localStorage-based offline cache for tasks
const TASKS_KEY = "scheduler.tasks.v1";
const SESSIONS_KEY = "scheduler.sessions.v1";
const PENDING_KEY = "scheduler.pending.v1";

export const storage = {
  getTasks() {
    try {
      return JSON.parse(localStorage.getItem(TASKS_KEY) || "[]");
    } catch {
      return [];
    }
  },
  setTasks(tasks) {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  },
  getSessions() {
    try {
      return JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]");
    } catch {
      return [];
    }
  },
  addSession(s) {
    const cur = this.getSessions();
    cur.push(s);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(cur));
  },
  getPending() {
    try {
      return JSON.parse(localStorage.getItem(PENDING_KEY) || "[]");
    } catch {
      return [];
    }
  },
  setPending(ops) {
    localStorage.setItem(PENDING_KEY, JSON.stringify(ops));
  },
  queueOp(op) {
    const cur = this.getPending();
    cur.push({ ...op, ts: Date.now() });
    this.setPending(cur);
  },
};
