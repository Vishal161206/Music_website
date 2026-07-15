/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Share2,
  ListMusic,
  Heart,
  Play,
  Pause,
  Disc,
  X,
  Sparkles,
  Upload,
} from 'lucide-react';

export default function NowPlayingView({
  currentSong,
  isPlaying,
  onTogglePlay,
  progress,
  onSeek,
  likedSongIds,
  onToggleLike,
  onClose,
  playQueue,
  onPlaySong,
}) {
  const canvasRef = useRef(null);
  const progressBarRef = useRef(null);
  const [activeLyricIndex, setActiveLyricIndex] = useState(0);
  const [shareToast, setShareToast] = useState(false);

  const isLiked = likedSongIds.includes(currentSong.id);

  // Sync lyrics highlight state
  useEffect(() => {
    const total = currentSong.durationSec;
    const count = currentSong.lyrics.length;
    if (count > 1 && total > 0) {
      const secPerLyric = total / count;
      const index = Math.min(count - 1, Math.floor(progress / secPerLyric));
      setActiveLyricIndex(index);
    }
  }, [progress, currentSong]);

  // Animated canvas visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rAFId;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const W = canvas.width;
      const H = canvas.height;
      const midY = H / 2;

      ctx.fillStyle = '#131313';
      ctx.fillRect(0, 0, W, H);

      const waves = [
        { amp: isPlaying ? 35 : 5, freq: 0.015, color: 'rgba(208, 188, 255, 0.45)', speed: 0.05 },
        { amp: isPlaying ? 22 : 3, freq: 0.03,  color: 'rgba(78, 222, 163, 0.5)',   speed: -0.07 },
        { amp: isPlaying ? 12 : 2, freq: 0.008, color: 'rgba(255, 255, 255, 0.2)',  speed: 0.03 },
      ];

      waves.forEach((w) => {
        ctx.beginPath();
        ctx.strokeStyle = w.color;
        ctx.lineWidth = 1.5;
        for (let x = 0; x < W; x++) {
          const y = midY + Math.sin(x * w.freq + phase * w.speed) * w.amp * Math.sin((x * Math.PI) / W);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      // EQ bars
      for (let i = 0; i < 15; i++) {
        const xPos = (W / 16) * i + (W / 32) * Math.sin(phase * 0.01 + i);
        const barH = isPlaying
          ? Math.abs(Math.sin(phase * 0.05 + i)) * (midY - 10) + 5
          : Math.abs(Math.sin(i * 12)) * 10 + 2;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(208, 188, 255, 0.25)' : 'rgba(78, 222, 163, 0.25)';
        ctx.fillRect(xPos - 3, midY - barH / 2, 6, barH);
      }

      phase += 1;
      rAFId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(rAFId);
  }, [isPlaying]);

  // Seek from progress bar click
  const handleProgressClick = (e) => {
    if (!progressBarRef.current || currentSong.durationSec <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(Math.floor(ratio * currentSong.durationSec));
  };

  const handleShare = async () => {
    const shareData = {
      title: `${currentSong.title} by ${currentSong.artist}`,
      text: `Listening to "${currentSong.title}" on SonicObsidian — Free Public Music Hub!`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        setShareToast(true);
        setTimeout(() => setShareToast(false), 2500);
      }
    } catch (_) {
      // User cancelled or not supported
    }
  };

  const progressPercent = currentSong.durationSec > 0
    ? (progress / currentSong.durationSec) * 100
    : 0;

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="fixed inset-0 bg-obsidian-base min-h-screen z-50 overflow-y-auto custom-scrollbar py-6 px-4 md:py-12 md:px-20 animate-fade-in flex flex-col justify-between select-none">

      {/* 1. Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          className="w-10 h-10 md:w-11 md:h-11 bg-obsidian-container-high hover:bg-obsidian-container-highest text-white rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md border border-white/5"
        >
          <ChevronDown className="w-5 h-5" />
        </button>

        <div className="text-center">
          <p className="text-[10px] font-bold text-primary-electric uppercase tracking-widest leading-4 mb-0.5">
            NOW PLAYING
          </p>
          <h3 className="font-display text-sm font-semibold text-white/50 max-w-[200px] truncate">
            {currentSong.album}
          </h3>
        </div>

        <button
          onClick={onClose}
          className="w-10 h-10 md:w-11 md:h-11 bg-obsidian-container-high hover:bg-obsidian-container-highest text-white rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md border border-white/5"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-6 items-center flex-1">

        {/* Left: Cover + Visualizer */}
        <div className="lg:col-span-5 flex flex-col items-center space-y-5">
          <div className="relative group w-56 h-56 md:w-72 md:h-72 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex-shrink-0 animate-pulse-subtle">
            <img
              alt={currentSong.title}
              className={`w-full h-full object-cover transition-all duration-1000 ${isPlaying ? 'animate-spin-slow scale-[1.02]' : 'scale-100'}`}
              src={currentSong.coverUrl}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>

          <div className="text-center w-full max-w-sm px-4">
            <h1 className="font-display text-xl md:text-3xl font-extrabold text-white tracking-tight leading-snug">
              {currentSong.title}
            </h1>
            <p className="font-sans text-sm text-primary-electric/80 font-medium mt-1">
              {currentSong.artist}
            </p>
            {currentSong.uploaderName && (
              <p className="text-[10px] text-obsidian-on-surface-variant/40 mt-1 font-mono">
                Shared by {currentSong.uploaderName}
              </p>
            )}
            {!currentSong.audioUrl && (
              <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-primary-electric/60 font-mono bg-primary-electric/5 px-2 py-1 rounded-full border border-primary-electric/10">
                <Upload className="w-3 h-3" />
                Demo track — upload a file to play
              </div>
            )}
          </div>

          {/* Progress bar — now seekable! */}
          <div className="w-full max-w-sm px-4">
            <div
              ref={progressBarRef}
              onClick={handleProgressClick}
              className="w-full h-1.5 bg-white/10 rounded-full relative group cursor-pointer hover:h-2 transition-all"
            >
              <div
                style={{ width: `${progressPercent}%` }}
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-electric to-secondary-emerald rounded-full"
              />
              {/* Scrubber knob */}
              <div
                style={{ left: `${progressPercent}%` }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] font-mono text-obsidian-on-surface-variant/40">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(currentSong.durationSec)}</span>
            </div>
          </div>

          {/* Canvas visualizer */}
          <div className="w-full max-w-sm h-28 rounded-2xl overflow-hidden relative shadow border border-white/5 bg-obsidian-surface">
            <canvas ref={canvasRef} width={380} height={112} className="w-full h-full" />
            <div className="absolute top-2.5 right-3.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-secondary-emerald animate-pulse" />
              <span className="text-[9px] font-mono font-bold tracking-wider text-secondary-emerald uppercase">
                VISUALIZER
              </span>
            </div>
          </div>
        </div>

        {/* Right: Lyrics + Up Next */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-stretch min-h-[320px]">

          {/* Lyrics */}
          <div className="bg-obsidian-container-low/40 border border-white/5 p-5 md:p-7 rounded-3xl flex flex-col">
            <h4 className="text-[10px] font-bold text-obsidian-on-surface-variant/40 tracking-widest uppercase mb-4 pl-1 flex items-center gap-2">
              <Disc className="w-3.5 h-3.5 text-primary-electric" />
              <span>Real-Time Lyrics</span>
            </h4>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 lyrics-gradient" style={{ maxHeight: 280 }}>
              {currentSong.lyrics.map((lyric, idx) => {
                const isActive = idx === activeLyricIndex;
                const isPast = idx < activeLyricIndex;
                return (
                  <p
                    key={idx}
                    className={`font-sans font-bold text-sm leading-relaxed tracking-tight transition-all duration-300 ${
                      isActive
                        ? 'text-primary-electric scale-[1.02] font-extrabold drop-shadow-[0_0_8px_rgba(208,188,255,0.3)]'
                        : isPast
                        ? 'text-white/30 font-medium'
                        : 'text-white/50 font-semibold'
                    }`}
                  >
                    {lyric}
                  </p>
                );
              })}
            </div>
          </div>

          {/* Up Next */}
          <div className="bg-obsidian-container-low/40 border border-white/5 p-5 md:p-7 rounded-3xl flex flex-col">
            <h4 className="text-[10px] font-bold text-obsidian-on-surface-variant/40 tracking-widest uppercase mb-4 flex items-center gap-2">
              <ListMusic className="w-3.5 h-3.5 text-secondary-emerald" />
              <span>Up Next ({playQueue.length})</span>
            </h4>
            <div className="flex-1 space-y-2.5 overflow-y-auto custom-scrollbar pr-1" style={{ maxHeight: 280 }}>
              {playQueue.length === 0 ? (
                <p className="text-xs text-obsidian-on-surface-variant/40 italic">No songs queued.</p>
              ) : (
                playQueue.map((song) => {
                  const isCurrent = song.id === currentSong.id;
                  return (
                    <div
                      key={song.id}
                      onClick={() => onPlaySong(song)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-primary-electric/10 border border-primary-electric/20'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <img
                        alt={song.title}
                        className="w-9 h-9 rounded object-cover shadow flex-shrink-0"
                        src={song.coverUrl}
                      />
                      <div className="overflow-hidden flex-1">
                        <p className={`text-xs font-bold truncate leading-snug ${isCurrent ? 'text-primary-electric' : 'text-white'}`}>
                          {song.title}
                        </p>
                        <p className="text-[10px] text-obsidian-on-surface-variant/40 truncate">{song.artist}</p>
                      </div>
                      {isCurrent && isPlaying && (
                        <div className="flex items-end gap-[2px] h-3.5 flex-shrink-0">
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
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Footer controls */}
      <div className="pt-5 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onToggleLike(currentSong.id)}
            className="text-obsidian-on-surface-variant/60 hover:text-primary-electric transition-transform hover:scale-110 cursor-pointer"
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'text-primary-electric fill-primary-electric' : ''}`} />
          </button>
          <span className="text-xs text-obsidian-on-surface-variant/40 font-mono font-bold uppercase">
            {currentSong.genre}
          </span>
        </div>

        <button
          onClick={onTogglePlay}
          className="w-14 h-14 bg-white hover:bg-primary-electric text-black rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer"
        >
          {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current translate-x-0.5" />}
        </button>

        <div className="flex items-center gap-4 relative">
          {shareToast && (
            <div className="absolute -top-10 right-0 bg-obsidian-container-highest border border-white/10 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap">
              Link copied!
            </div>
          )}
          <button onClick={handleShare} className="text-obsidian-on-surface-variant/50 hover:text-white cursor-pointer transition-colors">
            <Share2 className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
