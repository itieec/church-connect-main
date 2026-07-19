# ADR-RBAC-003 — Time-Bound Role Assignments

## Status

**Approved — Yes**

## Sources

- Link 1 (Chapters 1–2): optional lifecycle/time control; volunteers as temporary / optionally time-based assignments
- Link 2: RBAC decision recommending effective start/end dates on role assignments
- Planning confirmation: do not re-open; already part of the access model

## Decision

Every role assignment supports:

- Start Date (optional)
- End Date (optional)
- Active/Inactive status

Temporary Acting Team Leader, Conference Coordinator, Event Volunteer Leader, and similar assignments can activate/expire without manual cleanup.

## Consequences

- Authorization checks must respect effective dating
- Expired assignments grant no permissions
- Aligns with Volunteer and lifecycle principles from Chapter 2
- Exceptions beyond dates still use permission overrides
