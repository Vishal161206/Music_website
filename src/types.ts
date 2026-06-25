/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  durationSec: number;
  coverUrl: string;
  audioUrl?: string;       // GCS/Firebase Storage URL for the actual audio
  dateAdded: string;
  lyrics: string[];
  genre: string;
  isLiked?: boolean;
  uploaderName?: string;   // Public attribution (optional)
  uploaderId?: string;     // Firebase Auth UID of uploader
  createdAt?: number;      // Unix timestamp for sorting
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl: string;
  songIds: string[];
  isPublic: boolean;
  isUserCreated?: boolean;
  userId: string;          // Firebase Auth UID of owner — playlists are private per user
  createdAt?: number;
}

export interface Artist {
  id: string;
  name: string;
  image: string;
  tracksCount: number;
  type: 'Followed Artist' | 'Verified Artist';
}

export type ActiveScreen = 'home' | 'now-playing' | 'library' | 'playlist-detail';
