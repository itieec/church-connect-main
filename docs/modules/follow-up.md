# Follow-Up Module Requirements

**Status:** Step 3 requirements draft  
**Canonical source:** https://chatgpt.com/share/6a54dabb-eca4-83ea-b88e-fdae1dd5d0ff

Follow-Up is the first complete ministry module and establishes patterns for Bible Study, G5, Worship, Media, Usher, and other teams.

## 3.1 Purpose

Manage the relationship between IEEC YA and newcomers from initial registration until they are ready to transition into active membership.

Goals:

- Ensure every newcomer is contacted and cared for
- Assign clear responsibility for each person
- Record all follow-up activity
- Identify spiritual, personal, and practical needs
- Prevent newcomers from being forgotten
- Support the transition from newcomer to member
- Provide leadership with visibility into progress and concerns

## 3.2 Team structure

### Team Leader

View all newcomers; assign/reassign; manage team membership requests; view/create/update/remove follow-up records; review overdue follow-ups; approve or recommend status changes; view reports; configure follow-up rules when permitted; send team announcements.

### Assistant Leader

View all newcomers; assign/reassign; view/create/update follow-up records; review overdue follow-ups; send notifications when permitted; recommend transitions; support the Team Leader.

### Follow-Up Minister

View assigned newcomers; limited contact info; add follow-up updates; update own entries; view assigned history when permitted; record needs/attendance/responses/next steps; receive reminders; escalate concerns.

Deleting records, viewing sensitive information, or accessing newcomers assigned to other ministers requires separate permission.

## 3.3 Registration channels

Public web form, QR link, mobile app, and internal form for authorized users. Public registration must not require an account.

Collectable fields: first/middle/last/preferred name, phone, email, sex, DOB or age range, address, preferred language, first visit date, how heard, who invited, preferred contact method, prayer request, notes, consent.

Each field is configurable as required / optional / hidden / internal only. Public form must not expose internal notes or admin fields.

## 3.4 Registration processing

1. Duplicate check (manual review; no auto-merge)  
2. Create/update Person  
3. Ministry status = `Newcomer`  
4. Create newcomer journey  
5. Notify Follow-Up Team Leader and Assistant Leader  
6. Enter unassigned queue  
7. Assign to follow-up minister  
8. Notify assignee  
9. Calculate first follow-up deadline  
10. Audit all actions  

## 3.5 Assignment

A newcomer may have one primary minister, optional secondary, supervising leader, start/end dates, reason, and status (`pending`, `active`, `temporarily_paused`, `reassigned`, `completed`, `cancelled`).

Keep full assignment history. Reassignment must not erase prior assignment or follow-up history.

Assignment may be manual or rule-based (workload, sex, language, location, age group, inviter, other configurable rules). Automatic assignment is optional.

## 3.6 Follow-up records (weekly report)

Every interaction may be recorded as a weekly follow-up report/entry (newcomer, minister, contact datetime/method/outcome, summary, prayer request, need, spiritual progress, next action/date, escalation, visibility, attachments, audit fields).

Contact methods and outcomes are configurable (phone, text, WhatsApp, email, in person, video, social, other; reached, no answer, left message, wrong info, contact later, not interested, attended, pastoral attention, completed, other).

**Attendance is not stored inside the weekly report.**

## 3.6A Newcomer attendance (Approved)

From the design thread: attendance during follow-up is **On**, with these rules.

### How it works

- One **ministry-wide calendar** for the organization
- Regular program: **Saturday, 6:30 PM–9:30 PM**
- Newcomer profile dashboard lets the assigned Follow-Up member: view history, add weekly report, **add attendance**, add bio notes
- For attendance, the user **only selects a status for that specific Saturday program date** (linked calendar event)
- Recorded by the **assigned Follow-Up team member**, each week, **separate from the weekly report**
- Can be recorded even if the weekly report is not submitted yet
- Weekly report may reference attendance but must not embed it
- Leaders/Assistants may review and **correct** attendance when permitted; corrections keep history
- Attendance is one factor for membership readiness — **never the only factor**

### MVP attendance statuses

- `attended`
- `did_not_attend`
- `unknown`

### Planning data shape

Collection: `newcomerAttendance/{attendanceId}`

Fields: organizationId, personId, journeyId, assignmentId, calendarEventId, programDate, attendanceStatus, recordedByPersonId, recordedAt, updatedAt, updatedByPersonId

**Uniqueness:** one record per `personId + calendarEventId`.

## 3.7 Schedule

Configurable schedule example: first contact within 24–48h, second within one week, weekly updates, monthly leadership review, escalation after failed contact attempts.

Lifecycle controls: enable/disable deadlines and reminders, reminder frequency, escalation rules, pause, manual deadline changes with audit reason.

## 3.8 Journey status (separate from Person)

`newly_registered`, `awaiting_assignment`, `assigned`, `contact_initiated`, `actively_participating`, `inconsistent_participation`, `unable_to_contact`, `temporarily_inactive`, `ready_for_membership_review`, `transitioned_to_member`, `declined_continued_follow_up`, `moved_to_another_ministry`, `archived`.

Statuses are configurable; some system statuses may remain protected.

## 3.9 Transition to member

Not automatic by time alone. Criteria may include participation period, attendance, completed follow-up, orientation/discipleship, ministry expectations, leadership review, completed profile fields.

Recommended process: minister recommends → Follow-Up Leader reviews → Core Team / authorized leader approves → ministry status becomes Member → journey completed → optional G5/Bible Study assignment → history + notifications. Approving authority must be configurable.

## 3.10 Sensitive information

Visibility levels: assigned minister only, Follow-Up leadership, selected ministry leaders, pastoral/Head Leader, general follow-up history.

Sensitive notes require explicit permission. System admins do not automatically receive ministry-content access. Safeguarding escalations use a separate stricter path.

## 3.11 Notifications

Trigger on registration, assignment/change, approaching/overdue deadlines, missing weekly update, escalations, membership recommendation/decision, no successful contact, return after inactivity.

Channels: in-app, push, email, SMS/WhatsApp (future). Users control non-critical prefs; critical alerts may be mandatory for responsible roles.

## 3.12 Dashboards

**Minister:** assigned newcomers, due today, overdue, recent activity, next actions, notifications.  
**Leader:** active/unassigned/new registrations, completed/overdue, no successful contact, workload, ready for review, transition rate, average first-response time, inactive, escalations.

## 3.13 History and audit

Retain history for registration, assignments/reassignments, entries, status changes, recommendations, approvals/rejections, sensitive access, corrections, archive/restore. Soft-delete entries; keep originals for authorized auditors.

## 3.14 Core entities

`people`, `newcomerJourneys`, `followUpAssignments`, `followUpEntries` (weekly reports), `newcomerAttendance`, `newcomerBioEntries`, `calendarEvents`, `followUpTasks`, `membershipRecommendations`, `statusHistory`, `notifications`, `auditLogs`, `configurations`

Team membership and permissions stay in shared Organization / RBAC engines.

## Open decisions (admin-configurable policies; defaults TBD)

1. Who gives final membership approval (Follow-Up Leader, Core Team, Head Leader, or configurable workflow)?  
2. Can one newcomer be actively assigned to more than one follow-up minister?  
3. Should ministers see complete history or only post-assignment records?  
4. Can ministers edit previous entries, and for how long?  
5. Expected minimum follow-up frequency?  
6. Exact ready-for-member conditions?  
7. Which fields are sensitive/pastoral?  
8. Automatic welcome messages after registration?  
9. ~~Track attendance during follow-up?~~ **Resolved — Yes**, per §3.6A (Saturday program attendance via calendar; separate from weekly report)  
10. Multiple newcomer journeys if a person leaves and returns?  

**Next design sections:** Workflows & state transitions are documented in [`follow-up-workflows-and-state-transitions.md`](follow-up-workflows-and-state-transitions.md). Next: Firestore data model + permission catalog.
