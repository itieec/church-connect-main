# Implementation status

**Date:** 2026-07-20

## Merged to main

- PR #1 Phase A foundation — **merged**
- PR #2 Phase B/C Follow-Up + Expo mobile — **merged**

## Firebase connect / deploy / seed

**Blocked in this cloud agent:** no `firebase login`, no `FIREBASE_TOKEN`, no service account, no web/mobile API keys.

Run locally (or re-run agent after pasting secrets): see [`docs/FIREBASE_CONNECT.md`](FIREBASE_CONNECT.md) and `npm run firebase:connect`.

## Mobile smoke on device

Blocked without real `google-services.json` / `GoogleService-Info.plist` and EAS/Apple/Google signing. Helper: `scripts/mobile-smoke-check.sh`.

## Phase B remainder (this branch)

- Public registration `/register` (consent-only public create)
- Leader desk: staff intake, duplicate review (accept/link/discard), unassigned assign/reassign
- Membership recommendation (minister) + approvals (leader) → Member transition

## Still later

- Multi-step configurable approval templates beyond Minister → Leader MVP
- Server FCM push pipeline
- Cloud Function for anonymous duplicate scan against people (public currently queues pending)
