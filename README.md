# IEEC YA Connect

People-centered Young Adult ministry platform.

| Surface | Stack |
| --- | --- |
| Web | React + TypeScript + Vite |
| Mobile (Phase C) | Expo / React Native |
| Backend | Firebase Auth, Firestore, Hosting |

Architecture Baseline **v1.0** docs live in [`docs/`](docs/). Authority order: [`docs/SOURCE_OF_TRUTH.md`](docs/SOURCE_OF_TRUTH.md).

## Audit of planning package

The uploaded zip (`IEEC-cursor-react-firebase-platform-eb4d`) contained **planning docs only** — no application code, no `package.json`, no Firebase project files. Those docs are now in `docs/`. This repo implements **Phase A** (platform foundation) for Firebase production.

## Repo layout

```text
apps/web/                 Vite React web client
packages/shared/          Shared types, permission catalog, RBAC resolver
firebase/                 Firestore rules + indexes
scripts/seed-bootstrap.mjs  Super Admin / org seed (Admin SDK)
docs/                     Architecture handbook, ADRs, Follow-Up specs
```

## Prerequisites

1. Node.js 20+
2. A Firebase project (docs suggest `ieec-ya-connect` — **confirm before touching production**)
3. Firebase CLI login or CI token
4. Web app config from Firebase Console → Project settings

## Quick start (local)

```bash
npm install
cp apps/web/.env.example apps/web/.env.local
# fill VITE_FIREBASE_* keys

npm run build -w @ieec/shared
npm run dev
```

### Emulators

```bash
# apps/web/.env.local
VITE_USE_EMULATORS=true

npm run emulators
# in another terminal
npm run dev
```

See [`docs/FIREBASE_CONNECT.md`](docs/FIREBASE_CONNECT.md) for production connect, deploy, and seed. One-shot helper: `npm run firebase:connect` (requires `FIREBASE_TOKEN` + configs).

## Bootstrap Super Admin

After Auth + Firestore exist:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
export BOOTSTRAP_EMAIL='you@example.com'
export BOOTSTRAP_PASSWORD='choose-a-strong-password'
export ORGANIZATION_ID=ieec_ya
npm run build -w @ieec/shared
npm run seed
```

Creates org `ieec_ya`, Young Adult ministry, Follow-Up team, role templates (Super Admin, Head Leader, Follow-Up Leader/Assistant/Minister), Person + `userAccounts` link, and an audit log entry.

## Phase status

| Phase | Scope | Status |
| --- | --- | --- |
| A | Auth, People, RBAC session, admin view, rules, hosting | Done (foundation) |
| B | Follow-Up module (web minister flows) | In progress on this branch |
| C | Expo mobile + React Native Firebase parity | In progress on this branch |

### Mobile

See [`apps/mobile/README.md`](apps/mobile/README.md). Uses **Expo Router** + **React Native Firebase**. Requires a development/EAS build (not Expo Go).

```bash
npm run build -w @ieec/shared
npm run dev:mobile
# then: npx expo prebuild && npm run android|ios  (or EAS)
```

## Security notes

- UI permission gates are UX only; Firestore rules enforce access.
- Soft delete + audit for sensitive changes (ADR-006).
- Never commit `.env.local` or service account JSON.
