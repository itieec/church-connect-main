# Follow-Up Permission Catalog

**Source:** Link 2 — https://chatgpt.com/share/6a54dabb-eca4-83ea-b88e-fdae1dd5d0ff  
**Status:** Canonical for coding (Baseline v1.0)  
**RBAC rules:** ADR-RBAC-001/002/003 — roles are scoped live templates; assignment grants **all** template permissions in scope; overrides for exceptions; optional start/end dates.

## Governing rules (approved)

1. **Permission-based UI and security** — Firestore rules enforce the same checks; hiding a button is not security.
2. **Follow-Up Leader** → full Follow-Up management permissions by default (removable via overrides).
3. **Follow-Up Assistant Leader** → **no** management permissions by default.
4. Basic assigned-work access comes from **team membership / minister template**, not the Assistant title alone.
5. Scope example: Follow-Up Leader @ `IEEC → Young Adult → Follow-Up Team` does not grant Worship/Media leadership.

## Canonical permission keys

Use **plural** resource segments. Do not invent aliases in code.

### Newcomers / journeys

| Permission | Intent |
| --- | --- |
| `follow_up.view` | Base Follow-Up module access |
| `follow_up.newcomers.view_unassigned` | See unassigned queue |
| `follow_up.newcomers.view_all` | See all Follow-Up newcomers |
| `follow_up.journey.create` | Create journey |
| `follow_up.journey.mark_inactive` | Mark inactive |
| `follow_up.journey.close` | Close journey |
| `follow_up.journey.reopen` | Reopen journey |
| `follow_up.duplicate.review` | Resolve duplicate registrations |

### Assignments

| Permission | Intent |
| --- | --- |
| `follow_up.assignments.create` | Assign newcomer |
| `follow_up.assignments.reassign` | Reassign |

### Weekly reports

| Permission | Intent |
| --- | --- |
| `follow_up.reports.submit` | Submit weekly report |
| `follow_up.reports.edit_own` | Edit own report in window |
| `follow_up.reports.edit_locked` | Edit/reopen locked reports |
| `follow_up.reports.review` | Review / return / excuse |
| `follow_up.reports.view_all` | View all team reports |

### Attendance

| Permission | Intent |
| --- | --- |
| `follow_up.attendance.record_assigned` | Record attendance for own assigned newcomers (minister default) |
| `follow_up.attendance.view_all` | View all attendance |
| `follow_up.attendance.correct` | Correct attendance with history |

### Bio

| Permission | Intent |
| --- | --- |
| `follow_up.bio.view` | View bio entries |
| `follow_up.bio.add` | Add bio entries |
| `follow_up.bio.view_sensitive` | View sensitive bio |

### Membership

| Permission | Intent |
| --- | --- |
| `follow_up.membership_review.start` | Start readiness review |
| `membership.recommendations.submit` | Submit recommendation |
| *(workflow step permissions)* | Approve/reject per configurable approval workflow |

### Chat / welcome / calendar

| Permission | Intent |
| --- | --- |
| `follow_up.chat.create` | Create Follow-Up chat |
| `follow_up.chat.manage_members` | Manage chat membership |
| `follow_up.welcome_schedule.view` | View welcome schedule |
| `follow_up.welcome_schedule.create` | Create schedule entry |
| `follow_up.welcome_schedule.assign` | Assign welcomer |
| `follow_up.welcome_schedule.update` | Update schedule |
| `follow_up.welcome_schedule.cancel` | Cancel schedule |
| `calendar.event.create` | Create calendar event |
| `calendar.event.manage` | Manage events |
| `calendar.conflict.override` | Override calendar conflict |

### Workflow override

| Permission | Intent |
| --- | --- |
| `workflow.override` | Authorized workflow override (audited) |

---

## Default role templates

### Follow-Up Leader (full management set in team scope)

- `follow_up.view`
- `follow_up.newcomers.view_unassigned`
- `follow_up.newcomers.view_all`
- `follow_up.duplicate.review`
- `follow_up.assignments.create`
- `follow_up.assignments.reassign`
- `follow_up.reports.view_all`
- `follow_up.reports.review`
- `follow_up.reports.edit_locked`
- `follow_up.attendance.view_all`
- `follow_up.attendance.correct`
- `follow_up.bio.view`
- `follow_up.bio.add`
- `follow_up.membership_review.start`
- `follow_up.chat.create`
- `follow_up.chat.manage_members`
- `follow_up.welcome_schedule.view` / `.create` / `.assign` / `.update` / `.cancel`
- `calendar.event.create` / `calendar.event.manage`

### Follow-Up Assistant Leader

**No management permissions by default.** Add explicitly to template or via overrides.

### Follow-Up Minister / Team Member

- View **assigned** newcomers (limited contact fields)
- `follow_up.reports.submit`
- `follow_up.reports.edit_own`
- `follow_up.attendance.record_assigned`
- `follow_up.bio.add` / `follow_up.bio.view` (non-sensitive)
- `membership.recommendations.submit`
- Receive assignment/reminder notifications
- Escalate concerns

Does **not** by default: view all newcomers, assign/reassign, correct others’ attendance, edit locked reports, manage chat, start team-wide membership review.

---

## Resolution order

```text
System restrictions
  → Explicit individual denial
  → Explicit individual grant
  → Oversight permissions
  → Organizational-position permissions
  → Team-role permissions (live templates)
  → Basic membership permissions
  → Default deny
```

Backend checks **resolved permissions**, not role title alone. See handbook Chapter 6.
