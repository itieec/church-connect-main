# AGENTS.md

## Cursor Cloud specific instructions

### Repository layout caveat
The `main` branch currently holds only a placeholder `README.md`. The real IEEC YA Connect
monorepo lives on the `cursor/phase-*` feature branches (the fullest is
`cursor/phase-b-c-followup-expo-77d4`: web + shared + Expo mobile). Work from a feature branch
that actually contains `apps/`, `packages/`, and `package.json`.

This is an npm workspaces monorepo (`apps/*`, `packages/*`). Node 20+ (VM has Node 22). Firebase
(Auth + Firestore) is the backend — there is no separate API server or SQL database.

### Services and how to run them
- Web app (`apps/web`, React + Vite): `npm run dev` (root) → Vite on `http://localhost:5173`.
- Firebase emulators (Auth + Firestore) for local dev. `firebase-tools` is a dev dependency, so
  use `npx firebase ...` (no global install). Emulators require Java (present on the VM). Start
  auth + firestore only with:
  `npx firebase emulators:start --project ieec-ya-connect --only auth,firestore`
  (Emulator UI on 4000, Auth 9099, Firestore 8080.)
- Mobile app (`apps/mobile`, Expo/React Native Firebase): `npm run dev:mobile`. Cannot run in Expo
  Go — needs a dev client / native build and real `google-services.json` /
  `GoogleService-Info.plist`; not part of the local web dev loop.

### Non-obvious gotchas
- Build the shared package before running/seeding anything: `npm run build -w @ieec/shared`.
  The web app, mobile app, and the seed script import the compiled output
  (`packages/shared/dist`); without it, imports of `@ieec/shared` and the seed fail. `npm run
  build` / `npm run typecheck` also rebuild it.
- `apps/web/.env.local` is required and is gitignored (so it is not in the repo). Even in emulator
  mode, `isFirebaseConfigured()` needs non-empty `VITE_FIREBASE_API_KEY`, `_PROJECT_ID`, `_APP_ID`,
  and `_AUTH_DOMAIN` or the UI shows a "Firebase not configured" error. Use dummy values plus
  `VITE_USE_EMULATORS=true`, and set `VITE_FIREBASE_PROJECT_ID` to the SAME project id the
  emulators run under (`ieec-ya-connect`) so app and emulator data share a namespace.
- Seeding against emulators: the seed script (`npm run seed`) requires a service-account credential
  and calls `cert()`, but against emulators no real token signing happens, so any well-formed
  service-account JSON (valid PEM `private_key`, plus `client_email`/`project_id`) works. Point the
  Admin SDK at the emulators via env vars, e.g.:
  `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 GCLOUD_PROJECT=ieec-ya-connect GOOGLE_APPLICATION_CREDENTIALS=/path/to/fake-sa.json BOOTSTRAP_EMAIL=admin@ieec.test BOOTSTRAP_PASSWORD='Passw0rd!' ORGANIZATION_ID=ieec_ya npm run seed`
  This seeds a Super Admin login (`admin@ieec.test` / `Passw0rd!`) plus a demo newcomer (Alex
  Newcomer) and Follow-Up assignment for end-to-end testing.
- Emulator data is not persisted unless started with `--import/--export-on-exit`; re-run the seed
  after a fresh emulator start. The root `npm run emulators` script uses `./.firebase-data` for
  import/export.

### Lint / test / build (see root `package.json`)
- Lint: `npm run lint` (oxlint on `@ieec/web`).
- Typecheck: `npm run typecheck` (shared + web) and `npm run typecheck:mobile`.
- Build: `npm run build` (shared + web via Vite).
- There is no Jest/Vitest/Playwright suite. `packages/shared/src/rbac/resolvePermissions.test.ts`
  is a hand-rolled test that does not run directly under Node 22's ESM/TS loader; its logic is
  exercised through typecheck/build instead.
