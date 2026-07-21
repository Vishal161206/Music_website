/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import BottomPlayer from './components/BottomPlayer.jsx';
import HomeView from './components/HomeView.jsx';
import LibraryView from './components/LibraryView.jsx';
import PlaylistDetailView from './components/PlaylistDetailView.jsx';
import NowPlayingView from './components/NowPlayingView.jsx';
import CreatePlaylistModal from './components/CreatePlaylistModal.jsx';
import AddSongModal from './components/AddSongModal.jsx';
import EditSongModal from './components/EditSongModal.jsx';
import MobileNav from './components/MobileNav.jsx';
import AuthModal from './components/AuthModal.jsx';
import { Sparkles } from 'lucide-react';
import {
  subscribeToSongs,
  subscribeToPlaylists,
  saveSongToFirestore,
  savePlaylistToFirestore,
  updatePlaylistInFirestore,
  deleteSongFromFirestoreAndStorage,
  deletePlaylistFromFirestore,
} from './services/songService';
import { uploadCoverToDrive, isDriveConfigured, isDriveUrl, fetchAudioBlobUrl } from './services/driveService';
import { isFirebaseConfigured } from './firebase';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const { currentUser, username, isAuthLoading, isFirebaseReady } = useAuth();

  // ── Data state (from Firestore or localStorage) ────────────────────────
  const [songs, setSongs] = useState(() => {
    const saved = localStorage.getItem('sonic_obsidian_songs_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [playlists, setPlaylists] = useState(() => {
    // Only restore playlists that belong to the current user (handled in sync effect)
    return [];
  });

  // ── UI state ──────────────────────────────────────────────────────────
  const [activeScreen, setActiveScreen] = useState('home');
  const [currentSong, setCurrentSong] = useState(null);
  const [editingSong, setEditingSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [likedSongIds, setLikedSongIds] = useState(() => {
    const saved = localStorage.getItem('sonic_obsidian_likes');
    return saved ? JSON.parse(saved) : [];
  });
  const [playQueue, setPlayQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddSongModalOpen, setIsAddSongModalOpen] = useState(false);
  const [activeNotification, setActiveNotification] = useState(null);
  const [history, setHistory] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isCloudMode = isFirebaseConfigured;

  // ── Real <audio> element ref ───────────────────────────────────────────
  const audioRef = useRef(null);

  // Fix: use a ref to always call the latest handleAutoNext from the 'ended' listener
  const handleAutoNextRef = useRef(() => {});

  // Ref to track the desired play state for the canplay handler
  const wantsToPlayRef = useRef(false);

  // Create audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    // The onEnded listener calls via ref so it always gets the latest version
    const onTimeUpdate = () => setProgress(Math.floor(audio.currentTime));
    const onEnded = () => handleAutoNextRef.current();

    // When audio is ready to play, auto-play if the user intended to play
    const onCanPlay = () => {
      if (wantsToPlayRef.current) {
        audio.play().catch(() => {
          setIsPlaying(false);
        });
      }
    };

    // Handle load errors (e.g. Google Drive redirect failures)
    const onError = () => {
      console.error('[SonicObsidian] Audio load error:', audio.error?.message);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
      audio.pause();
    };
  }, []);

  // Sync audio src when currentSong changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (currentSong.audioUrl) {
      // Always reset and reload when song changes
      audio.pause();

      // Google Drive URLs can't be played directly by <audio> — they return
      // HTML redirects instead of raw audio bytes. We proxy through our Apps
      // Script which fetches the file, returns base64, and we decode it to
      // a local blob URL that the browser can play natively.
      if (isDriveUrl(currentSong.audioUrl)) {
        fetchAudioBlobUrl(currentSong.audioUrl)
          .then((blobUrl) => {
            audio.src = blobUrl;
            audio.load();
          })
          .catch((err) => {
            console.error('[SonicObsidian] Audio proxy failed:', err);
            // Fallback: try the direct URL anyway (may work for small files)
            audio.src = currentSong.audioUrl;
            audio.load();
          });
      } else {
        // Local blob URLs, data URLs, etc. — play directly
        audio.src = currentSong.audioUrl;
        audio.load();
      }
    } else {
      audio.pause();
      audio.src = '';
    }
    setProgress(0);
  }, [currentSong?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync play/pause state — only directly play/pause when audio is already loaded
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    wantsToPlayRef.current = isPlaying;
    if (isPlaying && currentSong?.audioUrl) {
      // Only call play() directly if the audio is already loaded (readyState >= 3)
      // Otherwise, the canplay listener will handle it when the buffer is ready
      if (audio.readyState >= 3) {
        audio.play().catch(() => {
          setIsPlaying(false);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong?.audioUrl]);

  // Sync volume / mute
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume / 100;
  }, [volume, isMuted]);

  // ── Firestore real-time sync ───────────────────────────────────────────
  useEffect(() => {
    // Only subscribe to songs once user is authenticated
    // (avoids permission errors during auth loading)
    if (!isCloudMode || !currentUser) return;

    const unsubSongs = subscribeToSongs((cloudSongs) => {
      if (cloudSongs.length > 0) {
        setSongs(cloudSongs);
      }
    });

    return () => {
      unsubSongs();
    };
  }, [isCloudMode, currentUser]);

  // Subscribe to playlists only when user is logged in (private playlists)
  useEffect(() => {
    if (!isCloudMode || !currentUser?.uid) {
      setPlaylists([]);
      return;
    }

    const unsubPlaylists = subscribeToPlaylists(currentUser.uid, (cloudPlaylists) => {
      setPlaylists(cloudPlaylists);
    });

    return () => {
      unsubPlaylists();
    };
  }, [isCloudMode, currentUser?.uid]);

  // ── LocalStorage persistence (fallback / offline cache) ───────────────
  useEffect(() => {
    localStorage.setItem('sonic_obsidian_songs_v2', JSON.stringify(songs));
  }, [songs]);

  useEffect(() => {
    localStorage.setItem('sonic_obsidian_likes', JSON.stringify(likedSongIds));
  }, [likedSongIds]);

  // ── Toast notification ─────────────────────────────────────────────────
  const triggerToast = useCallback((msg) => {
    setActiveNotification(msg);
    setTimeout(() => setActiveNotification(null), 3500);
  }, []);

  // ── Playback helpers ───────────────────────────────────────────────────
  const skipNext = useCallback(() => {
    setPlayQueue((queue) => {
      if (queue.length === 0) return queue;
      setQueueIndex((idx) => {
        let nextIdx;
        if (isShuffle) {
          nextIdx = Math.floor(Math.random() * queue.length);
        } else {
          nextIdx = (idx + 1) % queue.length;
        }
        const nextSong = queue[nextIdx];
        setCurrentSong(nextSong);
        setProgress(0);
        setIsPlaying(true);
        triggerToast(`Now playing: "${nextSong.title}"`);
        return nextIdx;
      });
      return queue;
    });
  }, [isShuffle, triggerToast]);

  const skipPrev = useCallback(() => {
    setPlayQueue((queue) => {
      if (queue.length === 0) return queue;
      setQueueIndex((idx) => {
        const prevIdx = idx === 0 ? queue.length - 1 : idx - 1;
        const prevSong = queue[prevIdx];
        setCurrentSong(prevSong);
        setProgress(0);
        setIsPlaying(true);
        triggerToast(`Playing previous: "${prevSong.title}"`);
        return prevIdx;
      });
      return queue;
    });
  }, [triggerToast]);

  // Fix: handleAutoNext uses skipNext via ref so the 'ended' event always has latest
  const handleAutoNext = useCallback(() => {
    if (isRepeat) {
      const audio = audioRef.current;
      if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
      setProgress(0);
    } else {
      skipNext();
    }
  }, [isRepeat, skipNext]);

  // Keep the ref in sync with the latest handleAutoNext
  useEffect(() => {
    handleAutoNextRef.current = handleAutoNext;
  }, [handleAutoNext]);

  const playSong = useCallback((song) => {
    setCurrentSong(song);
    setProgress(0);
    setIsPlaying(true);

    setPlayQueue((prev) => {
      if (!prev.some((s) => s.id === song.id)) {
        const newQueue = [song, ...prev];
        setQueueIndex(0);
        return newQueue;
      } else {
        const idx = prev.findIndex((s) => s.id === song.id);
        setQueueIndex(idx);
        return prev;
      }
    });

    setHistory((h) => {
      if (!h.some((s) => s.id === song.id)) return [song, ...h.slice(0, 5)];
      return h;
    });

    triggerToast(`Playing: "${song.title}"`);
  }, [triggerToast]);

  const playPlaylist = useCallback((playlist) => {
    const pSongs = songs.filter((s) => playlist.songIds.includes(s.id));
    if (pSongs.length > 0) {
      setPlayQueue(pSongs);
      setCurrentSong(pSongs[0]);
      setQueueIndex(0);
      setProgress(0);
      setIsPlaying(true);
      triggerToast(`Playing playlist: "${playlist.name}"`);
    } else {
      triggerToast('No tracks in this playlist yet.');
    }
  }, [songs, triggerToast]);

  const playPlaylistRandomly = useCallback((playlist) => {
    const pSongs = songs.filter((s) => playlist.songIds.includes(s.id));
    if (pSongs.length > 0) {
      const shuffled = [...pSongs].sort(() => Math.random() - 0.5);
      setPlayQueue(shuffled);
      setCurrentSong(shuffled[0]);
      setQueueIndex(0);
      setProgress(0);
      setIsPlaying(true);
      setIsShuffle(true);
      triggerToast(`🔀 Shuffled: "${playlist.name}"`);
    } else {
      triggerToast('No tracks in this playlist yet.');
    }
  }, [songs, triggerToast]);

  // ── Playlist management ────────────────────────────────────────────────
  const addSongToPlaylist = useCallback((playlistId, songId) => {
    setPlaylists((prev) => {
      const updated = prev.map((pl) => {
        if (pl.id === playlistId) {
          if (pl.songIds.includes(songId)) return pl;
          const newPl = { ...pl, songIds: [...pl.songIds, songId] };
          if (isCloudMode) {
            updatePlaylistInFirestore(playlistId, { songIds: newPl.songIds }).catch(console.error);
          }
          return newPl;
        }
        return pl;
      });
      return updated;
    });
    setSelectedPlaylist((prev) => {
      if (!prev || prev.id !== playlistId) return prev;
      if (prev.songIds.includes(songId)) return prev;
      return { ...prev, songIds: [...prev.songIds, songId] };
    });
    triggerToast('Track added to playlist!');
  }, [isCloudMode, triggerToast]);

  const removeSongFromPlaylist = useCallback((playlistId, songId) => {
    setPlaylists((prev) => {
      const updated = prev.map((pl) => {
        if (pl.id === playlistId) {
          const newPl = { ...pl, songIds: pl.songIds.filter((id) => id !== songId) };
          if (isCloudMode) {
            updatePlaylistInFirestore(playlistId, { songIds: newPl.songIds }).catch(console.error);
          }
          return newPl;
        }
        return pl;
      });
      return updated;
    });
    setSelectedPlaylist((prev) => {
      if (!prev || prev.id !== playlistId) return prev;
      return { ...prev, songIds: prev.songIds.filter((id) => id !== songId) };
    });
    triggerToast('Track removed from playlist.');
  }, [isCloudMode, triggerToast]);

  // Called by AddSongModal after successful upload
  const handleUploadAddSong = useCallback((newSong) => {
    setSongs((prev) => {
      const exists = prev.some((s) => s.id === newSong.id);
      return exists ? prev : [newSong, ...prev];
    });
    setIsAddSongModalOpen(false);

    if (isCloudMode) {
      saveSongToFirestore(newSong).catch((err) => {
        console.error('Failed to save to Firestore:', err);
        triggerToast('Uploaded locally (cloud sync failed).');
      });
    }

    setPlayQueue((prev) => [newSong, ...prev]);
    setCurrentSong(newSong);
    setQueueIndex(0);
    setProgress(0);
    setIsPlaying(true);

    triggerToast(`"${newSong.title}" uploaded & playing!`);
  }, [isCloudMode, triggerToast]);

  // ── Delete a song globally ──────────────────────────────────────────────
  const handleDeleteSong = useCallback(async (songId) => {
    const songToDelete = songs.find(s => s.id === songId);

    setSongs(prev => prev.filter(s => s.id !== songId));

    setPlaylists(prev => {
      return prev.map(pl => {
        if (pl.songIds.includes(songId)) {
          const updatedPl = { ...pl, songIds: pl.songIds.filter(id => id !== songId) };
          if (isCloudMode) {
            updatePlaylistInFirestore(pl.id, { songIds: updatedPl.songIds }).catch(console.error);
          }
          return updatedPl;
        }
        return pl;
      });
    });

    setCurrentSong(prev => prev?.id === songId ? null : prev);
    setPlayQueue(prev => prev.filter(s => s.id !== songId));
    setIsPlaying(false);
    triggerToast('Song deleted.');

    if (isCloudMode && songToDelete) {
      try {
        await deleteSongFromFirestoreAndStorage(songToDelete);
      } catch (err) {
        console.error('Failed to delete song from Firestore/Storage:', err);
        triggerToast('Deleted locally (cloud sync failed).');
      }
    }
  }, [songs, isCloudMode, triggerToast]);

  // ── Delete a playlist ───────────────────────────────────────────────────
  const handleDeletePlaylist = useCallback(async (playlistId) => {
    setPlaylists(prev => prev.filter(pl => pl.id !== playlistId));
    if (selectedPlaylist?.id === playlistId) {
      setSelectedPlaylist(null);
      setActiveScreen('library');
    }
    triggerToast('Playlist deleted.');

    if (isCloudMode) {
      try {
        await deletePlaylistFromFirestore(playlistId);
      } catch (err) {
        console.error('Failed to delete playlist from Firestore:', err);
        triggerToast('Deleted locally (cloud sync failed).');
      }
    }
  }, [isCloudMode, selectedPlaylist, triggerToast]);

  // ── Edit / update a song ────────────────────────────────────────────────
  const handleEditSong = useCallback(async (updated, newCoverFile) => {
    let finalSong = { ...updated };

    if (newCoverFile && isCloudMode) {
      try {
        triggerToast('Uploading new cover to Google Drive...');
        // Upload new cover to Google Drive via Apps Script
        const newCoverUrl = await uploadCoverToDrive(newCoverFile, updated.id);
        finalSong.coverUrl = newCoverUrl;
      } catch (err) {
        console.error('Failed to upload new cover to Drive:', err);
        triggerToast('Failed to upload cover.');
        // Fallback: use a local blob URL for this session
        finalSong.coverUrl = URL.createObjectURL(newCoverFile);
      }
    } else if (newCoverFile) {
      finalSong.coverUrl = URL.createObjectURL(newCoverFile);
    }

    setSongs(prev => prev.map(s => s.id === finalSong.id ? finalSong : s));
    setPlayQueue(prev => prev.map(s => s.id === finalSong.id ? finalSong : s));
    setCurrentSong(prev => prev?.id === finalSong.id ? finalSong : prev);

    if (isCloudMode) {
      try {
        await saveSongToFirestore(finalSong);
      } catch (err) {
        console.error('Failed to update song in Firestore:', err);
        triggerToast('Updated locally (cloud sync failed).');
      }
    }

    setEditingSong(null);
    triggerToast(`"${finalSong.title}" updated!`);
  }, [songs, isCloudMode, triggerToast]);

  const handleToggleLike = useCallback((songId) => {
    setLikedSongIds((prev) => {
      if (prev.includes(songId)) {
        triggerToast('Removed from liked songs.');
        return prev.filter((id) => id !== songId);
      } else {
        triggerToast('Added to liked songs!');
        return [...prev, songId];
      }
    });
  }, [triggerToast]);

  const viewPlaylistDetail = useCallback((playlist) => {
    setSelectedPlaylist(playlist);
    setActiveScreen('playlist-detail');
  }, []);

  const handleAddPlaylist = useCallback((newPl) => {
    const cleanedPl = {
      ...newPl,
      songIds: [],
      createdAt: Date.now(),
      userId: currentUser?.uid ?? 'local',
    };
    setPlaylists((prev) => [...prev, cleanedPl]);
    setIsCreateModalOpen(false);

    if (isCloudMode) {
      savePlaylistToFirestore(cleanedPl).catch(console.error);
    }

    triggerToast('Playlist created!');
    viewPlaylistDetail(cleanedPl);
  }, [isCloudMode, triggerToast, viewPlaylistDetail, currentUser?.uid]);

  // Seek handler passed to BottomPlayer and NowPlayingView
  const handleSeek = useCallback((seconds) => {
    const audio = audioRef.current;
    if (audio && currentSong?.audioUrl) {
      audio.currentTime = seconds;
    }
    setProgress(seconds);
  }, [currentSong?.audioUrl]);

  // Close handler — clears the current song and stops playback entirely
  const handleClosePlayer = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = '';
    }
    wantsToPlayRef.current = false;
    setCurrentSong(null);
    setIsPlaying(false);
    setProgress(0);
    if (activeScreen === 'now-playing') {
      setActiveScreen('home');
    }
  }, [activeScreen]);

  // ── Search ─────────────────────────────────────────────────────────────
  const globalFilteredSongs = songs.filter((song) =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.album.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Auth loading state ─────────────────────────────────────────────────
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-obsidian-base flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary-electric border-t-transparent animate-spin" />
          <p className="text-obsidian-on-surface-variant/50 text-sm font-sans">Loading SonicObsidian...</p>
        </div>
      </div>
    );
  }

  // ── Auth gate ──────────────────────────────────────────────────────────
  if (isFirebaseReady && !currentUser) {
    return <AuthModal onSuccess={() => {}} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode
        ? 'bg-obsidian-base text-obsidian-on-surface'
        : 'light-mode bg-zinc-50 text-zinc-900 font-sans'
    }`}>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 1. Sidebar */}
      <Sidebar
        activeScreen={activeScreen}
        setActiveScreen={(s) => { setActiveScreen(s); setIsSidebarOpen(false); }}
        onOpenCreatePlaylist={() => setIsCreateModalOpen(true)}
        onOpenAddSong={() => setIsAddSongModalOpen(true)}
        likedCount={likedSongIds.length}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCloudMode={isCloudMode}
        username={username}
      />

      {/* 2. Header */}
      <Header
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onOpenNotifications={() => triggerToast(isCloudMode ? '☁️ Cloud sync active.' : '💾 Local mode — add Firebase config to enable cloud sync.')}
        onToggleSidebar={() => setIsSidebarOpen((o) => !o)}
      />

      {/* 3. Main Dashboard Canvas */}
      <main className="md:ml-[280px] pt-24 pb-36 px-4 md:px-8 min-h-screen transition-all main-content-mobile">
        {searchQuery.trim().length > 0 ? (
          <div className="space-y-6 animate-fade-in select-none">
            <h3 className="font-display text-xl font-bold">
              Search results for &ldquo;{searchQuery}&rdquo;
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {globalFilteredSongs.map((song) => (
                <div
                  key={song.id}
                  onClick={() => { playSong(song); setSearchQuery(''); }}
                  className="flex items-center gap-4 bg-obsidian-container-low/60 hover:bg-obsidian-container-high/60 cursor-pointer p-3 rounded-xl border border-white/5 transition-all text-left"
                >
                  <img src={song.coverUrl} className="w-12 h-12 rounded object-cover shadow border border-white/5" alt="cover" />
                  <div className="flex-1 overflow-hidden">
                    <p className="font-bold text-sm truncate">{song.title}</p>
                    <p className="text-xs text-obsidian-on-surface-variant/40 mt-0.5 truncate">{song.artist}</p>
                  </div>
                  <span className="text-xs font-mono font-medium">{song.duration}</span>
                </div>
              ))}
              {globalFilteredSongs.length === 0 && (
                <p className="text-xs text-obsidian-on-surface-variant/40">No songs match that query.</p>
              )}
            </div>
          </div>
        ) : (
          <>
            {activeScreen === 'home' && (
              <HomeView
                songs={songs}
                onPlaySong={playSong}
                onPlayPlaylist={playPlaylist}
                activeSongId={currentSong?.id ?? ''}
                playlists={playlists}
                onViewPlaylist={viewPlaylistDetail}
                onOpenCreatePlaylist={() => setIsCreateModalOpen(true)}
                onOpenAddSong={() => setIsAddSongModalOpen(true)}
                onDeleteSong={handleDeleteSong}
                onEditSong={setEditingSong}
              />
            )}

            {activeScreen === 'library' && (
              <LibraryView
                playlists={playlists}
                songs={songs}
                onPlaySong={playSong}
                onPlayPlaylist={playPlaylist}
                onViewPlaylist={viewPlaylistDetail}
                activeSongId={currentSong?.id ?? ''}
                onToggleLike={handleToggleLike}
                likedSongIds={likedSongIds}
                onAddSongClicked={() => setIsAddSongModalOpen(true)}
                onDeleteSong={handleDeleteSong}
                onEditSong={setEditingSong}
                onDeletePlaylist={handleDeletePlaylist}
              />
            )}

            {activeScreen === 'playlist-detail' && selectedPlaylist && (
              <PlaylistDetailView
                playlist={selectedPlaylist}
                songs={songs}
                onPlaySong={playSong}
                onPlayPlaylist={playPlaylist}
                onPlayPlaylistRandomly={playPlaylistRandomly}
                onAddSongToPlaylist={addSongToPlaylist}
                onRemoveSongFromPlaylist={removeSongFromPlaylist}
                activeSongId={currentSong?.id ?? ''}
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
                likedSongIds={likedSongIds}
                onToggleLike={handleToggleLike}
                onDeleteSong={handleDeleteSong}
                onEditSong={setEditingSong}
                onDeletePlaylist={handleDeletePlaylist}
                onBack={() => setActiveScreen('library')}
              />
            )}
          </>
        )}
      </main>

      {/* 4. Fullscreen Now Playing */}
      {activeScreen === 'now-playing' && currentSong && (
        <NowPlayingView
          currentSong={currentSong}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          progress={progress}
          onSeek={handleSeek}
          likedSongIds={likedSongIds}
          onToggleLike={handleToggleLike}
          onClose={() => setActiveScreen('home')}
          playQueue={playQueue}
          onPlaySong={playSong}
        />
      )}

      {/* 5. Bottom player — only shown when there is a song loaded */}
      {currentSong && (
        <BottomPlayer
          currentSong={currentSong}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          progress={progress}
          onSeek={handleSeek}
          volume={volume}
          setVolume={setVolume}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          isShuffle={isShuffle}
          setIsShuffle={setIsShuffle}
          isRepeat={isRepeat}
          setIsRepeat={setIsRepeat}
          likedSongIds={likedSongIds}
          onToggleLike={handleToggleLike}
          onSkipNext={skipNext}
          onSkipPrev={skipPrev}
          onOpenFullscreen={() => setActiveScreen('now-playing')}
          onClose={handleClosePlayer}
        />
      )}

      {/* 6. Mobile bottom nav */}
      <MobileNav
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        onOpenAddSong={() => setIsAddSongModalOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen((o) => !o)}
      />

      {/* 7. Modals */}
      {isCreateModalOpen && (
        <CreatePlaylistModal
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleAddPlaylist}
        />
      )}

      {isAddSongModalOpen && (
        <AddSongModal
          isDarkMode={isDarkMode}
          onClose={() => setIsAddSongModalOpen(false)}
          onAdd={handleUploadAddSong}
          isCloudMode={isCloudMode}
          uploaderId={currentUser?.uid ?? ''}
          uploaderDisplayName={username}
        />
      )}

      {editingSong && (
        <EditSongModal
          song={editingSong}
          isDarkMode={isDarkMode}
          onClose={() => setEditingSong(null)}
          onSave={handleEditSong}
        />
      )}

      {/* 8. Toast notification */}
      {activeNotification && (
        <div className="fixed bottom-28 right-4 md:right-8 z-[99] animate-fade-in flex items-center gap-3 bg-obsidian-container-high/90 text-obsidian-on-surface backdrop-blur-xl border border-white/10 py-3.5 px-6 rounded-2xl shadow-xl select-none max-w-sm">
          <Sparkles className="w-4 h-4 text-primary-electric animate-pulse flex-shrink-0" />
          <p className="text-xs font-semibold leading-relaxed font-sans">{activeNotification}</p>
        </div>
      )}
    </div>
  );
}
