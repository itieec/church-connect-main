# Chapter 12 — Audit and History

**Status:** Draft handbook chapter (planning authority until PDF revision)  
**Depends on:** Chapters 4–11  
**Governing ADR:** ADR-006  

---

## 12.1 Purpose

The Audit Engine records important actions as append-only history so ministry operations remain accountable. Soft delete is the default for operational records; audit explains who changed what and why.

## 12.2 Design principles

1. **Soft delete by default**; hard delete is exceptional and separately governed.  
2. Audit records are **append-only** and protected from normal client modification.  
3. Prefer writing audit from **trusted backend** / controlled paths.  
4. Capture **before/after** or explicit action semantics for sensitive changes.  
5. Include **actor**, **permission context**, **timestamp**, **organization scope**.  
6. History must survive Person status changes and journey closure.  
7. React UI restrictions never replace backend enforcement or audit.

## 12.3 What must be audited (minimum)

| Domain | Examples |
| --- | --- |
| People | Status changes, merges, soft-delete/restore, sensitive profile edits |
| Auth / accounts | Invite, activate, disable, revoke, person↔account link changes |
| Permissions | Role template edits, assignments, overrides, oversight changes |
| Follow-Up | Registration decisions, assignments/reassigns, report submit/edit/lock, attendance create/correct, bio add/soft-delete, journey transitions |
| Membership | Recommendation submit, approval steps, Member transition |
| Calendar | Event create/update/cancel, conflict overrides, parent publish effects |
| Chat | Channel membership changes, moderation deletes |
| Workflow | Every transition; especially `workflow.override` |
| Parent oversight | Access to approved aggregates / shared reports |
| Files | Upload/delete of sensitive attachments |

## 12.4 Audit record shape (baseline)

`auditLogs/{auditId}`:

```ts
{
  organizationId: string
  actorPersonId: string | null
  actorAuthUid: string | null
  actorType: 'user' | 'system' | 'automation'
  action: string
  entityType: string
  entityId: string
  moduleKey: string | null
  previousValue: unknown | null
  newValue: unknown | null
  reason: string | null
  permissionKeys: string[] | null
  correlationId: string | null
  createdAt: Timestamp
}
```

Do not rely on mutable “last audit” fields alone.

## 12.5 Soft delete pattern

Operational docs use:

- `recordStatus` / `deletedAt` / `deletedByPersonId`  
- Queries default to non-deleted  
- Restore is a privileged, audited action  

Attendance corrections and report edits keep prior versions or correction history rather than inventing a clean rewrite.

## 12.6 Retention and access

- Audit access is highly privileged (`audit.view` or system-admin scoped).  
- Pastoral content inside audit payloads should be minimized; store refs + field diffs when possible.  
- Retention follows organization/legal policy; platform default is long retention for ministry accountability.  
- Export for incidents is admin-only and audited.

## 12.7 Correlation

Use `correlationId` (or workflow transition id) to group multi-doc transactions (e.g. Member approval updating Person + journey + assignments + notifications).

## 12.8 Chapter completion criteria

- Append-only org-scoped audit log exists.
- Required action classes above are covered for Follow-Up MVP paths.
- Soft delete + restore semantics documented and used.
- Client cannot freely rewrite audit history.
- Overrides and permission changes always audited.

## 12.9 Next chapter

Chapter 13 defines Data and Engineering Standards for Firestore modeling, security layers, testing, and AI/implementation conventions.
