<div align="center">

# 🎵 SonicObsidian

**A premium, dark-themed music streaming web app with private playlists and cloud-powered uploads.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite)](https://vite.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue?style=flat-square)](LICENSE)

</div>

---

## ✨ Overview

SonicObsidian is an immersive, high-fidelity music streaming application built with React and TypeScript. It features a stunning obsidian-dark UI with glassmorphism effects, real-time audio playback, private playlist management, and a unique **zero-cost file storage** architecture that uploads audio and cover art to Google Drive via an Apps Script proxy — completely avoiding Firebase Storage costs.

> **Works without Firebase too!** — If no Firebase credentials are configured, the app gracefully falls back to local-only mode using `localStorage`.

---

## 🖼️ Features

### 🎧 Music Playback
- Full audio player with play/pause, seek, skip, volume control
- Shuffle and repeat modes
- Persistent bottom player bar across all views
- Immersive **Now Playing** view with vinyl-spin animation and lyrics display
- Play queue visibility

### 📚 Library & Playlists
- **Private playlists** — only visible to the owner (enforced by Firestore security rules)
- Create, edit, and delete playlists with custom cover art
- Add/remove songs from playlists
- Song search and filtering

### 🎤 Song Management
- Upload songs with audio files and cover art
- Edit song metadata (title, artist, album, genre, lyrics)
- Delete songs with confirmation
- Public song feed — all uploaded songs are visible to everyone
- Uploader attribution badges

### 🔐 Authentication
- Username + password registration and login
- No email required — uses a clean username-based system
- Firebase Auth under the hood
- Per-user data isolation for playlists

### 🎨 Design & UX
- **Obsidian dark theme** with custom design tokens
- **Light mode** toggle
- Glassmorphism panels and subtle glow effects
- Smooth animations powered by [Motion](https://motion.dev) (Framer Motion)
- Fully responsive — mobile bottom navigation + desktop sidebar
- Custom scrollbars and micro-interactions
- Typography: Inter, Sora, JetBrains Mono (Google Fonts)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                      │
│              (Vite + TypeScript + Tailwind)              │
├──────────────┬──────────────────┬────────────────────────┤
│  Firebase    │  Firebase        │  Google Apps Script    │
│  Auth        │  Firestore       │  (Drive Upload Proxy)  │
│              │                  │                        │
│  • Login     │  • Song metadata │  • Audio files → Drive │
│  • Register  │  • Playlists     │  • Cover art → Drive   │
│  • Users     │  • User profiles │  • Free, no storage $  │
└──────────────┴──────────────────┴────────────────────────┘
```

**Key design decisions:**

| Concern | Solution | Why |
|---------|----------|-----|
| Audio/image storage | Google Drive via Apps Script | Completely free — avoids Firebase Storage costs |
| Metadata | Cloud Firestore | Real-time sync, generous free tier |
| Auth | Firebase Auth (Email/Password) | Simple, secure, zero-config |
| Offline fallback | `localStorage` | App works without any cloud services |

---

## 📁 Project Structure

```
SonicObsidian/
├── apps-script/
│   └── Code.gs              # Google Apps Script for Drive upload proxy
├── src/
│   ├── components/
│   │   ├── AddSongModal.tsx      # Upload song modal with progress tracking
│   │   ├── AuthModal.tsx         # Login / Register modal
│   │   ├── BottomPlayer.tsx      # Persistent playback controls
│   │   ├── CreatePlaylistModal.tsx
│   │   ├── EditSongModal.tsx     # Edit song metadata
│   │   ├── Header.tsx            # Top bar with search + theme toggle
│   │   ├── HomeView.tsx          # Main feed with songs + playlists
│   │   ├── LibraryView.tsx       # User's library
│   │   ├── MobileNav.tsx         # Bottom navigation for mobile
│   │   ├── NowPlayingView.tsx    # Full-screen now playing experience
│   │   ├── PlaylistDetailView.tsx
│   │   └── Sidebar.tsx           # Desktop sidebar navigation
│   ├── contexts/
│   │   └── AuthContext.tsx       # Firebase auth context provider
│   ├── services/
│   │   ├── driveService.ts       # Google Drive upload (base64 → Apps Script)
│   │   └── songService.ts       # Firestore CRUD for songs + playlists
│   ├── App.tsx                   # Root component + state management
│   ├── firebase.ts               # Firebase initialization
│   ├── index.css                 # Design system + animations
│   ├── main.tsx                  # Entry point
│   └── types.ts                  # TypeScript interfaces
├── firestore.rules               # Firestore security rules
├── storage.rules                 # Firebase Storage rules (optional)
├── cors.json                     # CORS config for Firebase Storage
├── .env.example                  # Environment variable template
├── index.html                    # HTML entry with SEO meta tags
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- A **Firebase** project (free Spark plan is sufficient)
- A **Google account** (for the Apps Script upload proxy)

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/SonicObsidian.git
cd SonicObsidian
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

| Variable | Where to find it |
|----------|-----------------|
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project Settings → Web App |
| `VITE_FIREBASE_AUTH_DOMAIN` | Same as above |
| `VITE_FIREBASE_PROJECT_ID` | Same as above |
| `VITE_FIREBASE_STORAGE_BUCKET` | Same as above |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Same as above |
| `VITE_FIREBASE_APP_ID` | Same as above |
| `VITE_APPS_SCRIPT_URL` | Your deployed Apps Script Web App URL (see below) |

### 4. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com) and create a new project
2. Enable **Authentication** → Sign-in method → **Email/Password**
3. Create a **Firestore Database** in production mode
4. Deploy security rules:
   ```bash
   npx firebase-tools deploy --only firestore:rules
   ```

### 5. Set up Google Drive Upload Proxy

This is the magic that gives you **free file storage** — audio and cover art are stored in your personal Google Drive.

1. Go to [Google Apps Script](https://script.google.com) → **New Project**
2. Replace the default code with the contents of [`apps-script/Code.gs`](apps-script/Code.gs)
3. **Important:** Change the `SECRET_TOKEN` variable to your own random string
4. Click **Deploy** → **New Deployment** → **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the Web App URL → paste into `.env` as `VITE_APPS_SCRIPT_URL`

> ⚠️ **Security:** The secret token in `Code.gs` prevents unauthorized uploads. Set the same value in your `.env` as `VITE_DRIVE_SECRET`.

### 6. Run the app

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | TypeScript type checking |
| `npm run clean` | Remove build artifacts |

---

## 🔒 Security Rules

### Firestore Rules

- **Users** — read/write only by the authenticated owner
- **Songs** — public read, authenticated write (any logged-in user can upload)
- **Playlists** — fully private per user (read/write restricted to owner's UID)

### Apps Script Proxy

- Protected by a shared secret token
- Only accepts requests with valid `secret` field
- Files are stored in a dedicated `SonicObsidian` folder in the deployer's Google Drive

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **UI Framework** | React 19 |
| **Language** | TypeScript 5.8 |
| **Build Tool** | Vite 6 |
| **Styling** | Tailwind CSS 4 |
| **Animations** | Motion (Framer Motion) |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Auth** | Firebase Authentication |
| **Database** | Cloud Firestore |
| **File Storage** | Google Drive (via Apps Script) |
| **Fonts** | Inter, Sora, JetBrains Mono |

---

## 🌐 Deployment

### Firebase Hosting (Recommended)

```bash
npm run build
npx firebase-tools deploy --only hosting
```

### Vercel / Netlify

The app is a standard Vite SPA — deploy as you would any React project. Make sure to set the environment variables in your hosting provider's dashboard.

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **Apache License 2.0** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with 🎵 and ☕**

</div>