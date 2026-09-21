import React, { useState, useEffect } from 'react';
import { Pencil, X, Check, Loader2, RefreshCw } from 'lucide-react';

export interface ProfileData {
  username: string;
  avatarUrl: string;
}

const STORAGE_KEY = 'viralme_tiktok_profile';

export const UserProfileBadge: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.username) {
          const clean = parsed.username.replace(/^@+/, '');
          return {
            username: `@${clean}`,
            avatarUrl: `/api/tiktok-avatar?username=${encodeURIComponent(clean)}`
          };
        }
      }
    } catch (e) {
      console.warn('Storage profile parse notice:', e);
    }
    return {
      username: '@agencyforads',
      avatarUrl: '/api/tiktok-avatar?username=agencyforads'
    };
  });

  const [isEditing, setIsEditing] = useState(false);
  const [inputUsername, setInputUsername] = useState('');
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanCurrent = profile.username.replace(/^@+/, '');
  const avatarSrc = `/api/tiktok-avatar?username=${encodeURIComponent(cleanCurrent)}`;

  const handleOpenEdit = () => {
    setInputUsername(cleanCurrent);
    setError(null);
    setIsEditing(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputUsername.trim().replace(/^@+/, '');
    if (!clean) {
      setError('Barah-e-karam TikTok username darj karein');
      return;
    }

    setIsLoadingAvatar(true);
    setImgError(false);

    const updated: ProfileData = {
      username: `@${clean}`,
      avatarUrl: `/api/tiktok-avatar?username=${encodeURIComponent(clean)}`
    };

    setProfile(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (storageErr) {
      console.warn('LocalStorage save notice:', storageErr);
    }

    setTimeout(() => {
      setIsLoadingAvatar(false);
      setIsEditing(false);
    }, 400);
  };

  return (
    <div className="flex flex-col items-center justify-center mb-1 animate-fadeIn">
      {/* Real TikTok Profile Circular Avatar Fetched From TikTok */}
      <div className="relative group">
        <button
          type="button"
          onClick={handleOpenEdit}
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-white dark:border-neutral-800 ring-2 ring-pink-500/60 shadow-md select-none cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-200 bg-neutral-900 flex items-center justify-center"
          title="TikTok Profile Picture"
        >
          {imgError ? (
            <div className="w-full h-full bg-gradient-to-br from-black via-neutral-900 to-pink-600 flex items-center justify-center text-white font-black text-xl">
              {cleanCurrent.charAt(0).toUpperCase() || 'T'}
            </div>
          ) : (
            <img
              src={avatarSrc}
              alt={`${profile.username} TikTok Profile`}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          )}

          {/* TikTok Mini Overlay Tag */}
          <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-2xs py-0.5 text-[8px] font-black text-white text-center tracking-wider uppercase">
            TikTok
          </div>
        </button>
      </div>

      {/* Username and Pencil Icon */}
      <div className="flex items-center gap-1.5 mt-1.5">
        <span className="text-xs font-black text-gray-700 dark:text-neutral-200 font-mono tracking-tight">
          {profile.username}
        </span>
        <button
          type="button"
          onClick={handleOpenEdit}
          aria-label="Edit TikTok Username"
          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer rounded-md hover:bg-blue-50 dark:hover:bg-neutral-800"
          title="Change TikTok Profile"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Edit TikTok Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 dark:text-neutral-100">
                TikTok Profile Picture & Username
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Selected Avatar Preview from TikTok */}
            <div className="flex flex-col items-center justify-center py-2 space-y-2">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-pink-500 shadow-lg bg-neutral-900 flex items-center justify-center">
                <img
                  src={`/api/tiktok-avatar?username=${encodeURIComponent(inputUsername.trim().replace(/^@+/, '') || cleanCurrent)}`}
                  alt="TikTok preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-[11px] text-gray-500 dark:text-neutral-400 font-medium">
                TikTok se real profile picture fetch hogi
              </p>
            </div>

            {/* Username Input */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-600 dark:text-neutral-400 block">
                  TikTok Handle / Username:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-500 font-mono text-sm">
                    @
                  </span>
                  <input
                    type="text"
                    value={inputUsername}
                    onChange={(e) => setInputUsername(e.target.value)}
                    placeholder="agencyforads"
                    autoFocus
                    required
                    className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-xl pl-7 pr-3 py-2 text-sm text-gray-900 dark:text-neutral-100 font-mono focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-neutral-800"
                  />
                </div>
                {error && (
                  <p className="text-[11px] text-rose-500 font-medium pt-0.5">{error}</p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoadingAvatar}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isLoadingAvatar ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
