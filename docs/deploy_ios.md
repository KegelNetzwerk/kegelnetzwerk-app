# iOS Distribution via TestFlight

This guide covers building and distributing the app to iOS devices via TestFlight, without submitting to the App Store. TestFlight is Apple's official beta distribution platform and supports up to 10,000 external testers.

## Prerequisites

- [EAS CLI](https://docs.expo.dev/eas-update/introduction/) installed globally: `npm install -g eas-cli`
- An [Expo account](https://expo.dev/) — free tier is sufficient
- Logged into EAS: `eas login`
- An **Apple Developer Program** membership ($99/year) — required for any iOS distribution outside a personal device
- An [App Store Connect](https://appstoreconnect.apple.com/) account linked to the same Apple ID

## One-time Setup

### 1. Add `ios.bundleIdentifier` to `app.json`

EAS requires a bundle identifier. Add it under the `ios` key in `app.json`:

```json
"ios": {
  "bundleIdentifier": "de.yourclub.kegelnetzwerk",
  "supportsTablet": true
}
```

Use a reverse-domain format. This identifier must match what is registered in App Store Connect and cannot be changed after the first build.

### 2. Register the app in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com/) and sign in.
2. Navigate to **My Apps** and click **+** → **New App**.
3. Select **iOS**, fill in the name, choose the bundle identifier from step 1, and complete the form.
4. You do not need to fill in store listing details — just creating the record is enough.

### 3. Add the `production` profile to `eas.json`

The default `production` profile already targets iOS correctly. Ensure it exists in `eas.json`:

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-production-server.example.com"
      }
    },
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

> **Note:** `eas.json` is committed to git. Do not put secrets in `env` here. Use the EAS dashboard for sensitive values (see **Environment Variables** in `deploy_android.md`).

### 4. Generate certificates and provisioning profiles

EAS manages code signing automatically. On the first build it will:

1. Ask to log in to your Apple Developer account.
2. Create a distribution certificate and an App Store provisioning profile.
3. Store them remotely so all future builds reuse the same credentials.

Accept the automatic management — this is the recommended approach.

## Building for TestFlight

Run from the project root:

```bash
eas build --platform ios --profile production
```

- The build runs on Expo's cloud servers (no local Xcode installation needed on Windows).
- Progress is streamed to the terminal. The first build takes longer due to dependency caching.
- When complete, the CLI prints a download link for the `.ipa` file and offers to submit it directly to TestFlight.

## Submitting to TestFlight

### Option A — Submit directly from EAS (recommended)

After the build completes, EAS will ask:

```
Submit to Apple TestFlight? (Y/n)
```

Press **Y**. EAS handles the upload automatically using the same Apple credentials.

### Option B — Submit manually via EAS

```bash
eas submit --platform ios --latest
```

This submits the most recent iOS build to App Store Connect. You can also target a specific build ID:

```bash
eas submit --platform ios --id <build-id>
```

### Option C — Submit manually via Transporter

Download the `.ipa` from [expo.dev](https://expo.dev/) under your project's **Builds** tab, then upload it using [Transporter](https://apps.apple.com/app/transporter/id1450874784) (free app from Apple, available on macOS only).

## Distributing via TestFlight

Once the build is processed by Apple (usually 5–15 minutes):

1. Open [App Store Connect](https://appstoreconnect.apple.com/) → **My Apps** → select the app → **TestFlight**.
2. Under **Internal Testing**, add yourself and any other testers by Apple ID.
3. For **External Testing** (testers outside your developer team), click **+** next to External Groups, create a group, and add tester email addresses. A short review by Apple is required for the first external build (usually same day).
4. Testers receive an email invitation and install the app via the **TestFlight** app on their device.

TestFlight builds expire after **90 days**. Upload a new build before expiry to keep testers on the latest version.

## Installing on a Device (tester side)

1. Install the **TestFlight** app from the App Store.
2. Open the invitation email and tap **View in TestFlight**, or open TestFlight and redeem the invitation code.
3. Tap **Install** next to the app.

Updates are delivered automatically through TestFlight when a new build is uploaded.

## Updating the App Version

Before releasing a new build, increment the version in `app.json`:

```json
"version": "2.1.0",
"ios": {
  "buildNumber": "3"
}
```

- `version` — human-readable string shown in TestFlight and the app
- `buildNumber` — must increase with every submission as a string integer; Apple uses this to distinguish builds

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `eas login` fails | Check network/VPN; ensure Expo account credentials are correct |
| Certificate or provisioning error | Run `eas credentials` to inspect or reset iOS credentials |
| Build uploads but Apple rejects it | Check App Store Connect for specific rejection notes; common causes are missing usage description strings or an outdated bundle identifier |
| Testers do not receive invitation email | Check spam folder; re-send from App Store Connect → TestFlight → tester row → resend |
| "This build has expired" in TestFlight | The 90-day limit was reached — upload a new build |
| App crashes on launch | Verify `EXPO_PUBLIC_API_URL` is set correctly and the server is reachable over HTTPS (iOS blocks plain HTTP by default) |
