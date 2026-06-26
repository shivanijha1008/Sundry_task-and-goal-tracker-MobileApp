import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

const DISMISS_KEY = "sundry.installPromoDismissed";

export function InstallPromo() {
  const [deferred, setDeferred] = useState(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Hide if user already dismissed or app already installed
    const dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    if (dismissed) return;
    if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }
    if (navigator.standalone) return; // iOS Safari

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferred(e);
      setVisible(true);
    };
    const onInstalled = () => {
      setInstalled(true);
      setVisible(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice?.outcome === "accepted") {
      setVisible(false);
    } else {
      // Soft-dismiss without permanently dismissing
      setVisible(false);
    }
    setDeferred(null);
  };

  if (!visible || installed) return null;

  return (
    <div
      data-testid="install-promo"
      className="fixed left-1/2 -translate-x-1/2 z-50"
      style={{
        bottom: "calc(96px + env(safe-area-inset-bottom, 0))",
        width: "min(420px, calc(100vw - 24px))",
      }}
    >
      <div
        className="glass-hi p-3 flex items-center gap-3 slide-up"
        style={{ borderRadius: 18, boxShadow: "0 20px 50px rgba(0,0,0,0.55)" }}
      >
        <img
          src="/logo-mark.png"
          alt=""
          className="w-10 h-10 rounded-xl"
          style={{ boxShadow: "0 4px 14px rgba(255,45,146,0.35)" }}
        />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm">Add Sundry to your home screen</div>
          <div className="text-[11px] opacity-65">Open like an app · works offline</div>
        </div>
        <button
          data-testid="install-promo-install-btn"
          onClick={install}
          className="btn-pill btn-pink inline-flex items-center gap-1 px-3 text-xs"
        >
          <Download size={12} strokeWidth={3} /> Install
        </button>
        <button
          data-testid="install-promo-dismiss-btn"
          onClick={dismiss}
          aria-label="Dismiss"
          className="w-8 h-8 rounded-full glass flex items-center justify-center"
        >
          <X size={12} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
