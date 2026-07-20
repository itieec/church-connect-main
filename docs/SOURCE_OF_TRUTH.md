# Canonical design sources

## Design authority (highest)

**Architecture Handbook v0.3** (July 13, 2026)

- PDF: `docs/handbook/IEEC_YA_Connect_Architecture_Handbook_v0.3.pdf`
- Searchable extract: `docs/handbook/Architecture_Handbook_v0.3.md`

If a module spec conflicts with the handbook, **the handbook wins** unless an approved ADR changes the standard.

Handbook TOC status:

| Chapter | Status |
| --- | --- |
| 1 Purpose, Scope, Design Authority | Present in PDF v0.3 |
| 2 Core Design Principles & Engines | Present in PDF v0.3 |
| 3 Organization and Tenant Model | Present in PDF v0.3 |
| 4 People and Account Model | **Draft:** `docs/handbook/Chapter_04_People_and_Account_Model.md` |
| 5 Identity and Authentication | **Draft:** `docs/handbook/Chapter_05_Identity_and_Authentication.md` |
| 6 Authorization and Permission Engine | **Draft:** `docs/handbook/Chapter_06_Authorization_and_Permission_Engine.md` |
| 7 Dynamic Forms Engine | **Draft:** `docs/handbook/Chapter_07_Dynamic_Forms_Engine.md` |
| 8 Workflow Engine | **Draft:** `docs/handbook/Chapter_08_Workflow_Engine.md` |
| 9 Ministry Calendar Engine | **Draft:** `docs/handbook/Chapter_09_Ministry_Calendar_Engine.md` |
| 10 Chat and Collaboration | **Draft:** `docs/handbook/Chapter_10_Chat_and_Collaboration.md` |
| 11 Notifications and Tasks | **Draft:** `docs/handbook/Chapter_11_Notifications_and_Tasks.md` |
| 12 Audit and History | **Draft:** `docs/handbook/Chapter_12_Audit_and_History.md` |
| 13 Data and Engineering Standards | **Draft:** `docs/handbook/Chapter_13_Data_and_Engineering_Standards.md` |

Chapters 4–13 drafts are planning authority for those topics until a later PDF revision absorbs them.

## ChatGPT design threads (module detail)

| Phase | Authority |
| --- | --- |
| Chapters / Steps 1–2 foundation narrative | [Link 1](https://chatgpt.com/share/6a54d9c0-23d4-83ea-b8d6-6e3675729fbd) — **only before** `Give me over all content from step 1 and step 2 in pdf` |
| Follow-Up Step 3+ detail | [Link 2](https://chatgpt.com/share/6a54dabb-eca4-83ea-b88e-fdae1dd5d0ff) |

Repo Follow-Up docs under `docs/modules/` capture link 2 detail for coding handoff.

## Phase rule

**Planning is frozen as Architecture Baseline v1.0 for coding.**  
This planning agent still does not write application code.  
**Coding:** paste `docs/AI_CODING_HANDOFF_PROMPT.md` into a **separate Cursor coding account**.

## Product clients (settled)

IEEC YA Connect is a **web + mobile** system (both first-class).

| Client | UI framework | Notes |
| --- | --- | --- |
| **Web** | **React** + TypeScript + Vite | Browser app (React DOM) |
| **Mobile** | **React Native** via **Expo** + TypeScript | iOS/Android native UI — **not** a WebView wrapper of the web app |
| **Shared** | Firebase + domain contracts/types | Same Auth, Firestore, permissions, workflows — do not fork business rules |
| **Not used** | Flutter | Out of scope |

Mobile binaries: EAS Build → `.apk` / `.aab` / `.ipa`. See Ch. 13 §13.8.1.

## Approved ADR catalog (Handbook)

ADR-001 Person record · ADR-002 Roles as templates · ADR-003 One org calendar · ADR-004 Chat ≠ team membership · ADR-005 Dynamic forms · ADR-006 Soft delete + audit · ADR-007 Federated multi-org  

RBAC clarifications: ADR-RBAC-001/002/003 (scoped live templates, full default grant, time bounds).

## Coding handoff

1. Use `docs/AI_CODING_HANDOFF_PROMPT.md` (status: **READY**)  
2. New Cursor coding agent / different account  
3. Agent must propose Phase A plan and wait for approval before implementing
