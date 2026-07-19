# ADR-006 — Soft Delete and Audit by Default

**Status:** Approved (Architecture Handbook v0.3)

## Decision

Soft delete by default. Important actions and changes are audited. Audit records should be append-only and protected from normal client modification.

## Consequences

- Attendance corrections, permission changes, assignments, reports, status changes, and workflow decisions write audit history
- React UI restrictions never replace backend enforcement
