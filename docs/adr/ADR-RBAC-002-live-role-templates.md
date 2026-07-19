# ADR-RBAC-002 — Role Templates Are Live

## Decision

Changes to a role template apply to all current and future assignments. Assignments do not snapshot permissions. Exceptions use individual permission overrides.

## Consequences

- Centralized role maintenance
- Overrides remain the escape hatch for special cases
