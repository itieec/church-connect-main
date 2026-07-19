# Follow-Up Workflows and State Transitions

**Source:** Link 2 — https://chatgpt.com/share/6a54dabb-eca4-83ea-b88e-fdae1dd5d0ff  
**Status:** Captured from design (Step 3.2 / Step 3.3.2)  
**Related:** [`follow-up.md`](../modules/follow-up.md) · Chapter 3

This document records the workflows already defined in the design thread. It does not invent new process rules.

---

## 1. Workflow design principles

The Follow-Up module uses explicit workflow states (not notes alone).

Every workflow must:

- Have a clear current state
- Define who may transition it
- Validate required conditions before transition
- Record actor, date/time, and reason when required
- Preserve full transition history
- Trigger notifications, reminders, or tasks when applicable
- Respect configurable approval and permission rules
- Allow authorized manual intervention
- Never silently overwrite history

States may be configurable for labels; critical system identifiers stay protected.

---

## 2. Main Follow-Up workflow

```text
Registration Submitted
        ↓
Duplicate Review (if needed)
        ↓
Newcomer Journey Created
        ↓
Awaiting Assignment
        ↓
Assigned
        ↓
Contact Initiated
        ↓
Active Follow-Up
        ↓
Membership Readiness Review
        ↓
Approval Workflow
        ↓
Transitioned to Member
```

**Alternative paths from Active Follow-Up:**

```text
Active Follow-Up
   ├── Temporarily Paused
   ├── Unable to Contact
   ├── Declined Follow-Up
   ├── Moved Away / Other Ministry
   ├── Referred for Pastoral Care
   ├── Inactive
   └── Journey Closed
```

**Core operating loop (as stated in design):**

```text
Newcomer registers
  → Follow-Up Leader / Assistant assigns to Team Member
  → Team Member contacts every week
  → Submits weekly report on predefined form
  → Records Saturday attendance separately
  → May add bio notes
  → Leadership reviews; membership recommendation when ready
```

---

## 3. Newcomer journey states

Journey is separate from the Person’s permanent ministry status. One current state per journey.

| State | Meaning |
| --- | --- |
| `registration_pending` | Registration submitted; processing incomplete |
| `duplicate_review_required` | Possible existing person / duplicate found |
| `awaiting_assignment` | Active journey; no follow-up minister assigned |
| `assigned` | At least one active follow-up assignment |
| `contact_initiated` | First contact attempted |
| `active_follow_up` | Regular follow-up in progress |
| `temporarily_paused` | Intentionally paused |
| `unable_to_contact` | Repeated contact attempts failed |
| `inactive` | No longer participating consistently |
| `membership_review_ready` | Ready for membership review (Person still Newcomer) |
| `membership_approval_in_progress` | Recommendation under approval |
| `transitioned_to_member` | Approved; Person status becomes Member |
| `declined_follow_up` | Person requested no further follow-up |
| `moved_to_other_ministry` | Continuing elsewhere |
| `journey_closed` | Ended without Member transition |
| `reopened` | Previously closed journey reactivated |

UI labels may be renamed; internal IDs stay stable.

---

## 4. Registration workflow

### Sources

Public web form, QR page, mobile app, admin/internal form, staff-assisted, event check-in, import. Record the source.

### Steps

1. **Form submission** → `registration_pending`  
   Validate required fields, phone/email, consent, spam controls on public forms.
2. **Duplicate detection** (no auto-merge)
   - No match → create/link Person, create journey, welcome message, notify leaders → `awaiting_assignment`
   - Possible match → `duplicate_review_required`  
     Authorized user may link, create new journey, update contacts, mark duplicate, create new person if false match, or escalate. All decisions audited.
3. Person ministry status becomes **Newcomer** when journey is established.

Public registration fields (core workflow): first name, last name, sex, phone, email, preferred contact method (call/text), preferred contact time, optional photo, consent.

---

## 5. Assignment workflow

### Assignment statuses (separate from journey)

`pending` · `active` · `paused` · `reassignment_requested` · `ended` · `cancelled`

### Assignment types

`primary` · `secondary` · `supporting` · `temporary`

### Creating an assignment

Authorized: Follow-Up Team Leader, Assistant Leader, or `follow_up.assignments.create`.

Select journey, assigned minister, type, primary/secondary, start/optional end, supervising leader, notes, expected frequency.

If an active assignment already exists, warn and show current assignment details. Leader may:

- Cancel
- Add another Team Member
- Replace / end previous and reassign
- Change primary

Preserve full assignment history. Reassignment ends prior assignment (`ended` + reason + end date); does not delete reports/history.

### On activation

- Assignment → `active`
- Notify assigned Team Member (in-app; push optional)
- Create first-contact task + deadline
- Journey: `awaiting_assignment` → `assigned`

Notification includes: name, phone, preferred method/time, assignment date, first-contact deadline.

---

## 6. First contact workflow

Configurable deadline (e.g. 24h, 48h, before next event).

### Outcomes

Reached · No answer · Left message · Invalid phone · Contact later · Other channel · Declined follow-up · Needs pastoral support · Emergency · Other

### Transitions

```text
Successful contact:
assigned → contact_initiated → active_follow_up

Unsuccessful attempt:
remain assigned  OR  move to contact_initiated (configurable)
+ create next-contact task

Repeated failures (configurable count):
contact_initiated → unable_to_contact
(+ notify leader / escalation / reassignment options)

Declines follow-up:
assigned | active_follow_up → declined_follow_up
(reason + note required)
```

---

## 7. Active follow-up workflow

Entered when contact is established, participation is ongoing, weekly reports are expected, and an active assignment exists.

System tracks: contact attempts, weekly reports, **attendance**, prayer requests, participation, needs, next actions, concerns, membership readiness, assignment activity.

Weekly contact continues while journey and assignment are active, person is not yet Member, and assignment is not paused/ended/reassigned.

Preferred contact methods: call / text; other methods allowed when needed.

---

## 8. Weekly reporting workflow

### Cycle

One report per active journey + active assignment + reporting week. Primary assignee is responsible by default; secondary may add notes without duplicate weekly report unless configured otherwise.

### Deadline (default)

```text
Friday = On time
Saturday or later = Late
```

Exact Friday time + timezone are configurable. Late reports are accepted but marked late.

### Report statuses

`not_open` · `pending` · `draft` · `submitted_on_time` · `submitted_late` · `missing` · `excused` · `returned_for_correction` · `resubmitted` · `reviewed` · `approved` (if enabled)

### Reminders (default, configurable)

Thu upcoming · Fri due · Sat late · Sun missing escalation to Leader/Assistant · weekly leadership summary

### Editing

Default **7-day** edit window (configurable). Revisions versioned; original submission time unchanged; late does not become on-time. After window: locked; author may request reopen; leader may reopen with reason; history kept.

### Missing reports

`pending` → `missing` → notify minister + leader, dashboard flag, compliance task. Repeated misses may trigger coaching/reassignment **only if automation enabled**.

### Report still required when no contact

e.g. Contact result = No answer, with attempt date/method and next action.

**Attendance is not stored inside the weekly report.**

---

## 9. Attendance workflow (Follow-Up MVP — as specified)

Aligned with approved attendance rules:

- One ministry calendar; Saturday program **6:30 PM–9:30 PM**
- Assigned Follow-Up member records attendance on the newcomer dashboard
- User only selects status for that Saturday calendar event
- Separate collection from weekly report
- MVP statuses: `attended` · `did_not_attend` · `unknown`
- Uniqueness: `personId + calendarEventId`
- Leaders may correct with history retained
- Attendance informs readiness; **never sole factor** for Member

(Broader future attendance channels/states in the design handbook may expand later; MVP follows the Saturday select-status model.)

---

## 10. Temporary pause workflow

```text
active_follow_up → temporarily_paused → active_follow_up (or other appropriate state)
```

Reasons: travel, illness, family, school/work, newcomer request, minister unavailable, pastoral decision, seasonal closure, other.

Pause record: reason, start, expected resume, approver, reminders suspended?, weekly reports still required?, notes, review date. Notify leader at review date.

---

## 11. Inactivity workflow

```text
active_follow_up → inactive → active_follow_up | journey_closed
```

May require: min contact attempts, leadership review, reason, last successful contact, attendance review, summary.

---

## 12. Pastoral / emergency escalation

May start from a report or immediately (not waiting for weekly cycle).

Escalation states: `submitted` · `under_review` · `assigned` · `action_in_progress` · `resolved` · `closed` · `referred_externally`

Visibility by sensitivity category; creating escalation must not auto-expose full report. Separate audit trail.

---

## 13. Membership readiness workflow

```text
active_follow_up → membership_review_ready
```

Does **not** change Person status yet.

Criteria examples: consistent participation, willingness to continue, required info complete, configured attendance/participation met, minister believes ready. **Not automatic by time alone.**

### Recommendation

Minister submits recommendation (participation/attendance/follow-up summaries, willingness, concerns, comments, next steps):

```text
draft → submitted
journey → membership_approval_in_progress
```

---

## 14. Configurable approval workflow

Template-driven. Examples:

```text
Follow-Up Minister → Follow-Up Leader → Core Team → Head Leader
```

or simpler:

```text
Follow-Up Minister → Follow-Up Leader
```

Step states: `pending` · `approved` · `rejected` · `returned_for_correction` · `skipped` · `cancelled` · `expired`

Approver actions: approve, reject, return, request info, delegate/abstain/cancel when allowed. Reject/return require comment.

### Outcomes

- **Approved:** Person → Member; journey → `transitioned_to_member`; effective date; history; notify; optional G5/Bible Study; onboarding tasks; complete follow-up assignments
- **Returned:** stays `membership_approval_in_progress`; revise and resubmit
- **Rejected:** journey returns to `active_follow_up` or `membership_review_ready`; does **not** auto-close journey

---

## 15. Transition to Member

```text
membership_approval_in_progress → transitioned_to_member
```

System actions: update Person status, keep Newcomer in history, complete journey, end assignments, notifications, optional G5/BS notify, onboarding tasks, preserve all follow-up records. Must be transactional / safely recoverable.

---

## 16. Journey closure (without Member)

```text
active_follow_up | inactive | unable_to_contact | declined_follow_up
        ↓
  journey_closed
```

Requires reason, date, actor, final summary, future-contact flags, reopen allowed?. **Does not delete Person.**

---

## 17. Returning person / reopen

- Search existing Person; reuse profile; previous journeys unchanged; **new journey** with reference to previous when appropriate
- Closed previous → new journey `awaiting_assignment`
- Inactive open → reopen, close+create new, or continue (configurable)
- Existing **Member** must not auto-revert to Newcomer (separate re-engagement workflow later)

Reopen closed journey:

```text
journey_closed → reopened → awaiting_assignment | active_follow_up
```

Requires reason, actor, whether prior assignments resume, new reporting cycle?, notifications?. Keep original closure in history.

---

## 18. Workflow permissions (examples)

| Action | Example permission |
| --- | --- |
| Create journey | `follow_up.journey.create` |
| Review duplicates | `follow_up.duplicate.review` |
| Assign / reassign | `follow_up.assignments.create` / `.reassign` |
| Submit / edit report | `follow_up.reports.submit` / `.edit_own` / `.edit_locked` |
| Mark inactive / close / reopen | `follow_up.journey.mark_inactive` / `.close` / `.reopen` |
| Membership recommend / approve | `membership.recommendation.submit` / workflow step |
| View sensitive escalation | category-based |
| Override workflow | `workflow.override` |

Role title alone is not enough — permissions come from templates, positions, oversight, overrides, and workflow approver assignments. Default grant still applies: assigned role → all template permissions in scope.

---

## 19. Audit requirements

Every transition records: workflow type, record id, previous/new state, action, actor, permission source, timestamp, reason/comments, related approval/assignment, automation/override flags.

---

## 20. Admin-configurable items

State labels, allowed transitions, required fields, permissions, report deadlines/reminders, escalation rules, first-contact deadline, failed-attempt threshold, membership approval steps, edit windows, pause/closure reasons, sensitive categories, notification templates, automation on/off.

Guardrails: no approval path without final outcome; no Member transition without approval path; no deadline without timezone; no assignment workflow without assigner; no sensitive category without viewer; no circular approvals.
