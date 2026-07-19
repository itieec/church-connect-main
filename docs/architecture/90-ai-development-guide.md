# AI Development Guide

**Canonical source:** Architecture Handbook v0.3 + Ch. 4–13 drafts (`docs/handbook/`) + Follow-Up docs

**Coding:** use `docs/AI_CODING_HANDOFF_PROMPT.md` in a separate Cursor account. This planning agent does not write app code.

## Current phase

**Planning / architecture only.**

AI coding sessions must **not** create application code, Firebase rules, Cloud Functions, or UI scaffolds until Architecture Baseline v1.0 is explicitly approved for implementation.

Allowed now:

- Architecture handbook chapters
- ADRs
- SRS / module requirements
- Data dictionary drafts
- Permission / workflow catalogs
- Decision logs

Not allowed yet:

- React / Expo (React Native) / other app code
- Deployable Firestore rules or indexes as product delivery
- Feature implementation PRs

## When implementation begins (later)

1. Read `docs/SOURCE_OF_TRUTH.md`
2. Read `docs/architecture/00-platform-blueprint.md`
3. Check relevant ADRs in `docs/adr/`
4. Classify the change as **Engine** or **Module**
5. Prefer extending engines over adding module-local infrastructure
6. Default deny; soft-delete; audit permission and status changes
7. Do not treat pending ADRs as approved product policy
