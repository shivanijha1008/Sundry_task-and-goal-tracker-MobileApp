# Sundry — Privacy Policy

_Last updated: 2026-06-26_

**Sundry** is a personal daily planner ("we", "the app"). This policy describes what data we collect and how we use it.

## Data we collect

- **What you type into the app** — tasks, shopping items, me-time rituals, diary entries, monthly-goal items, timestamps of completions. Stored locally on your device and (if you sign in) synced to our servers.
- **Optional Google sign-in** — if you choose to sign in, we receive your Google email address, display name, and profile photo URL from Google. We never see your Google password.
- **Diagnostic logs** — if the app crashes, anonymized crash logs (no personal content) may be recorded by the app store (Apple, Google) for our review.

We do **not** collect:
- Advertising identifiers
- Location
- Contacts
- Microphone recordings (voice dictation is transcribed by your device's built-in speech engine and never sent to us)
- Any third-party analytics

## How your data is stored

- **Locally**: `localStorage` in the WebView + Capacitor `@capacitor/preferences` on device.
- **Cloud** (only if you sign in): MongoDB Atlas cluster located in the region of our backend host. Encrypted at rest, TLS in transit.

## Sharing

We do **not** share, sell, or rent your data. Emergent-managed Google Auth uses Google's OAuth 2.0 — Google's own privacy policy applies to the sign-in flow.

## Notifications

Local task reminders are scheduled and delivered by your device. No content is sent to a remote push service.

## Your rights

- **Export**: use the .ics export inside Monthly Goals to take your data with you.
- **Delete**: sign out and clear app data (system Settings → Apps → Sundry → Clear Storage) to wipe all local + cached data. To delete your cloud account, email us (below) — we'll purge within 30 days.

## Children

Sundry is not directed at children under 13 (COPPA) or under 16 (GDPR). If you believe we have inadvertently collected data from a child, contact us for immediate deletion.

## Changes

We may update this policy. Material changes will be reflected in the app on next launch.

## Contact

- Email: `hello@sundry.app` *(replace with your real contact before publishing)*
