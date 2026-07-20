import firestore from '@react-native-firebase/firestore';
import {
  attendanceDocId,
  canEditReport,
  getEditableUntil,
  getReportingWeekBounds,
  getSaturdayProgramDate,
  isReportLate,
  saturdayEventId,
  WEEKLY_REPORT_FORM_KEY,
  type AttendanceStatus,
  type FollowUpAssignment,
  type FollowUpReport,
  type NewcomerAttendance,
  type NewcomerBioEntry,
  type NewcomerJourney,
  type Person,
} from '@ieec/shared';

function mapDoc<T extends { id: string }>(
  id: string,
  data: DocumentData,
): T {
  return { id, ...data } as T;
}

type DocumentData = Record<string, unknown>;

export async function listMyAssignments(
  organizationId: string,
  assignedPersonId: string,
): Promise<FollowUpAssignment[]> {
  const snap = await firestore()
    .collection('followUpAssignments')
    .where('organizationId', '==', organizationId)
    .where('assignedPersonId', '==', assignedPersonId)
    .where('assignmentStatus', '==', 'active')
    .get();
  return snap.docs.map((d) =>
    mapDoc<FollowUpAssignment>(d.id, d.data() as DocumentData),
  );
}

export async function getPerson(personId: string): Promise<Person | null> {
  const snap = await firestore().collection('people').doc(personId).get();
  if (!snap.exists()) return null;
  return mapDoc<Person>(snap.id, snap.data() as DocumentData);
}

export async function getJourney(
  journeyId: string,
): Promise<NewcomerJourney | null> {
  const snap = await firestore()
    .collection('newcomerJourneys')
    .doc(journeyId)
    .get();
  if (!snap.exists()) return null;
  return mapDoc<NewcomerJourney>(snap.id, snap.data() as DocumentData);
}

export async function getAssignment(
  assignmentId: string,
): Promise<FollowUpAssignment | null> {
  const snap = await firestore()
    .collection('followUpAssignments')
    .doc(assignmentId)
    .get();
  if (!snap.exists()) return null;
  return mapDoc<FollowUpAssignment>(snap.id, snap.data() as DocumentData);
}

export async function listReportsForAssignment(
  organizationId: string,
  assignmentId: string,
): Promise<FollowUpReport[]> {
  const snap = await firestore()
    .collection('followUpReports')
    .where('organizationId', '==', organizationId)
    .where('assignmentId', '==', assignmentId)
    .get();
  return snap.docs.map((d) =>
    mapDoc<FollowUpReport>(d.id, d.data() as DocumentData),
  );
}

export async function listAttendanceForPerson(
  organizationId: string,
  personId: string,
): Promise<NewcomerAttendance[]> {
  const snap = await firestore()
    .collection('newcomerAttendance')
    .where('organizationId', '==', organizationId)
    .where('personId', '==', personId)
    .get();
  return snap.docs.map((d) =>
    mapDoc<NewcomerAttendance>(d.id, d.data() as DocumentData),
  );
}

export async function listBioEntries(
  personId: string,
): Promise<NewcomerBioEntry[]> {
  const snap = await firestore()
    .collection('newcomerBioEntries')
    .where('personId', '==', personId)
    .where('recordStatus', '==', 'active')
    .get();
  return snap.docs.map((d) =>
    mapDoc<NewcomerBioEntry>(d.id, d.data() as DocumentData),
  );
}

export async function ensureSaturdayEvent(
  organizationId: string,
  actorPersonId: string,
) {
  const programDate = getSaturdayProgramDate();
  const eventId = saturdayEventId(organizationId, programDate);
  const ref = firestore().collection('calendarEvents').doc(eventId);
  const existing = await ref.get();
  if (existing.exists()) {
    return { eventId, programDate };
  }
  const startAt = new Date(programDate);
  startAt.setHours(18, 30, 0, 0);
  const endAt = new Date(programDate);
  endAt.setHours(21, 30, 0, 0);
  await ref.set({
    organizationId,
    title: 'IEEC YA Saturday Program',
    description: 'Weekly Young Adult program',
    startAt: firestore.Timestamp.fromDate(startAt),
    endAt: firestore.Timestamp.fromDate(endAt),
    timezone: 'America/New_York',
    recurrence: {
      enabled: true,
      frequency: 'weekly',
      daysOfWeek: ['saturday'],
    },
    eventStatus: 'scheduled',
    createdByPersonId: actorPersonId,
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
  return { eventId, programDate };
}

export async function submitWeeklyReport(params: {
  organizationId: string;
  assignment: FollowUpAssignment;
  actorPersonId: string;
  contactMade: boolean;
  expectedToAttend: string;
  dynamicResponses: Record<string, unknown>;
  canEditLocked?: boolean;
}): Promise<string> {
  const { weekStart, weekEnd, dueAt } = getReportingWeekBounds();
  const reportId = `${params.assignment.id}_${weekStart.toISOString().slice(0, 10)}`;
  const ref = firestore().collection('followUpReports').doc(reportId);
  const existing = await ref.get();
  const now = new Date();

  if (existing.exists()) {
    const data = existing.data() as FollowUpReport;
    const editableUntilRaw = data.editableUntil as
      | { toDate?: () => Date }
      | string
      | null
      | undefined;
    const editableUntil =
      editableUntilRaw &&
      typeof editableUntilRaw === 'object' &&
      editableUntilRaw.toDate
        ? editableUntilRaw.toDate()
        : editableUntilRaw
          ? new Date(editableUntilRaw as string)
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
  await ref.set(
    {
      organizationId: params.organizationId,
      journeyId: params.assignment.journeyId,
      newcomerPersonId: params.assignment.newcomerPersonId,
      assignmentId: params.assignment.id,
      reportingWeekStart: firestore.Timestamp.fromDate(weekStart),
      reportingWeekEnd: firestore.Timestamp.fromDate(weekEnd),
      dueAt: firestore.Timestamp.fromDate(dueAt),
      contactMade: params.contactMade,
      expectedToAttend: params.expectedToAttend,
      formDefinitionId: WEEKLY_REPORT_FORM_KEY,
      formVersion: 1,
      dynamicResponses: params.dynamicResponses,
      reportStatus: status,
      submittedByPersonId: params.actorPersonId,
      submittedAt: firestore.Timestamp.fromDate(now),
      originalSubmittedAt: existing.exists()
        ? ((existing.data() as FollowUpReport).originalSubmittedAt ??
          firestore.Timestamp.fromDate(now))
        : firestore.Timestamp.fromDate(now),
      editableUntil: firestore.Timestamp.fromDate(getEditableUntil(now)),
      updatedAt: firestore.FieldValue.serverTimestamp(),
      createdAt: existing.exists()
        ? (existing.data() as FollowUpReport).createdAt ??
          firestore.FieldValue.serverTimestamp()
        : firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
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
  await firestore()
    .collection('newcomerAttendance')
    .doc(id)
    .set(
      {
        organizationId: params.organizationId,
        personId: params.assignment.newcomerPersonId,
        journeyId: params.assignment.journeyId,
        assignmentId: params.assignment.id,
        calendarEventId: event.eventId,
        programDate: firestore.Timestamp.fromDate(event.programDate),
        attendanceStatus: params.attendanceStatus,
        recordedByPersonId: params.actorPersonId,
        recordedAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        updatedByPersonId: params.actorPersonId,
      },
      { merge: true },
    );
  return id;
}

export async function addBioEntry(params: {
  organizationId: string;
  personId: string;
  journeyId: string;
  actorPersonId: string;
  content: string;
}): Promise<string> {
  const ref = firestore().collection('newcomerBioEntries').doc();
  await ref.set({
    organizationId: params.organizationId,
    personId: params.personId,
    journeyId: params.journeyId,
    categoryId: 'general',
    content: params.content,
    sensitivityLevel: 'standard',
    visibilityPolicyId: 'team_default',
    recordStatus: 'active',
    addedByPersonId: params.actorPersonId,
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
    updatedByPersonId: params.actorPersonId,
    deletedAt: null,
    deletedByPersonId: null,
  });
  return ref.id;
}
