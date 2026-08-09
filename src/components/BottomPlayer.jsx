/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import {
  Heart,
  Shuffle,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Repeat,
  Mic2,
  ListMusic,
  Volume2,
  VolumeX,
  Maximize2,
  X,
  Loader2,
} from 'lucide-react';

export default function BottomPlayer({
  currentSong,
  isPlaying,
  isBuffering,
  onTogglePlay,
  progress,
  onSeek,
  volume,
  setVolume,
  isMuted,
  setIsMuted,
  isShuffle,
  setIsShuffle,
  isRepeat,
  setIsRepeat,
  likedSongIds,
  onToggleLike,
  onSkipNext,
  onSkipPrev,
  onOpenFullscreen,
  onClose,
}) {
  const progressBarRef = useRef(null);
  const isDragging = useRef(false);
  const isLiked = likedSongIds.includes(currentSong.id);
  const hasSrc = !!currentSong.audioUrl;

  const formatTime = (secs) => {
    const min = Math.floor(secs / 60);
    const sec = Math.floor(secs % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const seekFromEvent = (e) => {
    if (progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(Math.floor(ratio * currentSong.durationSec));
    }
  };

  const handleVolumeClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const vol = Math.floor(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * 100);
    setVolume(vol);
    if (vol > 0 && isMuted) setIsMuted(false);
  };

  const progressPercent = currentSong.durationSec > 0
    ? (progress / currentSong.durationSec) * 100
    : 0;

  return (
    <footer className="fixed bottom-0 left-0 w-full bg-obsidian-container-low/95 backdrop-blur-2xl border-t border-[#ffffff]/5 z-50 select-none shadow-[0_-10px_40px_rgba(0,0,0,0.6)] transition-all">

      {/* Progress bar — full width at top of footer */}
      <div
        ref={progressBarRef}
        onClick={seekFromEvent}
        onMouseDown={() => { isDragging.current = true; }}
        onMouseMove={(e) => { if (isDragging.current) seekFromEvent(e); }}
        onMouseUp={() => { isDragging.current = false; }}
        onMouseLeave={() => { isDragging.current = false; }}
        className={`w-full h-1 group relative ${hasSrc ? 'cursor-pointer' : 'cursor-default'}`}
        style={{ background: 'rgba(255,255,255,0.07)' }}
      >
        <div
          style={{ width: `${progressPercent}%` }}
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-electric to-secondary-emerald rounded-r-full transition-all duration-100"
        />
        {/* Scrubber knob */}
        <div
          style={{ left: `${progressPercent}%` }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
        />
      </div>

      <div className="flex items-center justify-between px-4 md:px-8 h-[88px]">
        {/* Track info (Left) */}
        <div
          onClick={onOpenFullscreen}
          className="flex items-center gap-3 w-1/3 md:w-1/4 group cursor-pointer min-w-0"
          title="Open Now Playing"
        >
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-lg border border-[#ffffff]/10 relative">
            <img
              alt={currentSong.title}
              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isPlaying ? 'animate-spin-slow' : ''}`}
              src={currentSong.coverUrl}
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="flex items-end gap-[2px] h-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-[3px] bg-primary-electric rounded-full animate-bounce"
                      style={{ height: `${40 + i * 20}%`, animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="overflow-hidden flex-1 hidden sm:block">
            <h6 className="font-sans font-bold text-sm text-white truncate group-hover:text-primary-electric transition-colors">
              {currentSong.title}
            </h6>
            <p className="font-sans text-xs text-obsidian-on-surface-variant/60 truncate mt-0.5">
              {currentSong.artist}
            </p>
            {isBuffering && (
              <span className="text-[9px] text-primary-electric/80 font-mono flex items-center gap-1 mt-0.5">
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                Loading audio…
              </span>
            )}
            {!hasSrc && !isBuffering && (
              <span className="text-[9px] text-primary-electric/60 font-mono">DEMO — no audio file</span>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleLike(currentSong.id); }}
            className="text-obsidian-on-surface-variant/60 hover:text-primary-electric transition-transform hover:scale-110 cursor-pointer ml-1 hidden sm:block"
          >
            <Heart className={`w-[18px] h-[18px] ${isLiked ? 'text-primary-electric fill-primary-electric' : ''}`} />
          </button>
        </div>

        {/* Controls (Center) */}
        <div className="flex flex-col items-center gap-1.5 w-1/3 md:w-1/2 max-w-sm">
          <div className="flex items-center gap-4 md:gap-7">
            <button
              onClick={() => setIsShuffle(!isShuffle)}
              className={`transition-colors cursor-pointer hidden md:block ${isShuffle ? 'text-secondary-emerald' : 'text-obsidian-on-surface-variant/40 hover:text-white'}`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={onSkipPrev}
              className="text-obsidian-on-surface-variant/60 hover:text-white transition-all hover:scale-105 cursor-pointer"
              title="Previous Track"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={onTogglePlay}
              disabled={isBuffering}
              className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] cursor-pointer ${
                isBuffering
                  ? 'bg-white/20 text-white/60'
                  : 'bg-white text-black hover:bg-primary-electric hover:scale-110 active:scale-95'
              }`}
              title={isBuffering ? 'Loading...' : isPlaying ? 'Pause' : 'Play'}
            >
              {isBuffering ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 md:w-5 md:h-5 fill-current" />
              ) : (
                <Play className="w-4 h-4 md:w-5 md:h-5 fill-current translate-x-0.5" />
              )}
            </button>

            <button
              onClick={onSkipNext}
              className="text-obsidian-on-surface-variant/60 hover:text-white transition-all hover:scale-105 cursor-pointer"
              title="Next Track"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={() => setIsRepeat(!isRepeat)}
              className={`transition-colors cursor-pointer hidden md:block ${isRepeat ? 'text-secondary-emerald' : 'text-obsidian-on-surface-variant/40 hover:text-white'}`}
              title="Repeat"
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Time labels */}
          <div className="w-full flex items-center justify-between text-[10px] font-mono text-obsidian-on-surface-variant/40 hidden md:flex">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(currentSong.durationSec)}</span>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center justify-end gap-3 md:gap-5 w-1/3 md:w-1/4 text-obsidian-on-surface-variant/60">
          <button
            onClick={onOpenFullscreen}
            className="hover:text-white transition-colors cursor-pointer hidden md:block"
            title="Lyrics"
          >
            <Mic2 className="w-[18px] h-[18px]" />
          </button>

          <button
            onClick={onOpenFullscreen}
            className="hover:text-white transition-colors cursor-pointer hidden md:block"
            title="Play Queue"
          >
            <ListMusic className="w-5 h-5" />
          </button>

          {/* Volume */}
          <div className="hidden md:flex items-center gap-2 group w-28 ml-1">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="hover:text-white transition-colors cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-[18px] h-[18px] text-primary-electric" />
              ) : (
                <Volume2 className="w-[18px] h-[18px] text-obsidian-on-surface-variant/80 group-hover:text-white" />
              )}
            </button>

            <div
              onClick={handleVolumeClick}
              className="flex-1 h-1 bg-[#ffffff]/10 hover:bg-[#ffffff]/15 rounded-full relative cursor-pointer"
            >
              <div
                style={{ width: `${isMuted ? 0 : volume}%` }}
                className="h-full bg-primary-electric hover:bg-secondary-emerald rounded-full transition-all"
              />
            </div>
          </div>

          <button
            onClick={onOpenFullscreen}
            className="hover:text-white transition-all hover:scale-105 cursor-pointer"
            title="Enter Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="hover:text-red-400 transition-all hover:scale-110 cursor-pointer ml-1"
            title="Close Player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}
