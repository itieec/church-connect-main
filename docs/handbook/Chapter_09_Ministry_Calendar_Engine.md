# Chapter 9 — Ministry Calendar Engine

**Status:** Draft handbook chapter (planning authority until PDF revision)  
**Depends on:** Chapters 3, 6  
**Governing ADR:** ADR-003  

---

## 9.1 Purpose

Each organization has **one shared operational calendar**. Ministries, teams, and groups create events inside that calendar under permission and conflict rules. Modules (Follow-Up attendance, welcome schedules, events) link to calendar events; they do not invent separate calendars.

## 9.2 Design principles

1. **One calendar per organization** (ADR-003).  
2. Events declare organizing scope (org / ministry / team / group) but live in the shared calendar.  
3. Conflict policies are explicit: informational, warning, approval-required, or hard-block.  
4. Parent events affect selected organizations only through declared scope and policy.  
5. Parent events must **not** silently delete local events.  
6. Attendance and schedules reference `calendarEventId`.  
7. Timezones are first-class (organization default; event may override when needed).

## 9.3 Event model (baseline)

`calendarEvents/{eventId}` includes at least:

- `organizationId`  
- Title, description  
- `startAt` / `endAt` / timezone  
- Organizing team/ministry/group ids as applicable  
- `eventScope`, `eventPriority`, `conflictPolicy`  
- Recurrence metadata (or link to parent recurring series)  
- `eventStatus` (`scheduled`, `cancelled`, …)  
- Audit fields  

### Follow-Up Saturday program (approved MVP)

- Weekly Saturday **6:30 PM–9:30 PM** (org timezone, e.g. `America/New_York`)  
- Used as the attendance target for newcomers  
- Unique attendance: `personId + calendarEventId`

## 9.4 Recurrence

- Support recurring series with materialised or queryable occurrences for operational weeks.
- Attendance links to the **occurrence** used for that Saturday, not only the series template.
- Cancelling one occurrence must not erase historical attendance already recorded.

## 9.5 Conflict rules

When creating/updating an event:

1. Detect overlaps in the shared org calendar per policy.  
2. `hard_block` — reject or require override permission (`calendar.conflict.override`).  
3. `warning` / `approval_required` — allow draft pending resolution.  
4. Overrides and exceptions are audited.

Organization-reserved program times (Saturday YA program) may use hard-block against conflicting bookings when configured.

## 9.6 Parent-organization events

Per Chapter 3:

- Parent declares affected organizations.  
- Declares informational vs warning vs approval-required vs hard-blocking.  
- Conflict with local events notifies local owners and enters review — no silent delete.  
- Parent calendar overrides are audited.  
- Publishing a parent event does not grant parent users access to local Person pastoral data.

## 9.7 Attendance linkage

Calendar Engine provides events; **attendance records** are module/domain data:

- Follow-Up: `newcomerAttendance` with statuses `attended` | `did_not_attend` | `unknown`  
- Separate from weekly reports  
- Leaders may correct with history  

Future modules (Members, Events) may attach other attendance types to the same calendar without forking calendars.

## 9.8 Welcome schedules

Welcome schedule rows may reference `calendarEventId` + assigned welcomer Person. Extra fields may use Dynamic Forms (Chapter 7).

## 9.9 Permissions

Examples:

- `calendar.event.create`  
- `calendar.event.manage`  
- `calendar.conflict.override`  
- Module permissions for recording attendance remain on Follow-Up / other modules  

## 9.10 Chapter completion criteria

- Single shared org calendar; no module-private calendars.
- Recurrence + timezone support sufficient for weekly Saturday program.
- Conflict policies and audited overrides.
- Parent events scoped, non-destructive, auditable.
- Follow-Up attendance uniquely keys on `personId + calendarEventId`.

## 9.11 Next chapter

Chapter 10 defines Chat and Collaboration, which remains independent of team membership and calendar attendance.
