/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Play, 
  Heart, 
  Search, 
  Clock, 
  Trash2, 
  Disc, 
  Plus,
  Pencil
} from 'lucide-react';
import { Playlist, Song } from '../types';

interface LibraryViewProps {
  playlists: Playlist[];
  songs: Song[];
  onPlaySong: (song: Song) => void;
  onPlayPlaylist: (playlist: Playlist) => void;
  onViewPlaylist: (playlist: Playlist) => void;
  activeSongId: string;
  onToggleLike: (songId: string) => void;
  likedSongIds: string[];
  onAddSongClicked: () => void;
  onDeleteSong: (songId: string) => void;
  onEditSong: (song: Song) => void;
  onDeletePlaylist: (playlistId: string) => void;
}

export default function LibraryView({
  playlists,
  songs,
  onPlaySong,
  onPlayPlaylist,
  onViewPlaylist,
  activeSongId,
  onToggleLike,
  likedSongIds,
  onAddSongClicked,
  onDeleteSong,
  onEditSong,
  onDeletePlaylist,
}: LibraryViewProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'playlists' | 'artists' | 'liked'>('all');
  const [libSearch, setLibSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeletePlaylistId, setConfirmDeletePlaylistId] = useState<string | null>(null);

  // Handle playing song by clicking row
  const handleRowClick = (song: Song) => {
    onPlaySong(song);
  };

  // Filter lists based on keywords and chips
  const filteredPlaylists = playlists.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(libSearch.toLowerCase());
    if (activeFilter === 'artists') return false;
    if (activeFilter === 'liked') return false;
    if (activeFilter === 'playlists') return matchesSearch;
    return matchesSearch;
  });

  // Dynamic artists derived from uploaded songs (not hardcoded mock data)
  const derivedArtists = Array.from(
    songs.reduce((map, song) => {
      if (!map.has(song.artist)) {
        map.set(song.artist, {
          id: song.artist,
          name: song.artist,
          image: song.coverUrl,
          tracksCount: 1,
          type: 'Followed Artist' as const,
        });
      } else {
        const entry = map.get(song.artist)!;
        entry.tracksCount += 1;
      }
      return map;
    }, new Map<string, { id: string; name: string; image: string; tracksCount: number; type: 'Followed Artist' }>())
    .values()
  );

  const filteredArtists = derivedArtists.filter(art => {
    const matchesSearch = art.name.toLowerCase().includes(libSearch.toLowerCase());
    if (activeFilter === 'playlists') return false;
    if (activeFilter === 'liked') return false;
    if (activeFilter === 'artists') return matchesSearch;
    return matchesSearch;
  });

  const likedSongs = songs.filter(s => likedSongIds.includes(s.id));

  return (
    <div className="space-y-8 animate-fade-in pr-2 select-none">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-extrabold text-obsidian-on-surface tracking-tight">
            Your Audio Library
          </h2>
          <p className="text-xs text-obsidian-on-surface-variant/40 font-medium font-sans mt-0.5">
            Synchronized with high-fidelity local cache nodes
          </p>
        </div>

        {/* Dynamic PC/Mobile Add Song trigger button */}
        <button
          onClick={onAddSongClicked}
          className="flex items-center gap-1.5 py-3 px-5 bg-gradient-to-r from-primary-electric to-secondary-emerald text-black font-extrabold rounded-full text-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-lg"
          title="Upload Local Track"
        >
          <Plus className="w-4 h-4 text-black" />
          <span>Upload Track</span>
        </button>
      </div>

      {/* Grid Filters + Search bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-[#ffffff]/5">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveFilter('all')}
            className={`py-2 px-5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
              activeFilter === 'all'
                ? 'bg-primary-electric text-white font-bold shadow'
                : 'bg-obsidian-container-high/60 hover:bg-obsidian-container-high text-obsidian-on-surface'
            }`}
          >
            All Creators & Playlists
          </button>
          
          <button
            onClick={() => setActiveFilter('playlists')}
            className={`py-2 px-5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
              activeFilter === 'playlists'
                ? 'bg-primary-electric text-white font-bold shadow'
                : 'bg-obsidian-container-high/60 hover:bg-obsidian-container-high text-obsidian-on-surface'
            }`}
          >
            Playlists
          </button>
          
          <button
            onClick={() => setActiveFilter('artists')}
            className={`py-2 px-5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
              activeFilter === 'artists'
                ? 'bg-primary-electric text-white font-bold shadow'
                : 'bg-obsidian-container-high/60 hover:bg-obsidian-container-high text-obsidian-on-surface'
            }`}
          >
            Artists
          </button>

          <button
            onClick={() => setActiveFilter('liked')}
            className={`py-2 px-5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
              activeFilter === 'liked'
                ? 'bg-primary-electric text-white font-bold shadow'
                : 'bg-obsidian-container-high/60 hover:bg-obsidian-container-high text-obsidian-on-surface'
            }`}
          >
            Liked Tracks ({likedSongs.length})
          </button>
        </div>

        {/* Local Search input */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-obsidian-on-surface-variant/40 w-3.5 h-3.5" />
          <input
            type="text"
            value={libSearch}
            onChange={(e) => setLibSearch(e.target.value)}
            className="w-full bg-obsidian-container-high/70 text-obsidian-on-surface text-xs rounded-full py-2.5 pl-9 pr-4 placeholder:text-obsidian-on-surface-variant/40 outline-none focus:ring-1 focus:ring-primary-electric"
            placeholder="Search within library"
          />
        </div>
      </div>

      {/* Main Layout of Playlists & Artists Cards */}
      {activeFilter !== 'liked' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-6">
            {/* Playlists listing */}
            {filteredPlaylists.map(playlist => (
              <div
                key={playlist.id}
                onClick={() => onViewPlaylist(playlist)}
                className="group p-4 bg-obsidian-container-low/60 hover:bg-obsidian-container-high/80 rounded-2xl border border-white/5 cursor-pointer transition-all relative"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-4 shadow border border-white/5">
                  <img 
                    alt={playlist.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    src={playlist.coverUrl}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 animate-fade-in">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayPlaylist(playlist);
                      }}
                      className="w-12 h-12 bg-primary-electric text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-lg cursor-pointer"
                    >
                      <Play className="w-5 h-5 fill-current text-black translate-x-0.5" />
                    </button>
                  </div>
                  {/* Delete playlist button */}
                  <div className="absolute top-2 right-2" onClick={e => e.stopPropagation()}>
                    {confirmDeletePlaylistId === playlist.id ? (
                      <button
                        onClick={() => { onDeletePlaylist(playlist.id); setConfirmDeletePlaylistId(null); }}
                        className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center text-white animate-pulse cursor-pointer shadow"
                        title="Confirm delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmDeletePlaylistId(playlist.id)}
                        className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white/70 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        title="Delete playlist"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <h4 className="font-sans font-bold text-sm text-obsidian-on-surface group-hover:text-primary-electric truncate">
                  {playlist.name}
                </h4>
                <p className="text-xs text-obsidian-on-surface-variant/40 mt-1 font-medium truncate">
                  {playlist.songIds.length} tracks · Private
                </p>
              </div>
            ))}

            {/* Followed Artists listing */}
            {filteredArtists.map(artist => (
              <div
                key={artist.id}
                className="group p-4 bg-obsidian-container-low/60 hover:bg-obsidian-container-high/80 rounded-2xl border border-white/5 cursor-pointer transition-all text-center"
              >
                <div className="relative aspect-square rounded-full overflow-hidden mb-4 w-3/4 mx-auto shadow border border-white/5 bg-obsidian-base">
                  <img 
                    alt={artist.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    src={artist.image}
                  />
                </div>
                <h4 className="font-sans font-bold text-sm text-obsidian-on-surface group-hover:text-primary-electric truncate">
                  {artist.name}
                </h4>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-emerald/10 text-[10px] text-secondary-emerald font-semibold font-mono mt-2">
                  <Disc className="w-3 h-3 animate-spin duration-3000" />
                  <span>{artist.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liked / Highlighted Tracks List Table */}
      <div className="space-y-4">
        <h3 className="font-display text-xl font-bold text-obsidian-on-surface tracking-tight">
          {activeFilter === 'liked' ? 'All Saved Masterpiece Tracks' : 'Recently Streamed & Top Audio Chords'}
        </h3>

        <div className="bg-obsidian-container-low/40 rounded-2xl border border-[#ffffff]/5 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#ffffff]/5 text-[10px] font-bold text-obsidian-on-surface-variant/40 uppercase tracking-widest leading-4">
                <th className="py-4 pl-6 w-12 text-center">#</th>
                <th className="py-4">Title</th>
                <th className="py-4 hidden md:table-cell">Album</th>
                <th className="py-4 hidden lg:table-cell">Added On</th>
                <th className="py-4 text-center w-20"><Clock className="w-4 h-4 mx-auto" /></th>
                <th className="py-4 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {(activeFilter === 'liked' ? likedSongs : songs).map((song, idx) => {
                const isActive = activeSongId === song.id;
                const isLiked = likedSongIds.includes(song.id);
                return (
                  <tr 
                    key={song.id}
                    onClick={() => handleRowClick(song)}
                    className={`group hover:bg-[#ffffff]/5 cursor-pointer transition-colors border-b border-[#ffffff]/2 ${
                      isActive ? 'bg-[#ffffff]/5' : ''
                    }`}
                  >
                    <td className="py-3.5 pl-6 font-mono text-xs text-obsidian-on-surface-variant/40 leading-relaxed font-semibold text-center">
                      {isActive ? (
                        <div className="flex items-end justify-center gap-[2px] w-4 h-3.5 pt-0.5 mx-auto">
                          <div className="w-[3px] bg-primary-electric animate-pulse h-1/2" />
                          <div className="w-[3px] bg-primary-electric h-full" />
                          <div className="w-[3px] bg-primary-electric animate-pulse h-3/4" />
                        </div>
                      ) : (
                        <span className="group-hover:hidden">{idx + 1}</span>
                      )}
                      <Play className="w-3.5 h-3.5 text-primary-electric fill-primary-electric hidden group-hover:inline-block cursor-pointer mx-auto" />
                    </td>

                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <img 
                          alt="track art" 
                          className="w-10 h-10 rounded object-cover shadow border border-white/5"
                          src={song.coverUrl}
                        />
                        <div>
                          <p className={`font-sans text-sm font-bold truncate leading-snug ${isActive ? 'text-primary-electric' : 'text-obsidian-on-surface'}`}>
                            {song.title}
                          </p>
                          <p className="font-sans text-xs text-obsidian-on-surface-variant/40 truncate mt-0.5">
                            {song.artist}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 text-xs text-obsidian-on-surface-variant/60 font-medium font-sans hidden md:table-cell max-w-[180px] truncate">
                      {song.album}
                    </td>

                    <td className="py-3.5 text-xs text-obsidian-on-surface-variant/40 font-sans hidden lg:table-cell">
                      {song.dateAdded}
                    </td>

                    <td className="py-3.5 text-xs text-obsidian-on-surface-variant/40 font-mono text-center">
                      {song.duration}
                    </td>

                    <td className="py-3.5 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit */}
                        <button
                          onClick={() => onEditSong(song)}
                          title="Edit song"
                          className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full bg-obsidian-container-highest flex items-center justify-center text-white/50 hover:text-secondary-emerald hover:bg-obsidian-container-highest/80 transition-all cursor-pointer border border-white/5"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>

                        {/* Delete — two-step */}
                        {confirmDeleteId === song.id ? (
                          <button
                            onClick={() => { onDeleteSong(song.id); setConfirmDeleteId(null); }}
                            title="Confirm delete"
                            className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center text-white animate-pulse cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(song.id)}
                            title="Delete song"
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
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
