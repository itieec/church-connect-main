#!/usr/bin/env node
/**
 * One-shot Firebase production connect helper.
 *
 * This environment cannot interactively `firebase login`. Provide credentials
 * via env, then run:
 *
 *   export FIREBASE_TOKEN=...                    # from: firebase login:ci (on your machine)
 *   # OR place a service account and:
 *   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json
 *   export FIREBASE_TOKEN=$(npx firebase login:ci)  # interactive on your laptop
 *
 *   export BOOTSTRAP_EMAIL=you@example.com
 *   export BOOTSTRAP_PASSWORD='...'
 *   # optional web config write:
 *   export VITE_FIREBASE_API_KEY=...
 *   export VITE_FIREBASE_AUTH_DOMAIN=ieec-ya-connect.firebaseapp.com
 *   export VITE_FIREBASE_PROJECT_ID=ieec-ya-connect
 *   export VITE_FIREBASE_STORAGE_BUCKET=ieec-ya-connect.appspot.com
 *   export VITE_FIREBASE_MESSAGING_SENDER_ID=...
 *   export VITE_FIREBASE_APP_ID=...
 *
 *   node scripts/firebase-connect-and-deploy.mjs
 */

import { spawnSync } from 'node:child_process';
import { writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const projectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.GCLOUD_PROJECT ||
  'ieec-ya-connect';

function run(cmd, args, opts = {}) {
  console.log(`\n$ ${cmd} ${args.join(' ')}`);
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    env: process.env,
    shell: false,
    ...opts,
  });
  if (result.status !== 0) {
    throw new Error(`Command failed (${result.status}): ${cmd} ${args.join(' ')}`);
  }
}

function writeWebEnvIfPresent() {
  const required = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.log(
      `Skipping apps/web/.env.local write (missing ${missing.join(', ')}).`,
    );
    return;
  }
  const body = required
    .map((k) => `${k}=${process.env[k]}`)
    .concat([
      `VITE_FIREBASE_MEASUREMENT_ID=${process.env.VITE_FIREBASE_MEASUREMENT_ID || ''}`,
      'VITE_USE_EMULATORS=false',
      `VITE_PUBLIC_ORG_ID=${process.env.ORGANIZATION_ID || 'ieec_ya'}`,
    ])
    .join('\n');
  const path = resolve('apps/web/.env.local');
  writeFileSync(path, `${body}\n`);
  console.log(`Wrote ${path}`);
}

function main() {
  if (!process.env.FIREBASE_TOKEN && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error(`
Firebase credentials are not available in this cloud agent.

On a machine where you can open a browser (or CI with a token):

  1. firebase login:ci          → copy token
  2. export FIREBASE_TOKEN=...
  3. Create/select project ${projectId} in Firebase Console
  4. Enable Authentication → Email/Password
  5. Create Firestore (production mode)
  6. Register Web + Android + iOS apps; copy configs
  7. Create a service account JSON for seeding
  8. Re-run: node scripts/firebase-connect-and-deploy.mjs

Or paste FIREBASE_TOKEN + VITE_FIREBASE_* + GOOGLE_APPLICATION_CREDENTIALS
into this agent environment and ask to re-run deploy.
`);
    process.exit(2);
  }

  write.FIREBASE_PROJECT_ID = projectId;
  writeWebEnvIfPresent();

  run('npx', ['firebase', 'use', projectId]);
  run('npm', ['run', 'build']);
  run('npx', ['firebase', 'deploy', '--only', 'firestore:rules,firestore:indexes,hosting', '--project', projectId]);

  if (!process.env.BOOTSTRAP_EMAIL || !process.env.BOOTSTRAP_PASSWORD) {
    console.log('Skipping seed (set BOOTSTRAP_EMAIL + BOOTSTRAP_PASSWORD).');
    return;
  }
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    console.log('Skipping seed (need GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON).');
    return;
  }
  run('node', ['scripts/seed-bootstrap.mjs']);
  console.log('\nDeploy + seed complete. Sign in on Hosting URL and open /app/follow-up.');
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
