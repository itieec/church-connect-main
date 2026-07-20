# ADR-001 — One Organization-Owned Person Record

**Status:** Approved (Architecture Handbook v0.3)

## Decision

One permanent Person record per individual **within each organization**.

## Consequences

- Status changes must never create a duplicate Person in the same organization
- The same human may have separate Person profiles in different organizations (not auto-merged)
- Modules reference Person; they do not create parallel person stores
