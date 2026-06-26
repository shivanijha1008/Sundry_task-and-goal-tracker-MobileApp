import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const client = axios.create({ baseURL: API, timeout: 8000 });

export const api = {
  // tasks
  listTasks: () => client.get("/tasks").then((r) => r.data),
  createTask: (task) => client.post("/tasks", task).then((r) => r.data),
  updateTask: (id, patch) => client.put(`/tasks/${id}`, patch).then((r) => r.data),
  deleteTask: (id) => client.delete(`/tasks/${id}`).then((r) => r.data),
  reorder: (items) => client.post("/tasks/reorder", items).then((r) => r.data),
  logSession: (s) => client.post("/sessions", s).then((r) => r.data),
  getStats: () => client.get("/stats").then((r) => r.data),

  // shopping
  listShopping: () => client.get("/shopping").then((r) => r.data),
  createShopping: (i) => client.post("/shopping", i).then((r) => r.data),
  updateShopping: (id, p) => client.put(`/shopping/${id}`, p).then((r) => r.data),
  deleteShopping: (id) => client.delete(`/shopping/${id}`).then((r) => r.data),

  // me-time
  listMeTime: () => client.get("/me-time").then((r) => r.data),
  createMeTime: (i) => client.post("/me-time", i).then((r) => r.data),
  updateMeTime: (id, p) => client.put(`/me-time/${id}`, p).then((r) => r.data),
  deleteMeTime: (id) => client.delete(`/me-time/${id}`).then((r) => r.data),

  // monthly goals
  listMonthly: (list_type) =>
    client
      .get(`/monthly-goals${list_type ? `?list_type=${list_type}` : ""}`)
      .then((r) => r.data),
  createMonthly: (i) => client.post("/monthly-goals", i).then((r) => r.data),
  updateMonthly: (id, p) => client.put(`/monthly-goals/${id}`, p).then((r) => r.data),
  deleteMonthly: (id) => client.delete(`/monthly-goals/${id}`).then((r) => r.data),

  // quote
  getQuote: () => client.get("/quote/today").then((r) => r.data),

  // google calendar
  googleStatus: (email) => client.get(`/google/status${email ? `?email=${email}` : ""}`).then((r) => r.data),
  googleLogin: () => client.get(`/oauth/calendar/login`).then((r) => r.data),
  googleDisconnect: (email) => client.post(`/google/disconnect?email=${email}`).then((r) => r.data),
  calendarEvents: (email) => client.get(`/calendar/events?email=${email}`).then((r) => r.data),
  calendarPush: (email, task_id) => client.post(`/calendar/push`, { email, task_id }).then((r) => r.data),
};

export async function isBackendOnline() {
  try {
    await client.get("/", { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}
