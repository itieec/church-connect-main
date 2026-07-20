# Mobile Kickoff Prompt — IEEC YA Connect (React Native + Expo)

**Use:** Open a **new Cursor coding agent / separate coding account**, point it at this repo, and paste **everything below the line**. This prompt bootstraps the **Expo mobile client only**. It assumes the shared Firebase backend (Phase A) and Follow-Up module (Phase B) are the source of truth — mobile is **Phase C parity**, not a redesign.

---

## YOUR ROLE

You are building the **React Native (Expo) mobile client** for **IEEC YA Connect**, a people-centered Young Adult ministry platform. The mobile app is a **native client** on the **same Firebase backend** as the web app — **not** a WebView wrapper of the website, and **not** Flutter.

- Follow the planning docs in this repository exactly.
- **Do not redesign** architecture, roles, workflows, data model, or RBAC. Consume them.
- **Do not fork business rules.** Reuse shared types/contracts and rely on Firestore Security Rules / trusted Functions for enforcement.
- If something is missing or ambiguous, **ask the human** — never invent product policy.

## READ BEFORE WRITING CODE (in this order)

1. `docs/SOURCE_OF_TRUTH.md` — authority order
2. `docs/AI_CODING_HANDOFF_PROMPT.md` — full-product handoff (your Phase C is defined here)
3. `docs/handbook/Chapter_05_Identity_and_Authentication.md`
4. `docs/handbook/Chapter_06_Authorization_and_Permission_Engine.md`
5. `docs/handbook/Chapter_11_Notifications_and_Tasks.md`
6. `docs/handbook/Chapter_13_Data_and_Engineering_Standards.md` (esp. §13.8.1 EAS build)
7. `docs/modules/follow-up.md` + `follow-up-workflows-and-state-transitions.md` + `follow-up-firestore-data-model.md` + `follow-up-permission-catalog.md`

If a module doc conflicts with the handbook/ADRs, **handbook/ADR wins**.

## STACK (settled — do not reopen)

| Layer | Choice |
| --- | --- |
| Framework | **React Native via Expo** (managed workflow) + **TypeScript (strict)** |
| Navigation | Expo Router (file-based) or React Navigation — pick one, justify in README |
| Backend | Same Firebase project as web (**Auth + Firestore**; Functions/Storage as needed) |
| Firebase SDK | Use the approach documented in Ch. 5/13; confirm RN Firebase vs JS SDK with human before locking in |
| Shared code | Import the shared **types/contracts** package — do not re-declare domain models |
| Builds | **EAS Build** → Android `.apk`/`.aab`, iOS `.ipa` |
| Not allowed | Flutter; WebView-wrapped web app; forking business rules into the app |

## SESSION & PERMISSIONS (must match web semantics)

- Auth UID → `userAccount` → `Person` → **effective permissions for active org**
- **Default deny.** UI gates are convenience only; **Firestore Security Rules are the real boundary** (hiding a button is not security).
- Roles are **scoped live permission templates**; exceptions are overrides where **deny wins** (ADR-RBAC-001/002/003).
- **Person ≠ User Account.** Ministers sign in; newcomers do not.

## MOBILE SCOPE (Phase C — Minister-first)

Minister operational flows must work on **mobile and web**. Admin/config may stay web-primary for v1.

1. **Sign-in** (Firebase Auth email/password) + permission-resolved session for the active org
2. **My assigned newcomers** — list scoped to the signed-in minister's assignments
3. **Weekly report** — dynamic form (definition + version); Friday due / Sat+ late; 7-day edit window. **Report is a separate record from attendance.**
4. **Saturday attendance** — the 6:30–9:30 PM calendar event; status `attended` | `did_not_attend` | `unknown`; unique `personId + calendarEventId`. **Never merged with the report.**
5. **Newcomer bio + basic profile** — history, report, attendance, bio (read; edit where permitted)
6. **Notifications** — push/in-app for first-contact (default 48h) and weekly-contact reminders where practical

Out of scope for mobile v1: admin role/template management, org config, membership-approval workflow UI (web-primary), any non-Follow-Up module.

## NON-NEGOTIABLE RULES (carry over from handoff)

- Report ≠ attendance (different records, different screens).
- No auto-promote to Member by time alone; attendance is never the only membership factor.
- Public registration fields never expose internal/admin data (not a mobile concern unless you touch that surface).
- Soft delete + history (ADR-006). Audit permission/status-changing actions.
- No secrets in git; confirm the Firebase project with the human before touching anything that could be production.

## DEFINITION OF DONE (mobile)

- [ ] Expo app runs on iOS + Android against the shared Firebase project
- [ ] Sign-in + permission-resolved session (default-deny, honors overrides)
- [ ] Minister can view assigned newcomers
- [ ] Minister submits a **weekly report** and **Saturday attendance** as separate records
- [ ] Newcomer profile shows history / report / attendance / bio
- [ ] Security rules block unauthorized reads/writes from the app (verified, not assumed)
- [ ] Task/reminder notifications wired where practical
- [ ] README documents: install, env/Firebase config, `expo` run, and `eas build` for Android/iOS

## HOW TO START (mandatory)

1. Confirm you have read `docs/SOURCE_OF_TRUTH.md` and the files listed above.
2. State whether Phase A (shared backend) and the shared contracts package already exist in this repo/workspace, or whether you need them stubbed — **ask the human** rather than assuming.
3. Propose a short **Phase C plan**: Expo scaffold → auth/session → assigned list → report → attendance → profile → notifications. **No architecture redesign.**
4. Wait for human approval, then implement in that order.
5. Ask whenever the docs are silent — never invent policy.

**Begin now by confirming the docs you read and listing your Phase C plan for approval.**
