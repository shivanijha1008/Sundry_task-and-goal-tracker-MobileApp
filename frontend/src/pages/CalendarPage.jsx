import { useEffect, useState } from "react";
import { Calendar as CalIcon, Plug, LogOut, RefreshCw, Clock } from "lucide-react";
import { api } from "../lib/api";
import { toast } from "sonner";

export const CalendarPage = () => {
  const [email, setEmail] = useState(() => localStorage.getItem("gcal_email") || "");
  const [status, setStatus] = useState({ configured: false, connected: false });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Pull ?gcal_email from URL after OAuth redirect
    const url = new URL(window.location.href);
    const ge = url.searchParams.get("gcal_email");
    if (ge) {
      setEmail(ge);
      localStorage.setItem("gcal_email", ge);
      url.searchParams.delete("gcal_email");
      window.history.replaceState({}, "", url.toString());
      toast.success(`Connected as ${ge}`);
    }
  }, []);

  const refresh = async () => {
    try {
      const s = await api.googleStatus(email || undefined);
      setStatus(s);
      if (s.connected && email) {
        setLoading(true);
        const data = await api.calendarEvents(email);
        setEvents(data.items || []);
      }
    } catch (e) {
      console.warn("[calendar] refresh:", e?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const connect = async () => {
    try {
      const { authorization_url } = await api.googleLogin();
      window.location.href = authorization_url;
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Google credentials not configured on server");
    }
  };

  const disconnect = async () => {
    if (!email) return;
    await api.googleDisconnect(email);
    localStorage.removeItem("gcal_email");
    setEmail("");
    setEvents([]);
    setStatus({ ...status, connected: false });
    toast.success("Disconnected");
  };

  return (
    <div data-testid="calendar-page" className="slide-up">
      <div className="mb-5 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.25em] opacity-60 mb-1">
            <CalIcon className="inline mr-1" size={12} /> Schedule
          </div>
          <h1 className="font-display text-4xl md:text-5xl">Calendar</h1>
          <p className="text-sm opacity-70 mt-1">
            {status.connected ? `Synced with ${email}` : "Connect Google Calendar to push tasks & see events"}
          </p>
        </div>
        <div className="flex gap-2">
          <button data-testid="calendar-refresh-btn" onClick={refresh} className="btn-pill btn-ghost inline-flex items-center gap-1">
            <RefreshCw size={14} strokeWidth={3} /> Refresh
          </button>
          {status.connected ? (
            <button data-testid="gcal-disconnect-btn" onClick={disconnect} className="btn-pill btn-ghost inline-flex items-center gap-1">
              <LogOut size={14} strokeWidth={3} /> Disconnect
            </button>
          ) : (
            <button data-testid="gcal-connect-btn" onClick={connect} className="btn-pill btn-pink inline-flex items-center gap-1">
              <Plug size={14} strokeWidth={3} /> Connect Google
            </button>
          )}
        </div>
      </div>

      {!status.configured && (
        <div className="glass p-5 mb-4" data-testid="calendar-not-configured">
          <p className="text-sm font-semibold">
            Google Calendar isn't configured yet. Ask the dev to add{" "}
            <code className="px-1.5 py-0.5 rounded bg-white/10">GOOGLE_CLIENT_ID</code>,{" "}
            <code className="px-1.5 py-0.5 rounded bg-white/10">GOOGLE_CLIENT_SECRET</code>,{" "}
            <code className="px-1.5 py-0.5 rounded bg-white/10">BACKEND_PUBLIC_URL</code>, and{" "}
            <code className="px-1.5 py-0.5 rounded bg-white/10">FRONTEND_PUBLIC_URL</code> to <code>backend/.env</code>.
          </p>
        </div>
      )}

      {status.connected && (
        <div className="space-y-2">
          {loading && <div className="opacity-70 text-sm">Loading…</div>}
          {!loading && events.length === 0 && (
            <div data-testid="events-empty" className="glass p-8 text-center opacity-70">No upcoming events.</div>
          )}
          {events.map((e) => {
            const start = e.start?.dateTime || e.start?.date;
            const startStr = start ? new Date(start).toLocaleString() : "—";
            return (
              <div key={e.id} data-testid={`event-${e.id}`} className="glass p-4 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#FF2D92,#B026FF)" }}
                >
                  <Clock size={16} strokeWidth={2.5} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-base leading-tight truncate">{e.summary || "(no title)"}</div>
                  <div className="text-xs opacity-70">{startStr}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
