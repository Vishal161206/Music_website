/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AuthModal — Login / Register screen for SonicObsidian.
 * Username + password (no email required from the user).
 */

import React, { useState } from 'react';
import { Flame, User, Lock, Eye, EyeOff, Loader2, AlertCircle, Music } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  onSuccess: () => void;
}

export default function AuthModal({ onSuccess }: AuthModalProps) {
  const { register, login } = useAuth();

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
  };

  const switchTab = (t: 'login' | 'register') => {
    setTab(t);
    resetForm();
  };

  const validateUsername = (u: string) => {
    if (u.trim().length < 3) return 'Username must be at least 3 characters.';
    if (!/^[a-zA-Z0-9_. ]+$/.test(u)) return 'Username can only contain letters, numbers, spaces, dots or underscores.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const usernameError = validateUsername(username);
    if (usernameError) { setError(usernameError); return; }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (tab === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      if (tab === 'register') {
        await register(username.trim(), password);
      } else {
        await login(username.trim(), password);
      }
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      // Translate Firebase error messages to user-friendly text
      if (msg.includes('email-already-in-use') || msg.includes('already-in-use')) {
        setError('That username is already taken. Try a different one.');
      } else if (msg.includes('user-not-found') || msg.includes('invalid-credential') || msg.includes('wrong-password')) {
        setError('Incorrect username or password.');
      } else if (msg.includes('too-many-requests')) {
        setError('Too many failed attempts. Please wait a moment before trying again.');
      } else if (msg.includes('weak-password')) {
        setError('Password is too weak. Use at least 6 characters.');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls = 'w-full bg-obsidian-container-high/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:ring-1 focus:ring-primary-electric transition-colors';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-obsidian-base">
      {/* Ambient glow blobs */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary-electric/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary-emerald/5 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="relative w-full max-w-sm mx-4 animate-fade-in">
        {/* Brand */}
        <div className="text-center mb-8 select-none">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-electric/10 border border-primary-electric/20 mb-4">
            <Flame className="w-8 h-8 text-primary-electric animate-pulse" />
          </div>
          <h1 className="font-display text-3xl font-extrabold text-white tracking-tight">
            SonicObsidian
          </h1>
          <p className="text-sm text-obsidian-on-surface-variant/50 mt-1 font-sans">
            Your private music sanctuary
          </p>
        </div>

        {/* Card */}
        <div className="bg-obsidian-surface border border-white/10 rounded-2xl p-6 shadow-2xl">

          {/* Tabs */}
          <div className="flex rounded-xl bg-obsidian-container-low p-1 mb-6">
            <button
              type="button"
              onClick={() => switchTab('login')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === 'login'
                  ? 'bg-primary-electric text-obsidian-base shadow'
                  : 'text-obsidian-on-surface-variant/60 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchTab('register')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === 'register'
                  ? 'bg-primary-electric text-obsidian-base shadow'
                  : 'text-obsidian-on-surface-variant/60 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs font-medium animate-fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Username */}
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-on-surface-variant/40" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Username"
                required
                autoComplete="username"
                className={`${inputCls} pl-10`}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-on-surface-variant/40" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                required
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                className={`${inputCls} pl-10 pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-obsidian-on-surface-variant/40 hover:text-white cursor-pointer transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Confirm password (register only) */}
            {tab === 'register' && (
              <div className="relative animate-fade-in">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-on-surface-variant/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  required
                  autoComplete="new-password"
                  className={`${inputCls} pl-10`}
                />
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-primary-electric text-obsidian-base font-extrabold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-transform primary-glow cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {tab === 'login' ? 'Signing in...' : 'Creating account...'}</>
              ) : (
                <><Music className="w-4 h-4" /> {tab === 'login' ? 'Sign In' : 'Create Account'}</>
              )}
            </button>
          </form>

          {/* Switch hint */}
          <p className="text-center text-xs text-obsidian-on-surface-variant/40 mt-4 select-none">
            {tab === 'login' ? (
              <>No account? <button type="button" onClick={() => switchTab('register')} className="text-primary-electric font-semibold hover:underline cursor-pointer">Create one free</button></>
            ) : (
              <>Already have an account? <button type="button" onClick={() => switchTab('login')} className="text-primary-electric font-semibold hover:underline cursor-pointer">Sign in</button></>
            )}
          </p>
        </div>

        <p className="text-center text-[10px] text-obsidian-on-surface-variant/25 mt-4 select-none font-mono">
          Your playlists are private · Songs are shared publicly
        </p>
      </div>
    </div>
  );
}
