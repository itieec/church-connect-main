/** Shared platform domain contracts (Phase A). */

export type MinistryStatus = 'newcomer' | 'member' | 'minister';
export type RecordStatus = 'active' | 'inactive' | 'archived';
export type AccountStatus =
  | 'invited'
  | 'pending_activation'
  | 'active'
  | 'disabled'
  | 'revoked';

export type ScopeType =
  | 'platform'
  | 'organization'
  | 'ministry'
  | 'team'
  | 'group';

export interface OrganizationScope {
  type: ScopeType;
  organizationId: string;
  ministryId?: string | null;
  teamId?: string | null;
  groupId?: string | null;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  recordStatus: RecordStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Person {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  normalizedFirstName: string;
  normalizedLastName: string;
  sex?: string | null;
  phone?: { display: string; normalized: string } | null;
  email?: { address: string; normalized: string; verified: boolean } | null;
  currentMinistryStatus: MinistryStatus | string;
  recordStatus: RecordStatus | string;
  hasUserAccount: boolean;
  activeJourneyId?: string | null;
  createdAt?: unknown;
  createdBy?: string;
  updatedAt?: unknown;
  updatedBy?: string;
}

export interface UserAccount {
  organizationId: string;
  personId: string;
  email: string;
  accountStatus: AccountStatus | string;
  emailVerified: boolean;
  invitationStatus?: string;
  invitedAt?: unknown | null;
  activatedAt?: unknown | null;
  lastLoginAt?: unknown | null;
  /** Bootstrap flag for Super Admin until custom claims land. */
  isSuperAdmin?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface RoleTemplate {
  id: string;
  organizationId: string;
  key: string;
  name: string;
  description?: string;
  permissions: string[];
  scopeTypes: ScopeType[];
  recordStatus: RecordStatus | string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface RoleAssignment {
  id: string;
  organizationId: string;
  personId: string;
  roleTemplateId: string;
  scope: OrganizationScope;
  active: boolean;
  startDate?: unknown | null;
  endDate?: unknown | null;
  assignedByPersonId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type OverrideEffect = 'grant' | 'deny';

export interface PermissionOverride {
  id: string;
  organizationId: string;
  personId: string;
  permission: string;
  effect: OverrideEffect;
  scope: OrganizationScope;
  active: boolean;
  reason?: string;
  startDate?: unknown | null;
  endDate?: unknown | null;
  createdByPersonId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AuditLog {
  id?: string;
  organizationId: string;
  action: string;
  actorPersonId: string | null;
  actorAuthUid: string | null;
  targetType: string;
  targetId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: unknown;
}

export interface Ministry {
  id: string;
  organizationId: string;
  name: string;
  key: string;
  recordStatus: RecordStatus | string;
}

export interface Team {
  id: string;
  organizationId: string;
  ministryId: string;
  name: string;
  key: string;
  recordStatus: RecordStatus | string;
}
