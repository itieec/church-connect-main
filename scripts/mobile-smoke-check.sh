#!/usr/bin/env bash
# Mobile smoke checklist helper — does not replace EAS/device access.
set -euo pipefail
cd "$(dirname "$0")/../apps/mobile"

if [[ ! -f google-services.json ]]; then
  echo "Missing google-services.json — copy from Firebase Console (Android app org.ieec.yaconnect)"
  echo "  cp google-services.json.example google-services.json   # then replace placeholders"
  exit 2
fi
if [[ ! -f GoogleService-Info.plist ]]; then
  echo "Missing GoogleService-Info.plist — copy from Firebase Console (iOS app org.ieec.yaconnect)"
  exit 2
fi

echo "Native Firebase configs present."
echo "Next:"
echo "  npm run build -w @ieec/shared"
echo "  npx expo prebuild"
echo "  eas build --profile preview --platform android   # or ios"
echo "Then install the artifact, sign in, open Follow-Up → report + attendance."
