/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Cloud service layer for SonicObsidian.
 * 
 * Audio & cover files → Google Drive (via Apps Script proxy, free)
 * Song metadata + playlist data → Firebase Firestore (free tier)
 *
 * Firebase Storage is no longer used for audio files.
 */

import {
  collection,
  setDoc,
  doc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';

// ─── Firestore CRUD ──────────────────────────────────────────────────────────

/** Save a song document to Firestore. The audioUrl/coverUrl are Google Drive URLs. */
export async function saveSongToFirestore(song) {
  if (!db) throw new Error('Firestore not configured');
  await setDoc(doc(db, 'songs', song.id), {
    ...song,
    createdAt: serverTimestamp(),
  });
}

/** Save a playlist document to Firestore. */
export async function savePlaylistToFirestore(playlist) {
  if (!db) throw new Error('Firestore not configured');
  await setDoc(doc(db, 'playlists', playlist.id), {
    ...playlist,
    createdAt: serverTimestamp(),
  });
}

/** Update specific fields of a playlist. */
export async function updatePlaylistInFirestore(playlistId, data) {
  if (!db) throw new Error('Firestore not configured');
  await updateDoc(doc(db, 'playlists', playlistId), data);
}

/** Delete a playlist document from Firestore. */
export async function deletePlaylistFromFirestore(playlistId) {
  if (!db) throw new Error('Firestore not configured');
  await deleteDoc(doc(db, 'playlists', playlistId));
}

/** Update an existing song's metadata in Firestore. */
export async function updateSongInFirestore(songId, data) {
  if (!db) throw new Error('Firestore not configured');
  await updateDoc(doc(db, 'songs', songId), data);
}

/**
 * Delete a song document from Firestore.
 * NOTE: Audio/cover files live on Google Drive — they are NOT deleted here
 * because Drive files are managed via the Drive API, not from the frontend.
 * Users can manually delete old files from their Google Drive "SonicObsidian" folder.
 */
export async function deleteSongFromFirestore(song) {
  if (!db) throw new Error('Firestore not configured');
  await deleteDoc(doc(db, 'songs', song.id));
  // Drive file deletion would require an authenticated Drive API call.
  // Files remain in Drive but are no longer referenced in the app.
}

// ─── Real-time subscriptions ─────────────────────────────────────────────────

/**
 * Subscribe to all songs (public — anyone can read).
 * Songs' audioUrl and coverUrl point to Google Drive.
 */
export function subscribeToSongs(callback) {
  if (!db || !isFirebaseConfigured) return () => {};

  const q = query(collection(db, 'songs'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const songs = snap.docs.map((d) => {
        const data = d.data();
        const ts = data.createdAt;
        const dateAdded = ts
          ? new Date(ts.toMillis()).toLocaleDateString()
          : 'Just added';
        return { ...data, id: d.id, dateAdded };
      });
      callback(songs);
    },
    (err) => {
      console.error('[Firestore] Songs subscription error:', err.code, err.message);
      if (err.code === 'permission-denied') {
        console.warn('[Firestore] PERMISSION DENIED on songs. Deploy firestore.rules:\n  firebase deploy --only firestore:rules');
      } else if (err.code === 'failed-precondition') {
        console.warn('[Firestore] Missing index for songs orderBy. Visit the Firebase Console to create it or go to:\n  https://console.firebase.google.com/project/music-website-4dbb2/firestore/indexes');
      }
    },
  );
}

/**
 * Subscribe to playlists owned by the logged-in user (private playlists).
 * NOTE: orderBy('createdAt') removed — it requires a composite index.
 * Sorting is done client-side instead.
 */
export function subscribeToPlaylists(userId, callback) {
  if (!db || !isFirebaseConfigured || !userId) return () => {};

  // Simple query — only filter by userId, no orderBy (avoids composite index requirement)
  const q = query(
    collection(db, 'playlists'),
    where('userId', '==', userId),
  );
  return onSnapshot(
    q,
    (snap) => {
      const playlists = snap.docs
        .map((d) => ({ ...d.data(), id: d.id }))
        // Sort client-side by createdAt descending
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      callback(playlists);
    },
    (err) => {
      console.error('[Firestore] Playlists subscription error:', err.code, err.message);
      if (err.code === 'permission-denied') {
        console.warn('[Firestore] PERMISSION DENIED on playlists. Deploy firestore.rules:\n  firebase deploy --only firestore:rules');
      }
    },
  );
}

// ─── Legacy Firebase Storage helpers (kept for backward compat) ───────────────
// These are only used by EditSongModal when updating cover images.
// For new uploads, driveService.js is used instead.

export async function uploadFileToStorage(_file, _path, _onProgress) {
  throw new Error(
    'Firebase Storage audio uploads are disabled. ' +
    'Use driveService.uploadAudioToDrive() or driveService.uploadCoverToDrive() instead.'
  );
}

/** @deprecated Use driveService instead. */
export async function deleteSongFromFirestoreAndStorage(song) {
  // Just delete from Firestore; Drive files are manually managed
  await deleteSongFromFirestore(song);
}

/** @deprecated Use driveService instead. */
export async function deleteFileByUrl(_url) {
  // No-op: Drive file deletion requires Drive API, not implemented client-side
  console.warn('[Drive] File deletion from Drive is not implemented. Remove files manually from Google Drive → SonicObsidian folder.');
}
