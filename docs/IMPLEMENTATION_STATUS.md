# Implementation status

**Branch:** Phase B Follow-Up + Phase C Expo mobile (parallel)  
**Date:** 2026-07-20

## Decisions locked

- Mobile Firebase SDK: **React Native Firebase**
- Delivery: Phase B (Follow-Up) and Phase C (mobile) **in parallel**
- Navigation: Expo Router

## Delivered

### Shared / backend
- Follow-Up types + reporting helpers in `@ieec/shared`
- Firestore rules/indexes for Follow-Up collections
- Seed creates demo newcomer + active assignment for bootstrap user

### Web (Phase B minister slice)
- `/app/follow-up` assigned list
- Profile / weekly report / Saturday attendance (separate records)

### Mobile (Phase C)
- `apps/mobile` Expo app with RN Firebase Auth + Firestore
- Sign-in + permission session
- Assigned newcomers, report, attendance, profile, bio
- Local notification helpers (first-contact 48h, weekly reminder)
- EAS profiles + README

## Still required from human

1. Firebase login/token + confirm project `ieec-ya-connect`
2. Real `google-services.json` / `GoogleService-Info.plist`
3. `npm run seed` with service account
4. EAS project id + Apple/Google signing for store builds

## Not in this slice

- Public registration UI
- Membership approval workflow UI (web-primary later)
- Full FCM server push pipeline (local reminders wired)
