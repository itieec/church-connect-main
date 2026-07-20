/** Follow-Up module domain contracts (Phase B). */

export type JourneyStatus =
  | 'awaiting_assignment'
  | 'assigned'
  | 'active_follow_up'
  | 'paused'
  | 'unable_to_contact'
  | 'inactive'
  | 'ready_for_membership_review'
  | 'membership_approval_in_progress'
  | 'transitioned_to_member'
  | 'declined_follow_up'
  | 'closed'
  | 'reopened'
  | 'duplicate_review_required';

export type AssignmentType = 'primary' | 'secondary' | 'supporting' | 'temporary';
export type AssignmentStatus =
  | 'pending'
  | 'active'
  | 'paused'
  | 'reassignment_requested'
  | 'ended'
  | 'cancelled';

export type ReportStatus =
  | 'draft'
  | 'pending'
  | 'submitted_on_time'
  | 'submitted_late'
  | 'missing'
  | 'excused'
  | 'returned_for_correction'
  | 'reviewed'
  | 'approved';

export type ExpectedAttendance = 'yes' | 'no' | 'maybe' | 'unknown';
export type AttendanceStatus = 'attended' | 'did_not_attend' | 'unknown';

export interface NewcomerJourney {
  id: string;
  organizationId: string;
  personId: string;
  registrationDate?: unknown;
  registrationSource?: string;
  journeyStatus: JourneyStatus | string;
  membershipReadinessStatus?: string;
  previousJourneyId?: string | null;
  isCurrentJourney: boolean;
  welcomeMessageStatus?: string | null;
  startedAt?: unknown;
  completedAt?: unknown | null;
  closureReason?: string | null;
  createdAt?: unknown;
  createdBy?: string;
  updatedAt?: unknown;
  updatedBy?: string;
}

export interface FollowUpAssignment {
  id: string;
  organizationId: string;
  journeyId: string;
  newcomerPersonId: string;
  assignedPersonId: string;
  assignmentType: AssignmentType | string;
  assignmentStatus: AssignmentStatus | string;
  reportingRequired: boolean;
  startDate?: unknown;
  endDate?: unknown | null;
  assignedByPersonId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface FollowUpReport {
  id: string;
  organizationId: string;
  journeyId: string;
  newcomerPersonId: string;
  assignmentId: string;
  reportingWeekStart: unknown;
  reportingWeekEnd: unknown;
  dueAt: unknown;
  contactMade: boolean;
  expectedToAttend: ExpectedAttendance | string;
  formDefinitionId: string;
  formVersion: number;
  dynamicResponses: Record<string, unknown>;
  reportStatus: ReportStatus | string;
  notes?: string | null;
  submittedByPersonId?: string | null;
  submittedAt?: unknown | null;
  originalSubmittedAt?: unknown | null;
  editableUntil?: unknown | null;
  lockedAt?: unknown | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface NewcomerAttendance {
  id: string;
  organizationId: string;
  personId: string;
  journeyId: string;
  assignmentId?: string | null;
  calendarEventId: string;
  programDate: unknown;
  attendanceStatus: AttendanceStatus;
  recordedByPersonId: string;
  recordedAt?: unknown;
  updatedAt?: unknown;
  updatedByPersonId?: string;
}

export interface NewcomerBioEntry {
  id: string;
  organizationId: string;
  personId: string;
  journeyId: string;
  categoryId: string;
  content: string;
  sensitivityLevel: string;
  visibilityPolicyId?: string;
  recordStatus: string;
  addedByPersonId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  updatedByPersonId?: string;
  deletedAt?: unknown | null;
  deletedByPersonId?: string | null;
}

export interface CalendarEvent {
  id: string;
  organizationId: string;
  title: string;
  description?: string | null;
  organizingTeamId?: string | null;
  eventScope?: string;
  eventPriority?: string;
  conflictPolicy?: string;
  startAt: unknown;
  endAt: unknown;
  timezone: string;
  recurrence?: {
    enabled: boolean;
    frequency: string;
    daysOfWeek: string[];
  };
  parentRecurringEventId?: string | null;
  eventStatus: string;
  createdByPersonId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface FormDefinition {
  id: string;
  organizationId: string;
  key: string;
  title: string;
  version: number;
  fields: FormFieldDefinition[];
  recordStatus: string;
}

export interface FormFieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'boolean' | 'select' | string;
  required?: boolean;
  options?: string[];
}

/** Follow-Up config defaults (admin-editable later). */
export const FOLLOW_UP_CONFIG_DEFAULTS = {
  reportDueDay: 'friday',
  reportLateFrom: 'saturday',
  reportTimezone: 'America/New_York',
  reportEditWindowDays: 7,
  firstContactDeadlineHours: 48,
  welcomeMessageEnabled: true,
  primaryReportsOnly: true,
  attendanceEnabled: true,
  attendanceProgramLabel: 'Saturday 6:30 PM–9:30 PM',
} as const;

export interface MembershipRecommendation {
  id: string;
  organizationId: string;
  journeyId: string;
  personId: string;
  assignmentId?: string | null;
  status:
    | 'draft'
    | 'submitted'
    | 'approved'
    | 'rejected'
    | 'returned_for_correction'
    | string;
  participationSummary?: string;
  attendanceSummary?: string;
  followUpSummary?: string;
  willingness?: string;
  concerns?: string;
  comments?: string;
  nextSteps?: string;
  submittedByPersonId?: string | null;
  submittedAt?: unknown | null;
  decidedByPersonId?: string | null;
  decidedAt?: unknown | null;
  decisionComment?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PublicRegistration {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  sex?: string | null;
  phone?: string | null;
  email?: string | null;
  contactPreferenceMethod?: 'call' | 'text' | string;
  preferredContactTime?: string | null;
  consent: boolean;
  registrationSource: string;
  status:
    | 'registration_pending'
    | 'duplicate_review_required'
    | 'accepted'
    | 'discarded'
    | string;
  candidatePersonIds?: string[];
  linkedPersonId?: string | null;
  linkedJourneyId?: string | null;
  reviewNotes?: string | null;
  reviewedByPersonId?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const WEEKLY_REPORT_FORM_KEY = 'follow_up_weekly_report';

export const DEFAULT_WEEKLY_REPORT_FIELDS: FormFieldDefinition[] = [
  {
    key: 'contact_summary',
    label: 'Contact summary',
    type: 'textarea',
    required: true,
  },
  {
    key: 'prayer_requests',
    label: 'Prayer requests',
    type: 'textarea',
    required: false,
  },
  {
    key: 'concerns',
    label: 'Concerns / next actions',
    type: 'textarea',
    required: false,
  },
];
