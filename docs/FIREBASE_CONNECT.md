# Connect Firebase (production)

This cloud agent **cannot** complete `firebase login` (no browser / no Google credentials in the environment). PR #1 and #2 are already merged to `main`. Deploy waits on your credentials.

## Checklist (you do once)

1. Open [Firebase Console](https://console.firebase.google.com/) and confirm or create project **`ieec-ya-connect`** (or update `.firebaserc`).
2. Enable **Authentication → Email/Password**.
3. Create **Cloud Firestore** (production mode is fine; rules deploy from this repo).
4. Add apps:
   - **Web** → copy config into `apps/web/.env.local` (see `.env.example`)
   - **Android** package `org.ieec.yaconnect` → `apps/mobile/google-services.json`
   - **iOS** bundle `org.ieec.yaconnect` → `apps/mobile/GoogleService-Info.plist`
5. Create a **service account** (Project settings → Service accounts → Generate new private key).
6. On your machine:

```bash
firebase login:ci
export FIREBASE_TOKEN='...'
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
export BOOTSTRAP_EMAIL='you@example.com'
export BOOTSTRAP_PASSWORD='strong-password'
export VITE_FIREBASE_API_KEY=...
export VITE_FIREBASE_AUTH_DOMAIN=ieec-ya-connect.firebaseapp.com
export VITE_FIREBASE_PROJECT_ID=ieec-ya-connect
export VITE_FIREBASE_STORAGE_BUCKET=ieec-ya-connect.appspot.com
export VITE_FIREBASE_MESSAGING_SENDER_ID=...
export VITE_FIREBASE_APP_ID=...

node scripts/firebase-connect-and-deploy.mjs
```

Or paste those env vars into a new Cursor Cloud Agent message and ask it to re-run deploy.

## After deploy

1. Open the Hosting URL → Sign in with bootstrap email
2. Open **Follow-Up** → demo newcomer assignment from seed
3. Submit a weekly report and Saturday attendance (separate screens)
4. For mobile: `cd apps/mobile && npx expo prebuild && eas build --profile preview --platform android`

## Mobile smoke

React Native Firebase requires a **dev client / EAS build** (not Expo Go). Place real `google-services.json` and `GoogleService-Info.plist`, then build.
