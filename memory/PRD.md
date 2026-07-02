# Daily Offline Task Scheduler with Timer — PRD

## Problem Statement
Daily offline task scheduler with timer

## Iteration 2 (Feb 2026)
User uploaded a reference design (dark glass/glow, magenta-purple gradient, pill buttons, mobile-style bottom nav) and requested:
1. Google Calendar OAuth + auto-sync
2. Shopping list
3. Me Time (editable rituals + guided breather)
4. Motivational quote of the day (ZenQuotes free public API, backend-proxied to bypass CORS)
5. Share lists to messaging apps (WhatsApp/Telegram/SMS/Email/Native share)
6. Mobile app + local export (routed to support agent)

## Architecture
- Backend: FastAPI + MongoDB + google-auth, google-api-python-client, httpx
  - /api/tasks*, /api/sessions, /api/stats (existing)
  - /api/shopping (CRUD), /api/me-time (CRUD + auto-seed 5 defaults)
  - /api/quote/today (proxies ZenQuotes, 24h server cache, fallback if upstream fails)
  - /api/oauth/calendar/login + /callback, /api/google/status, /api/calendar/events, /api/calendar/push, /api/google/disconnect
- Frontend: React 19, framer-motion (Reorder), sonner (toasts), 5-tab bottom nav
  - Hooks: useTasks, useShopping, useMeTime, useDailyQuote (all with localStorage cache)
  - Pages: Tasks (with Quote banner + stats), Shopping, MeTime (with Breather overlay), Timer, Calendar

## Visual System (rebuilt from reference photo)
- Dark gradient background (deep purple → magenta → near-black radial)
- Glassmorphism cards (backdrop-blur 18-22px, white@7% bg)
- Pill buttons with pink→purple gradient glow
- Warm gradient text (yellow → orange → pink)
- Mobile-style fixed bottom nav with 5 tabs

## Implemented
- All iteration 1 features
- Shopping list with offline cache + clear bought
- Me Time editable rituals + guided breather (Inhale/Hold/Exhale visualization)
- Motivational quote banner with daily local cache
- Share modal: WhatsApp, Telegram, SMS, Email, Native share, Copy
- Google Calendar OAuth (full code; activates once GOOGLE_CLIENT_ID/SECRET/BACKEND_PUBLIC_URL/FRONTEND_PUBLIC_URL are added)
- Bottom nav navigation
- Bug fixes: prop-wiring for Shopping/MeTime; pulse pointer-events for breather close

## Pending (needs user action)
- User must add to /app/backend/.env to enable Google Calendar:
  GOOGLE_CLIENT_ID=...
  GOOGLE_CLIENT_SECRET=...
  BACKEND_PUBLIC_URL=https://offline-planner-9.preview.emergentagent.com
  FRONTEND_PUBLIC_URL=https://offline-planner-9.preview.emergentagent.com
- Setup steps: Google Cloud Console → enable Calendar API → OAuth consent → create OAuth client with redirect URI {BACKEND_PUBLIC_URL}/api/oauth/calendar/callback

## Backlog
- P1: Breather phase/countdown testid placement polish; Me Time inline edit input testid
- P1: Recurring tasks auto-reset at midnight
- P2: Browser Notification API for background timer
- P2: CSV/JSON export, keyboard shortcuts

## Iteration 5 (Feb 2026)
- **Google Calendar removed** per user request (backend endpoints kept but UI no longer calls them; Calendar tab gone)
- **Streak badge** — flame icon + day counter; localStorage `scheduler.streak.v1`; bumps on task completion; auto-breaks if >1 day gap
- **Midnight recurring reset** — once per calendar day, recurring tasks completed=true get reset to completed=false, elapsed=0; idempotency via `scheduler.lastResetDate`
- **Smart suggestions** — 12-suggestion bank with time-of-day filters; renders 4 chips above task list; one tap auto-creates task with title + duration + timer mode

Bottom nav now: Tasks · Shopping · Me Time (3 tabs)


## Iteration 9 (Jun 26, 2026) — Sundry Rebrand
App renamed **Lumora → Sundry** ("All your little things").

### Phase 1 — Monthly Goals tab ✅
- 5th bottom-nav tab `nav-goals-btn` (Tasks · Shop · Me Time · Diary · **Goals**)
- 5 collapsible lists: Goals for the month, Skills to be learned, Books to be read, Movies/Series to watch, Places to be explored
- Each list: add / inline-edit / check-off / delete; counts (`X of Y done`)
- localStorage cache + MongoDB sync (`/api/monthly-goals` CRUD with `list_type` validation)
- Optimistic add reconciles temp-UUID → server-id on response (bug fix from iter 8)
- Files: `hooks/useMonthlyGoals.js`, `pages/MonthlyGoalsPage.jsx`, `lib/api.js`, `components/BottomNav.jsx` (now 5 tabs)

### Phase 2 — Speech-to-text ✅
- Web Speech API wrapper hook `useSpeechRecognition` with cross-browser detection
- `<MicButton />` component — pulse animation + glow while listening, fallback toast on Firefox/unsupported
- Wired into: task title, task description, shopping name, me-time title, diary text, search input, all 5 monthly-goals add inputs, monthly-goal inline-edit input
- Files: `hooks/useSpeechRecognition.js`, `components/MicButton.jsx`, plus inputs across `TaskFormModal.jsx`, `ShoppingPage.jsx`, `MeTimePage.jsx`, `DiaryPage.jsx`, `App.js`

### Phase 3 — Rename + Logo (Gemini Nano Banana) ✅
- 5 names proposed (Lumora, Glowdeck, Halo Loop, Petal, Sundry) — user picked **Sundry**
- Logo generated via `gemini-3.1-flash-image-preview` (one-shot script: `/app/scripts/generate_logo.py`)
- Assets in `/app/frontend/public/`: `logo.png` (512), `logo-mark.png`, `favicon-16.png`, `favicon-32.png`, `favicon.ico` (multi-res), `apple-touch-icon.png` (180), `og-image.png` (1200×630)
- HTML: `<title>` = "Sundry — All your little things"; theme-color, manifest.json, og:image, twitter:card
- In-app brand pill: SUNDRY + tiny logo mark next to date label (`data-testid="brand-mark"`)
- Share-card updated to "All your little things." + "sundry.app" + filename `sundry-streak.png`
- localStorage migration: `lumora.dayMode` → `sundry.dayMode`

### Phase 4 — Emergent Google Auth (OPTIONAL) ✅
- Backend: `/api/auth/session` (POST: exchanges session_id via Emergent `/session-data`; upserts user; httpOnly secure samesite=None cookie; 7-day TTL), `/api/auth/me` (GET: cookie OR `Authorization: Bearer` fallback), `/api/auth/logout` (POST: deletes session row + clears cookie)
- MongoDB: `users` (`user_id`, `email`, `name`, `picture`, `created_at`) and `user_sessions` (`user_id`, `session_token`, `expires_at`, `created_at`)
- Frontend: `<AuthProvider>` (skips `/auth/me` when URL hash has `session_id=`), `<AuthCallback>` (useRef one-shot, hash read synchronously during render), `<ProfileChip>` (Sign-in button OR avatar+dropdown+logout)
- Guest mode preserved: all features work without sign-in; sign-in is purely for cloud sync identity

### Test status
- Iteration 9 testing agent: **26/26 backend pass + 100% frontend pass — no issues**
- Regression suites: `backend/tests/test_monthly_goals.py`, `backend/tests/test_auth.py`

## Iteration 10 (Jun 26, 2026) — Goals tab expansion (6 features)

1. **Side-by-side tiles** — Goals page is now a `md:grid-cols-2` tile grid; each tile has its own emoji header, progress bar, add-input with mic, and inline-editable items
2. **Monthly Recap card + PDF** — `<MonthlyRecapModal>` with canvas-rendered 1200×900 share card (completion ring + per-list mini-cards); buttons: PNG download, **PDF** (jsPDF — page 1 card image, page 2+ full text list grouped by list_type), Share (Web Share API native), ICS export
3. **Last vs This month comparison view** — toggle `view-compare-btn` shows `comparison-col-last` and `comparison-col-this` side-by-side with completion %, per-list breakdown, and first 3 items preview
4. **.ics calendar export** — RFC 5545 builder (`/app/frontend/src/lib/icsExport.js`); one all-day VEVENT per goal item dated to the **last day** of the selected month; one-click export button on Goals page header + inside Recap modal
5. **Voice-driven long-form punctuation** — `/app/frontend/src/lib/punctuation.js` applies spoken commands (period/comma/question mark/exclamation point/new line/new paragraph/colon/semicolon/dash/ellipsis/open-close quote/paren) to **every** mic; auto-capitalizes sentence starts and stand-alone "i"; wired into `useSpeechRecognition.onresult` so all mic buttons benefit
6. **PWA install promo + service worker** — `public/service-worker.js` cache-first for static assets (never caches `/api/*`), navigation network-first with cached `/` fallback; `<InstallPromo>` bottom-banner uses `beforeinstallprompt` event; localStorage `sundry.installPromoDismissed` for one-time dismissal

### Data model change
- `MonthlyItem` now carries `month_key` (e.g. `"2026-06"`), defaulting to current month at creation
- One-shot startup migration in `server.py` backfills legacy items
- New endpoint: `GET /api/monthly-goals/months` returns `[{month_key, count}]` sorted desc, current month always included
- `GET /api/monthly-goals?month_key=YYYY-MM` filters by month

### Test status
- Iteration 10 testing agent: **19/19 backend pytest pass, ~98% frontend pass — all 6 features verified end-to-end**
- Punctuation `\n` spacing nit fixed post-test
- Regression test files: `/app/backend/tests/test_monthly_goals.py` (now with TestMonthKey + TestAuthRegression), `/app/backend/tests/test_auth.py`


## Iteration 11 (Jul 2, 2026) — Native mobile app (Capacitor 7)

Sundry is now a real cross-platform native app. The existing React code is wrapped
via Capacitor 7 into iOS + Android shells with full native API access. Zero web
regressions — everything degrades gracefully on the web because every native call
is gated on `Capacitor.isNativePlatform()`.

### What's shipped
1. **Capacitor 7 project scaffold** — `capacitor.config.ts` (appId `app.sundry.mobile`, webDir `build`), `android/` (Android Studio), `ios/` (Xcode) native projects generated in-repo
2. **Native APIs wired via `/app/frontend/src/lib/native.js`** (safe to import anywhere):
   - `hapticTap()` / `hapticSelect()` / `hapticSuccess()` — impact + selection + success
   - `scheduleNotification(id, title, body, at)` + `cancelNotification(id)` — task reminders when `due_time` is set (auto-scheduled on add, auto-cancelled on complete/delete)
   - `applyStatusBarTheme(dayMode)` — light/dark tint + Android backgroundColor
   - `shareNative({title, text, url, files})` — native share sheet with Web Share fallback
   - `hideSplash()` — splash dismiss ~400 ms after mount
   - `onAppResume(cb)` — with `document.visibilitychange` web fallback
3. **Interactions haptified**:
   - Bottom-nav tap → `hapticSelect`
   - Task check-off → `hapticSuccess`; uncheck → `hapticTap`; delete → `cancelNotification`
   - Monthly goal check-off → `hapticSuccess`; uncheck → `hapticTap`
4. **Task reminders (native)** — adding a task with `due_time="HH:MM"` today schedules a `LocalNotifications` for that time. Completing/deleting the task cancels it. Web = silent no-op.
5. **Mobile-first responsive pass** (`/app/frontend/src/index.css` bottom section):
   - Safe-area padding for iOS notch / Android gesture bar
   - 44×44 min tap targets on `≤768px`
   - 16px input font-size to prevent iOS zoom
   - `@media (display-mode: standalone)` — status-bar overlay strip
   - Bottom-nav taps enlarged to 56×52 (verified by testing agent)
6. **Icons + splash generated via `@capacitor/assets`** from `/app/frontend/assets/` (icon, foreground, background, splash). All iOS/Android/PWA sizes produced (13 iOS, 15 Android, 7 PWA assets).
7. **AndroidManifest.xml** declares: `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`, `VIBRATE`, `RECEIVE_BOOT_COMPLETED`, `INTERNET`.
8. **iOS Info.plist** hardened: `UIUserInterfaceStyle=Dark`, `UIStatusBarStyle=LightContent`, `ITSAppUsesNonExemptEncryption=false` (unblocks App Store submission).
9. **Docs**: `/app/mobile/README.md` (full dev + release workflow: cap sync, IDE open, keystore gen, bundleRelease, App Store archive) and `/app/mobile/PRIVACY.md` (draft policy for store listing).

### Test status
- Iteration 11 testing agent: **33/33 backend pytest pass, 100% frontend regression + smoke, zero native/Capacitor console errors on web**
- Bottom-nav mobile tap target: **56×53 px** ✅ (>44 min)
- Service worker still registered post-Capacitor wrap ✅
- Capacitor plugins: `@capacitor/{core,cli,android,ios,haptics,local-notifications,status-bar,share,app,preferences,splash-screen,assets}` @ ^7

### Not done (offloaded to user's local machine)
- Actual `.apk` / `.aab` compilation (needs Android Studio + JDK 17)
- Actual `.ipa` archive (needs macOS + Xcode + CocoaPods)
- Real device install + haptic/notification live testing
- Play Store / App Store metadata submission

All build steps are documented in `/app/mobile/README.md`.


## Iteration 12 (Jul 2, 2026) — Daily Nudge (gentle 8 PM reminder)

Sundry now sends one **on-device** notification per day summarising what's left,
gently prompting you back into the app to plan tomorrow. Zero backend cost — 100%
`LocalNotifications`. Fully configurable, on by default.

### Behaviour
- **Default:** enabled, delivers at **20:00 (8 PM)** local time
- **Copy** is computed live from your data:
  - `1 task and 2 intentions left. Plan tomorrow?` (mixed)
  - `3 tasks still open. Wrap up or roll over to tomorrow?` (tasks-only, plural)
  - `One task left today — one more push? 🌙` (tasks-only, singular)
  - `You did everything today. Legend. ⭐` (perfect day)
  - `Clean slate today ✨ Set an intention for tomorrow?` (empty)
- **Reschedules** debounced (1.8 s) after any task/goal add/complete/delete
- **Reschedules** on app-resume (Capacitor `appStateChange`) with fallback to
  `document.visibilitychange` on web
- If the target time is already past today → next occurrence is tomorrow at that time

### UI
- Gear icon `settings-btn` in the Tasks tab header (between Day-mode and Profile)
- Opens `<SettingsModal>` with:
  - `nudge-toggle` — enable/disable switch (asks native permission on first enable)
  - `nudge-hour-select` — 24 hour options rendered in user's locale ("9:00 AM"/"20:00")
  - `nudge-preview` — live copy preview based on current data
  - `nudge-test-btn` — "Send test nudge in 5s" (native only)
  - `nudge-web-hint` — friendly explainer on web

### Files
- `/app/frontend/src/lib/dailyNudge.js` — prefs (localStorage `sundry.dailyNudge`),
  `computeNudgeBody`, `reschedule`, `cancelDaily`, `rescheduleDebounced`,
  `fireTestNudge`, `DAILY_NUDGE_ID` (`idFromString('sundry.dailyNudge.v1')`)
- `/app/frontend/src/components/SettingsModal.jsx` — the UI
- `/app/frontend/src/App.js` — settings-btn wire-up, rescheduleDebounced on state
  changes, reschedule on app resume

### Web behaviour
Every path is a safe no-op on the web (guarded by `isNative()`). The preview and
saved preferences work on web so users can configure the app before installing
the mobile build — settings persist to `localStorage` and apply once they
install the native app.

### Test status
- Iteration 12 testing agent: **32/33 backend pytest pass (1 known-flaky xdist race
  unchanged since iter 10), 100% frontend acceptance criteria**
- All 6 SettingsModal testids present and interactive
- Preview copy branches verified (singular/plural, perfect-day, empty-slate)
- localStorage persistence verified across close+reopen
- One UX nit fixed post-test (info-toast on hour-change suppressed — now only fires on toggle-ON)

