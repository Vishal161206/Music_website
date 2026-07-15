/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * MobileNav — bottom tab bar shown on mobile only.
 * Analytics tab removed.
 */

import React from 'react';
import { Home, Library, Upload, Heart, Menu } from 'lucide-react';

export default function MobileNav({ activeScreen, setActiveScreen, onOpenAddSong, onToggleSidebar }) {
  return (
    <nav className="md:hidden fixed bottom-24 left-0 right-0 z-40 px-3">
      <div className="bg-obsidian-container-low/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl flex items-center justify-around py-2 px-1">

        <button
          onClick={() => setActiveScreen('home')}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeScreen === 'home'
              ? 'text-primary-electric bg-primary-electric/10'
              : 'text-obsidian-on-surface-variant/60 hover:text-white'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[9px] font-bold tracking-wide">Home</span>
        </button>

        <button
          onClick={() => setActiveScreen('library')}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeScreen === 'library'
              ? 'text-primary-electric bg-primary-electric/10'
              : 'text-obsidian-on-surface-variant/60 hover:text-white'
          }`}
        >
          <Library className="w-5 h-5" />
          <span className="text-[9px] font-bold tracking-wide">Library</span>
        </button>

        {/* Upload button — center hero */}
        <button
          onClick={onOpenAddSong}
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl bg-primary-electric text-black primary-glow hover:scale-105 active:scale-95 transition-transform cursor-pointer"
        >
          <Upload className="w-5 h-5" />
          <span className="text-[9px] font-extrabold tracking-wide">Upload</span>
        </button>

        {/* Liked songs shortcut */}
        <button
          onClick={() => setActiveScreen('library')}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeScreen === 'library'
              ? 'text-primary-electric bg-primary-electric/10'
              : 'text-obsidian-on-surface-variant/60 hover:text-white'
          }`}
        >
          <Heart className="w-5 h-5" />
          <span className="text-[9px] font-bold tracking-wide">Liked</span>
        </button>

        <button
          onClick={onToggleSidebar}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all cursor-pointer text-obsidian-on-surface-variant/60 hover:text-white"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[9px] font-bold tracking-wide">Menu</span>
        </button>
      </div>
    </nav>
  );
}
