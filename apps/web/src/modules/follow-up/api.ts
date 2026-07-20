import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  attendanceDocId,
  canEditReport,
  findDuplicateCandidates,
  getEditableUntil,
  getReportingWeekBounds,
  getSaturdayProgramDate,
  isReportLate,
  normalizeEmail,
  normalizeName,
  normalizePhone,
  saturdayEventId,
  DEFAULT_WEEKLY_REPORT_FIELDS,
  WEEKLY_REPORT_FORM_KEY,
  type AttendanceStatus,
  type FollowUpAssignment,
  type FollowUpReport,
  type MembershipRecommendation,
  type NewcomerAttendance,
  type NewcomerBioEntry,
  type NewcomerJourney,
  type Person,
  type PublicRegistration,
} from '@ieec/shared';
import { getDb } from '../../lib/firebase';
import { writeAudit } from '../../engines/audit/writeAudit';

const DEFAULT_ORG =
  (import.meta.env.VITE_PUBLIC_ORG_ID as string | undefined) || 'ieec_ya';

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

export async function listUnassignedJourneys(
  organizationId: string,
): Promise<NewcomerJourney[]> {
  const snap = await getDocs(
    query(
      collection(getDb(), 'newcomerJourneys'),
      where('organizationId', '==', organizationId),
      where('journeyStatus', 'in', [
        'awaiting_assignment',
        'duplicate_review_required',
      ]),
    ),
  );
  return snap.docs.map((d) =>
    mapDoc<NewcomerJourney>(d.id, d.data() as Omit<NewcomerJourney, 'id'>),
  );
}

export async function listTeamMembersForAssign(
  organizationId: string,
): Promise<Person[]> {
  // MVP: people with hasUserAccount in org (ministers/leaders)
  const snap = await getDocs(
    query(
      collection(getDb(), 'people'),
      where('organizationId', '==', organizationId),
      where('hasUserAccount', '==', true),
      where('recordStatus', '==', 'active'),
    ),
  );
  return snap.docs.map((d) =>
    mapDoc<Person>(d.id, d.data() as Omit<Person, 'id'>),
  );
}

export async function createAssignment(params: {
  organizationId: string;
  journey: NewcomerJourney;
  assignedPersonId: string;
  actorPersonId: string;
  assignmentType?: string;
  replaceExistingPrimary?: boolean;
}): Promise<{ assignmentId: string; warning?: string }> {
  const activeSnap = await getDocs(
    query(
      collection(getDb(), 'followUpAssignments'),
      where('journeyId', '==', params.journey.id),
      where('assignmentStatus', '==', 'active'),
    ),
  );
  let warning: string | undefined;
  if (!activeSnap.empty) {
    warning = `Journey already has ${activeSnap.size} active assignment(s).`;
    if (params.replaceExistingPrimary) {
      for (const d of activeSnap.docs) {
        const data = d.data();
        if (data.assignmentType === 'primary') {
          await updateDoc(d.ref, {
            assignmentStatus: 'ended',
            endDate: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }
    }
  }

  const ref = doc(collection(getDb(), 'followUpAssignments'));
  await setDoc(ref, {
    organizationId: params.organizationId,
    journeyId: params.journey.id,
    newcomerPersonId: params.journey.personId,
    assignedPersonId: params.assignedPersonId,
    assignmentType: params.assignmentType ?? 'primary',
    assignmentStatus: 'active',
    reportingRequired: true,
    startDate: serverTimestamp(),
    endDate: null,
    assignedByPersonId: params.actorPersonId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(doc(getDb(), 'newcomerJourneys', params.journey.id), {
    journeyStatus: 'assigned',
    updatedAt: serverTimestamp(),
    updatedBy: params.actorPersonId,
  });

  await writeAudit({
    organizationId: params.organizationId,
    action: 'follow_up.assignment.create',
    actorPersonId: params.actorPersonId,
    actorAuthUid: null,
    targetType: 'followUpAssignment',
    targetId: ref.id,
    before: null,
    after: { assignedPersonId: params.assignedPersonId },
    metadata: { warning: warning ?? null },
  });

  return { assignmentId: ref.id, warning };
}

export async function reassignAssignment(params: {
  organizationId: string;
  assignment: FollowUpAssignment;
  newAssigneePersonId: string;
  actorPersonId: string;
  reason?: string;
}): Promise<string> {
  await updateDoc(doc(getDb(), 'followUpAssignments', params.assignment.id), {
    assignmentStatus: 'ended',
    endDate: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const ref = doc(collection(getDb(), 'followUpAssignments'));
  await setDoc(ref, {
    organizationId: params.organizationId,
    journeyId: params.assignment.journeyId,
    newcomerPersonId: params.assignment.newcomerPersonId,
    assignedPersonId: params.newAssigneePersonId,
    assignmentType: params.assignment.assignmentType,
    assignmentStatus: 'active',
    reportingRequired: true,
    startDate: serverTimestamp(),
    endDate: null,
    assignedByPersonId: params.actorPersonId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await writeAudit({
    organizationId: params.organizationId,
    action: 'follow_up.assignment.reassign',
    actorPersonId: params.actorPersonId,
    actorAuthUid: null,
    targetType: 'followUpAssignment',
    targetId: ref.id,
    before: { previousAssignmentId: params.assignment.id },
    after: { assignedPersonId: params.newAssigneePersonId },
    metadata: { reason: params.reason ?? null },
  });

  return ref.id;
}

export async function submitPublicRegistration(input: {
  firstName: string;
  lastName: string;
  sex?: string;
  phone?: string;
  email?: string;
  contactPreferenceMethod?: string;
  preferredContactTime?: string;
  consent: boolean;
  organizationId?: string;
}): Promise<{ registrationId: string; status: string }> {
  if (!input.consent) throw new Error('Consent is required.');
  const organizationId = input.organizationId || DEFAULT_ORG;

  // Client-side duplicate scan against people the rules allow... public cannot
  // read people. Store as pending; a Cloud Function / leader review completes
  // detection. For authenticated leaders creating via admin, we scan.
  const ref = await addDoc(collection(getDb(), 'publicRegistrations'), {
    organizationId,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    sex: input.sex ?? null,
    phone: input.phone ?? null,
    email: input.email ?? null,
    contactPreferenceMethod: input.contactPreferenceMethod ?? 'text',
    preferredContactTime: input.preferredContactTime ?? null,
    consent: true,
    registrationSource: 'public_web',
    status: 'registration_pending',
    candidatePersonIds: [],
    linkedPersonId: null,
    linkedJourneyId: null,
    reviewNotes: null,
    reviewedByPersonId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { registrationId: ref.id, status: 'registration_pending' };
}

/** Leader intake: create registration then immediately process duplicate check. */
export async function intakeAndProcessRegistration(params: {
  organizationId: string;
  actorPersonId: string;
  firstName: string;
  lastName: string;
  sex?: string;
  phone?: string;
  email?: string;
  contactPreferenceMethod?: string;
  preferredContactTime?: string;
}): Promise<{ registrationId: string; status: string; journeyId?: string }> {
  const peopleSnap = await getDocs(
    query(
      collection(getDb(), 'people'),
      where('organizationId', '==', params.organizationId),
      where('recordStatus', '==', 'active'),
    ),
  );
  const people = peopleSnap.docs.map((d) => {
    const data = d.data() as {
      firstName?: string;
      lastName?: string;
      phone?: { normalized?: string };
      email?: { normalized?: string };
    };
    return {
      id: d.id,
      firstName: String(data.firstName ?? ''),
      lastName: String(data.lastName ?? ''),
      phoneNormalized: data.phone?.normalized ?? null,
      emailNormalized: data.email?.normalized ?? null,
    };
  });

  const candidates = findDuplicateCandidates(
    {
      firstName: params.firstName,
      lastName: params.lastName,
      phone: params.phone,
      email: params.email,
    },
    people,
  );

  const regRef = doc(collection(getDb(), 'publicRegistrations'));
  const status = candidates.length
    ? 'duplicate_review_required'
    : 'registration_pending';

  await setDoc(regRef, {
    organizationId: params.organizationId,
    firstName: params.firstName.trim(),
    lastName: params.lastName.trim(),
    sex: params.sex ?? null,
    phone: params.phone ?? null,
    email: params.email ?? null,
    contactPreferenceMethod: params.contactPreferenceMethod ?? 'text',
    preferredContactTime: params.preferredContactTime ?? null,
    consent: true,
    registrationSource: 'staff_assisted',
    status,
    candidatePersonIds: candidates.map((c) => c.id),
    linkedPersonId: null,
    linkedJourneyId: null,
    reviewNotes: null,
    reviewedByPersonId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (candidates.length) {
    return { registrationId: regRef.id, status };
  }

  const created = await acceptRegistrationAsNewPerson({
    organizationId: params.organizationId,
    registrationId: regRef.id,
    actorPersonId: params.actorPersonId,
  });
  return {
    registrationId: regRef.id,
    status: 'accepted',
    journeyId: created.journeyId,
  };
}

export async function listPendingRegistrations(
  organizationId: string,
): Promise<PublicRegistration[]> {
  const snap = await getDocs(
    query(
      collection(getDb(), 'publicRegistrations'),
      where('organizationId', '==', organizationId),
      where('status', 'in', [
        'registration_pending',
        'duplicate_review_required',
      ]),
    ),
  );
  return snap.docs.map((d) =>
    mapDoc<PublicRegistration>(
      d.id,
      d.data() as Omit<PublicRegistration, 'id'>,
    ),
  );
}

export async function acceptRegistrationAsNewPerson(params: {
  organizationId: string;
  registrationId: string;
  actorPersonId: string;
}): Promise<{ personId: string; journeyId: string }> {
  const regSnap = await getDoc(
    doc(getDb(), 'publicRegistrations', params.registrationId),
  );
  if (!regSnap.exists()) throw new Error('Registration not found');
  const reg = regSnap.data() as PublicRegistration;

  const personRef = doc(collection(getDb(), 'people'));
  const journeyRef = doc(collection(getDb(), 'newcomerJourneys'));

  await setDoc(personRef, {
    organizationId: params.organizationId,
    firstName: reg.firstName,
    lastName: reg.lastName,
    normalizedFirstName: normalizeName(reg.firstName),
    normalizedLastName: normalizeName(reg.lastName),
    sex: reg.sex ?? null,
    phone: reg.phone
      ? { display: reg.phone, normalized: normalizePhone(reg.phone) }
      : null,
    email: reg.email
      ? {
          address: reg.email,
          normalized: normalizeEmail(reg.email),
          verified: false,
        }
      : null,
    contactPreference: {
      method: reg.contactPreferenceMethod ?? 'text',
      preferredTime: reg.preferredContactTime ?? null,
      customTimeNote: null,
    },
    currentMinistryStatus: 'newcomer',
    recordStatus: 'active',
    hasUserAccount: false,
    activeJourneyId: journeyRef.id,
    createdAt: serverTimestamp(),
    createdBy: params.actorPersonId,
    updatedAt: serverTimestamp(),
    updatedBy: params.actorPersonId,
  });

  await setDoc(journeyRef, {
    organizationId: params.organizationId,
    personId: personRef.id,
    registrationDate: serverTimestamp(),
    registrationSource: reg.registrationSource,
    journeyStatus: 'awaiting_assignment',
    membershipReadinessStatus: 'not_ready',
    previousJourneyId: null,
    isCurrentJourney: true,
    welcomeMessageStatus: null,
    startedAt: serverTimestamp(),
    completedAt: null,
    closureReason: null,
    createdAt: serverTimestamp(),
    createdBy: params.actorPersonId,
    updatedAt: serverTimestamp(),
    updatedBy: params.actorPersonId,
  });

  await updateDoc(doc(getDb(), 'publicRegistrations', params.registrationId), {
    status: 'accepted',
    linkedPersonId: personRef.id,
    linkedJourneyId: journeyRef.id,
    reviewedByPersonId: params.actorPersonId,
    updatedAt: serverTimestamp(),
  });

  await writeAudit({
    organizationId: params.organizationId,
    action: 'follow_up.registration.accept_new',
    actorPersonId: params.actorPersonId,
    actorAuthUid: null,
    targetType: 'publicRegistration',
    targetId: params.registrationId,
    before: null,
    after: { personId: personRef.id, journeyId: journeyRef.id },
    metadata: null,
  });

  return { personId: personRef.id, journeyId: journeyRef.id };
}

export async function linkRegistrationToExistingPerson(params: {
  organizationId: string;
  registrationId: string;
  personId: string;
  actorPersonId: string;
}): Promise<{ journeyId: string }> {
  const journeyRef = doc(collection(getDb(), 'newcomerJourneys'));
  await setDoc(journeyRef, {
    organizationId: params.organizationId,
    personId: params.personId,
    registrationDate: serverTimestamp(),
    registrationSource: 'duplicate_link',
    journeyStatus: 'awaiting_assignment',
    membershipReadinessStatus: 'not_ready',
    previousJourneyId: null,
    isCurrentJourney: true,
    welcomeMessageStatus: null,
    startedAt: serverTimestamp(),
    completedAt: null,
    closureReason: null,
    createdAt: serverTimestamp(),
    createdBy: params.actorPersonId,
    updatedAt: serverTimestamp(),
    updatedBy: params.actorPersonId,
  });

  await updateDoc(doc(getDb(), 'people', params.personId), {
    activeJourneyId: journeyRef.id,
    updatedAt: serverTimestamp(),
    updatedBy: params.actorPersonId,
  });

  await updateDoc(doc(getDb(), 'publicRegistrations', params.registrationId), {
    status: 'accepted',
    linkedPersonId: params.personId,
    linkedJourneyId: journeyRef.id,
    reviewedByPersonId: params.actorPersonId,
    updatedAt: serverTimestamp(),
  });

  await writeAudit({
    organizationId: params.organizationId,
    action: 'follow_up.registration.link_existing',
    actorPersonId: params.actorPersonId,
    actorAuthUid: null,
    targetType: 'publicRegistration',
    targetId: params.registrationId,
    before: null,
    after: { personId: params.personId, journeyId: journeyRef.id },
    metadata: null,
  });

  return { journeyId: journeyRef.id };
}

export async function discardRegistration(params: {
  organizationId: string;
  registrationId: string;
  actorPersonId: string;
  notes?: string;
}): Promise<void> {
  await updateDoc(doc(getDb(), 'publicRegistrations', params.registrationId), {
    status: 'discarded',
    reviewNotes: params.notes ?? null,
    reviewedByPersonId: params.actorPersonId,
    updatedAt: serverTimestamp(),
  });
  await writeAudit({
    organizationId: params.organizationId,
    action: 'follow_up.registration.discard',
    actorPersonId: params.actorPersonId,
    actorAuthUid: null,
    targetType: 'publicRegistration',
    targetId: params.registrationId,
    before: null,
    after: { status: 'discarded' },
    metadata: { notes: params.notes ?? null },
  });
}

export async function submitMembershipRecommendation(params: {
  organizationId: string;
  assignment: FollowUpAssignment;
  actorPersonId: string;
  participationSummary: string;
  attendanceSummary: string;
  followUpSummary: string;
  willingness: string;
  concerns?: string;
  comments?: string;
  nextSteps?: string;
}): Promise<string> {
  const ref = doc(collection(getDb(), 'membershipRecommendations'));
  await setDoc(ref, {
    organizationId: params.organizationId,
    journeyId: params.assignment.journeyId,
    personId: params.assignment.newcomerPersonId,
    assignmentId: params.assignment.id,
    status: 'submitted',
    participationSummary: params.participationSummary,
    attendanceSummary: params.attendanceSummary,
    followUpSummary: params.followUpSummary,
    willingness: params.willingness,
    concerns: params.concerns ?? null,
    comments: params.comments ?? null,
    nextSteps: params.nextSteps ?? null,
    submittedByPersonId: params.actorPersonId,
    submittedAt: serverTimestamp(),
    decidedByPersonId: null,
    decidedAt: null,
    decisionComment: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(doc(getDb(), 'newcomerJourneys', params.assignment.journeyId), {
    journeyStatus: 'membership_approval_in_progress',
    membershipReadinessStatus: 'ready',
    updatedAt: serverTimestamp(),
    updatedBy: params.actorPersonId,
  });

  await writeAudit({
    organizationId: params.organizationId,
    action: 'follow_up.membership.recommend',
    actorPersonId: params.actorPersonId,
    actorAuthUid: null,
    targetType: 'membershipRecommendation',
    targetId: ref.id,
    before: null,
    after: { status: 'submitted' },
    metadata: null,
  });

  return ref.id;
}

export async function listMembershipRecommendations(
  organizationId: string,
): Promise<MembershipRecommendation[]> {
  const snap = await getDocs(
    query(
      collection(getDb(), 'membershipRecommendations'),
      where('organizationId', '==', organizationId),
      where('status', '==', 'submitted'),
    ),
  );
  return snap.docs.map((d) =>
    mapDoc<MembershipRecommendation>(
      d.id,
      d.data() as Omit<MembershipRecommendation, 'id'>,
    ),
  );
}

export async function decideMembershipRecommendation(params: {
  organizationId: string;
  recommendation: MembershipRecommendation;
  actorPersonId: string;
  decision: 'approved' | 'rejected' | 'returned_for_correction';
  comment?: string;
}): Promise<void> {
  await updateDoc(
    doc(getDb(), 'membershipRecommendations', params.recommendation.id),
    {
      status: params.decision,
      decidedByPersonId: params.actorPersonId,
      decidedAt: serverTimestamp(),
      decisionComment: params.comment ?? null,
      updatedAt: serverTimestamp(),
    },
  );

  if (params.decision === 'approved') {
    await updateDoc(doc(getDb(), 'people', params.recommendation.personId), {
      currentMinistryStatus: 'member',
      updatedAt: serverTimestamp(),
      updatedBy: params.actorPersonId,
    });
    await updateDoc(
      doc(getDb(), 'newcomerJourneys', params.recommendation.journeyId),
      {
        journeyStatus: 'transitioned_to_member',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: params.actorPersonId,
      },
    );
    const assignments = await getDocs(
      query(
        collection(getDb(), 'followUpAssignments'),
        where('journeyId', '==', params.recommendation.journeyId),
        where('assignmentStatus', '==', 'active'),
      ),
    );
    for (const d of assignments.docs) {
      await updateDoc(d.ref, {
        assignmentStatus: 'ended',
        endDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } else if (params.decision === 'rejected') {
    await updateDoc(
      doc(getDb(), 'newcomerJourneys', params.recommendation.journeyId),
      {
        journeyStatus: 'active_follow_up',
        updatedAt: serverTimestamp(),
        updatedBy: params.actorPersonId,
      },
    );
  }

  await writeAudit({
    organizationId: params.organizationId,
    action: `follow_up.membership.${params.decision}`,
    actorPersonId: params.actorPersonId,
    actorAuthUid: null,
    targetType: 'membershipRecommendation',
    targetId: params.recommendation.id,
    before: { status: params.recommendation.status },
    after: { status: params.decision },
    metadata: { comment: params.comment ?? null },
  });
}
