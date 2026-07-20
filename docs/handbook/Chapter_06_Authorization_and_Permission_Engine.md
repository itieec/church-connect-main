# Chapter 6 — Authorization and Permission Engine

**Status:** Draft handbook chapter (planning authority until PDF revision)  
**Version alignment:** Extends Architecture Handbook v0.3 §2.4; depends on Chapters 3–5  
**Governing ADRs:** ADR-002, ADR-RBAC-001, ADR-RBAC-002, ADR-RBAC-003, ADR-006, ADR-007  

---

## 6.1 Purpose

This chapter defines how IEEC YA Connect decides whether a Person may view data or perform an action. The Permission Engine is a shared platform engine. Modules declare permissions; they do not invent private authorization systems.

Authentication (Chapter 5) answers **who is signed in**.  
Authorization answers **what that Person may do in a given scope**.

## 6.2 Design principles

1. **Default deny** — absence of permission means deny.
2. **Least privilege** — grant only what the assignment requires.
3. **Roles are templates, not final authority** (ADR-002 / ADR-RBAC-001).
4. **Live templates** — template edits apply to current and future assignments (ADR-RBAC-002). Snapshotting permissions onto assignments is forbidden.
5. **Default full-template grant** — assigning a role grants **all** permissions currently on that template, evaluated inside the assignment scope. Admins do not pick permissions one-by-one at assignment time.
6. **Overrides for exceptions** — grant or deny on a Person without cloning a special role.
7. **Explicit deny wins** over grants.
8. **Scope-aware** — permissions never cross scope automatically (Chapter 3).
9. **Time-aware when configured** — optional start/end dates and active/inactive (ADR-RBAC-003).
10. **Backend enforcement** — React UI must mirror permissions but Security Rules / trusted functions enforce them.
11. **Audited** — permission-mutating operations write append-only history (ADR-006).
12. **Technical authority ≠ ministry authority** — System Admin is not automatically Head Leader; Follow-Up Leader is not System Admin.

## 6.3 Permission scopes

Permissions are always evaluated inside a scope. Canonical scopes:

| Scope | Meaning |
| --- | --- |
| `platform` | Platform-wide technical operations |
| `parent_organization` | Explicit parent oversight / standards |
| `organization` | Single church / branch tenant |
| `ministry` | e.g. Young Adult |
| `team` | e.g. Follow-Up Team |
| `group` | e.g. G5 or Bible Study subgroup |
| `specific_record` | One workflow/record instance when required |

Scope chain example:

```text
IEEC YA (organization) → Young Adult (ministry) → Follow-Up (team)
```

A Follow-Up Leader assignment at that team scope does **not** grant Worship or Media leadership.

## 6.4 Building blocks

### 6.4.1 Permission

A named capability key, preferably stable and namespaced:

```text
follow_up.assignments.create
follow_up.reports.review
calendar.event.manage
```

Normalize singular/plural variants before implementation. Prefer plural resource segments (`assignments`, `reports`) as the canonical form.

### 6.4.2 Role template

Reusable named set of permissions (e.g. `Follow-Up Leader`). Has **no authority** until assigned within a scope.

### 6.4.3 Role assignment

Links:

- `personId`
- `roleTemplateId`
- `organizationId`
- scope type + scope ids (ministry/team/group as applicable)
- optional `startAt` / `endAt`
- `active` flag
- audit metadata

### 6.4.4 Permission override

Person-scoped exception:

- `grant` or `deny`
- permission key
- scope
- optional time bounds
- reason + audit metadata

### 6.4.5 Related access sources (not role titles alone)

- **Team membership** — baseline ops for members/ministers of a team
- **Organizational position** — Head Leader / Core Team defaults
- **Oversight assignment** — selected-team oversight permissions
- **System role** — technical admin capabilities
- **Volunteer assignment** — temporary scoped grants (prefer time-bound role assignment)

Backend evaluates **resolved permissions**, never “if title == Leader” string checks in isolation.

## 6.5 Default grant rule (approved)

When a role is assigned:

```text
Person receives ALL permissions defined on that role template
within the assignment’s scope
for as long as the assignment is effective
```

Examples:

```text
Person: John
1. Follow-Up Leader @ IEEC → YA → Follow-Up
   → all Follow-Up Leader template permissions in that team scope
2. Bible Study Leader @ IEEC → YA → Bible Study
   → all Bible Study Leader template permissions in that team scope
```

If Admin later adds a permission to the Follow-Up Leader template, John’s assignment receives it automatically (live templates). To withhold one permission from John only, add a **deny override**.

## 6.6 Time-bound assignments (approved)

Every role assignment supports:

- Optional start date
- Optional end date
- Active / inactive status

Expired or inactive assignments contribute **zero** permissions. Temporary Acting Team Leader, Conference Coordinator, and Event Volunteer Leader patterns rely on this instead of manual cleanup when possible.

Overrides may also be time-bound.

## 6.7 Follow-Up role template defaults

Detailed keys: `docs/modules/follow-up-permission-catalog.md`.

| Role template | Default posture |
| --- | --- |
| **Follow-Up Leader** | Full Follow-Up management permission set within team scope |
| **Follow-Up Assistant Leader** | **No** management permissions by default; add explicitly to template or via overrides |
| **Follow-Up Minister / team member** | Assigned-work operations only (own newcomers: report, attendance, non-sensitive bio, recommend membership) |

Assistant Leader title alone must not imply Leader authority. Basic assigned-work access comes from team membership / minister template, not from the Assistant title.

## 6.8 Permission resolution order

Evaluate for `(personId, organizationId, requestedPermission, requestedScope)`:

```text
0. System / platform restrictions (kill-switch, disabled account, archived person)
1. Explicit individual DENY override (effective in scope)        → DENY
2. Explicit individual GRANT override (effective in scope)      → ALLOW
3. Oversight assignment permissions (effective, matching scope)
4. Organizational-position permissions (effective, matching scope)
5. Team-role template permissions from effective assignments
6. Basic team-membership / minister baseline permissions
7. Default DENY
```

Notes:

- “Matching scope” includes the requested scope and correctly inherited parent scopes **only where the permission definition and assignment say inheritance is allowed**. Do not invent cross-team inheritance.
- When unioning role templates, a permission is present if any effective assignment grants it—unless a deny override applies.
- Parent-organization oversight never silently includes child operational permissions (ADR-007).

### 6.8.1 Traceability

For debugging and audit UX, the engine should be able to explain:

- which assignments/overrides contributed
- why deny won
- whether time bounds excluded an assignment

## 6.9 Enforcement layers

| Layer | Duty |
| --- | --- |
| **React UI** | Show/hide routes, buttons, fields by effective permissions |
| **Firestore Security Rules** | Enforce the same decisions on reads/writes |
| **Cloud Functions / Admin SDK paths** | Re-check permissions for privileged workflows; write audit |
| **Workflow engine** | Gate transitions with required permissions + valid state |

Hiding a button is **not** security. Every sensitive write path must fail closed without permission.

## 6.10 Admin configuration surfaces

Authorized admins (scoped) may:

1. Maintain role templates (permission sets)
2. Assign / end-date / deactivate role assignments
3. Create grant/deny overrides with reason
4. Manage oversight and organizational position assignments
5. View permission traces for a Person (support/admin)

Template edits are live; communicate impact to admins in UI copy where practical.

## 6.11 Audit requirements

Audit at least:

- Role template create/update/delete (soft)
- Role assignment create/update/deactivate
- Override create/update/deactivate
- Oversight / position assignment changes
- Privilege-sensitive workflow overrides (`workflow.override`)

Audit records are append-only and protected from normal client modification (ADR-006).

## 6.12 Multi-organization authorization

- Every assignment and override is organization-scoped (or parent/platform where explicitly modeled).
- Resolving permissions for org A must ignore org B assignments.
- Platform system roles are separate from organization ministry roles.
- Cross-org data access requires an explicit permissioned workflow, not shared role bleed.

## 6.13 Module contract

Each module must publish:

1. Permission catalog (stable keys + intent)
2. Default role template mappings
3. Which actions are UI-only vs security-critical
4. Record-level rules (own vs all, assigned-only, sensitive fields)

Follow-Up is the reference implementation of this contract.

## 6.14 Chapter completion criteria

- Roles are scoped live templates with full default grant and override exceptions.
- Time-bound assignments are first-class (ADR-RBAC-003).
- Deny overrides win; default deny otherwise.
- Scopes never auto-cross teams/orgs.
- Follow-Up Leader / Assistant / Minister defaults match the approved posture.
- UI + Firestore rules (+ trusted functions) enforce the same resolved permissions.
- Permission changes and template edits are audited.
- Evaluation uses resolved permissions, not role title string checks alone.

## 6.15 Next chapter

Chapter 7 will define the Dynamic Forms Engine (configurable registration and operational forms, field sensitivity, and validation), which Follow-Up registration and weekly reports consume.
