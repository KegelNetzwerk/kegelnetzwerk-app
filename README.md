# KegelNetzwerk App

Cross-platform mobile app (Android, iOS, Web) for German bowling clubs — companion to the [KegelNetzwerk webservice](../kegelnetzwerk2).

## Purpose

The app's primary purpose is **result entry during bowling sessions**. Members tap game parts to record who scored what, with results syncing automatically to the webservice when online. A secondary mode allows notification-only usage for members who don't enter results.

## Tech Stack

- **Expo** (managed workflow) with **Expo Router v3** — file-based routing
- **TypeScript** throughout
- **NativeWind v4** — Tailwind CSS for React Native
- **TanStack Query v5** — server state management
- **AsyncStorage** — offline-first data persistence
- **expo-secure-store** — credentials and Bearer token
- **expo-notifications** — local + push notifications
- **expo-background-fetch** + **expo-task-manager** — background polling (15 min)
- **@react-native-community/netinfo** — online/offline detection for auto-sync

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the API URL in `.env`:
   ```
   EXPO_PUBLIC_API_URL=https://your-webservice.com
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```
   Then press `a` for Android emulator, `i` for iOS simulator, or `w` for browser.

4. For a device build:
   ```bash
   npx expo start --tunnel
   ```

## Project Structure

```
app/
  _layout.tsx          Root layout — providers, auto-login, notification setup
  (auth)/
    login.tsx          Club picker + nickname/password login
  (app)/
    main.tsx           Mode selector (result entry / notifications / settings)
    working.tsx        Game tabs + auto-sized part buttons
    selectwho.tsx      Member/guest selection for a scoring part
    overview.tsx       Live session standings
    log.tsx            Chronological entry log with delete
    notifications.tsx  Notification toggles + recent log
    settings.tsx       Photo upload, session management, sign out

src/
  api/          HTTP clients (auth, members, games, results, events, activity, photo)
  storage/      AsyncStorage + SecureStore helpers
  models/       TypeScript interfaces (Member, GameOrPenalty, Result, Guest)
  hooks/        useAuth, useLocalData, useSyncQueue, useNetworkSync
  notifications/ Permission setup, local scheduler, background task, tap handler
  components/   PartButton, MemberButton, ValueDialog, SyncStatus
```

## Key Flows

### Result Entry
1. Login → Main → "Ergebnisse eingeben"
2. Select game tab → tap a part button → SelectWho screen
3. Tap member (or guest) — result recorded locally and queued for sync
4. If online: syncs immediately; if offline: queued and flushed on reconnect

### Notifications
- **Event deadline reminders** — scheduled locally 24 h before the cancel deadline
- **New news** — pushed from server on creation; also polled every 15 min in background
- **New votes** — same as news
- Each type can be toggled individually in the Notifications screen

## Environment

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_URL` | Base URL of the KegelNetzwerk webservice |

## Building for Production

```bash
npx eas build --platform android
npx eas build --platform ios
```
