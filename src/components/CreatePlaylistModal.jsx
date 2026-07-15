/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

const PRESET_COVERS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBnzd57QpExo-eBsk_19-QmXPq2jA4tftgLTrCWUjrgIf89pHNDc2tw67WGqTPjONYw9n4cLX2N6PL77YVUxclfSowGOG5ypUU9aoC9AM80VMtAsKA4EPmWqrLhGaM6-Tt1w51rK4FA3l1y8r0cU2qSRhYXNLz1oS5Ix55Pw6qHS4LJqXWOAKAG4bA18QrvGdne6tn5k8tFE10ar4Xmy3EEuZSNQEjLpTvQ8s9PF2vj2m_Q0ULnZ-HuAmHGjMb4XW7a9iFd4VVr-PQ',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCIEfzGZD80af6l9xl_eoz4OfkYftSvB-cAMF0w8RfX7oZMOx0IlrDUot0Xw8pt3irwVYSubApi5vG6JlUPPs9SQzY2DNgPdreEqQ9H3WIQWDdLgl7nRjMPdiZ1qqcMDKB_1tix8XdLvvCaSn4m1xQPmVCmFfGD0VXGKjRfB64LguScPJGR7sqHMxQRT49f7fPcy8dJMCahCVObggpuS9lwyFEv_W8rg_BfsPaR3eRAbl0RahRIDbYiHqhaLZsdRu5pCu7ciE7Sx_4',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBKtg6oid2rBiLa5y8yKRp2IHKhiOhfEW3WqJMwH0MpUdgZodgEg5hV9Pjuxum7va-ytI3gP1VewUzJ3C9GYB9Y2yV-F30ns2Ow_dJ0-_lMh7RdW56Qt2ft8RXmomvT2tage92bmPpPxJGUkGfQ0g4fbDAkow_9sCryeQKZypvnhTI93veBuKQplcnk3D4eUFp6jS9vyjHDE2USC0YPlHUgSir5KuaiMnzJylcunvGABOWlPzcblnmnUXaNlZ5z4q6g5P7XBWWV0oM',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAFMmoPFoNksF_nIXDbvhsY9b4xGP3eQ2r65W9grYtDClyUulYFzoA3i82B0dvC4zaCsU5R6GP_eOFeEoSek61l60fDEw1K4VPPOo6Mvi-jRHRjhC8veKzwI0A8s6j6Ftm0OGNU6WCm26E0-Bl00IyjuSGX7BQvnxxi5qGyiqMWmWTDcmrfuNRWp43F51Po9Y-TphYZf1BOc9uqCOM-OsWdmpcnC8V83OnhzTht_ld2QssKgFft7VCJfWZxLEFmKdbER2waYxg3iAE'
];

export default function CreatePlaylistModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCover, setSelectedCover] = useState(PRESET_COVERS[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPlaylist = {
      id: `pl-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      coverUrl: selectedCover,
      songIds: [],        // Fixed: always start empty — no phantom song IDs
      isPublic: false,    // Private by default — only visible to the owner
      isUserCreated: true,
      userId: '',         // Will be set by App.jsx handleAddPlaylist using currentUser.uid
    };

    onSave(newPlaylist);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-99 flex items-center justify-center p-4">
      <div className="bg-obsidian-surface border border-white/10 rounded-2xl w-full max-w-md p-6 relative overflow-hidden select-none">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-obsidian-on-surface-variant/60 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-display text-xl font-bold text-white tracking-tight mb-1">
          Create Private Playlist
        </h3>
        <p className="text-xs text-obsidian-on-surface-variant/40 mb-4 font-sans">
          Only you can see your playlists. Add songs from the global library.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-obsidian-on-surface-variant/40 uppercase tracking-widest leading-4 mb-1">
              Playlist Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Synth Midnight Cruise"
              className="w-full bg-obsidian-container-high/60 border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:ring-1 focus:ring-primary-electric outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-obsidian-on-surface-variant/40 uppercase tracking-widest leading-4 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief mood summary..."
              className="w-full bg-obsidian-container-high/60 border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:ring-1 focus:ring-primary-electric outline-none h-20 resize-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-obsidian-on-surface-variant/40 uppercase tracking-widest leading-4 mb-2">
              Select Theme Cover
            </label>
            <div className="flex gap-3">
              {PRESET_COVERS.map((cov, id) => (
                <div
                  key={id}
                  onClick={() => setSelectedCover(cov)}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                    selectedCover === cov ? 'border-primary-electric scale-102' : 'border-transparent hover:scale-102'
                  }`}
                >
                  <img src={cov} className="w-full h-full object-cover" alt="Preset Option" />
                  {selectedCover === cov && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-electric stroke-[3]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-primary-electric text-obsidian-base font-bold text-xs hover:scale-105 active:scale-95 transition-transform primary-glow cursor-pointer"
            >
              Create Playlist
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
