# AI Coding Command Prompt — IEEC YA Connect

**Status:** READY for coding (Architecture Baseline v1.0 — planning freeze)  
**Markdown:** this file  
**PDF:** [`AI_CODING_HANDOFF_PROMPT.pdf`](AI_CODING_HANDOFF_PROMPT.pdf)  
**Use:** Open a **new Cursor coding agent / different Cursor account**, paste **everything below the line** (or from the PDF “YOUR ROLE” section), and point it at this repo.

Planning agent does **not** write application code. This prompt is for the **implementation** agent only.

---

## YOUR ROLE

You are implementing **IEEC YA Connect**, a people-centered Young Adult ministry platform.

- Follow the planning docs in this repository exactly.
- **Do not redesign** architecture, roles, workflows, data model, or RBAC.
- If something is missing or ambiguous, **ask the human** — do not invent product policy.
- This coding session is separate from the planning agent that wrote `docs/`.

---

## SOURCE OF TRUTH (read in this order)

### Highest authority

1. `docs/SOURCE_OF_TRUTH.md`
2. `docs/handbook/IEEC_YA_Connect_Architecture_Handbook_v0.3.pdf`  
   (searchable: `docs/handbook/Architecture_Handbook_v0.3.md`)
3. Handbook drafts Ch. 4–13 under `docs/handbook/Chapter_*.md`
4. ADRs: `docs/adr/` (ADR-001…007 + ADR-RBAC-001…003)

If a module doc conflicts with the handbook/ADR, **handbook/ADR wins**.

### Supporting ChatGPT threads (detail only)

| Phase | Link | Rule |
| --- | --- | --- |
| Steps 1–2 | https://chatgpt.com/share/6a54d9c0-23d4-83ea-b8d6-6e3675729fbd | Use **only BEFORE** user message `Give me over all content from step 1 and step 2 in pdf` |
| Follow-Up Step 3+ | https://chatgpt.com/share/6a54dabb-eca4-83ea-b88e-fdae1dd5d0ff | Module detail |

Prefer repo docs under `docs/modules/` over re-deriving from ChatGPT.

### Required reading before coding

- `docs/architecture/00-platform-blueprint.md`
- `docs/architecture/90-ai-development-guide.md`
- `docs/handbook/Chapter_04_People_and_Account_Model.md`
- `docs/handbook/Chapter_05_Identity_and_Authentication.md`
- `docs/handbook/Chapter_06_Authorization_and_Permission_Engine.md`
- `docs/handbook/Chapter_07_Dynamic_Forms_Engine.md`
- `docs/handbook/Chapter_08_Workflow_Engine.md`
- `docs/handbook/Chapter_09_Ministry_Calendar_Engine.md`
- `docs/handbook/Chapter_10_Chat_and_Collaboration.md`
- `docs/handbook/Chapter_11_Notifications_and_Tasks.md`
- `docs/handbook/Chapter_12_Audit_and_History.md`
- `docs/handbook/Chapter_13_Data_and_Engineering_Standards.md`
- `docs/modules/follow-up.md`
- `docs/modules/follow-up-workflows-and-state-transitions.md`
- `docs/modules/follow-up-firestore-data-model.md`
- `docs/modules/follow-up-permission-catalog.md`
- `docs/modules/follow-up-config-defaults.md`

---

## PRODUCT & STACK (settled — do not reopen)

| Layer | Choice |
| --- | --- |
| Web | **React** (React DOM) + TypeScript + Vite |
| Mobile | **React Native** via Expo + TypeScript (native screens — not a WebView of the web app) |
| Shared | Firebase backend + shared types/contracts only (do not fork business rules) |
| Not allowed | **Flutter**; do not ship mobile as “wrapped website” only |
| Backend | Firebase Auth, Firestore; Functions/Storage as needed |
| Mobile binaries | **EAS Build** → Android `.apk`/`.aab`, iOS `.ipa` |
| First module | **Follow-Up** |
| Org start | Single org MVP (`ieec_ya` / Firebase project `ieec-ya-connect` if present — confirm before touching prod) |

**Engines vs Modules:** shared engines (`engines/`) + business modules (`modules/follow-up/`). Do not duplicate Person, calendar, chat, workflow, forms, or RBAC inside Follow-Up.

---

## ACCESS MODEL (must implement)

- Ministry status ≠ system role ≠ org position ≠ team role ≠ oversight ≠ volunteer
- **Person ≠ User Account** (newcomers register without login)
- Roles = **scoped live permission templates** (ADR-RBAC-001/002)
- Assign role → receive **all** template permissions in that scope
- Exceptions = permission **overrides** (grant/deny); **deny wins**
- Time-bound assignments: optional start/end + active/inactive (ADR-RBAC-003)
- Default deny; audit permission and status changes
- UI gates + **Firestore Security Rules** (hiding buttons is not security)

### Follow-Up role defaults

| Role | Default |
| --- | --- |
| Follow-Up Leader | Full Follow-Up management permissions in team scope |
| Follow-Up Assistant Leader | **No** management permissions by default |
| Follow-Up Minister | Assigned-work only (report, attendance, bio, recommend) |

Canonical keys: plural resources (`follow_up.assignments.*`, `follow_up.reports.*`) — see permission catalog.

---

## IMPLEMENTATION ORDER

### Phase A — Platform foundation (web + shared backend)

1. Monorepo or clear workspace: web (Vite React) + mobile (Expo) + shared packages for types/contracts
2. Firebase Auth email/password
3. Firestore: organizations, people, userAccounts, roleTemplates, roleAssignments, permissionOverrides, auditLogs
4. Session: Auth UID → userAccount → Person → effective permissions for active org
5. Admin (web-primary): manage templates, assign roles (scope + dates), overrides
6. Audit writes for permission/status-changing actions
7. Seed Super Admin / Head Leader bootstrap documented in README

### Phase B — Follow-Up module

1. Public newcomer registration (no account)
2. Duplicate review (**no auto-merge**)
3. Journey + unassigned queue
4. Assign / reassign (primary/secondary; warn if already assigned; keep history)
5. First-contact task (default 48h) + weekly contact responsibility
6. Weekly report (form definition + version; Friday due / Sat+ late; 7-day edit window)
7. **Attendance separate from report**: Saturday **6:30 PM–9:30 PM** calendar event; statuses `attended` \| `did_not_attend` \| `unknown`; unique `personId + calendarEventId`
8. Newcomer profile: history, report, attendance, bio
9. Permission-driven leader dashboards
10. Membership recommendation + configurable approval (example: Minister → Leader → Core Team)
11. Journey pause / unable_to_contact / inactive / close / reopen

Exact workflows: `docs/modules/follow-up-workflows-and-state-transitions.md`  
Exact collections: `docs/modules/follow-up-firestore-data-model.md`

### Phase C — Mobile parity (Expo)

1. Expo app wired to same Firebase project
2. Sign-in + permission-resolved session
3. Minister flows: assigned newcomers, weekly report, Saturday attendance, bio, basic profile
4. Push/in-app notifications for tasks/reminders where practical
5. Document `eas build` for Android/iOS in README

Admin/config may remain web-primary for v1; minister ops must work on **mobile and web**.

---

## NON-NEGOTIABLE RULES

- Report ≠ attendance (different records)
- One org calendar; Saturday program via `calendarEvents`
- Attendance informs membership readiness; **never the only factor**
- No auto-promote to Member by time alone
- Soft delete + history (ADR-006)
- Public registration never exposes internal/admin fields
- Members normally get account **invitation after membership approval** (not silent auto-passwords)
- Chat membership ≠ team membership (ADR-004)

### Config defaults (admin-editable later)

| Key area | Default |
| --- | --- |
| Report due | Friday (org timezone); Sat+ = late |
| Edit window | 7 days |
| First contact | 48 hours |
| Welcome message | On |
| Primary reports only | true |
| Attendance | On (Saturday model) |

Full table: `docs/modules/follow-up-config-defaults.md`

---

## OUT OF SCOPE (first milestone)

- Full parent-org / denomination product
- SMS / WhatsApp providers
- Flutter
- Other ministry modules beyond hooks (Bible Study, G5, Worship, …)
- Redesigning RBAC or Follow-Up “improvements” not in the docs

---

## ENGINEERING STANDARDS

- TypeScript strict (web + Expo)
- Folder split: `engines/*` vs `modules/follow-up/*` + shared contracts package
- Business rules enforced in Security Rules / trusted Functions — not UI-only
- Prefer extending engines over module-local duplicates
- Small commits; no secrets in git
- Confirm Firebase project with human before overwriting production

### Mobile release

```text
eas build --platform android   →  .apk / .aab
eas build --platform ios       →  .ipa
```

Needs Apple Developer + Google Play accounts. Details: handbook Ch. 13 §13.8.1.

---

## DEFINITION OF DONE

- [ ] Sign-in + permission session on **web and mobile**
- [ ] Admin can manage roles / assignments / overrides (web OK for v1 admin)
- [ ] Public registration → Person + journey + duplicate review path
- [ ] Leader/assistant (with permission) can assign newcomers
- [ ] Minister submits weekly report and Saturday attendance separately on **web and mobile**
- [ ] Newcomer profile shows history / report / attendance / bio on both clients
- [ ] Security rules block unauthorized access
- [ ] Audit for assignment, status, permission, membership actions
- [ ] README: setup, seed, web + Expo run, EAS build notes

---

## HOW TO START (mandatory)

1. Read the docs listed above end-to-end  
2. Propose a short implementation plan (Phase A → B → C) — **no architecture redesign**  
3. Wait for human approval of that plan  
4. Implement Phase A, then B, then C  
5. Ask when docs are silent — never invent policy  

**Begin now by confirming you read `docs/SOURCE_OF_TRUTH.md` and listing your Phase A plan for approval.**
