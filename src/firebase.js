/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Firebase initialization module.
 * Reads config from VITE_ environment variables.
 *
 * Services used:
 *  - Firebase Auth  (username/password login)
 *  - Firebase Firestore (song metadata + playlist metadata)
 *
 * NOT used:
 *  - Firebase Storage (audio/cover files now stored on Google Drive for free)
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if all required keys are present and not placeholder values
export const isFirebaseConfigured =
  !!firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'your_api_key_here' &&
  !!firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'your_project_id_here';

let app = null;
let db = null;
let auth = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log('[SonicObsidian] Firebase connected ✓ (Firestore + Auth)');
    console.log('[SonicObsidian] Audio storage → Google Drive via Apps Script');
  } catch (err) {
    console.error('[SonicObsidian] Firebase init failed:', err);
  }
} else {
  console.warn(
    '[SonicObsidian] Firebase not configured — running in local-only mode.\n' +
    'Add VITE_FIREBASE_* variables to your .env file to enable cloud sync.'
  );
}

export { app, db, auth };
// Note: storage is intentionally NOT exported — audio goes to Google Drive now.
