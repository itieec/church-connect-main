# People & Access Model

**Canonical source:** Handbook Chapter 6 + Follow-Up permission catalog (canonical plural keys)  
**Status:** Baseline v1.0 — use catalog keys as written; do not reintroduce singular aliases

## Separations (approved)

| Concept | Meaning | Not the same as |
| --- | --- | --- |
| **Ministry Status** | Newcomer → Member → Minister journey stage | Leadership role |
| **System Role** | Super Admin, System Admin, Support Admin | Ministry authority |
| **Organizational Position** | Head Leader, Core Team | Team membership |
| **Team Role** | Team Leader, Assistant Leader, Minister | System admin rights |
| **Oversight Assignment** | Can oversee selected teams | Operational team membership |
| **Volunteer** | Temporary assignment | Ministry status |

## Person vs User Account

- A **Person** may exist without login (public newcomer registration).
- A **User Account** authenticates into the platform and must link to an organization-owned Person.
- Organizations own independent person profiles; profiles are not auto-merged across orgs.

## Permission principles

- Default deny
- Roles provide default permissions
- Individual overrides can grant or revoke
- Permissions are dynamic and evaluated inside an assignment **scope**
- Soft delete by default
- Audit all permission changes
- Separate technical authority from ministry authority
- Separate oversight from team membership
- Least-privilege security

## Permission scopes

`platform` · `parent_organization` · `organization` · `ministry` · `team` · `group` · `specific_record`
