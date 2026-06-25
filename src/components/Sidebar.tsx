/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Home,
  Library,
  PlusSquare,
  Heart,
  Upload,
  Flame,
  Cloud,
  HardDrive,
  X,
  LogOut,
  User,
} from 'lucide-react';
import { ActiveScreen } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  onOpenCreatePlaylist: () => void;
  onOpenAddSong: () => void;
  likedCount: number;
  isOpen: boolean;
  onClose: () => void;
  isCloudMode: boolean;
  username: string;
}

export default function Sidebar({
  activeScreen,
  setActiveScreen,
  onOpenCreatePlaylist,
  onOpenAddSong,
  likedCount,
  isOpen,
  onClose,
  isCloudMode,
  username,
}: SidebarProps) {
  const { logout } = useAuth();

  const navBtnCls = (active: boolean) =>
    `w-full flex items-center gap-4 py-3 px-4 rounded-lg font-sans text-sm font-medium transition-all cursor-pointer text-left ${
      active
        ? 'text-primary-electric border-l-4 border-primary-electric bg-primary-electric/5 font-bold'
        : 'text-obsidian-on-surface-variant hover:text-primary-electric hover:bg-obsidian-container-high/40'
    }`;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  // Get initials for avatar
  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : 'SO';

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-[280px] bg-obsidian-container-low border-r border-[#ffffff]/5 flex flex-col py-8 px-4 z-50 transition-transform duration-300 select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:hidden text-obsidian-on-surface-variant/60 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="mb-8 px-2 cursor-pointer" onClick={() => setActiveScreen('home')}>
          <div className="flex items-center gap-2">
            <Flame className="w-8 h-8 text-primary-electric animate-pulse" />
            <h1 className="font-display text-2xl font-bold text-primary-electric tracking-tight">
              SonicObsidian
            </h1>
          </div>
          <div className="flex items-center gap-1.5 mt-1 pl-1">
            {isCloudMode ? (
              <>
                <Cloud className="w-3 h-3 text-secondary-emerald" />
                <p className="text-xs font-sans text-secondary-emerald/70 font-medium">Cloud Sync Active</p>
              </>
            ) : (
              <>
                <HardDrive className="w-3 h-3 text-obsidian-on-surface-variant/50" />
                <p className="text-xs font-sans text-obsidian-on-surface-variant/60 font-medium">Local Mode</p>
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar">
          <button onClick={() => setActiveScreen('home')} className={navBtnCls(activeScreen === 'home')}>
            <Home className={`w-5 h-5 ${activeScreen === 'home' ? 'text-primary-electric' : ''}`} />
            <span>Home</span>
          </button>

          <button onClick={() => setActiveScreen('library')} className={navBtnCls(activeScreen === 'library')}>
            <Library className={`w-5 h-5 ${activeScreen === 'library' ? 'text-primary-electric' : ''}`} />
            <span>Your Library</span>
          </button>

          {/* Upload Song CTA */}
          <div className="pt-2">
            <button
              onClick={onOpenAddSong}
              className="w-full flex items-center gap-4 py-3 px-4 rounded-lg font-sans text-sm font-bold text-black bg-primary-electric hover:scale-[1.02] active:scale-95 transition-all cursor-pointer primary-glow shadow-md"
            >
              <Upload className="w-5 h-5" />
              <span>Upload Song</span>
            </button>
          </div>

          <button
            onClick={onOpenCreatePlaylist}
            className="w-full flex items-center gap-4 py-3 px-4 rounded-lg font-sans text-sm font-medium text-obsidian-on-surface-variant hover:text-primary-electric hover:bg-obsidian-container-high/40 transition-all cursor-pointer text-left"
          >
            <PlusSquare className="w-5 h-5" />
            <span>Create Playlist</span>
          </button>

          {/* Library accents */}
          <div className="pt-6 pb-2">
            <h3 className="px-4 text-[10px] font-bold text-obsidian-on-surface-variant/40 uppercase tracking-widest leading-4 mb-2">
              Your Library
            </h3>

            <button
              onClick={() => setActiveScreen('library')}
              className="w-full flex items-center gap-4 py-2 px-4 rounded-lg font-sans text-sm font-medium text-obsidian-on-surface-variant hover:text-primary-electric hover:bg-obsidian-container-high/40 transition-all cursor-pointer text-left"
            >
              <Heart className="w-4 h-4 text-primary-electric fill-primary-electric" />
              <div className="flex justify-between items-center w-full">
                <span>Liked Songs</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-electric/10 text-primary-electric">
                  {likedCount}
                </span>
              </div>
            </button>
          </div>
        </nav>

        {/* Footer — User info + logout */}
        <div className="mt-auto pt-4 border-t border-[#ffffff]/5 space-y-2">
          {/* User card */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-obsidian-container-high/40 border border-white/5">
            <div className="w-8 h-8 rounded-full bg-primary-electric/20 border border-primary-electric/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-extrabold text-primary-electric font-display">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-obsidian-on-surface truncate">{username || 'User'}</p>
              <p className="text-[10px] text-obsidian-on-surface-variant/40 font-sans">Private playlists active</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="text-obsidian-on-surface-variant/40 hover:text-red-400 transition-colors cursor-pointer flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
