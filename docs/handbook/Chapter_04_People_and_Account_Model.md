# Chapter 4 — People and Account Model

**Status:** Draft handbook chapter (planning authority until PDF revision)  
**Version alignment:** Extends Architecture Handbook v0.3 Chapters 1–3  
**Governing ADRs:** ADR-001, ADR-006, ADR-007  
**Supporting detail:** Link 2 Step 3.3.1 (Person / Account); `docs/architecture/01-people-and-access.md`; Follow-Up module specs  

---

## 4.1 Purpose

This chapter defines how IEEC YA Connect represents people, ministry progression, user accounts, invitations, duplicates, profile completion, and multi-organization identity. Every module that stores or displays a person must follow these rules.

## 4.2 Core rule — Person is the center

Within an organization, the **Person** record is the permanent center of the ministry data model.

- Newcomer journeys, membership, team membership, attendance, reports, chats, calendar participation, roles, and permissions all reference an organization-owned **Person**.
- A status change must **never** create a duplicate Person inside the same organization (ADR-001).
- Modules must not invent parallel “person-like” stores. They may hold operational records that **point to** `personId`.

## 4.3 Person ≠ User Account

| Concept | Meaning |
| --- | --- |
| **Person** | Organization-owned ministry identity and profile |
| **User Account** | Authentication identity that can sign in to the platform |

Rules:

1. A Person **may exist without** a User Account (public newcomer registration).
2. A User Account **must link** to exactly one Person **per organization context** it serves (see Chapter 5 for multi-org sign-in).
3. Creating a Person does **not** automatically create login credentials.
4. Creating a User Account does **not** create a second Person; it links to an existing Person.

Firebase Auth UID maps to `userAccounts/{authUid}` → `personId`. Person exists first whenever possible.

## 4.4 Organization ownership of Person profiles

Each organization owns and isolates its Person records (ADR-007).

- The same human may have separate Person profiles in different organizations.
- Profiles are **not** automatically shared or merged across organizations.
- Cross-organization workflows may transfer only **approved** fields under explicit policy; they do not merge Person graphs by default.

```text
Human: Daniel
├── IEEC YA (Washington) Person — newcomer history, YA roles, local attendance
└── Maryland Org Person — separate profile, status, and history
```

## 4.5 Separated identity concepts (do not collapse)

These remain distinct fields / assignment types. Do not store them as one “role” string on Person.

| Concept | Purpose | Examples |
| --- | --- | --- |
| **Ministry Status** | Journey stage in the organization | Newcomer, Member, Minister |
| **System Role** | Technical platform authority | Super Admin, System Admin, Support Admin |
| **Organizational Position** | Ministry-wide leadership position | Head Leader, Core Team |
| **Team Role** | Scoped operational authority via RBAC templates | Follow-Up Leader, Assistant Leader, Minister |
| **Team Membership** | Belonging to a team (ops access baseline) | Follow-Up team member |
| **Oversight Assignment** | Can oversee selected teams without being operational member | Oversight of Media + Usher |
| **Volunteer** | Temporary assignment; not a ministry status | Event volunteer (optionally time-bound) |

Ministry status answers “where is this person in the shepherding journey?”  
Roles and positions answer “what may this person do?”  
They must stay independent so a Member can lead a team and a Minister can temporarily have no login.

## 4.6 Ministry status model

### 4.6.1 Canonical statuses

Primary progression:

```text
Newcomer → Member → Minister
```

Additional record / lifecycle flags (separate from ministry status when needed):

- `recordStatus`: e.g. `active`, `inactive`, `archived` (soft lifecycle of the Person record)
- Journey state (Follow-Up): operational workflow state on the journey document, **not** a second Person identity

### 4.6.2 Status history

Every ministry status change writes history:

- Previous status, new status
- Reason / workflow reference (e.g. membership approval id)
- Actor (`changedBy`), timestamp
- Optional notes

Never overwrite history in place. Soft-delete or supersede incorrect entries with audited corrections (ADR-006).

### 4.6.3 Status change rules

- Promoting Newcomer → Member happens through approved membership workflow, not by elapsed time alone.
- Attendance and weekly contact inform readiness but are **never the only factor**.
- Transition to Member updates Person `currentMinistryStatus`, keeps prior status in history, and completes the Follow-Up journey per module rules.
- Do not create a new Person when status changes.

## 4.7 Progressive profile completion

Person profiles are incomplete by design at first contact.

1. **Public registration / first capture** — minimum fields needed for Follow-Up (name, contact, sex, contact preference, etc. per form config).
2. **Operational enrichment** — ministers and leaders add bio notes, corrected contacts, photos, and ministry fields over time.
3. **Member / Minister enrichment** — additional profile sections may unlock as status and permissions allow.

Rules:

- Missing optional fields must not block shepherding work.
- Required fields are form/config driven (Dynamic Forms engine), not hard-coded everywhere.
- Sensitive profile fields require explicit permissions to view/edit.
- Profile edits are audited when they change identity-critical or sensitive data.

## 4.8 Returning people

When someone returns after inactivity or a prior journey:

1. Search the **same organization** Person store first (normalized name, phone, email).
2. Prefer **reactivating / continuing** the existing Person over creating a new one.
3. A new Follow-Up journey may be created on the same Person; ministry status rules determine whether they remain Newcomer or other status.
4. Prior history (attendance, reports, bio, previous journeys) remains attached to the Person.

## 4.9 Duplicate detection and merge

### 4.9.1 Detection

Public registration and leader-created people run duplicate candidates against organization-scoped Person data using normalized fields (name, phone, email). Possible matches place the journey/submission in `duplicate_review_required` (or equivalent) until resolved.

### 4.9.2 Review outcomes (audited)

Authorized reviewers may:

- Link submission to existing Person
- Create a new Person (false match)
- Update contact fields on existing Person
- Mark submission as duplicate / discard
- Escalate

### 4.9.3 No auto-merge

The system **must not** auto-merge Person records. Merge is a deliberate, permissioned, audited operation that:

- Chooses a surviving Person
- Re-points operational references (`personId`) safely
- Soft-deletes or archives the duplicate Person
- Preserves history of both records

Cross-organization merge is out of scope for default behavior (ADR-007).

## 4.10 User accounts and invitations (People side)

Account lifecycle details live in Chapter 5. People-model rules:

| Person type | Account expectation |
| --- | --- |
| Newcomer | Normally **no** account |
| Member | Normally receives an **invitation after membership approval** (not auto-generated passwords at approval time unless policy explicitly says otherwise) |
| Minister / people with system responsibilities | **Require** an account when they must operate in the system |
| Leaders / Admins | Require an account |

Invitation is an intentional access grant linked to an existing Person. Leaders may delay Member invitations when ministry process requires it; the default path is invite-after-approval.

## 4.11 Soft delete of people

Soft delete by default (ADR-006):

- Person `recordStatus` moves to inactive/archived rather than hard delete
- Operational history remains for audit and pastoral continuity
- Hard delete is exceptional, highly privileged, and normally out of MVP scope

## 4.12 Relationships and entities (People Engine)

The People Engine owns (or coordinates) at least:

- `people` — Person profiles
- `userAccounts` — account ↔ person link (Auth chapter)
- `ministryStatusHistory`
- `teamMemberships`
- `organizationalPositionAssignments`
- `oversightAssignments`
- `volunteerAssignments` (or equivalent time-bound membership)
- Relationships to other people/entities as modules need (e.g. household links later)

Follow-Up journeys, reports, attendance, and bio are **module records** that reference `personId`; they are not stored as nested forever-growing arrays inside Person.

## 4.13 Multi-organization access (People view)

A signed-in human may access more than one organization only when:

1. Each organization has (or creates under policy) its own Person profile for that human, and  
2. A User Account / org-membership link authorizes that organization context (Chapter 5).

Selecting an active organization switches which Person profile and permissions apply. Data from org A is not readable in org B by default.

## 4.14 Security and privacy consequences

- Person PII is organization-scoped.
- Public registration must not expose internal admin fields.
- Contact and sensitive bio visibility is permission-gated.
- UI hiding is not security; backend rules enforce Person access (Chapters 5–6).

## 4.15 Chapter completion criteria

- Person is organization-owned and permanent within that org (ADR-001).
- Person ≠ User Account is enforced in model and workflows.
- Ministry status, system roles, org positions, team roles, oversight, and volunteers remain separated.
- Status changes write history and never spawn duplicate Persons.
- Progressive profiles, returning-person handling, and duplicate review (no auto-merge) are defined.
- Member invitations default to post-approval; ministers with responsibilities require accounts.
- Soft delete and audit apply to Person lifecycle and merges.
- Multi-org humans use separate Person profiles per organization.

## 4.16 Next chapter

Chapter 5 defines Identity and Authentication: Firebase Auth relationship, invitation/activation, account statuses, multi-org sign-in context, and security boundaries between Auth and ministry status.
