import { FOLLOW_UP_CONFIG_DEFAULTS } from '../types/followUp.js';

/** Start of reporting week (Sunday 00:00 local conceptually; date-only UTC noon). */
export function getReportingWeekBounds(
  reference: Date = new Date(),
): { weekStart: Date; weekEnd: Date; dueAt: Date } {
  const d = new Date(reference);
  const day = d.getDay(); // 0 Sun … 5 Fri
  const weekStart = new Date(d);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(d.getDate() - day);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Friday due (end of day)
  const dueAt = new Date(weekStart);
  dueAt.setDate(weekStart.getDate() + 5);
  dueAt.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd, dueAt };
}

export function isReportLate(submittedAt: Date, dueAt: Date): boolean {
  return submittedAt.getTime() > dueAt.getTime();
}

export function getEditableUntil(
  submittedAt: Date,
  editWindowDays = FOLLOW_UP_CONFIG_DEFAULTS.reportEditWindowDays,
): Date {
  const until = new Date(submittedAt);
  until.setDate(until.getDate() + editWindowDays);
  return until;
}

export function canEditReport(params: {
  reportStatus: string;
  submittedByPersonId?: string | null;
  currentPersonId: string;
  editableUntil?: Date | null;
  now?: Date;
  canEditLocked?: boolean;
}): boolean {
  const now = params.now ?? new Date();
  if (params.canEditLocked) return true;
  if (params.submittedByPersonId !== params.currentPersonId) return false;
  if (
    params.reportStatus === 'draft' ||
    params.reportStatus === 'pending' ||
    params.reportStatus === 'returned_for_correction'
  ) {
    return true;
  }
  if (
    params.reportStatus === 'submitted_on_time' ||
    params.reportStatus === 'submitted_late'
  ) {
    if (!params.editableUntil) return false;
    return now.getTime() <= params.editableUntil.getTime();
  }
  return false;
}

/** Deterministic attendance doc id: personId + calendarEventId */
export function attendanceDocId(personId: string, calendarEventId: string): string {
  return `${personId}__${calendarEventId}`;
}

/** Next/current Saturday program window helper (local calendar date). */
export function getSaturdayProgramDate(reference: Date = new Date()): Date {
  const d = new Date(reference);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const delta = day === 6 ? 0 : (6 - day + 7) % 7;
  d.setDate(d.getDate() + delta);
  return d;
}

export function saturdayEventId(
  organizationId: string,
  programDate: Date,
): string {
  const y = programDate.getFullYear();
  const m = String(programDate.getMonth() + 1).padStart(2, '0');
  const day = String(programDate.getDate()).padStart(2, '0');
  return `${organizationId}_sat_${y}${m}${day}`;
}
