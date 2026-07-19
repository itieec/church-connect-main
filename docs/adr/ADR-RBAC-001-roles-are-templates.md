# ADR-RBAC-001 — Roles Are Templates

## Decision

A role is a reusable permission template. It has no authority until assigned within a scope. A person may hold the same role in multiple scopes.

**Default grant:** When a role is assigned, the person receives **all permissions defined on that role template**, evaluated within the assignment scope. Admins do not pick permissions one-by-one at assignment time.

Exceptions use permission overrides (grant/deny), not a reduced assignment copy.

## Consequences

- Avoid duplicate role definitions per ministry
- Permission evaluation is always scope-aware
- Role assignment stays simple: pick person + role + scope
- Role template remains the single source of permissions for that assignment