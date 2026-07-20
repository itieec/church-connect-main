# Config defaults (Follow-Up) — for Configuration Engine

Captured from link 2 design so coding does not re-ask. All are Admin-editable later.

| Key | Default |
| --- | --- |
| `follow_up.report.due_day` | Friday |
| `follow_up.report.late_from` | Saturday |
| `follow_up.report.timezone` | Organization timezone (e.g. `America/New_York`) |
| `follow_up.report.edit_window_days` | 7 |
| `follow_up.first_contact.deadline_hours` | 48 |
| `follow_up.welcome_message.enabled` | true |
| `follow_up.assignment.primary_reports_only` | true |
| `follow_up.attendance.enabled` | true |
| `follow_up.attendance.program` | Saturday 6:30 PM–9:30 PM via `calendarEvents` |
| `follow_up.attendance.statuses` | `attended`, `did_not_attend`, `unknown` |
| `follow_up.membership.approval_workflow` | Configurable (example: Minister → Leader → Core Team) |
| `follow_up.leader_role.default_full_management` | true |
| `follow_up.assistant_role.default_management` | false (none by default) |

Related: `docs/modules/follow-up-permission-catalog.md`, workflows doc, Firestore model.
