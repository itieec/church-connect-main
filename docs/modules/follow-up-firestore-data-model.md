# Follow-Up Firestore Data Model

**Source:** Link 2 — https://chatgpt.com/share/6a54dabb-eca4-83ea-b88e-fdae1dd5d0ff  
**Status:** Planning draft (collections + fields only; no app code)  
**Related:** [`follow-up.md`](follow-up.md) · [`follow-up-workflows-and-state-transitions.md`](follow-up-workflows-and-state-transitions.md)

## Design rules

- Most operational records are **top-level collections** with `organizationId`
- **Person** holds only basic profile data; journeys, reports, attendance, bio, and audit stay separate
- **Person ≠ User Account**
- Soft delete / history for sensitive operational records
- Growing lists (messages, reports, attendance) are not huge arrays inside one document

---

## Shared platform collections (used by Follow-Up)

### `people/{personId}`

```ts
{
  organizationId: string
  firstName: string
  lastName: string
  normalizedFirstName: string
  normalizedLastName: string
  sex: string
  phone: { display: string, normalized: string }
  email: { address: string, normalized: string, verified: boolean }
  contactPreference: {
    method: 'call' | 'text' | string
    preferredTime: string | null
    customTimeNote: string | null
  }
  photoFileId: string | null
  currentMinistryStatus: 'newcomer' | 'member' | 'minister' | string
  recordStatus: 'active' | string
  hasUserAccount: boolean
  activeJourneyId: string | null
  createdAt: Timestamp
  createdBy: string
  updatedAt: Timestamp
  updatedBy: string
}
```

### `userAccounts/{authUid}`

Document ID = Firebase Auth UID.

```ts
{
  organizationId: string
  personId: string
  email: string
  accountStatus: 'active' | string
  emailVerified: boolean
  invitationStatus: string
  invitedAt: Timestamp | null
  activatedAt: Timestamp | null
  lastLoginAt: Timestamp | null
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

A Person may exist without a User Account.

### RBAC (shared)

- `roleTemplates/{roleId}`
- `roleAssignments/{assignmentId}` — includes scope + optional `startDate` / `endDate` / active flag (ADR-RBAC-003)
- `permissionOverrides/{overrideId}`
- `oversightAssignments/{id}`
- `teamMemberships/{id}`
- `organizationalPositionAssignments/{id}`

### `calendarEvents/{eventId}`

One ministry calendar for the organization. Saturday program example:

```ts
{
  organizationId: string
  title: 'IEEC YA Saturday Program'
  description: string | null
  organizingTeamId: string | null
  eventScope: 'organization'
  eventPriority: 'organization_reserved'
  conflictPolicy: 'hard_block'
  startAt: Timestamp
  endAt: Timestamp
  timezone: string // e.g. America/New_York
  recurrence: {
    enabled: true
    frequency: 'weekly'
    daysOfWeek: ['saturday']
  }
  parentRecurringEventId: string | null
  eventStatus: 'scheduled' | string
  createdByPersonId: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

Regular time: **Saturday 6:30 PM–9:30 PM**

### Other shared (referenced)

`notifications` · `tasks` · `formDefinitions` · `formSubmissions` · `files` · `auditLogs` · `chatChannels` / `chatMemberships` / `chatMessages`

---

## Follow-Up module collections

### `newcomerJourneys/{journeyId}`

A Person may have multiple journeys.

```ts
{
  organizationId: string
  personId: string
  registrationDate: Timestamp
  registrationSource: 'public_web' | string
  journeyStatus: string // see workflow doc
  membershipReadinessStatus: 'not_ready' | string
  previousJourneyId: string | null
  isCurrentJourney: boolean
  welcomeMessageStatus: 'sent' | string | null
  startedAt: Timestamp
  completedAt: Timestamp | null
  closureReason: string | null
  createdAt: Timestamp
  createdBy: string
  updatedAt: Timestamp
  updatedBy: string
}
```

Journey statuses (from entity model):  
`awaiting_assignment` · `assigned` · `active_follow_up` · `paused` · `unable_to_contact` · `inactive` · `ready_for_membership_review` · `membership_approval_in_progress` · `transitioned_to_member` · `declined_follow_up` · `closed` · `reopened`  
(Align with full workflow-state list in the workflows doc; some UI labels map to these IDs.)

### `followUpAssignments/{assignmentId}`

```ts
{
  organizationId: string
  journeyId: string
  newcomerPersonId: string
  assignedPersonId: string
  assignmentType: 'primary' | 'secondary' | 'supporting' | 'temporary'
  assignmentStatus: 'pending' | 'active' | 'paused' | 'reassignment_requested' | 'ended' | 'cancelled'
  reportingRequired: boolean
  startDate: Timestamp
  endDate: Timestamp | null
  assignedByPersonId: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

Warn before creating another active assignment for the same journey.

### `followUpReports/{reportId}`

**Attendance must not be stored here.**

```ts
{
  organizationId: string
  journeyId: string
  newcomerPersonId: string
  assignmentId: string
  reportingWeekStart: Timestamp
  reportingWeekEnd: Timestamp
  dueAt: Timestamp
  contactMade: boolean
  expectedToAttend: 'yes' | 'no' | 'maybe' | 'unknown'
  formDefinitionId: string
  formVersion: number
  dynamicResponses: Record<string, unknown>
  reportStatus: string
  submittedByPersonId: string | null
  submittedAt: Timestamp | null
  originalSubmittedAt: Timestamp | null // never overwritten on edit
  editableUntil: Timestamp | null
  lockedAt: Timestamp | null
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

Report statuses: `draft` · `pending` · `submitted_on_time` · `submitted_late` · `missing` · `excused` · `returned_for_correction` · `reviewed` (+ `approved` when enabled)

### `newcomerAttendance/{attendanceId}`

```ts
{
  organizationId: string
  personId: string
  journeyId: string
  assignmentId: string | null
  calendarEventId: string
  programDate: Timestamp
  attendanceStatus: 'attended' | 'did_not_attend' | 'unknown'
  recordedByPersonId: string
  recordedAt: Timestamp
  updatedAt: Timestamp
  updatedByPersonId: string
}
```

**Uniqueness:** one record per `personId + calendarEventId`.

### `newcomerBioEntries/{bioEntryId}`

Timeline entries (not one big editable blob).

```ts
{
  organizationId: string
  personId: string
  journeyId: string
  categoryId: string
  content: string
  sensitivityLevel: 'standard' | string
  visibilityPolicyId: string
  recordStatus: 'active' | string
  addedByPersonId: string
  createdAt: Timestamp
  updatedAt: Timestamp
  updatedByPersonId: string
  deletedAt: Timestamp | null
  deletedByPersonId: string | null
}
```

### `welcomeSchedules/{scheduleId}`

MVP business fields: program date + assigned person.

```ts
{
  organizationId: string
  calendarEventId: string
  programDate: Timestamp
  assignedPersonId: string
  formDefinitionId: string
  formVersion: number
  dynamicResponses: Record<string, unknown>
  assignedByPersonId: string
  recordStatus: 'active' | string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### `membershipRecommendations/{recommendationId}`

(Referenced in workflows; fields include submitter, summaries, willingness, workflow/approval status — expand with workflow engine when coding.)

### `publicRegistrations/{regId}` (intake)

Optional staging collection for public form submissions before Person/journey creation / duplicate review.

---

## Suggested indexes (planning)

- `newcomerJourneys`: `organizationId` + `journeyStatus` + `createdAt`
- `followUpAssignments`: `organizationId` + `assignmentStatus` + `assignedPersonId`
- `followUpAssignments`: `journeyId` + `assignmentStatus`
- `followUpReports`: `organizationId` + `reportingWeekStart` + `reportStatus`
- `newcomerAttendance`: `personId` + `calendarEventId` (unique)
- `newcomerAttendance`: `organizationId` + `programDate`
- `roleAssignments`: `organizationId` + `personId` + `isActive`

---

## Out of scope for this doc

Security rules, Cloud Functions, and client code — deferred until Architecture Baseline freeze.
