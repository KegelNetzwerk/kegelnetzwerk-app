# Android Production APK Build

This guide covers building a production APK for direct device installation (sideloading), without publishing to the Play Store.

## Prerequisites

- [Node.js](https://nodejs.org/) (version required by the project)
- [EAS CLI](https://docs.expo.dev/eas-update/introduction/) installed globally: `npm install -g eas-cli`
- An [Expo account](https://expo.dev/) — free tier is sufficient
- Logged into EAS: `eas login`

## One-time Setup

### 1. Configure `eas.json`

Create `eas.json` in the project root if it does not exist:

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "production-apk": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-production-server.example.com"
      }
    }
  }
}
```

> **Note:** The default `production` profile produces an `.aab` (Android App Bundle) intended for the Play Store. The `production-apk` profile above explicitly builds an `.apk` for direct installation.

> **Note:** `eas.json` is committed to git. Do not put secrets (API keys, passwords) in `env` here — only public base URLs and non-sensitive config are safe. For secrets, use EAS environment variables instead (see the **Environment Variables** section below).

### 2. Add `android.package` to `app.json`

EAS requires a package name. Add it under the `android` key in `app.json`:

```json
"android": {
  "package": "de.yourclub.kegelnetzwerk",
  ...
}
```

Replace `de.yourclub.kegelnetzwerk` with the desired reverse-domain identifier. This cannot be changed after the first build without resetting the keystore.

### 3. Generate a Keystore

EAS can manage the keystore automatically. On the first build it will prompt you to generate and store one remotely. Accept this — EAS keeps it safe and reuses it for all future builds.

If you prefer a local keystore, see the [EAS credentials docs](https://docs.expo.dev/app-signing/local-credentials/).

## Building the APK

Run from the project root:

```bash
eas build --platform android --profile production-apk
```

- The build runs on Expo's cloud servers (no local Android SDK needed).
- Progress is streamed to the terminal. The first build takes longer due to dependency caching.
- When complete, the CLI prints a download URL. Download the `.apk` from that URL.

You can also view and re-download builds at [expo.dev](https://expo.dev/) under your project's **Builds** tab.

## Installing on a Device

### Enable Unknown Sources

On the target device, go to **Settings > Security** (or **Settings > Apps > Special app access > Install unknown apps**) and allow installs from the source you will use (e.g., Chrome, Files).

### Transfer and Install

Copy the `.apk` to the device via USB, email, or a file sharing service, then open it to install.

Alternatively, install directly via ADB if the device is connected by USB:

```bash
adb install kegelnetzwerk-app.apk
```

## Environment Variables

EAS cloud builds run on remote servers and do not have access to local `.env` files. Environment variables must be declared directly in `eas.json` (already done in step 1 above) or via the EAS dashboard for sensitive values.

### Non-sensitive variables (e.g. `EXPO_PUBLIC_API_URL`)

Declared in the `env` block of the build profile in `eas.json`. They are baked into the app bundle at build time and are visible in the committed file, so only use this for non-secret values.

### Secrets (API keys, tokens, etc.)

Set them in the Expo dashboard so they stay out of source control:

1. Go to [expo.dev](https://expo.dev/) and open the project.
2. Navigate to **Project > Environment Variables**.
3. Add each variable and mark it as **Secret** if it should be hidden from build logs.

EAS injects dashboard variables automatically during every build, regardless of profile.

### Verifying a variable was picked up

Check the EAS build logs on [expo.dev](https://expo.dev/) under your project's **Builds** tab. Each build lists the environment variables that were injected. If `EXPO_PUBLIC_API_URL` is absent there, it was not baked into the app.

## Updating the App Version

Before releasing a new build, increment the version in `app.json`:

```json
"version": "2.1.0",
"android": {
  "versionCode": 3
}
```

- `version` — human-readable string shown in the app
- `versionCode` — integer that must increase with every new APK; Android uses this to determine if an update is newer

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `eas login` fails | Check network/VPN; ensure Expo account credentials are correct |
| Build fails with keystore error | Run `eas credentials` to inspect or reset the keystore |
| APK installs but crashes | Check that `EXPO_PUBLIC_API_URL` is set correctly and the server is reachable |
| "App not installed" error | Uninstall the previous version first, or increment `versionCode` |
