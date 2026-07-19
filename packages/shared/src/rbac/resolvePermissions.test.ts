import { resolvePermissions } from './resolvePermissions.js';
import type { PermissionOverride, RoleAssignment, RoleTemplate } from '../types/platform.js';

const orgScope = {
  type: 'organization' as const,
  organizationId: 'ieec_ya',
};

const template: RoleTemplate = {
  id: 'tpl_leader',
  organizationId: 'ieec_ya',
  key: 'follow_up_leader',
  name: 'Follow-Up Leader',
  permissions: ['follow_up.view', 'follow_up.assignments.create'],
  scopeTypes: ['team'],
  recordStatus: 'active',
};

const assignment: RoleAssignment = {
  id: 'asg1',
  organizationId: 'ieec_ya',
  personId: 'p1',
  roleTemplateId: 'tpl_leader',
  scope: orgScope,
  active: true,
};

const denyOverride: PermissionOverride = {
  id: 'ov1',
  organizationId: 'ieec_ya',
  personId: 'p1',
  permission: 'follow_up.assignments.create',
  effect: 'deny',
  scope: orgScope,
  active: true,
};

const result = resolvePermissions({
  assignments: [assignment],
  templatesById: { tpl_leader: template },
  overrides: [denyOverride],
});

if (!result.effective.has('follow_up.view')) {
  throw new Error('expected follow_up.view');
}
if (result.effective.has('follow_up.assignments.create')) {
  throw new Error('deny should win');
}

console.log('resolvePermissions tests passed');
