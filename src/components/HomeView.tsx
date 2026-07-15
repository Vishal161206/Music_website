/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Play, Music, PlusSquare, Upload, ChevronRight, ChevronLeft, User, Pencil, Trash2, Filter, X } from 'lucide-react';
import { Song, Playlist } from '../types';

interface HomeViewProps {
  songs: Song[];
  onPlaySong: (song: Song) => void;
  onPlayPlaylist: (playlist: Playlist) => void;
  activeSongId: string;
  playlists: Playlist[];
  onViewPlaylist: (playlist: Playlist) => void;
  onOpenCreatePlaylist: () => void;
  onOpenAddSong: () => void;
  onDeleteSong: (songId: string) => void;
  onEditSong: (song: Song) => void;
}

export default function HomeView({
  songs,
  onPlaySong,
  onPlayPlaylist,
  activeSongId,
  playlists,
  onViewPlaylist,
  onOpenCreatePlaylist,
  onOpenAddSong,
  onDeleteSong,
  onEditSong,
}: HomeViewProps) {
  const [visualizerHeights, setVisualizerHeights] = useState<number[]>(
    [40, 70, 50, 90, 30, 80, 45, 60, 35, 75, 55, 95]
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ── Pagination ──────────────────────────────────────────────────────────────
  const SONGS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [filterGenre, setFilterGenre] = useState('');
  const [filterAlbum, setFilterAlbum] = useState('');
  const [filterArtist, setFilterArtist] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = filterGenre || filterAlbum || filterArtist;

  // Extract unique filter options from songs
  const uniqueGenres = useMemo(() => {
    const set = new Set(songs.map(s => s.genre).filter(Boolean));
    return Array.from(set).sort();
  }, [songs]);

  const uniqueAlbums = useMemo(() => {
    const set = new Set(songs.map(s => s.album).filter(Boolean));
    return Array.from(set).sort();
  }, [songs]);

  const uniqueArtists = useMemo(() => {
    const set = new Set(songs.map(s => s.artist).filter(Boolean));
    return Array.from(set).sort();
  }, [songs]);

  // Apply filters
  const filteredSongs = useMemo(() => {
    return songs.filter(song => {
      if (filterGenre && song.genre !== filterGenre) return false;
      if (filterAlbum && song.album !== filterAlbum) return false;
      if (filterArtist && song.artist !== filterArtist) return false;
      return true;
    });
  }, [songs, filterGenre, filterAlbum, filterArtist]);

  // Paginate filtered results
  const totalPages = Math.max(1, Math.ceil(filteredSongs.length / SONGS_PER_PAGE));
  const paginatedSongs = filteredSongs.slice(
    (currentPage - 1) * SONGS_PER_PAGE,
    currentPage * SONGS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterGenre, filterAlbum, filterArtist]);

  // Clamp page if songs list shrinks
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const clearAllFilters = () => {
    setFilterGenre('');
    setFilterAlbum('');
    setFilterArtist('');
  };

  useEffect(() => {
    const id = setInterval(() => {
      setVisualizerHeights(() => Array.from({ length: 12 }, () => Math.floor(Math.random() * 75) + 25));
    }, 150);
    return () => clearInterval(id);
  }, []);

  const showBannerPlaylist = playlists.length > 0 ? playlists[0] : null;

  return (
    <div className="space-y-10 animate-fade-in p-1">

      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <section className="relative h-[360px] md:h-[400px] rounded-3xl overflow-hidden group border border-[#ffffff]/5 shadow-2xl bg-obsidian-surface">
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            alt="Warm glowing audiophile ambient waves"
            src="https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=1200"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian-base via-black/40 to-black/25" />
          <div className="absolute inset-0 bg-gradient-to-r from-obsidian-base/80 via-black/50 to-transparent" />
        </div>

        <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-12 max-w-2xl select-none">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="bg-primary-electric/20 text-primary-electric px-3.5 py-1 rounded-full text-[10px] font-bold tracking-widest backdrop-blur-md border border-primary-electric/25">
              FREE PUBLIC STREAM
            </span>
            {/* Live visualizer */}
            <div className="flex items-end gap-[3px] h-4">
              {visualizerHeights.map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className="w-1 bg-gradient-to-t from-primary-electric to-secondary-emerald rounded-full transition-all duration-150"
                />
              ))}
            </div>
          </div>

          <h2 className="font-display text-3xl md:text-5xl font-extrabold mb-3 leading-none tracking-tighter text-white">
            Common Sharing Hub
          </h2>
          <p className="text-sm font-sans text-white/85 mb-6 max-w-lg leading-relaxed">
            Upload songs from your device — saved to Google Cloud Storage. Create public playlists. No login required!
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={onOpenAddSong}
              className="bg-primary-electric text-black px-6 md:px-8 py-3.5 rounded-full text-xs font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform primary-glow cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Your Song</span>
            </button>

            {showBannerPlaylist ? (
              <button
                onClick={() => onViewPlaylist(showBannerPlaylist)}
                className="border border-[#ffffff]/20 hover:bg-[#ffffff]/10 text-white px-6 md:px-8 py-3.5 rounded-full text-xs font-bold backdrop-blur-md transition-all cursor-pointer"
              >
                View Playlists
              </button>
            ) : (
              <button
                onClick={onOpenCreatePlaylist}
                className="border border-[#ffffff]/20 hover:bg-[#ffffff]/10 text-white px-6 md:px-8 py-3.5 rounded-full text-xs font-bold backdrop-blur-md transition-all cursor-pointer flex items-center gap-2"
              >
                <PlusSquare className="w-4 h-4" />
                <span>Create Playlist</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── How it works strip ───────────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Upload, color: 'text-primary-electric', bg: 'bg-primary-electric/10', title: 'Upload Your Music', desc: 'Select any MP3, WAV or FLAC from your device. Saves to Google Cloud.' },
          { icon: PlusSquare, color: 'text-secondary-emerald', bg: 'bg-secondary-emerald/10', title: 'Create Playlists', desc: 'Group your uploads into public playlists anyone can discover and play.' },
          { icon: User, color: 'text-primary-electric', bg: 'bg-primary-electric/5', title: 'No Login Needed', desc: 'Everything is fully open — upload, listen, and share without any account.' },
        ].map(({ icon: Icon, color, bg, title, desc }) => (
          <div key={title} className="flex gap-4 p-4 rounded-2xl bg-obsidian-container-low border border-white/5">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="font-sans font-bold text-sm text-obsidian-on-surface">{title}</p>
              <p className="text-xs text-obsidian-on-surface-variant/50 mt-1 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Song Library ─────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-2xl font-bold text-obsidian-on-surface tracking-tight">
            All Songs
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-primary-electric uppercase">
              {filteredSongs.length} track{filteredSongs.length !== 1 ? 's' : ''}
              {hasActiveFilters && ` (filtered from ${songs.length})`}
            </span>
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                showFilters || hasActiveFilters
                  ? 'bg-primary-electric/15 text-primary-electric border-primary-electric/30'
                  : 'bg-obsidian-container-low text-obsidian-on-surface-variant/60 hover:text-white border-white/5 hover:border-white/15'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-emerald" />
              )}
            </button>
          </div>
        </div>

        {/* ── Filter Bar ─────────────────────────────────────────────────── */}
        {showFilters && (
          <div className="flex flex-wrap items-end gap-3 mb-5 p-4 rounded-2xl bg-obsidian-container-low/60 border border-white/5 animate-fade-in">
            {/* Genre */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-obsidian-on-surface-variant/40 uppercase tracking-wider">Genre</label>
              <select
                value={filterGenre}
                onChange={(e) => setFilterGenre(e.target.value)}
                className="bg-obsidian-container-high border border-white/10 text-obsidian-on-surface text-xs rounded-lg px-3 py-2 min-w-[140px] focus:outline-none focus:border-primary-electric/50 cursor-pointer appearance-none"
              >
                <option value="">All Genres</option>
                {uniqueGenres.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* Album */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-obsidian-on-surface-variant/40 uppercase tracking-wider">Album</label>
              <select
                value={filterAlbum}
                onChange={(e) => setFilterAlbum(e.target.value)}
                className="bg-obsidian-container-high border border-white/10 text-obsidian-on-surface text-xs rounded-lg px-3 py-2 min-w-[140px] focus:outline-none focus:border-primary-electric/50 cursor-pointer appearance-none"
              >
                <option value="">All Albums</option>
                {uniqueAlbums.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* Artist */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-obsidian-on-surface-variant/40 uppercase tracking-wider">Artist</label>
              <select
                value={filterArtist}
                onChange={(e) => setFilterArtist(e.target.value)}
                className="bg-obsidian-container-high border border-white/10 text-obsidian-on-surface text-xs rounded-lg px-3 py-2 min-w-[140px] focus:outline-none focus:border-primary-electric/50 cursor-pointer appearance-none"
              >
                <option value="">All Artists</option>
                {uniqueArtists.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* Clear all */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all cursor-pointer"
              >
                <X className="w-3 h-3" />
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Active filter chips (shown even when filter panel is closed) */}
        {hasActiveFilters && !showFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {filterGenre && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-primary-electric/10 text-primary-electric border border-primary-electric/20">
                Genre: {filterGenre}
                <button onClick={() => setFilterGenre('')} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            )}
            {filterAlbum && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-secondary-emerald/10 text-secondary-emerald border border-secondary-emerald/20">
                Album: {filterAlbum}
                <button onClick={() => setFilterAlbum('')} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            )}
            {filterArtist && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-primary-electric/10 text-primary-electric border border-primary-electric/20">
                Artist: {filterArtist}
                <button onClick={() => setFilterArtist('')} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-[11px] text-obsidian-on-surface-variant/40 hover:text-red-400 cursor-pointer transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {songs.length === 0 ? (
          /* Empty state — no songs uploaded yet */
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-5 border-2 border-dashed border-white/5 rounded-3xl bg-obsidian-container-low/30">
            <div className="w-20 h-20 rounded-full bg-primary-electric/10 flex items-center justify-center">
              <Music className="w-9 h-9 text-primary-electric" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-display text-xl font-bold text-obsidian-on-surface">No songs uploaded yet</h4>
              <p className="text-sm text-obsidian-on-surface-variant/50 max-w-sm mx-auto leading-relaxed">
                Be the first to upload! Add any MP3, WAV or FLAC from your device. It's saved to the cloud and visible to everyone instantly.
              </p>
            </div>
            <button
              onClick={onOpenAddSong}
              className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary-electric text-black font-bold text-sm hover:scale-105 active:scale-95 transition-transform primary-glow cursor-pointer shadow-lg"
            >
              <Upload className="w-4 h-4" />
              Upload First Song
            </button>
          </div>
        ) : filteredSongs.length === 0 ? (
          /* Empty filter result */
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 border border-dashed border-white/5 rounded-2xl bg-obsidian-container-low/30">
            <Filter className="w-10 h-10 text-obsidian-on-surface-variant/30" />
            <div className="space-y-1">
              <h4 className="font-sans font-bold text-base text-obsidian-on-surface">No songs match your filters</h4>
              <p className="text-xs text-obsidian-on-surface-variant/50">Try adjusting or clearing filters to see more songs.</p>
            </div>
            <button
              onClick={clearAllFilters}
              className="px-5 py-2 rounded-full text-xs font-bold bg-primary-electric/15 text-primary-electric hover:bg-primary-electric/25 transition-all cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
        <>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
          {/* Upload CTA card */}
          <div
            onClick={onOpenAddSong}
            className="group relative bg-obsidian-container-low p-4 rounded-xl transition-all duration-300 hover:bg-primary-electric/10 hover:border-primary-electric/30 cursor-pointer shadow-lg border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 aspect-square"
          >
            <div className="w-12 h-12 rounded-full bg-primary-electric/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5 text-primary-electric" />
            </div>
            <p className="text-xs font-bold text-primary-electric text-center leading-tight">Upload Your Song</p>
          </div>

          {paginatedSongs.map((song) => {
            const isActive = activeSongId === song.id;
            const isConfirming = confirmDeleteId === song.id;
            return (
              <div
                key={song.id}
                onClick={() => !isConfirming && onPlaySong(song)}
                className={`group relative bg-obsidian-container-low p-4 rounded-xl transition-all duration-300 hover:bg-obsidian-container-high hover:scale-[1.02] cursor-pointer shadow-lg border ${
                  isActive ? 'border-primary-electric/40 primary-glow' : 'border-[#ffffff]/5'
                }`}
              >
                <div className="relative aspect-square rounded-lg overflow-hidden mb-3 shadow bg-obsidian-base">
                  <img
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    alt={song.title}
                    src={song.coverUrl}
                  />
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); onPlaySong(song); }}
                      className="w-10 h-10 bg-primary-electric text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform primary-glow shadow-lg cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current text-black translate-x-0.5" />
                    </button>
                  </div>

                  {/* ── Edit / Delete hover icons ──────────────────── */}
                  <div
                    className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Edit */}
                    <button
                      onClick={() => onEditSong(song)}
                      title="Edit song"
                      className="w-7 h-7 rounded-full bg-obsidian-base/80 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-secondary-emerald hover:bg-obsidian-base transition-all cursor-pointer shadow-md border border-white/10"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>

                    {/* Delete (two-step: click to confirm, click again to execute) */}
                    {isConfirming ? (
                      <button
                        onClick={() => { onDeleteSong(song.id); setConfirmDeleteId(null); }}
                        title="Click again to confirm delete"
                        className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center text-white animate-pulse cursor-pointer shadow-md"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(song.id)}
                        title="Delete song"
                        className="w-7 h-7 rounded-full bg-obsidian-base/80 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-red-400 hover:bg-obsidian-base transition-all cursor-pointer shadow-md border border-white/10"
                        onBlur={() => setConfirmDeleteId(null)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Playing indicator */}
                  {isActive && (
                    <div className="absolute top-2 left-2 flex items-end gap-[2px] h-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-[2px] bg-primary-electric rounded-full animate-bounce"
                          style={{ height: `${40 + i * 20}%`, animationDelay: `${i * 0.1}s` }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <h4 className="font-sans font-bold text-xs md:text-sm truncate text-obsidian-on-surface">
                  {song.title}
                </h4>
                <p className="font-sans text-xs text-obsidian-on-surface-variant/40 mt-0.5 truncate">
                  {song.artist}
                </p>
                {song.genre && (
                  <p className="text-[9px] text-secondary-emerald/50 font-mono mt-0.5 truncate">
                    {song.genre}
                  </p>
                )}
                {song.uploaderName && (
                  <p className="text-[9px] text-primary-electric/50 font-mono mt-0.5 truncate">
                    by {song.uploaderName}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Pagination Controls ─────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8 select-none">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                currentPage === 1
                  ? 'text-obsidian-on-surface-variant/20 border-white/5 cursor-not-allowed'
                  : 'text-white hover:bg-primary-electric/15 hover:text-primary-electric border-white/10 hover:border-primary-electric/30 cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  // Show first, last, current, and neighbors
                  if (page === 1 || page === totalPages) return true;
                  if (Math.abs(page - currentPage) <= 1) return true;
                  return false;
                })
                .reduce<(number | 'ellipsis')[]>((acc, page, idx, arr) => {
                  if (idx > 0 && typeof arr[idx - 1] === 'number' && page - (arr[idx - 1] as number) > 1) {
                    acc.push('ellipsis');
                  }
                  acc.push(page);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span key={`e-${idx}`} className="px-2 text-obsidian-on-surface-variant/30 text-xs">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item as number)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentPage === item
                          ? 'bg-primary-electric text-black shadow-lg'
                          : 'text-obsidian-on-surface-variant/60 hover:text-white hover:bg-obsidian-container-high'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                currentPage === totalPages
                  ? 'text-obsidian-on-surface-variant/20 border-white/5 cursor-not-allowed'
                  : 'text-white hover:bg-primary-electric/15 hover:text-primary-electric border-white/10 hover:border-primary-electric/30 cursor-pointer'
              }`}
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Page info text */}
        {totalPages > 1 && (
          <p className="text-center text-[11px] text-obsidian-on-surface-variant/30 mt-3 font-mono">
            Showing {(currentPage - 1) * SONGS_PER_PAGE + 1}–{Math.min(currentPage * SONGS_PER_PAGE, filteredSongs.length)} of {filteredSongs.length} songs
          </p>
        )}
        </>
        )}
      </section>

      {/* ── Playlists ────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-2xl font-bold text-obsidian-on-surface tracking-tight">
            Shared Public Playlists
          </h3>
        </div>

        {playlists.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-4 bg-obsidian-container-low/40 max-w-2xl mx-auto">
            <Music className="w-12 h-12 text-primary-electric" style={{ animation: 'spin-slow 8s linear infinite' }} />
            <div className="space-y-1">
              <h5 className="font-sans font-bold text-base text-obsidian-on-surface">No playlists yet</h5>
              <p className="text-xs text-obsidian-on-surface-variant/50 max-w-md">
                Be the first to create a public playlist! Upload songs and group them so anyone can discover your music.
              </p>
            </div>
            <button
              onClick={onOpenCreatePlaylist}
              className="py-2.5 px-6 rounded-full bg-primary-electric text-black font-extrabold text-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              + Create Public Playlist
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => onViewPlaylist(pl)}
                className="group p-4 bg-obsidian-container-low hover:bg-obsidian-container-high rounded-2xl border border-white/5 cursor-pointer transition-all flex flex-col"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-4 shadow border border-white/5 bg-obsidian-surface">
                  <img
                    alt={pl.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    src={pl.coverUrl}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); onPlayPlaylist(pl); }}
                      className="w-11 h-11 bg-primary-electric text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-lg cursor-pointer"
                    >
                      <Play className="w-5 h-5 fill-current translate-x-0.5" />
                    </button>
                  </div>
                </div>
                <h4 className="font-sans font-bold text-sm text-obsidian-on-surface group-hover:text-primary-electric truncate">
                  {pl.name}
                </h4>
                <p className="text-xs text-obsidian-on-surface-variant/55 mt-1 font-sans">
                  {pl.songIds.length} track{pl.songIds.length !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
