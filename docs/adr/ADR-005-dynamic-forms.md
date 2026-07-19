# ADR-005 — Dynamic Forms as a Shared Platform Service

**Status:** Approved (Architecture Handbook v0.3)

## Decision

Forms and workflows are configurable where practical via a shared Dynamic Form Engine. Published forms are versioned so submissions keep the structure used at submit time.

## Consequences

- Follow-Up weekly reports, registration, and welcome schedules should use form definitions rather than hard-coded-only schemas where practical
- Configuration must not weaken security or allow invalid workflows
