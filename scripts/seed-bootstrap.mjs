#!/usr/bin/env node
/**
 * Bootstrap Super Admin / Head Leader for IEEC YA Connect (Phase A).
 *
 * Requires:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
 *   or FIREBASE_SERVICE_ACCOUNT_JSON='{...}'
 *
 * Optional env:
 *   BOOTSTRAP_EMAIL=admin@example.com
 *   BOOTSTRAP_PASSWORD=...
 *   BOOTSTRAP_FIRST_NAME=Head
 *   BOOTSTRAP_LAST_NAME=Leader
 *   ORGANIZATION_ID=ieec_ya
 *   ORGANIZATION_NAME=IEEC YA
 */

import { readFileSync } from 'node:fs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

function loadCredential() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
  }
  throw new Error(
    'Provide GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON for Admin SDK seed.',
  );
}

const email = process.env.BOOTSTRAP_EMAIL;
const password = process.env.BOOTSTRAP_PASSWORD;
const firstName = process.env.BOOTSTRAP_FIRST_NAME || 'Head';
const lastName = process.env.BOOTSTRAP_LAST_NAME || 'Leader';
const organizationId = process.env.ORGANIZATION_ID || 'ieec_ya';
const organizationName = process.env.ORGANIZATION_NAME || 'IEEC YA';
const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || 'ieec-ya-connect';

if (!email || !password) {
  console.error('Set BOOTSTRAP_EMAIL and BOOTSTRAP_PASSWORD.');
  process.exit(1);
}

const credential = loadCredential();
if (!getApps().length) {
  initializeApp({
    credential: cert(credential),
    projectId,
  });
}

const auth = getAuth();
const db = getFirestore();

const {
  FOLLOW_UP_LEADER_PERMISSIONS,
  FOLLOW_UP_ASSISTANT_LEADER_PERMISSIONS,
  FOLLOW_UP_MINISTER_PERMISSIONS,
  SUPER_ADMIN_PERMISSIONS,
  HEAD_LEADER_PERMISSIONS,
  normalizeName,
  normalizeEmail,
} = await import('../packages/shared/dist/index.js');

async function upsertAuthUser() {
  try {
    const existing = await auth.getUserByEmail(email);
    await auth.updateUser(existing.uid, { password, emailVerified: true });
    return existing.uid;
  } catch (err) {
    if (err?.code !== 'auth/user-not-found') throw err;
    const created = await auth.createUser({
      email,
      password,
      emailVerified: true,
      displayName: `${firstName} ${lastName}`,
    });
    return created.uid;
  }
}

async function main() {
  const uid = await upsertAuthUser();
  const personId = `person_${organizationId}_bootstrap`;
  const now = FieldValue.serverTimestamp();
  const orgScope = {
    type: 'organization',
    organizationId,
    ministryId: null,
    teamId: null,
    groupId: null,
  };

  const batch = db.batch();

  batch.set(
    db.collection('organizations').doc(organizationId),
    {
      name: organizationName,
      slug: organizationId,
      timezone: 'America/New_York',
      recordStatus: 'active',
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );

  const ministryId = `${organizationId}_young_adult`;
  batch.set(
    db.collection('ministries').doc(ministryId),
    {
      organizationId,
      name: 'Young Adult',
      key: 'young_adult',
      recordStatus: 'active',
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );

  const teamId = `${organizationId}_follow_up`;
  batch.set(
    db.collection('teams').doc(teamId),
    {
      organizationId,
      ministryId,
      name: 'Follow-Up',
      key: 'follow_up',
      recordStatus: 'active',
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );

  batch.set(
    db.collection('people').doc(personId),
    {
      organizationId,
      firstName,
      lastName,
      normalizedFirstName: normalizeName(firstName),
      normalizedLastName: normalizeName(lastName),
      email: {
        address: email,
        normalized: normalizeEmail(email),
        verified: true,
      },
      currentMinistryStatus: 'minister',
      recordStatus: 'active',
      hasUserAccount: true,
      activeJourneyId: null,
      createdAt: now,
      createdBy: 'seed-bootstrap',
      updatedAt: now,
      updatedBy: 'seed-bootstrap',
    },
    { merge: true },
  );

  batch.set(
    db.collection('userAccounts').doc(uid),
    {
      organizationId,
      personId,
      email,
      accountStatus: 'active',
      emailVerified: true,
      invitationStatus: 'activated',
      invitedAt: now,
      activatedAt: now,
      lastLoginAt: null,
      isSuperAdmin: true,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );

  const templates = [
    {
      id: `${organizationId}_super_admin`,
      key: 'super_admin',
      name: 'Super Admin',
      permissions: [...SUPER_ADMIN_PERMISSIONS],
      scopeTypes: ['platform', 'organization'],
    },
    {
      id: `${organizationId}_head_leader`,
      key: 'head_leader',
      name: 'Head Leader',
      permissions: [...HEAD_LEADER_PERMISSIONS],
      scopeTypes: ['organization'],
    },
    {
      id: `${organizationId}_follow_up_leader`,
      key: 'follow_up_leader',
      name: 'Follow-Up Leader',
      permissions: [...FOLLOW_UP_LEADER_PERMISSIONS],
      scopeTypes: ['team'],
    },
    {
      id: `${organizationId}_follow_up_assistant`,
      key: 'follow_up_assistant_leader',
      name: 'Follow-Up Assistant Leader',
      permissions: [...FOLLOW_UP_ASSISTANT_LEADER_PERMISSIONS],
      scopeTypes: ['team'],
    },
    {
      id: `${organizationId}_follow_up_minister`,
      key: 'follow_up_minister',
      name: 'Follow-Up Minister',
      permissions: [...FOLLOW_UP_MINISTER_PERMISSIONS],
      scopeTypes: ['team'],
    },
  ];

  for (const t of templates) {
    batch.set(
      db.collection('roleTemplates').doc(t.id),
      {
        organizationId,
        key: t.key,
        name: t.name,
        permissions: t.permissions,
        scopeTypes: t.scopeTypes,
        recordStatus: 'active',
        createdAt: now,
        updatedAt: now,
      },
      { merge: true },
    );
  }

  const assignmentId = `${organizationId}_bootstrap_super_admin`;
  batch.set(
    db.collection('roleAssignments').doc(assignmentId),
    {
      organizationId,
      personId,
      roleTemplateId: `${organizationId}_super_admin`,
      scope: orgScope,
      active: true,
      startDate: null,
      endDate: null,
      assignedByPersonId: personId,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );

  batch.set(db.collection('auditLogs').doc(), {
    organizationId,
    action: 'bootstrap.seed',
    actorPersonId: personId,
    actorAuthUid: uid,
    targetType: 'userAccount',
    targetId: uid,
    before: null,
    after: { email, isSuperAdmin: true },
    metadata: { script: 'seed-bootstrap.mjs' },
    createdAt: now,
  });

  await batch.commit();

  console.log('Bootstrap complete');
  console.log({ projectId, organizationId, email, uid, personId });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
