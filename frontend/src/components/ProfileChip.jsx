import { useState } from "react";
import { LogIn, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export function ProfileChip() {
  const { user, loading, login, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div
        data-testid="profile-chip-loading"
        className="glass w-10 h-10 rounded-full flex items-center justify-center"
        aria-label="Loading auth"
      >
        <span className="sr-only">Loading</span>
        <span className="opacity-60 animate-pulse">…</span>
      </div>
    );
  }

  if (!user) {
    return (
      <button
        data-testid="login-btn"
        onClick={login}
        className="btn-pill btn-ghost inline-flex items-center gap-1.5 text-xs"
        title="Sign in with Google for cloud sync"
      >
        <LogIn size={13} strokeWidth={3} />
        Sign in
      </button>
    );
  }

  const initial = (user.name || user.email || "?").trim().charAt(0).toUpperCase();
  const firstName = (user.name || user.email || "you").split(" ")[0];

  return (
    <div className="relative">
      <button
        data-testid="profile-chip"
        onClick={() => setOpen((o) => !o)}
        className="glass inline-flex items-center gap-2 pl-1 pr-3 h-10 rounded-full"
        aria-haspopup="menu"
        aria-expanded={open}
        title={user.email || ""}
      >
        {user.picture ? (
          <img
            src={user.picture}
            alt=""
            referrerPolicy="no-referrer"
            data-testid="profile-avatar"
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div
            data-testid="profile-avatar-initial"
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{
              background: "linear-gradient(135deg, #FF2D92, #B026FF)",
              color: "#fff",
            }}
          >
            {initial}
          </div>
        )}
        <span className="text-xs font-bold uppercase tracking-wider max-w-[80px] truncate">
          {firstName}
        </span>
      </button>

      {open && (
        <div
          data-testid="profile-menu"
          role="menu"
          className="glass-hi absolute right-0 mt-2 w-56 p-3 z-50 slide-up"
          style={{ borderRadius: 16 }}
        >
          <div className="px-2 pb-2 mb-2 border-b border-white/10 flex items-center gap-2">
            <UserIcon size={13} strokeWidth={2.5} className="opacity-60" />
            <div className="min-w-0">
              <div className="text-sm font-bold truncate">{user.name || "Signed in"}</div>
              <div className="text-[11px] opacity-60 truncate">{user.email}</div>
            </div>
          </div>
          <button
            data-testid="logout-btn"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="w-full btn-pill btn-ghost inline-flex items-center justify-center gap-1.5 text-xs"
          >
            <LogOut size={13} strokeWidth={3} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
