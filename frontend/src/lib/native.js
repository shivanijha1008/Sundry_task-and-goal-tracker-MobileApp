// Native bridge — safe to import from anywhere (web or Capacitor).
// When running in a Capacitor container we use native plugins.
// On the web we transparently fall back to Web APIs / no-ops.

import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { LocalNotifications } from "@capacitor/local-notifications";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Share } from "@capacitor/share";
import { SplashScreen } from "@capacitor/splash-screen";
import { App as CapApp } from "@capacitor/app";

export const isNative = () => Capacitor.isNativePlatform();
export const platform = () => Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

// ---------------- Haptics ----------------
export async function hapticTap() {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* noop */
  }
}

export async function hapticSelect() {
  if (!isNative()) return;
  try {
    await Haptics.selectionStart();
    await Haptics.selectionChanged();
    await Haptics.selectionEnd();
  } catch {
    /* noop */
  }
}

export async function hapticSuccess() {
  if (!isNative()) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    /* noop */
  }
}

// ---------------- Local Notifications ----------------
let _notifPermGranted = false;

export async function ensureNotifPermission() {
  if (!isNative()) return false;
  if (_notifPermGranted) return true;
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === "granted") {
      _notifPermGranted = true;
      return true;
    }
    const req = await LocalNotifications.requestPermissions();
    _notifPermGranted = req.display === "granted";
    return _notifPermGranted;
  } catch {
    return false;
  }
}

/**
 * Schedule a local notification.
 * @param {number} id - stable numeric id (e.g. hash of task id)
 * @param {string} title
 * @param {string} body
 * @param {Date} at - when to fire
 */
export async function scheduleNotification(id, title, body, at) {
  if (!isNative()) return false;
  const ok = await ensureNotifPermission();
  if (!ok) return false;
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title,
          body,
          schedule: { at, allowWhileIdle: true },
          smallIcon: "ic_notification",
          extra: { source: "sundry" },
        },
      ],
    });
    return true;
  } catch (e) {
    console.warn("[native] scheduleNotification failed:", e?.message);
    return false;
  }
}

export async function cancelNotification(id) {
  if (!isNative()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id }] });
  } catch {
    /* noop */
  }
}

// ---------------- Share ----------------
export async function shareNative({ title, text, url, files }) {
  if (isNative()) {
    try {
      await Share.share({ title, text, url });
      return true;
    } catch {
      return false;
    }
  }
  // Web fallback
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      const payload = { title, text, url };
      if (files && navigator.canShare?.({ files })) payload.files = files;
      await navigator.share(payload);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

// ---------------- Status Bar ----------------
export async function applyStatusBarTheme(dayMode) {
  if (!isNative()) return;
  try {
    await StatusBar.setStyle({ style: dayMode ? Style.Light : Style.Dark });
    if (platform() === "android") {
      await StatusBar.setBackgroundColor({
        color: dayMode ? "#FFF3F7" : "#1B0A2A",
      });
    }
  } catch {
    /* noop */
  }
}

// ---------------- App lifecycle ----------------
export async function hideSplash() {
  if (!isNative()) return;
  try {
    await SplashScreen.hide();
  } catch {
    /* noop */
  }
}

export function onAppResume(handler) {
  if (!isNative()) {
    // Web fallback via visibility API
    if (typeof document !== "undefined") {
      const cb = () => {
        if (document.visibilityState === "visible") handler();
      };
      document.addEventListener("visibilitychange", cb);
      return () => document.removeEventListener("visibilitychange", cb);
    }
    return () => {};
  }
  const sub = CapApp.addListener("appStateChange", (s) => {
    if (s.isActive) handler();
  });
  return () => sub.then((h) => h.remove()).catch(() => {});
}

// Stable numeric id from any string (for notif ids)
export function idFromString(s) {
  let h = 0;
  const str = String(s || "");
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  // Local Notifications requires positive 32-bit int
  return Math.abs(h) || 1;
}
