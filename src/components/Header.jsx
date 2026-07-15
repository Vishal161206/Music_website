/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Settings,
  Sun,
  Moon,
  Menu,
  Bell,
  LogOut,
  User,
  Info,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Header({
  activeScreen,
  setActiveScreen,
  searchQuery,
  setSearchQuery,
  isDarkMode,
  setIsDarkMode,
  onOpenNotifications,
  onToggleSidebar,
}) {
  const { logout, username, currentUser } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    };
    if (settingsOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [settingsOpen]);

  const initials = username ? username.slice(0, 2).toUpperCase() : 'SO';

  const handleLogout = async () => {
    setSettingsOpen(false);
    try { await logout(); } catch (e) { console.error('Logout error:', e); }
  };

  return (
    <header className="fixed top-0 right-0 left-0 md:left-[280px] h-16 bg-obsidian-surface/80 backdrop-blur-3xl flex items-center justify-between px-4 md:px-8 z-40 border-b border-[#ffffff]/5 select-none transition-all">

      {/* Left: hamburger (mobile) + nav arrows + search */}
      <div className="flex items-center gap-3 md:gap-6 flex-1 max-w-2xl">

        {/* Mobile hamburger */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden w-9 h-9 rounded-full bg-obsidian-container-low flex items-center justify-center text-obsidian-on-surface-variant hover:text-white transition-all cursor-pointer border border-white/5"
          aria-label="Open menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Nav arrows (desktop) */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => setActiveScreen('home')}
            className="w-8 h-8 rounded-full bg-obsidian-container-low hover:bg-obsidian-container-high flex items-center justify-center text-obsidian-on-surface-variant hover:text-obsidian-on-surface transition-all cursor-pointer border border-[#ffffff]/5"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveScreen('library')}
            className="w-8 h-8 rounded-full bg-obsidian-container-low hover:bg-obsidian-container-high flex items-center justify-center text-obsidian-on-surface-variant hover:text-obsidian-on-surface transition-all cursor-pointer border border-[#ffffff]/5"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Search bar */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-obsidian-on-surface-variant/40 w-4 h-4" />
          <input
            id="searchInput"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-obsidian-container-high border-none text-obsidian-on-surface text-sm rounded-full py-2 pl-10 pr-4 placeholder:text-obsidian-on-surface-variant/40 focus:ring-1 focus:ring-primary-electric focus:bg-obsidian-container-highest transition-all outline-none"
            placeholder="Search songs, artists, albums..."
          />
        </div>

        {/* Tab shortcuts (desktop only) */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-sans font-medium text-obsidian-on-surface-variant/60">
          {[
            { label: 'Music', screen: 'home' },
            { label: 'Library', screen: 'library' },
          ].map(({ label, screen }) => (
            <button
              key={label}
              onClick={() => setActiveScreen(screen)}
              className={`cursor-pointer transition-all ${
                activeScreen === screen
                  ? 'text-primary-electric font-semibold border-b-2 border-primary-electric py-1'
                  : 'hover:text-primary-electric'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 md:gap-3">
        <button
          onClick={onOpenNotifications}
          className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-obsidian-container-high/40 hover:bg-obsidian-container-high text-obsidian-on-surface-variant/70 hover:text-obsidian-on-surface transition-all cursor-pointer border border-[#ffffff]/5"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          title={isDarkMode ? 'Toggle Light Mode' : 'Toggle Dark Mode'}
          className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-obsidian-container-high/40 hover:bg-obsidian-container-high text-obsidian-on-surface-variant/70 hover:text-obsidian-on-surface transition-all cursor-pointer border border-[#ffffff]/5"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-[#a078ff]" />}
        </button>

        {/* Settings dropdown button */}
        <div className="relative" ref={settingsRef}>
          <button
            id="settingsBtn"
            onClick={() => setSettingsOpen((o) => !o)}
            className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all cursor-pointer border ${
              settingsOpen
                ? 'bg-primary-electric/20 border-primary-electric/40 text-primary-electric'
                : 'bg-obsidian-container-high/40 hover:bg-obsidian-container-high text-obsidian-on-surface-variant/70 hover:text-obsidian-on-surface border-[#ffffff]/5'
            }`}
            title="Settings & Account"
            aria-label="Settings"
            aria-expanded={settingsOpen}
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Dropdown panel */}
          {settingsOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-obsidian-container-low border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in">

              {/* User info */}
              <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-electric/20 border border-primary-electric/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-extrabold text-primary-electric font-display">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{username || 'User'}</p>
                  <p className="text-[10px] text-obsidian-on-surface-variant/40 truncate">{currentUser?.email ?? 'local mode'}</p>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <div className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-obsidian-on-surface-variant/50">
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Private playlists active</span>
                </div>

                <div className="h-px bg-white/5 mx-4 my-1" />

                <button
                  onClick={handleLogout}
                  id="logoutBtn"
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
