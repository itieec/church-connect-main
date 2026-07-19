/**
 * Canonical permission keys (plural resources).
 * Source: docs/modules/follow-up-permission-catalog.md + platform admin keys.
 */

export const PLATFORM_PERMISSIONS = [
  'platform.admin',
  'org.admin',
  'people.view',
  'people.manage',
  'rbac.templates.manage',
  'rbac.assignments.manage',
  'rbac.overrides.manage',
  'audit.view',
] as const;

export const FOLLOW_UP_PERMISSIONS = [
  'follow_up.view',
  'follow_up.newcomers.view_unassigned',
  'follow_up.newcomers.view_all',
  'follow_up.journey.create',
  'follow_up.journey.mark_inactive',
  'follow_up.journey.close',
  'follow_up.journey.reopen',
  'follow_up.duplicate.review',
  'follow_up.assignments.create',
  'follow_up.assignments.reassign',
  'follow_up.reports.submit',
  'follow_up.reports.edit_own',
  'follow_up.reports.edit_locked',
  'follow_up.reports.review',
  'follow_up.reports.view_all',
  'follow_up.attendance.record_assigned',
  'follow_up.attendance.view_all',
  'follow_up.attendance.correct',
  'follow_up.bio.view',
  'follow_up.bio.add',
  'follow_up.bio.view_sensitive',
  'follow_up.membership_review.start',
  'membership.recommendations.submit',
  'follow_up.chat.create',
  'follow_up.chat.manage_members',
  'follow_up.welcome_schedule.view',
  'follow_up.welcome_schedule.create',
  'follow_up.welcome_schedule.assign',
  'follow_up.welcome_schedule.update',
  'follow_up.welcome_schedule.cancel',
  'calendar.event.create',
  'calendar.event.manage',
  'calendar.conflict.override',
  'workflow.override',
] as const;

export const FOLLOW_UP_LEADER_PERMISSIONS: readonly string[] = [
  'follow_up.view',
  'follow_up.newcomers.view_unassigned',
  'follow_up.newcomers.view_all',
  'follow_up.duplicate.review',
  'follow_up.assignments.create',
  'follow_up.assignments.reassign',
  'follow_up.reports.view_all',
  'follow_up.reports.review',
  'follow_up.reports.edit_locked',
  'follow_up.attendance.view_all',
  'follow_up.attendance.correct',
  'follow_up.bio.view',
  'follow_up.bio.add',
  'follow_up.membership_review.start',
  'follow_up.chat.create',
  'follow_up.chat.manage_members',
  'follow_up.welcome_schedule.view',
  'follow_up.welcome_schedule.create',
  'follow_up.welcome_schedule.assign',
  'follow_up.welcome_schedule.update',
  'follow_up.welcome_schedule.cancel',
  'calendar.event.create',
  'calendar.event.manage',
];

/** Assistant Leader: no management permissions by default. */
export const FOLLOW_UP_ASSISTANT_LEADER_PERMISSIONS: readonly string[] = [
  'follow_up.view',
];

/** Minister / assigned-work template defaults. */
export const FOLLOW_UP_MINISTER_PERMISSIONS: readonly string[] = [
  'follow_up.view',
  'follow_up.reports.submit',
  'follow_up.reports.edit_own',
  'follow_up.attendance.record_assigned',
  'follow_up.bio.view',
  'follow_up.bio.add',
  'membership.recommendations.submit',
];

export const HEAD_LEADER_PERMISSIONS: readonly string[] = [
  ...PLATFORM_PERMISSIONS,
  ...FOLLOW_UP_LEADER_PERMISSIONS,
];

export const SUPER_ADMIN_PERMISSIONS: readonly string[] = [
  ...PLATFORM_PERMISSIONS,
  ...FOLLOW_UP_PERMISSIONS,
];
