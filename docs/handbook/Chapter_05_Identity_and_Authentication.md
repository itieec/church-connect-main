# Chapter 5 — Identity and Authentication

**Status:** Draft handbook chapter (planning authority until PDF revision)  
**Version alignment:** Extends Architecture Handbook v0.3; depends on Chapter 4  
**Governing ADRs:** ADR-001, ADR-006, ADR-007  
**Stack:** Firebase Authentication + Firestore `userAccounts`  

---

## 5.1 Purpose

This chapter defines how humans authenticate into IEEC YA Connect, how Auth identities link to organization-owned Person records, how invitations and activation work, and how multi-organization sign-in context is selected. Authentication proves **who signed in**. It does not by itself grant ministry authority (Chapter 6).

## 5.2 Separation of concerns

| Layer | Responsibility |
| --- | --- |
| **Firebase Auth** | Credentials, session, email verification, password reset |
| **User Account** (`userAccounts/{authUid}`) | Platform account record linking Auth UID → Person(+ org context) |
| **Person** | Ministry identity and profile (Chapter 4) |
| **Permission Engine** | What the signed-in Person may do (Chapter 6) |

Rules:

- A valid Auth session without a linked User Account / Person must not receive operational permissions.
- Ministry status (Newcomer/Member/Minister) is **not** an Auth claim and must not be treated as a login role.
- Disabling an account must not delete the Person.

## 5.3 Identity chain (canonical)

```text
Firebase Auth UID
  → userAccounts/{authUid}
    → personId (+ organization membership / context)
      → roleAssignments, overrides, teamMemberships, …
        → effective permissions
```

MVP assumption for a single-org deployment: `userAccounts` documents include `organizationId` and `personId` for the primary organization. Multi-org deployments may add explicit `organizationMemberships` (or equivalent) while keeping one Auth UID per human login identity.

## 5.4 Who needs an account

| Situation | Account required? |
| --- | --- |
| Public newcomer registration | No |
| Assigned Follow-Up minister recording reports/attendance | Yes |
| Follow-Up Leader / Assistant with system duties | Yes |
| Core Team / Head Leader approving membership | Yes |
| System / Support Admin | Yes |
| Member browsing member features | Yes (after invitation / activation) |
| Read-only public pages (registration, public info) | No |

Default Member path: **invitation after membership approval** (Chapter 4). Do not auto-create passwords silently unless a future ADR/policy explicitly enables that mode.

## 5.5 Invitation and activation lifecycle

### 5.5.1 States (account)

Recommended `accountStatus` / invitation fields:

| State | Meaning |
| --- | --- |
| `invited` | Invitation issued; Auth user may or may not exist yet |
| `pending_activation` | Auth exists; waiting for password set / email verify / first login |
| `active` | May sign in and use granted permissions |
| `disabled` | Sign-in blocked or session rejected for app use |
| `revoked` | Invitation/account intentionally withdrawn |

Track at least: `invitationStatus`, `invitedAt`, `invitedBy`, `activatedAt`, `lastLoginAt`, `emailVerified`.

### 5.5.2 Flow

```text
1. Authorized leader/admin selects Person → Invite
2. System records invitation against Person / User Account stub
3. Invitee receives email (or approved channel) with secure activation link
4. Invitee sets credentials via Firebase Auth
5. userAccounts/{authUid} linked to personId + organizationId
6. Person.hasUserAccount = true
7. accountStatus → active (after required verification steps)
8. Audit: invitation, activation, and link events
```

### 5.5.3 Rules

- Invitation always targets an existing Person (create Person first if needed).
- One active User Account link per Person per organization (no duplicate active logins for the same Person in that org without an audited remediation path).
- Re-invite is allowed when prior invite expired or failed; prior attempts remain in audit/history.
- Activation must not invent permissions; permissions come only from Chapter 6 assignments.

## 5.6 Authentication methods (baseline)

- **Email / password** via Firebase Auth for web and mobile.
- Password reset and email verification use Firebase-supported flows on both clients.
- Mobile sessions use the same Auth UID → User Account → Person chain as web.
- Additional providers (Google, SSO, phone, biometrics as device UX) are future options and must still resolve to the same User Account → Person chain.

## 5.7 Session and active organization context

On each app session:

1. Validate Firebase Auth session.
2. Load `userAccounts/{uid}`.
3. Resolve allowed organization(s).
4. Establish **active organization context** (single-org MVP: the only org).
5. Load that org’s Person profile for the account.
6. Resolve effective permissions for that Person in that org (Chapter 6).
7. Deny access if account is disabled/revoked or Person is archived without break-glass admin policy.

Switching organizations (when enabled) reloads Person + permissions for the selected org. Never mix org A permissions with org B data.

## 5.8 Account status vs ministry status

These must never be collapsed:

| Field | Lives on | Examples |
| --- | --- | --- |
| Ministry status | Person | newcomer, member, minister |
| Account status | User Account | invited, active, disabled |
| Record status | Person | active, archived |
| Journey state | Follow-Up journey doc | assigned, membership_review, … |

Examples:

- Person is Member, account still `invited` → cannot use member app features until activation.
- Person is Newcomer, no account → Follow-Up continues via assigned ministers’ accounts.
- Person is Minister, account `disabled` → Person record remains; login blocked; reassignment of work may be required.

## 5.9 Multi-organization sign-in

Under ADR-007:

- One human login (Auth UID) may be authorized for multiple organizations.
- Each organization still has its own Person profile.
- Cross-organization access is denied by default.
- Parent-organization oversight uses explicit parent-scoped permissions, not ambient access to child Person stores.

Implementation detail (planning): prefer explicit membership documents over packing unbounded org lists into Auth custom claims alone. Claims may cache org ids for rules performance but Firestore remains source of truth.

## 5.10 Security requirements

1. **Backend enforcement** — Firestore Security Rules (and Cloud Functions where used) verify Auth UID → account → Person → permission. UI gates are UX only.
2. **Least privilege at login** — Authenticated ≠ authorized. Default deny until permissions resolve.
3. **Invitation secrets** — Activation links must be unguessable, time-limited where practical, and single-use or rotated on reuse policy.
4. **PII** — Email on Auth and User Account must stay consistent with Person contact policy; changes audited.
5. **Disabled accounts** — Immediate denial of app data access; sessions should be treated as invalid for operational reads/writes.
6. **Service accounts / admin SDKs** — Server paths still write audit trails and respect org isolation.
7. **Public registration** — Unauthenticated writes only to approved public intake paths; never to admin collections.

## 5.11 Soft delete and account removal

- Prefer `disabled` / `revoked` over hard-deleting Auth users during normal ministry ops.
- Soft-deleted Person does not imply Auth deletion; disable the account and block org context.
- Hard deletion of Auth users is exceptional and must not orphan operational history (Person remains).

## 5.12 Audit events (Auth / account)

At minimum, audit:

- Invitation created / resent / canceled
- Account activated
- Account disabled / re-enabled / revoked
- Person ↔ account link changes
- Successful and failed privileged auth-adjacent admin actions
- Active organization context switches for multi-org users (when enabled)

## 5.13 Chapter completion criteria

- Auth UID → User Account → Person chain is mandatory for signed-in operations.
- Newcomers can be shepherded without accounts; ministers with system duties require accounts.
- Member default is invite-after-approval activation, not silent auto-passwords.
- Account status is independent of ministry status.
- Active organization context scopes Person and permissions.
- Multi-org access is explicit; default deny across orgs.
- UI restrictions never replace Security Rules / trusted backend checks.

## 5.14 Next chapter

Chapter 6 defines the Authorization and Permission Engine: scopes, role templates, live updates, overrides, time-bound assignments, resolution order, Follow-Up defaults, and enforcement layers.
