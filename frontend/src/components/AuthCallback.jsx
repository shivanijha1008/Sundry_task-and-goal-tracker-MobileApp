import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * AuthCallback
 * Renders when window.location.hash contains "session_id=".
 * - Reads session_id synchronously (no race conditions)
 * - POSTs to /api/auth/session (backend sets httpOnly cookie + returns user)
 * - Cleans the hash, sets user in AuthContext, navigates to /
 */
export function AuthCallback() {
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const sessionId = params.get("session_id");

    if (!sessionId) {
      window.history.replaceState({}, "", window.location.pathname);
      window.location.replace("/");
      return;
    }

    axios
      .post(`${API}/auth/session`, { session_id: sessionId }, { withCredentials: true })
      .then((r) => {
        setUser(r.data);
        // Clean the hash and reload to the main app
        window.history.replaceState({}, "", window.location.pathname);
        window.location.reload();
      })
      .catch((err) => {
        console.error("[auth] session exchange failed:", err?.message);
        setError("We couldn't complete sign-in. Please try again.");
      });
  }, [setUser]);

  return (
    <div
      data-testid="auth-callback"
      className="min-h-screen flex items-center justify-center px-6"
    >
      <div className="glass-hi p-8 text-center max-w-sm w-full slide-up">
        <div className="text-3xl mb-2" aria-hidden="true">
          ✨
        </div>
        <div className="font-display text-2xl gradient-text-pink mb-2">
          {error ? "Sign-in failed" : "Signing you in…"}
        </div>
        <p className="text-sm opacity-70">
          {error || "One sec while we set everything up."}
        </p>
        {error && (
          <button
            data-testid="auth-callback-retry-btn"
            onClick={() => {
              window.history.replaceState({}, "", "/");
              window.location.replace("/");
            }}
            className="btn-pill btn-pink mt-4"
          >
            Back to Sundry
          </button>
        )}
      </div>
    </div>
  );
}
