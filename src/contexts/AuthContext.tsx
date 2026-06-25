/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AuthContext — Firebase Authentication context for SonicObsidian.
 * Provides login / register / logout with username + password.
 * Internally maps username → username@sonicobsidian.local as the email
 * so users never need to type an email address.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert a plain username to a pseudo-email for Firebase Auth */
const toEmail = (username: string) =>
  `${username.trim().toLowerCase().replace(/\s+/g, '_')}@sonicobsidian.local`;

// ─── Context shape ───────────────────────────────────────────────────────────

interface AuthContextValue {
  currentUser: User | null;
  username: string;
  isAuthLoading: boolean;
  isFirebaseReady: boolean;
  register: (username: string, password: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Listen to Firebase auth state changes
  useEffect(() => {
    if (!auth) {
      setIsAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user?.displayName) {
        setUsername(user.displayName);
      } else if (user) {
        // Try fetching username from Firestore users doc
        try {
          if (db) {
            const snap = await getDoc(doc(db, 'users', user.uid));
            if (snap.exists()) {
              setUsername(snap.data().username || '');
            }
          }
        } catch {
          // ignore
        }
      } else {
        setUsername('');
      }
      setIsAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // ── register ──────────────────────────────────────────────────────────────
  const register = async (usernameInput: string, password: string) => {
    if (!auth) throw new Error('Firebase Auth not configured.');
    const email = toEmail(usernameInput);
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // Set display name on the Auth user object
    await updateProfile(cred.user, { displayName: usernameInput.trim() });
    // Create a Firestore user document
    if (db) {
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        username: usernameInput.trim(),
        email,
        createdAt: serverTimestamp(),
      });
    }
    setUsername(usernameInput.trim());
  };

  // ── login ─────────────────────────────────────────────────────────────────
  const login = async (usernameInput: string, password: string) => {
    if (!auth) throw new Error('Firebase Auth not configured.');
    const email = toEmail(usernameInput);
    await signInWithEmailAndPassword(auth, email, password);
  };

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
    setUsername('');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        username,
        isAuthLoading,
        isFirebaseReady: isFirebaseConfigured,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
