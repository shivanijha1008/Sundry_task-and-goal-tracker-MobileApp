# Sundry — Mobile App (iOS & Android via Capacitor)

Sundry is now a native mobile app that wraps the existing React web app inside a
Capacitor container. All web code, features, and data flows continue to work
unchanged. On top, native APIs are used automatically when running on device:

| Native feature       | Web fallback                           |
| -------------------- | -------------------------------------- |
| Haptic taps          | no-op                                  |
| Local notifications  | no-op (in-app only)                    |
| Native share sheet   | Web Share API → download               |
| Status-bar theming   | CSS `@media (display-mode: standalone)`|
| Splash screen        | manifest.json PWA splash               |
| Offline shell        | service-worker.js precache             |

**App identifier:** `app.sundry.mobile`
**Display name:** `Sundry`
**Minimum Android SDK:** 22 (Lollipop) — Capacitor 7 default
**Minimum iOS:** 14.0

---

## 1. Project layout

```
/app/frontend/
├── capacitor.config.ts     # native app config (single source of truth)
├── build/                  # production web assets (bundled into APK/IPA)
├── android/                # ✅ scaffolded — open in Android Studio
├── ios/                    # ✅ scaffolded — open in Xcode (macOS)
├── assets/                 # source icons/splash for @capacitor/assets
└── src/lib/native.js       # thin JS bridge → falls back to web when non-native
```

## 2. Local development loop

You'll need on your dev machine:

- Node 20+, Yarn
- **Android**: Android Studio + Android SDK (API 34+) + Java 17
- **iOS**: Xcode 15+ on macOS + CocoaPods (`sudo gem install cocoapods`)

```bash
cd /app/frontend

# 1) rebuild the web bundle
yarn build

# 2) copy assets + native config into android/ and ios/
npx cap sync

# 3) open native IDE
npx cap open android   # opens Android Studio
npx cap open ios       # opens Xcode (macOS only)
```

Then hit **Run ▶** in the IDE to install on a connected device or emulator.

### Live-reload against the preview backend (optional)
Uncomment the `server.url` block in `capacitor.config.ts`:

```ts
server: {
  url: "https://monthly-goals-sprint.preview.emergentagent.com",
  cleartext: false,
},
```

Then `npx cap sync android` and re-run. The device will load the live web app
instead of the bundled `build/` — useful for iterating on UI without rebuilding.

## 3. Regenerating icons + splash

Source images live in `/app/frontend/assets/`:
- `icon.png` (1024×1024, opaque)
- `icon-foreground.png` (1024×1024)
- `icon-background.png` (1024×1024 solid `#1B0A2A`)
- `splash.png` (2732×2732 centered logo on `#1B0A2A`)

To regenerate all iOS/Android/PWA icons after tweaking the source:

```bash
cd /app/frontend
npx @capacitor/assets generate \
  --iconBackgroundColor "#1B0A2A" \
  --iconBackgroundColorDark "#1B0A2A" \
  --splashBackgroundColor "#1B0A2A" \
  --splashBackgroundColorDark "#1B0A2A"
```

## 4. Building release binaries

### Android — signed release APK / AAB

```bash
cd /app/frontend/android

# Generate keystore ONCE (keep this safe — you'll need it for every future release)
keytool -genkey -v -keystore sundry-release.keystore \
  -alias sundry -keyalg RSA -keysize 2048 -validity 10000

# Reference it in android/gradle.properties (add these lines):
#   MYAPP_UPLOAD_STORE_FILE=sundry-release.keystore
#   MYAPP_UPLOAD_KEY_ALIAS=sundry
#   MYAPP_UPLOAD_STORE_PASSWORD=<keystore-password>
#   MYAPP_UPLOAD_KEY_PASSWORD=<key-password>

# Then in Android Studio: Build → Generate Signed Bundle/APK → Android App Bundle
# Or from CLI:
./gradlew bundleRelease   # → android/app/build/outputs/bundle/release/app-release.aab
./gradlew assembleRelease # → android/app/build/outputs/apk/release/app-release.apk
```

### iOS — TestFlight / App Store archive (macOS only)

```bash
cd /app/frontend/ios/App
pod install
open App.xcworkspace
```

In Xcode:
1. Signing & Capabilities → set your Team + unique bundle identifier
2. Add **Push Notifications** capability (already prepared in Info.plist)
3. Product → **Archive**
4. Distribute → **App Store Connect** (or **Ad Hoc** for direct install)

## 5. Native features wired

| Interaction                          | Native effect                            |
| ------------------------------------ | ---------------------------------------- |
| Tap a bottom-nav tab                 | `Haptics.selectionStart/Changed/End`     |
| Check-off a task                     | `Haptics.notification(Success)`          |
| Uncheck a task                       | `Haptics.impact(Light)`                  |
| Check-off a monthly goal             | `Haptics.notification(Success)`          |
| Add a task with `due_time` today     | Schedules a local notification for HH:MM |
| Complete a task with pending reminder| Cancels the scheduled notification       |
| Delete a task                        | Cancels its scheduled notification       |
| Day/Night mode toggle                | Updates iOS/Android status-bar tint      |
| Share streak card / recap card       | Native iOS/Android share sheet           |
| App boot                             | Hides native splash after ~400ms         |

All wired via `/app/frontend/src/lib/native.js` — everything degrades gracefully
to the web (`Capacitor.isNativePlatform()` guard, then no-op or Web API).

## 6. Play Store / App Store metadata checklist

- [ ] `applicationId` set: `app.sundry.mobile` (Android — in `android/app/build.gradle`)
- [ ] `PRODUCT_BUNDLE_IDENTIFIER` set: `app.sundry.mobile` (iOS — in Xcode)
- [ ] App name: **Sundry**
- [ ] Short description: *"All your little things — tasks, shopping, me-time, diary & monthly intentions."*
- [ ] Long description: draft in `/app/frontend/assets/store-listing.md` (create as needed)
- [ ] Screenshots (see § 7)
- [ ] Privacy policy URL: *required* — host a static page (e.g. `sundry.app/privacy`)
- [ ] Content rating: **Everyone** (no user-generated public content)
- [ ] Permissions declared (Android):
  - `INTERNET` (backend calls)
  - `POST_NOTIFICATIONS` (reminders)
  - `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM` (task-time reminders)
  - `VIBRATE` (haptics)
  - `RECEIVE_BOOT_COMPLETED` (re-schedule reminders after reboot)

## 7. Store screenshots — recommended sizes

Take these from **iPhone 14 Pro (390×844)** and **Pixel 6 (412×892)** emulators.

| Screen         | What it shows                                              |
| -------------- | ---------------------------------------------------------- |
| 01_home        | Tasks tab with quote banner + streak + a few tasks         |
| 02_shopping    | Shopping list with a couple items                          |
| 03_metime      | Me Time rituals + breathing timer running                  |
| 04_diary       | Diary entry with mood                                      |
| 05_goals_tiles | Monthly Goals — 5 tiles with progress bars                 |
| 06_recap_card  | Recap modal open, canvas visible                           |
| 07_compare     | Last vs This month side-by-side                            |

Store them in `/app/frontend/assets/store-screenshots/ios/` and `.../android/`.

## 8. Post-install smoke test

1. Install APK / TestFlight build on device
2. Grant notification permission when prompted (Android 13+)
3. Add a task with a time 2 minutes in the future → wait → notification should
   fire even if the app is backgrounded
4. Toggle a task complete → feel the success haptic + notification cancelled
5. Switch tabs → feel the light selection haptic
6. Toggle day/night → status bar changes tint
7. Open Recap modal → tap Share → native share sheet appears
