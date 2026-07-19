# Implementation status

**Branch:** Phase A Firebase foundation  
**Date:** 2026-07-19

## Zip audit

`IEEC-cursor-react-firebase-platform-eb4d.zip` contents:

- Planning docs only (`docs/handbook`, `docs/adr`, `docs/modules`, handoff prompt)
- **No** React app, Expo app, `package.json`, Firebase rules, or Cloud Functions
- Planning freeze note: Architecture Baseline v1.0 ready for coding

Those docs are ingested into this repository under `docs/`.

## Phase A delivered in code

- Monorepo: `apps/web`, `packages/shared`, `firebase/`
- Firebase Hosting + Firestore rules/indexes (`firebase.json`, `.firebaserc` → `ieec-ya-connect`)
- Auth email/password session: Auth UID → `userAccounts` → Person → effective permissions
- Shared RBAC resolver (template grant + overrides; deny wins; time bounds)
- Admin RBAC read UI (templates + assignments)
- Bootstrap seed script for Super Admin / org / Follow-Up role templates
- Production web build (`npm run build`)

## Blocked on human / credentials

1. Confirm Firebase project id is `ieec-ya-connect` (or update `.firebaserc`)
2. `firebase login` (or `FIREBASE_TOKEN`) in this environment
3. Web app config keys in `apps/web/.env.local`
4. Service account JSON to run `npm run seed`
5. Explicit approval before overwriting any existing production data

## Next (Phase B)

Follow-Up module per `docs/modules/*` — public registration, journeys, assignments, weekly reports, Saturday attendance.
