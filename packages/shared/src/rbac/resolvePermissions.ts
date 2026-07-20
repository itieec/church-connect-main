import type {
  OrganizationScope,
  PermissionOverride,
  RoleAssignment,
  RoleTemplate,
} from '../types/platform.js';

export interface ResolvePermissionsInput {
  assignments: RoleAssignment[];
  templatesById: Record<string, RoleTemplate>;
  overrides: PermissionOverride[];
  /** Optional: limit evaluation to a specific scope (e.g. active team). */
  activeScope?: OrganizationScope | null;
  now?: Date;
}

export interface ResolvePermissionsResult {
  granted: Set<string>;
  denied: Set<string>;
  effective: Set<string>;
}

function toDate(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const maybe = value as { toDate: () => Date };
    return maybe.toDate();
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function isTimeActive(
  startDate: unknown,
  endDate: unknown,
  now: Date,
): boolean {
  const start = toDate(startDate);
  const end = toDate(endDate);
  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
}

/** Scope A covers scope B when A is equal or an ancestor of B. */
export function scopeCovers(
  assignmentScope: OrganizationScope,
  activeScope: OrganizationScope | null | undefined,
): boolean {
  if (!activeScope) return true;
  if (assignmentScope.organizationId !== activeScope.organizationId) {
    return false;
  }
  if (assignmentScope.type === 'platform' || assignmentScope.type === 'organization') {
    return true;
  }
  if (assignmentScope.type === 'ministry') {
    return (
      !activeScope.ministryId ||
      assignmentScope.ministryId === activeScope.ministryId
    );
  }
  if (assignmentScope.type === 'team') {
    return (
      !activeScope.teamId || assignmentScope.teamId === activeScope.teamId
    );
  }
  if (assignmentScope.type === 'group') {
    return (
      !activeScope.groupId || assignmentScope.groupId === activeScope.groupId
    );
  }
  return false;
}

/**
 * Resolve effective permissions per ADR-RBAC-001/002/003:
 * - Role assignment grants all template permissions in scope
 * - Grant overrides add; deny overrides remove
 * - Deny wins; default deny otherwise
 * - Time-bound start/end respected when present
 */
export function resolvePermissions(
  input: ResolvePermissionsInput,
): ResolvePermissionsResult {
  const now = input.now ?? new Date();
  const granted = new Set<string>();
  const denied = new Set<string>();

  for (const assignment of input.assignments) {
    if (!assignment.active) continue;
    if (!isTimeActive(assignment.startDate, assignment.endDate, now)) continue;
    if (!scopeCovers(assignment.scope, input.activeScope)) continue;

    const template = input.templatesById[assignment.roleTemplateId];
    if (!template || template.recordStatus === 'archived') continue;

    for (const permission of template.permissions) {
      granted.add(permission);
    }
  }

  for (const override of input.overrides) {
    if (!override.active) continue;
    if (!isTimeActive(override.startDate, override.endDate, now)) continue;
    if (!scopeCovers(override.scope, input.activeScope)) continue;

    if (override.effect === 'grant') {
      granted.add(override.permission);
    } else if (override.effect === 'deny') {
      denied.add(override.permission);
    }
  }

  const effective = new Set<string>();
  for (const permission of granted) {
    if (!denied.has(permission)) {
      effective.add(permission);
    }
  }

  return { granted, denied, effective };
}

export function hasPermission(
  effective: Set<string> | readonly string[],
  permission: string,
): boolean {
  if (effective instanceof Set) return effective.has(permission);
  return effective.includes(permission);
}
