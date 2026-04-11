# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Locations

- **App** (this project): `E:\2026_Projects\kegelnetzwerk-app`
- **Webservice**: `E:\2026_Projects\kegelnetzwerk-web`

## Project Overview

KegelNetzwerk App is a cross-platform Expo/React Native app (Android, iOS, Web) for German bowling clubs. Its primary purpose is **result entry during bowling sessions** — members tap game parts, select who scored, and results sync automatically to the webservice. It also delivers push notifications for events, news, and votes.

## Architecture

**Routing**: Expo Router v3 (file-based). Two route groups:
- `app/(auth)/` — unauthenticated screens (login)
- `app/(app)/` — authenticated screens; redirects to login if no user

**Request flow:**
1. `app/_layout.tsx` — attempts auto-login from SecureStore on startup, sets up notification handlers, wraps app in `AuthContext` + `QueryClientProvider`
2. `(auth)/_layout.tsx` — redirects to `/(app)/main` if already logged in
3. `(app)/_layout.tsx` — redirects to `/(auth)/login` if no user

**State management:**
- Auth state: `AuthContext` in `src/hooks/useAuth.ts`
- Server data: TanStack Query v5 (members, games)
- Local session data: AsyncStorage via `src/storage/`
- Credentials: `expo-secure-store` via `src/storage/credentials.ts`

**Key directories:**
- `src/api/` — typed fetch wrappers; all use `apiFetch()` from `client.ts` which injects the Bearer token automatically
- `src/storage/` — `credentials.ts` (SecureStore), `cache.ts` (member/game cache), `resultPackage.ts` (local results), `syncQueue.ts` (pending upload queue), `notificationState.ts`
- `src/notifications/` — permission setup, local event-deadline scheduler, background fetch task, notification tap handler
- `src/hooks/` — `useLocalData` (offline-first data), `useSyncQueue` (queue + flush), `useNetworkSync` (auto-flush on reconnect)
- `src/components/` — `PartButton`, `MemberButton`, `ValueDialog`, `SyncStatus`
- `constants/api.ts` — exports `BASE_URL` from `EXPO_PUBLIC_API_URL`

## Webservice API

Base URL configured via `EXPO_PUBLIC_API_URL` in `.env`. All authenticated endpoints use `Authorization: Bearer <token>`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/app/clubs/list` | Public list of clubs for login screen |
| POST | `/api/app/login` | Login; returns `{ memberId, clubId, nickname, role, token }` |
| GET | `/api/app/members` | Club members `{ id, nickname, pic }[]` |
| GET | `/api/games` | Games and penalties with parts |
| POST | `/api/app/upload-results` | Upload result entries |
| POST | `/api/app/push-token` | Register Expo push token |
| GET | `/api/app/activity?since=` | New news/vote counts since ISO timestamp |
| GET | `/api/app/events` | Upcoming events with cancel deadlines |
| POST | `/api/app/upload-photo` | Multipart photo upload |

## Language

All English-language strings (i18n, code comments, documentation) must use **American English** (e.g. "color" not "colour", "center" not "centre").

## Styling

NativeWind v4 — use `className` on all React Native primitives. The `nativewind-env.d.ts` file provides the required TypeScript augmentation. Primary color is `#005982` (configured in `tailwind.config.js` as `primary`).

## Buttons Auto-Sizing

Part buttons and member buttons fill the available screen width automatically:
```ts
const COLUMNS = 3;
const cellSize = Math.floor((width - 32 - COLUMNS * BUTTON_MARGIN) / COLUMNS);
// Then capped at 160px in the component
```
Do not add fixed sizes — always pass the calculated `size` prop.

## Offline / Sync

- Results are always written to `resultPackage.ts` first (local source of truth)
- Unsynced results are also written to `syncQueue.ts`
- `useSyncQueue.flush()` uploads the queue and marks entries as synced
- `useNetworkSync` calls `flush()` automatically when the device comes back online
- `SyncStatus` component displays the pending count and online state

## Once-Parts

Parts with `once: true` may only be recorded once per member per session. This is tracked in local React state in `selectwho.tsx` (resets when the screen unmounts). The member button is visually disabled after one entry.

## Notifications

Three independently toggleable types (stored in `notificationState.ts`):
- `events` — local scheduled notifications 24 h before cancel deadline
- `news` — pushed from server; also polled via background fetch
- `votes` — same as news

Background fetch runs every 15 min via `expo-background-fetch` + `expo-task-manager`. The task calls `GET /api/app/activity?since=<lastChecked>` and schedules local notifications if new items are found.

## Running

```bash
npx expo start          # development server
npx expo start --tunnel # for physical device testing
```

No build step, no Composer, no native code to compile in managed workflow.

## React Rules of Hooks

All hook calls (`useState`, `useRef`, `useMemo`, `useEffect`, `useWindowDimensions`, `useSafeAreaInsets`, etc.) **must appear before any early return**. This applies even to hooks that logically "belong" to the post-guard code. In screens that have a role guard (e.g. `if (user?.role !== 'ADMIN') return <Redirect />`), declare every hook above the guard, then perform non-hook computations below it.

## Unit Testing

Only `src/utils/` contains pure, runtime-free logic that can be unit-tested with Jest. All other directories (`src/hooks/`, `src/components/`, `src/api/`, `src/storage/`, `src/notifications/`, `app/`) require the Expo/React Native runtime and cannot be tested in the Jest environment.

- Test files live in `src/__tests__/` and mirror the `src/utils/` structure.
- `src/utils/colorUtils.ts` is fully covered (100% statements/branches/functions/lines). Maintain this when adding new utility functions — write tests alongside the implementation.
- When adding a new pure utility to `src/utils/`, add it to an existing test file or create a new one in `src/__tests__/`.

## Code Quality (SonarQube)

The SonarQube Cloud quality gate is enforced on every push. Key rule to watch:

- **S6440** (Rules of Hooks) — hooks called after an early return are flagged as bugs. See "React Rules of Hooks" section above.

## Pre-commit Hook (SonarQube Secrets)

A global SonarQube Secrets CLI hook (`~/.sonar/sonarqube-cli/hooks/pre-commit`) scans every staged file for hardcoded secrets. The hook has no exclusion mechanism. If i18n or other files containing password-related UI strings are staged, expect false positives that block the commit.

## Debugging Production Crashes (Android)

When the production APK crashes on launch, use `adb logcat` with a proper filter. **Do not** use `findstr de.foellix` — the real exception stack trace lines do not contain the package name and will be filtered out entirely.

Clear the log first, then capture only errors:

```bash
adb logcat -c                        # clear existing log
adb logcat AndroidRuntime:E *:S      # show only fatal exceptions
```

Alternatively, to also include lines mentioning the package name:

```bash
adb logcat | findstr /i "FATAL AndroidRuntime kegelnetzwerk"
```

The crash will appear as a `FATAL EXCEPTION` block from `AndroidRuntime`, showing the exception type, message, and full Java/native stack trace.
