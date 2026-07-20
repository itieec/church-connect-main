# ADR-007 — Federated Multi-Organization Tenant Model

**Status:** Approved (Architecture Handbook v0.3 §3.16)

## Decision

IEEC YA Connect supports multiple independent organizations grouped under an optional parent organization.

## Local ownership

Each organization owns and isolates its people, users, roles, permissions, ministry records, calendar, chat, files, configuration, and operational history.

## Parent access

Parent organizations receive only explicitly configured oversight, aggregate reporting, shared standards, announcements, and event capabilities.

## People

The same human may have separate organization-owned Person profiles. Profiles are not automatically shared or merged.

## Security consequence

Every operational record and permission assignment must be organization-scoped. Cross-organization access is denied by default.
