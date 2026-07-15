/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Heart, 
  Search, 
  Clock, 
  Plus,
  Trash2,
  ListPlus,
  MoreHorizontal,
  ChevronLeft,
  Calendar,
  Grid,
  Pencil
} from 'lucide-react';

export default function PlaylistDetailView({
  playlist,
  songs,
  onPlaySong,
  onPlayPlaylist,
  onPlayPlaylistRandomly,
  onAddSongToPlaylist,
  onRemoveSongFromPlaylist,
  activeSongId,
  isPlaying,
  onTogglePlay,
  likedSongIds,
  onToggleLike,
  onDeleteSong,
  onEditSong,
  onDeletePlaylist,
  onBack,
}) {
  const [playlistQuery, setPlaylistQuery] = useState('');
  const [searchAvailableQuery, setSearchAvailableQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Hydrate songs belonging to this playlist from dynamic songs list
  const playlistSongs = songs.filter(song => playlist.songIds.includes(song.id));

  // Find songs that are NOT in the playlist currently to show as available
  const availableSongs = songs.filter(song => !playlist.songIds.includes(song.id));

  // Calculate stats
  const totalCount = playlistSongs.length;
  const totalSecs = playlistSongs.reduce((acc, song) => acc + song.durationSec, 0);
  const totalMin = Math.floor(totalSecs / 60);
  const [confirmDeletePlaylist, setConfirmDeletePlaylist] = useState(false);

  const filteredPlaylistSongs = playlistSongs.filter(song => 
    song.title.toLowerCase().includes(playlistQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(playlistQuery.toLowerCase()) ||
    song.album.toLowerCase().includes(playlistQuery.toLowerCase())
  );

  const filteredAvailableSongs = availableSongs.filter(song => 
    song.title.toLowerCase().includes(searchAvailableQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchAvailableQuery.toLowerCase())
  );

  const isCurrentPlaylistPlaying = isPlaying && playlist.songIds.includes(activeSongId);

  return (
    <div className="space-y-8 animate-fade-in pr-2 select-none">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold text-obsidian-on-surface-variant/60 hover:text-white transition-colors cursor-pointer group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Library
      </button>

      {/* Header Banner - Large album art & statistics */}
      <section className="relative flex flex-col md:flex-row items-end gap-8 pb-6 border-b border-[#ffffff]/5">
        <div className="w-56 h-56 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 border border-white/10 group relative self-center md:self-auto bg-obsidian-container-low">
          <img 
            alt={playlist.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            src={playlist.coverUrl}
          />
        </div>

        <div className="space-y-4 flex-1">
          <span className="text-[10px] font-bold text-primary-electric tracking-widest uppercase bg-primary-electric/10 px-3.5 py-1 rounded-full border border-primary-electric/15">
            🔒 PRIVATE PLAYLIST
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold text-obsidian-on-surface tracking-tighter leading-none">
            {playlist.name}
          </h2>
          <p className="text-sm text-obsidian-on-surface-variant/70 leading-relaxed font-sans max-w-2xl">
            {playlist.description || "Your private playlist — only you can see and play this."}
          </p>
          
          <div className="flex items-center gap-2 text-xs text-obsidian-on-surface-variant/50 font-medium">
            <span className="text-primary-electric font-bold">Your Collection</span>
            <span>•</span>
            <span>{totalCount} songs</span>
            <span>•</span>
            <span className="text-primary-electric font-semibold">{totalMin} min</span>
          </div>

          {/* Delete playlist */}
          <div className="pt-1">
            {confirmDeletePlaylist ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-red-400 font-medium">Delete this playlist?</span>
                <button
                  onClick={() => onDeletePlaylist(playlist.id)}
                  className="px-4 py-1.5 bg-red-500 text-white text-xs font-bold rounded-full hover:bg-red-600 cursor-pointer transition-colors"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setConfirmDeletePlaylist(false)}
                  className="px-4 py-1.5 bg-white/5 text-white/60 text-xs font-bold rounded-full hover:bg-white/10 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDeletePlaylist(true)}
                className="flex items-center gap-1.5 text-xs text-obsidian-on-surface-variant/40 hover:text-red-400 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Playlist
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Control row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              if (isCurrentPlaylistPlaying) {
                onTogglePlay();
              } else {
                onPlayPlaylist(playlist);
              }
            }}
            className="w-14 h-14 bg-primary-electric text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform primary-glow cursor-pointer"
            title="Play Playlist"
          >
            {isCurrentPlaylistPlaying ? (
              <Pause className="w-6 h-6 fill-current text-zinc-950" />
            ) : (
              <Play className="w-6 h-6 fill-current translate-x-0.5 text-zinc-950" />
            )}
          </button>

          {/* PLAY RANDOMLY BUTTON */}
          <button
            onClick={() => onPlayPlaylistRandomly(playlist)}
            className="flex items-center gap-2 px-5 py-3.5 bg-obsidian-container-high hover:bg-obsidian-container-highest text-obsidian-on-surface rounded-full font-bold text-xs hover:scale-105 active:scale-95 transition-transform border border-white/5 cursor-pointer shadow-md"
            title="Play Randomly / Shuffle"
          >
            <span className="text-sm">🔀</span>
            <span>Play Randomly</span>
          </button>
        </div>

        {/* Playlist specific search input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-obsidian-on-surface-variant/40 w-3.5 h-3.5" />
          <input
            type="text"
            value={playlistQuery}
            onChange={(e) => setPlaylistQuery(e.target.value)}
            className="w-full bg-obsidian-container-high/60 text-obsidian-on-surface text-xs rounded-full py-2.5 pl-10 pr-4 placeholder:text-obsidian-on-surface-variant/40 outline-none focus:ring-1 focus:ring-primary-electric"
            placeholder="Search in playlist"
          />
        </div>
      </div>

      {/* Tracks list table */}
      <div className="bg-obsidian-container-low/30 rounded-2xl border border-[#ffffff]/5 overflow-hidden">
        {filteredPlaylistSongs.length === 0 ? (
          <div className="p-8 text-center text-obsidian-on-surface-variant/40 text-xs">
            No tracks in this playlist yet. Add some website tracks below!
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#ffffff]/5 text-[10px] font-bold text-obsidian-on-surface-variant/40 uppercase tracking-widest leading-4">
                <th className="py-4 pl-6 w-12 text-center">#</th>
                <th className="py-4">Title</th>
                <th className="py-4 hidden md:table-cell">Album</th>
                <th className="py-4 hidden lg:table-cell">Date Added</th>
                <th className="py-4 text-center w-20"><Clock className="w-4 h-4 mx-auto" /></th>
                <th className="py-4 w-28 text-center">Manage</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlaylistSongs.map((song, idx) => {
                const isActive = activeSongId === song.id;
                const isLiked = likedSongIds.includes(song.id);
                return (
                  <tr 
                    key={song.id}
                    onClick={() => onPlaySong(song)}
                    className={`group hover:bg-[#ffffff]/5 cursor-pointer transition-colors border-b border-[#ffffff]/2 ${
                      isActive ? 'bg-[#ffffff]/2' : ''
                    }`}
                  >
                    <td className="py-4 pl-6 font-mono text-xs text-obsidian-on-surface-variant/40 font-semibold text-center">
                      {isActive && isPlaying ? (
                        <div className="flex items-end justify-center gap-[2px] w-4 h-3.5 mx-auto">
                          <div className="w-[3px] bg-primary-electric animate-pulse h-1/2" />
                          <div className="w-[3px] bg-primary-electric h-full" />
                          <div className="w-[3px] bg-primary-electric animate-pulse h-3/4" />
                        </div>
                      ) : (
                        <span className="group-hover:hidden">{idx + 1}</span>
                      )}
                      <Play className="w-3.5 h-3.5 text-primary-electric fill-primary-electric hidden group-hover:inline-block cursor-pointer mx-auto" />
                    </td>

                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          alt={song.title} 
                          className="w-10 h-10 rounded object-cover shadow border border-white/5"
                          src={song.coverUrl}
                        />
                        <div className="max-w-[200px] sm:max-w-xs md:max-w-md">
                          <p className={`font-sans text-sm font-bold truncate leading-snug ${isActive ? 'text-primary-electric' : 'text-obsidian-on-surface'}`}>
                            {song.title}
                          </p>
                          <p className="font-sans text-xs text-obsidian-on-surface-variant/40 truncate mt-0.5">
                            {song.artist}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 text-xs text-obsidian-on-surface-variant/60 font-medium font-sans hidden md:table-cell max-w-[180px] truncate">
                      {song.album}
                    </td>

                    <td className="py-4 text-xs text-obsidian-on-surface-variant/40 font-sans hidden lg:table-cell">
                      {song.dateAdded}
                    </td>

                    <td className="py-4 text-xs text-obsidian-on-surface-variant/40 font-mono text-center">
                      {song.duration}
                    </td>

                    <td className="py-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        {/* Edit */}
                        <button
                          onClick={() => onEditSong(song)}
                          title="Edit song"
                          className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full bg-obsidian-container-highest flex items-center justify-center text-white/50 hover:text-secondary-emerald transition-all cursor-pointer border border-white/5"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>

                        {/* Global delete — two-step */}
                        {confirmDeleteId === song.id ? (
                          <button
                            onClick={() => { onDeleteSong(song.id); setConfirmDeleteId(null); }}
                            title="Confirm delete song"
                            className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center text-white animate-pulse cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(song.id)}
                            title="Delete song globally"
                            className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full bg-obsidian-container-highest flex items-center justify-center text-white/50 hover:text-red-400 transition-all cursor-pointer border border-white/5"
                            onBlur={() => setConfirmDeleteId(null)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}

                        {/* Like */}
                        <button 
                          onClick={() => onToggleLike(song.id)}
                          className="text-obsidian-on-surface-variant/40 hover:text-primary-electric transition-transform hover:scale-110 cursor-pointer"
                          title="Like Song"
                        >
                          <Heart className={`w-4 h-4 ${isLiked ? 'text-primary-electric fill-primary-electric' : ''}`} />
                        </button>

                        {/* Remove from this playlist */}
                        <button 
                          onClick={() => onRemoveSongFromPlaylist(playlist.id, song.id)}
                          className="text-obsidian-on-surface-variant/40 hover:text-red-400 transition-transform hover:scale-110 cursor-pointer"
                          title="Remove from Playlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ADD SONGS FROM CURRENT AVAILABLE WEBSITE SONGS */}
      <div className="p-6 bg-obsidian-container-low rounded-2xl border border-white/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-bold text-obsidian-on-surface">
              Add Available Website Tracks
            </h3>
            <p className="text-xs text-obsidian-on-surface-variant/50 font-medium font-sans">
              Add songs from the available global catalogue of tracks
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-obsidian-on-surface-variant/40 w-3.5 h-3.5" />
            <input
              type="text"
              value={searchAvailableQuery}
              onChange={(e) => setSearchAvailableQuery(e.target.value)}
              className="w-full bg-obsidian-container-high/40 text-obsidian-on-surface text-xs rounded-full py-2.5 pl-10 pr-4 placeholder:text-obsidian-on-surface-variant/40 outline-none focus:ring-1 focus:ring-primary-electric"
              placeholder="Filter website songs"
            />
          </div>
        </div>

        {filteredAvailableSongs.length === 0 ? (
          <p className="text-xs text-obsidian-on-surface-variant/40 py-4 text-center">
            {availableSongs.length === 0 
              ? "All available website tracks are already added to this playlist!" 
              : "No website tracks map your filter parameters."}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-1 pt-1">
            {filteredAvailableSongs.map((song) => (
              <div 
                key={song.id}
                className="flex items-center gap-4 bg-obsidian-base/40 border border-white/5 rounded-xl p-3 pr-4 hover:border-primary-electric/25 transition-all text-left"
              >
              <img src={song.coverUrl} className="w-11 h-11 rounded object-cover shadow" alt="art" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-obsidian-on-surface truncate">{song.title}</p>
                <p className="text-xs text-obsidian-on-surface-variant/40 truncate mt-0.5">{song.artist}</p>
              </div>
              <button
                type="button"
                onClick={() => onAddSongToPlaylist(playlist.id, song.id)}
                className="flex items-center gap-1 py-1.5 px-3 rounded-full bg-primary-electric/15 hover:bg-primary-electric hover:text-black font-semibold text-[11px] text-primary-electric cursor-pointer active:scale-95 transition-all"
                title="Add Song To Playlist"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
