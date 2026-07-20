# Authorization Engine (RBAC)

**Canonical source:** Handbook Chapter 6 draft (`docs/handbook/Chapter_06_Authorization_and_Permission_Engine.md`) + Handbook v0.3 §2.4 + Follow-Up link 2 detail

## ADR-RBAC-001 — Roles are templates (Approved)

A role is a reusable template that groups permissions. It grants no authority until assigned within a specific scope.

- A person may have multiple roles
- The same role may be assigned multiple times in different scopes
- Permissions are always evaluated within the assignment scope
- Roles never bypass the permission engine

### Default grant rule (Approved)

**By default, a person receives all permissions defined on their assigned role template(s), within each assignment’s scope.**

- No extra per-permission setup is required at assignment time
- Assigning “Follow-Up Leader” means they get every permission currently on that template for that scope
- Exceptions are handled only through **permission overrides** (grant or deny), not by stripping permissions during assignment

Example:

```text
Person: John
1. Follow-Up Leader @ IEEC → Young Adult → Follow-Up Team
   → receives all Follow-Up Leader permissions in that team scope
2. Bible Study Leader @ IEEC → Young Adult → Bible Study Team
   → receives all Bible Study Leader permissions in that team scope
```

## ADR-RBAC-002 — Role templates are live (Approved — Option A)

Role templates are the single source of truth. Updating a template applies to all current and future assignments. Do not snapshot permissions onto assignments. Exceptions use individual permission overrides.

Because of the default grant rule + live templates: if Admin adds a permission to the Follow-Up Leader role, everyone currently assigned that role gets it automatically (within scope).

## ADR-RBAC-003 — Time-bound assignments (Approved — Yes)

Every role assignment supports optional start date, end date, and active/inactive status. Temporary leadership and volunteer coverage expire automatically. This matches Chapter 2 lifecycle/time-control and temporary assignment principles from link 1.

## Evaluation algorithm

1. Resolve active role assignments for `(personId, organizationId)` within the requested scope chain.
2. Union permissions from assigned role templates.
3. Apply grant overrides, then deny overrides.
4. Default deny if the permission is still absent.
5. Write an audit event for permission-mutating operations.

## Follow-Up permission examples

- `follow_up.view`
- `follow_up.assignments.create`
- `follow_up.reports.submit`
- `follow_up.reports.edit_own`
- `follow_up.reports.review`
- `follow_up.chat.manage_members`
- `follow_up.bio.view_sensitive`
- `membership.recommendations.submit`
- `follow_up.membership_review.start`

Canonical catalog: `docs/modules/follow-up-permission-catalog.md`.
