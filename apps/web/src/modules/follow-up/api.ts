import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import {
  attendanceDocId,
  canEditReport,
  getEditableUntil,
  getReportingWeekBounds,
  getSaturdayProgramDate,
  isReportLate,
  saturdayEventId,
  DEFAULT_WEEKLY_REPORT_FIELDS,
  WEEKLY_REPORT_FORM_KEY,
  type AttendanceStatus,
  type FollowUpAssignment,
  type FollowUpReport,
  type NewcomerAttendance,
  type NewcomerBioEntry,
  type NewcomerJourney,
  type Person,
} from '@ieec/shared';
import { getDb } from '../../lib/firebase';
import { writeAudit } from '../../engines/audit/writeAudit';

function mapDoc<T extends { id: string }>(
  id: string,
  data: Omit<T, 'id'>,
): T {
  return { id, ...data } as T;
}

export async function listMyAssignments(
  organizationId: string,
  assignedPersonId: string,
): Promise<FollowUpAssignment[]> {
  const snap = await getDocs(
    query(
      collection(getDb(), 'followUpAssignments'),
      where('organizationId', '==', organizationId),
      where('assignedPersonId', '==', assignedPersonId),
      where('assignmentStatus', '==', 'active'),
    ),
  );
  return snap.docs.map((d) =>
    mapDoc<FollowUpAssignment>(d.id, d.data() as Omit<FollowUpAssignment, 'id'>),
  );
}

export async function getPerson(personId: string): Promise<Person | null> {
  const snap = await getDoc(doc(getDb(), 'people', personId));
  if (!snap.exists()) return null;
  return mapDoc<Person>(snap.id, snap.data() as Omit<Person, 'id'>);
}

export async function getJourney(journeyId: string): Promise<NewcomerJourney | null> {
  const snap = await getDoc(doc(getDb(), 'newcomerJourneys', journeyId));
  if (!snap.exists()) return null;
  return mapDoc<NewcomerJourney>(
    snap.id,
    snap.data() as Omit<NewcomerJourney, 'id'>,
  );
}

export async function getAssignment(
  assignmentId: string,
): Promise<FollowUpAssignment | null> {
  const snap = await getDoc(doc(getDb(), 'followUpAssignments', assignmentId));
  if (!snap.exists()) return null;
  return mapDoc<FollowUpAssignment>(
    snap.id,
    snap.data() as Omit<FollowUpAssignment, 'id'>,
  );
}

export async function listReportsForAssignment(
  organizationId: string,
  assignmentId: string,
): Promise<FollowUpReport[]> {
  const snap = await getDocs(
    query(
      collection(getDb(), 'followUpReports'),
      where('organizationId', '==', organizationId),
      where('assignmentId', '==', assignmentId),
    ),
  );
  return snap.docs.map((d) =>
    mapDoc<FollowUpReport>(d.id, d.data() as Omit<FollowUpReport, 'id'>),
  );
}

export async function listAttendanceForPerson(
  organizationId: string,
  personId: string,
): Promise<NewcomerAttendance[]> {
  const snap = await getDocs(
    query(
      collection(getDb(), 'newcomerAttendance'),
      where('organizationId', '==', organizationId),
      where('personId', '==', personId),
    ),
  );
  return snap.docs.map((d) =>
    mapDoc<NewcomerAttendance>(
      d.id,
      d.data() as Omit<NewcomerAttendance, 'id'>,
    ),
  );
}

export async function listBioEntries(
  personId: string,
): Promise<NewcomerBioEntry[]> {
  const snap = await getDocs(
    query(
      collection(getDb(), 'newcomerBioEntries'),
      where('personId', '==', personId),
      where('recordStatus', '==', 'active'),
    ),
  );
  return snap.docs.map((d) =>
    mapDoc<NewcomerBioEntry>(d.id, d.data() as Omit<NewcomerBioEntry, 'id'>),
  );
}

export async function ensureSaturdayEvent(
  organizationId: string,
  actorPersonId: string,
  reference = new Date(),
) {
  const programDate = getSaturdayProgramDate(reference);
  const eventId = saturdayEventId(organizationId, programDate);
  const ref = doc(getDb(), 'calendarEvents', eventId);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    return { eventId, programDate, ...(existing.data() as object) };
  }

  const startAt = new Date(programDate);
  startAt.setHours(18, 30, 0, 0);
  const endAt = new Date(programDate);
  endAt.setHours(21, 30, 0, 0);

  const payload = {
    organizationId,
    title: 'IEEC YA Saturday Program',
    description: 'Weekly Young Adult program',
    organizingTeamId: `${organizationId}_follow_up`,
    eventScope: 'organization',
    eventPriority: 'organization_reserved',
    conflictPolicy: 'hard_block',
    startAt: Timestamp.fromDate(startAt),
    endAt: Timestamp.fromDate(endAt),
    timezone: 'America/New_York',
    recurrence: {
      enabled: true,
      frequency: 'weekly',
      daysOfWeek: ['saturday'],
    },
    parentRecurringEventId: null,
    eventStatus: 'scheduled',
    createdByPersonId: actorPersonId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, payload);
  return { eventId, programDate, ...payload };
}

export async function submitWeeklyReport(params: {
  organizationId: string;
  assignment: FollowUpAssignment;
  actorPersonId: string;
  contactMade: boolean;
  expectedToAttend: string;
  dynamicResponses: Record<string, unknown>;
  notes?: string;
  canEditLocked?: boolean;
}): Promise<string> {
  const { weekStart, weekEnd, dueAt } = getReportingWeekBounds();
  const reportId = `${params.assignment.id}_${weekStart.toISOString().slice(0, 10)}`;
  const ref = doc(getDb(), 'followUpReports', reportId);
  const existing = await getDoc(ref);
  const now = new Date();

  if (existing.exists()) {
    const data = existing.data() as FollowUpReport;
    const editableUntil = data.editableUntil
      ? (data.editableUntil as { toDate?: () => Date }).toDate?.() ??
        new Date(data.editableUntil as string)
      : null;
    if (
      !canEditReport({
        reportStatus: String(data.reportStatus),
        submittedByPersonId: data.submittedByPersonId,
        currentPersonId: params.actorPersonId,
        editableUntil,
        now,
        canEditLocked: params.canEditLocked,
      })
    ) {
      throw new Error('Report is locked and cannot be edited.');
    }
  }

  const late = isReportLate(now, dueAt);
  const status = late ? 'submitted_late' : 'submitted_on_time';
  const editableUntil = getEditableUntil(now);
  const originalSubmittedAt = existing.exists()
    ? (existing.data() as FollowUpReport).originalSubmittedAt ??
      Timestamp.fromDate(now)
    : Timestamp.fromDate(now);

  await setDoc(
    ref,
    {
      organizationId: params.organizationId,
      journeyId: params.assignment.journeyId,
      newcomerPersonId: params.assignment.newcomerPersonId,
      assignmentId: params.assignment.id,
      reportingWeekStart: Timestamp.fromDate(weekStart),
      reportingWeekEnd: Timestamp.fromDate(weekEnd),
      dueAt: Timestamp.fromDate(dueAt),
      contactMade: params.contactMade,
      expectedToAttend: params.expectedToAttend,
      formDefinitionId: WEEKLY_REPORT_FORM_KEY,
      formVersion: 1,
      dynamicResponses: params.dynamicResponses,
      notes: params.notes ?? null,
      reportStatus: status,
      submittedByPersonId: params.actorPersonId,
      submittedAt: Timestamp.fromDate(now),
      originalSubmittedAt,
      editableUntil: Timestamp.fromDate(editableUntil),
      lockedAt: null,
      createdAt: existing.exists()
        ? (existing.data() as FollowUpReport).createdAt ?? serverTimestamp()
        : serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  await writeAudit({
    organizationId: params.organizationId,
    action: 'follow_up.report.submit',
    actorPersonId: params.actorPersonId,
    actorAuthUid: null,
    targetType: 'followUpReport',
    targetId: reportId,
    before: existing.exists() ? (existing.data() as Record<string, unknown>) : null,
    after: { reportStatus: status },
    metadata: { fields: DEFAULT_WEEKLY_REPORT_FIELDS.map((f) => f.key) },
  });

  return reportId;
}

export async function recordAttendance(params: {
  organizationId: string;
  assignment: FollowUpAssignment;
  actorPersonId: string;
  attendanceStatus: AttendanceStatus;
}): Promise<string> {
  const event = await ensureSaturdayEvent(
    params.organizationId,
    params.actorPersonId,
  );
  const id = attendanceDocId(
    params.assignment.newcomerPersonId,
    event.eventId,
  );
  const ref = doc(getDb(), 'newcomerAttendance', id);
  const existing = await getDoc(ref);

  await setDoc(
    ref,
    {
      organizationId: params.organizationId,
      personId: params.assignment.newcomerPersonId,
      journeyId: params.assignment.journeyId,
      assignmentId: params.assignment.id,
      calendarEventId: event.eventId,
      programDate: Timestamp.fromDate(event.programDate),
      attendanceStatus: params.attendanceStatus,
      recordedByPersonId: params.actorPersonId,
      recordedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedByPersonId: params.actorPersonId,
    },
    { merge: true },
  );

  await writeAudit({
    organizationId: params.organizationId,
    action: 'follow_up.attendance.record',
    actorPersonId: params.actorPersonId,
    actorAuthUid: null,
    targetType: 'newcomerAttendance',
    targetId: id,
    before: existing.exists()
      ? (existing.data() as Record<string, unknown>)
      : null,
    after: { attendanceStatus: params.attendanceStatus },
    metadata: { calendarEventId: event.eventId },
  });

  return id;
}

export async function addBioEntry(params: {
  organizationId: string;
  personId: string;
  journeyId: string;
  actorPersonId: string;
  content: string;
  categoryId?: string;
}): Promise<string> {
  const ref = doc(collection(getDb(), 'newcomerBioEntries'));
  await setDoc(ref, {
    organizationId: params.organizationId,
    personId: params.personId,
    journeyId: params.journeyId,
    categoryId: params.categoryId ?? 'general',
    content: params.content,
    sensitivityLevel: 'standard',
    visibilityPolicyId: 'team_default',
    recordStatus: 'active',
    addedByPersonId: params.actorPersonId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedByPersonId: params.actorPersonId,
    deletedAt: null,
    deletedByPersonId: null,
  });
  return ref.id;
}
