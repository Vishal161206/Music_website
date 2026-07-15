/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * EditSongModal — pre-filled form to edit song metadata.
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Save, Music, Image as ImageIcon, Check, Loader2 } from 'lucide-react';

const GENRES = [
  'Ambient Electronica', 'Synthwave', 'Lo-Fi Beats', 'Classical Redefined',
  'Vocal Jazz', 'Ambient Soundscape', 'Hip-Hop', 'Rock', 'Pop', 'R&B',
  'Electronic', 'Jazz', 'Classical', 'Folk', 'Indie',
];

export default function EditSongModal({ song, isDarkMode, onClose, onSave }) {
  const [title, setTitle]           = useState(song.title);
  const [artist, setArtist]         = useState(song.artist);
  const [album, setAlbum]           = useState(song.album);
  const [genre, setGenre]           = useState(song.genre);
  const [uploaderName, setUploader] = useState(song.uploaderName || '');
  const [lyricsText, setLyrics]     = useState(song.lyrics.join('\n'));
  const [imageFile, setImageFile]   = useState(null);
  const [imagePreview, setPreview]  = useState(song.coverUrl);
  const [saving, setSaving]         = useState(false);

  const imageRef = useRef(null);
  // Track blob URLs to revoke on unmount
  const blobUrlsRef = useRef([]);

  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const inputCls = `w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary-electric transition-colors ${
    isDarkMode
      ? 'bg-obsidian-container-high/60 border-white/5 text-white placeholder:text-white/20'
      : 'bg-zinc-50 border-zinc-200 text-zinc-900'
  }`;
  const labelCls = `block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${
    isDarkMode ? 'text-obsidian-on-surface-variant/60' : 'text-zinc-500'
  }`;

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    // Revoke previous preview blob if any
    if (imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
      blobUrlsRef.current = blobUrlsRef.current.filter(u => u !== imagePreview);
    }
    const previewUrl = URL.createObjectURL(file);
    blobUrlsRef.current.push(previewUrl);
    setPreview(previewUrl);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) return;
    setSaving(true);

    const lyricsList = lyricsText.split('\n').map(l => l.trim()).filter(Boolean);

    const updated = {
      ...song,
      title:        title.trim(),
      artist:       artist.trim(),
      album:        album.trim() || 'Single Release',
      genre,
      uploaderName: uploaderName.trim() || song.uploaderName,
      // coverUrl will be resolved by App.jsx handleEditSong (local blob or cloud upload)
      coverUrl:     imageFile ? imagePreview : song.coverUrl,
      lyrics:       lyricsList.length > 0 ? lyricsList : song.lyrics,
    };

    await new Promise(r => setTimeout(r, 300));
    setSaving(false);
    onSave(updated, imageFile);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className={`border rounded-2xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto custom-scrollbar ${
        isDarkMode ? 'bg-obsidian-surface border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-900'
      }`}>

        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/5 backdrop-blur-xl bg-obsidian-surface/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-secondary-emerald/15 flex items-center justify-center">
              <Music className="w-4 h-4 text-secondary-emerald" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold tracking-tight">Edit Song</h3>
              <p className="text-[10px] text-obsidian-on-surface-variant/50 font-medium mt-0.5 truncate max-w-[220px]">{song.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-obsidian-on-surface-variant/60 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">

          {/* Cover preview + change */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 shadow-lg">
              <img src={imagePreview} alt="cover" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <p className={labelCls}>Album Cover</p>
              <input ref={imageRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              <button
                type="button" onClick={() => imageRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-xs font-semibold text-obsidian-on-surface-variant hover:text-white hover:border-white/20 transition-colors cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                {imageFile ? <span className="text-secondary-emerald flex items-center gap-1"><Check className="w-3 h-3"/>Changed</span> : 'Change Cover'}
              </button>
              <p className="text-[9px] text-obsidian-on-surface-variant/40 mt-1.5">JPG, PNG, WEBP — max 10MB</p>
            </div>
          </div>

          {/* Title + Artist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Song Title *</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Artist Name *</label>
              <input type="text" required value={artist} onChange={e => setArtist(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Album + Genre */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Album</label>
              <input type="text" value={album} onChange={e => setAlbum(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Genre</label>
              <select value={genre} onChange={e => setGenre(e.target.value)} className={inputCls}>
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {/* Uploader name */}
          <div>
            <label className={labelCls}>Uploader Name</label>
            <input type="text" value={uploaderName} onChange={e => setUploader(e.target.value)} placeholder="Anonymous" className={inputCls} />
          </div>

          {/* Lyrics */}
          <div>
            <label className={labelCls}>Lyrics (one line per lyric)</label>
            <textarea
              value={lyricsText} onChange={e => setLyrics(e.target.value)}
              className={`${inputCls} h-24 resize-none custom-scrollbar`}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs font-semibold cursor-pointer text-obsidian-on-surface-variant/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={saving}
              className="px-6 py-2.5 rounded-full bg-secondary-emerald text-black font-bold text-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/>Saving...</> : <><Save className="w-3.5 h-3.5"/>Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
