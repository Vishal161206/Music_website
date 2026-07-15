/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AddSongModal — Upload songs via Google Drive (free, no Firebase Storage cost).
 *
 * Flow:
 *  Audio file  → driveService.uploadAudioToDrive() → Google Drive URL
 *  Cover image → driveService.uploadCoverToDrive() → Google Drive URL
 *  Metadata    → Firestore (title, artist, audioUrl, coverUrl, ...)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Check,
  Music,
  Image as ImageIcon,
  Cloud,
  HardDrive,
  Loader2,
  AlertCircle,
  Info,
} from 'lucide-react';
import { uploadAudioToDrive, uploadCoverToDrive, isDriveConfigured } from '../services/driveService';

const GENRES = [
  'Ambient Electronica', 'Synthwave', 'Lo-Fi Beats', 'Classical Redefined',
  'Vocal Jazz', 'Ambient Soundscape', 'Hip-Hop', 'Rock', 'Pop', 'R&B',
  'Electronic', 'Jazz', 'Classical', 'Folk', 'Indie',
];

// Default cover used when no image is selected
const DEFAULT_COVER = 'https://images.unsplash.com/photo-1614149162883-504ce4d13909?q=80&w=400';

export default function AddSongModal({
  onClose,
  onAdd,
  isDarkMode,
  isCloudMode,
  uploaderId,
  uploaderDisplayName,
}) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('Ambient Electronica');
  const [uploaderName, setUploaderName] = useState(uploaderDisplayName);
  const [lyricsText, setLyricsText] = useState('');

  const [audioFile, setAudioFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadPhase, setUploadPhase] = useState('idle');
  const [audioProgress, setAudioProgress] = useState(0);
  const [coverProgress, setCoverProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);

  const audioInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const blobUrlsRef = useRef([]);

  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const inputCls = `w-full border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary-electric outline-none transition-colors ${
    isDarkMode
      ? 'bg-obsidian-container-high/60 border-white/5 text-white placeholder:text-white/20'
      : 'bg-zinc-50 border-zinc-200 text-zinc-900'
  }`;
  const labelCls = `block text-[10px] font-bold uppercase tracking-widest leading-4 mb-1.5 ${
    isDarkMode ? 'text-obsidian-on-surface-variant/60' : 'text-zinc-500'
  }`;

  const handleAudioChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Warn if file might exceed Apps Script limit
    const MAX_MB = 24;
    if (file.size > MAX_MB * 1024 * 1024) {
      setUploadError(
        `Audio file is ${(file.size / 1024 / 1024).toFixed(1)} MB — maximum is ${MAX_MB} MB for Google Drive upload. ` +
        `Try compressing the MP3 or trimming the track.`
      );
      return;
    }
    setUploadError(null);
    setAudioFile(file);
    if (!title) {
      const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(name.charAt(0).toUpperCase() + name.slice(1));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Cover image must be under 10 MB.');
      return;
    }
    setUploadError(null);
    setImageFile(file);
    if (imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
      blobUrlsRef.current = blobUrlsRef.current.filter((u) => u !== imagePreview);
    }
    const previewUrl = URL.createObjectURL(file);
    blobUrlsRef.current.push(previewUrl);
    setImagePreview(previewUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim() || !audioFile) return;

    setUploadError(null);
    setIsUploading(true);
    setAudioProgress(0);
    setCoverProgress(0);

    const songId = `song-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const lyricsList = lyricsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lyricsList.length === 0) {
      lyricsList.push('Enjoy the music stream...', 'Powered by SonicObsidian.');
    }

    try {
      let audioUrl;
      let coverUrl;

      if (isCloudMode && isDriveConfigured) {
        // ── Upload audio to Google Drive ──────────────────────────────
        setUploadPhase('encoding');
        audioUrl = await uploadAudioToDrive(audioFile, songId, (pct) => {
          setAudioProgress(pct);
          if (pct < 40) setUploadPhase('encoding');
          else setUploadPhase('uploading-audio');
        });

        // ── Upload cover to Google Drive (or use default) ─────────────
        if (imageFile) {
          setCoverProgress(0);
          setUploadPhase('uploading-cover');
          coverUrl = await uploadCoverToDrive(imageFile, songId, (pct) => {
            setCoverProgress(pct);
          });
        } else {
          coverUrl = DEFAULT_COVER;
          setCoverProgress(100);
        }

        setUploadPhase('saving');
      } else {
        // ── Local mode: blob URLs (session only) ──────────────────────
        audioUrl = URL.createObjectURL(audioFile);
        coverUrl = imageFile ? URL.createObjectURL(imageFile) : DEFAULT_COVER;
        blobUrlsRef.current.push(audioUrl);
        if (imageFile) blobUrlsRef.current.push(coverUrl);
        setAudioProgress(100);
        setCoverProgress(100);
      }

      // ── Extract duration from the audio file ──────────────────────
      const durationInfo = await new Promise((resolve) => {
        const audioEl = new Audio();
        // Use the original file as a blob URL just to read metadata
        const tempUrl = URL.createObjectURL(audioFile);
        audioEl.src = tempUrl;
        audioEl.addEventListener('loadedmetadata', () => {
          URL.revokeObjectURL(tempUrl);
          const secs = Math.floor(audioEl.duration) || 180;
          const min = Math.floor(secs / 60);
          const rem = secs % 60;
          resolve({ durationSec: secs, duration: `${min}:${rem < 10 ? '0' : ''}${rem}` });
        });
        audioEl.addEventListener('error', () => {
          URL.revokeObjectURL(tempUrl);
          resolve({ durationSec: 180, duration: '3:00' });
        });
      });

      const newSong = {
        id: songId,
        title: title.trim(),
        artist: artist.trim(),
        album: album.trim() || 'Single Release',
        duration: durationInfo.duration,
        durationSec: durationInfo.durationSec,
        coverUrl,
        audioUrl,  // ← Google Drive URL (permanent, public)
        dateAdded: 'Just added',
        lyrics: lyricsList,
        genre,
        isLiked: false,
        uploaderName: uploaderName.trim() || uploaderDisplayName || 'Anonymous',
        uploaderId,
        createdAt: Date.now(),
      };

      setUploadPhase('done');
      onAdd(newSong);
    } catch (err) {
      console.error('[AddSongModal] Upload failed:', err);
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadPhase('idle');
    }
  };

  // Human-readable phase labels
  const phaseLabel = {
    idle: '',
    encoding: 'Encoding audio file…',
    'uploading-audio': 'Uploading to Google Drive…',
    'uploading-cover': 'Uploading cover to Google Drive…',
    saving: 'Saving to database…',
    done: 'Done!',
  };

  const overallProgress = imageFile
    ? Math.round((audioProgress + coverProgress) / 2)
    : audioProgress;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div
        className={`border rounded-2xl w-full max-w-lg relative overflow-hidden max-h-[92vh] overflow-y-auto custom-scrollbar ${
          isDarkMode
            ? 'bg-obsidian-surface border-white/10 text-white'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/5 backdrop-blur-xl bg-obsidian-surface/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary-electric/15 flex items-center justify-center">
              <Music className="w-4 h-4 text-primary-electric" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold tracking-tight">Upload a Song</h3>
              <p className="text-[10px] text-obsidian-on-surface-variant/50 font-medium mt-0.5">
                {isCloudMode && isDriveConfigured ? (
                  <span className="flex items-center gap-1">
                    <Cloud className="w-3 h-3 text-secondary-emerald" />
                    Audio stored on Google Drive · Metadata in Firebase
                  </span>
                ) : isCloudMode && !isDriveConfigured ? (
                  <span className="flex items-center gap-1 text-amber-400">
                    <AlertCircle className="w-3 h-3" />
                    Drive not configured — running in local mode
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3 h-3" />
                    Local session only
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="text-obsidian-on-surface-variant/60 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Drive not configured warning */}
          {isCloudMode && !isDriveConfigured && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-3 rounded-xl text-xs font-medium">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Google Drive not configured</p>
                <p className="text-amber-400/70 mt-0.5">
                  Deploy <code className="bg-black/20 px-1 rounded">apps-script/Code.gs</code> and set{' '}
                  <code className="bg-black/20 px-1 rounded">VITE_APPS_SCRIPT_URL</code> in your .env file.
                </p>
              </div>
            </div>
          )}

          {/* Error message */}
          {uploadError && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Title + Artist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Song Title *</label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Amber Glitch" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Artist Name *</label>
              <input type="text" required value={artist} onChange={(e) => setArtist(e.target.value)}
                placeholder="e.g. Luminous Pulse" className={inputCls} />
            </div>
          </div>

          {/* Album + Genre */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Album Name</label>
              <input type="text" value={album} onChange={(e) => setAlbum(e.target.value)}
                placeholder="e.g. Single Release" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Genre</label>
              <select value={genre} onChange={(e) => setGenre(e.target.value)} className={inputCls}>
                {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {/* Uploader name */}
          <div>
            <label className={labelCls}>Your Display Name</label>
            <input type="text" value={uploaderName} onChange={(e) => setUploaderName(e.target.value)}
              placeholder="e.g. DJ Cosmic" className={inputCls} />
          </div>

          {/* File pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Audio */}
            <div>
              <label className={`${labelCls} flex items-center justify-between`}>
                <span>Audio File * <span className="normal-case tracking-normal text-obsidian-on-surface-variant/40">(max 24 MB)</span></span>
                {audioFile && <span className="text-secondary-emerald flex items-center gap-0.5 normal-case tracking-normal"><Check className="w-3 h-3" /> Loaded</span>}
              </label>
              <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioChange} className="hidden" />
              <div
                onClick={() => audioInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-primary-electric transition-all flex flex-col items-center gap-1.5 ${
                  audioFile ? 'border-secondary-emerald/40 bg-secondary-emerald/5' :
                  isDarkMode ? 'bg-obsidian-container-low/50 border-white/10' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <Upload className={`w-5 h-5 ${audioFile ? 'text-secondary-emerald' : 'text-primary-electric'}`} />
                <span className="text-xs font-bold truncate max-w-[160px]">
                  {audioFile ? audioFile.name : 'Choose Audio File'}
                </span>
                {audioFile && (
                  <span className="text-[9px] text-obsidian-on-surface-variant/40">
                    {(audioFile.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                )}
                <span className="text-[9px] text-zinc-400">MP3, WAV, M4A, FLAC</span>
              </div>
            </div>

            {/* Cover */}
            <div>
              <label className={`${labelCls} flex items-center justify-between`}>
                <span>Album Cover <span className="normal-case tracking-normal text-obsidian-on-surface-variant/40">(optional)</span></span>
                {imageFile && <span className="text-secondary-emerald flex items-center gap-0.5 normal-case tracking-normal"><Check className="w-3 h-3" /> Custom</span>}
              </label>
              <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              <div className="flex gap-3">
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-primary-electric transition-all flex flex-col items-center gap-1.5 flex-1 ${
                    imageFile ? 'border-secondary-emerald/40 bg-secondary-emerald/5' :
                    isDarkMode ? 'bg-obsidian-container-low/50 border-white/10' : 'bg-zinc-50 border-zinc-200'
                  }`}
                >
                  <ImageIcon className={`w-5 h-5 ${imageFile ? 'text-secondary-emerald' : 'text-primary-electric'}`} />
                  <span className="text-xs font-bold truncate max-w-[100px]">
                    {imageFile ? imageFile.name : 'Choose Cover'}
                  </span>
                  <span className="text-[9px] text-zinc-400">JPG, PNG, WEBP — 10 MB</span>
                </div>
                {/* Preview (local blob) or default placeholder */}
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-obsidian-base">
                  <img
                    src={imagePreview || DEFAULT_COVER}
                    className="w-full h-full object-cover"
                    alt="Cover preview"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Lyrics */}
          <div>
            <label className={labelCls}>Lyrics (Optional — one line per lyric)</label>
            <textarea
              value={lyricsText}
              onChange={(e) => setLyricsText(e.target.value)}
              placeholder={`Midnight echoes fading trace\nWatching as the hours pass...`}
              className={`${inputCls} h-20 resize-none custom-scrollbar`}
            />
          </div>

          {/* Upload progress */}
          {isUploading && (
            <div className="space-y-3 pt-1 bg-obsidian-container-low/40 border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs font-medium text-primary-electric">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {phaseLabel[uploadPhase]}
                </span>
                <span>{overallProgress}%</span>
              </div>

              {/* Audio progress bar */}
              <div>
                <div className="flex justify-between text-[10px] text-obsidian-on-surface-variant/40 mb-1">
                  <span>Audio → Google Drive</span>
                  <span>{audioProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-electric to-primary-electric/70 rounded-full transition-all duration-300"
                    style={{ width: `${audioProgress}%` }}
                  />
                </div>
              </div>

              {/* Cover progress bar */}
              {imageFile && (
                <div>
                  <div className="flex justify-between text-[10px] text-obsidian-on-surface-variant/40 mb-1">
                    <span>Cover → Google Drive</span>
                    <span>{coverProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-secondary-emerald to-secondary-emerald/70 rounded-full transition-all duration-300"
                      style={{ width: `${coverProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-5 py-2.5 rounded-full text-xs font-semibold cursor-pointer text-obsidian-on-surface-variant/70 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !audioFile}
              className="px-6 py-2.5 rounded-full bg-primary-electric text-obsidian-base font-bold text-xs hover:scale-105 active:scale-95 transition-transform primary-glow cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isUploading ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
              ) : (
                <><Upload className="w-3.5 h-3.5" /> Upload to Drive</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
