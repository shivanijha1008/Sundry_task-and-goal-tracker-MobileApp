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
