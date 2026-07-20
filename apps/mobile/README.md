# IEEC YA Connect — Mobile (Expo + React Native Firebase)

Native minister client for the **same Firebase backend** as web. Not a WebView. Not Flutter.

## Stack

| Choice | Detail |
| --- | --- |
| Framework | Expo (managed) + TypeScript strict |
| Navigation | **Expo Router** (file-based) |
| Firebase | **React Native Firebase** (`@react-native-firebase/app`, `auth`, `firestore`) |
| Shared | `@ieec/shared` types + RBAC + Follow-Up helpers |
| Builds | EAS → Android `.apk`/`.aab`, iOS `.ipa` |

React Native Firebase **does not run in Expo Go**. Use a **development client** (`expo-dev-client`) or EAS Build.

## Setup

1. Copy Firebase native config from Console:

```bash
cp google-services.json.example google-services.json
cp GoogleService-Info.plist.example GoogleService-Info.plist
# replace placeholders with real Firebase Android/iOS app configs
```

2. Install from repo root:

```bash
npm install
npm run build -w @ieec/shared
```

3. Prebuild + run (requires Android SDK / Xcode as appropriate):

```bash
cd apps/mobile
npx expo prebuild
npm run android   # or npm run ios
```

Or EAS:

```bash
npm run eas:android   # apk/aab per eas.json profile
npm run eas:ios       # ipa (Apple Developer account required)
```

## Minister flows (Phase C)

- Sign-in → Auth UID → `userAccounts` → Person → effective permissions
- My assigned newcomers
- Weekly report (separate record; Friday due / 7-day edit)
- Saturday attendance (`attended` | `did_not_attend` | `unknown`; unique `personId + calendarEventId`)
- Newcomer profile (history / report / attendance / bio)
- Local notification helpers for first-contact (48h) and weekly report reminders

Admin/config remains web-primary.

## Project id

Default Firebase project in repo docs: `ieec-ya-connect` — confirm before production.
