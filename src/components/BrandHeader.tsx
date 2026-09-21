import React from 'react';
import { BadgeCheck } from 'lucide-react';
import { UserProfileBadge } from './UserProfileBadge.tsx';

interface BrandHeaderProps {
  subtitleExtra?: React.ReactNode;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({ subtitleExtra }) => {
  return (
    <div className="w-full flex flex-col items-center justify-center text-center pt-1 pb-2">
      {/* Profile Section with Avatar, Username & Pencil Edit */}
      <UserProfileBadge />

      {/* Title */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-blue-600 tracking-tight font-sans select-none">
        Viral Me
      </h1>

      {/* Subtitle with Verified Blue Tick */}
      <div className="mt-1 flex items-center justify-center gap-1.5 text-blue-500 font-semibold text-sm sm:text-base tracking-wide">
        <span>Power By Viral Wave</span>
        <BadgeCheck className="w-5 h-5 text-blue-600 fill-blue-500/20 inline-block shrink-0" />
      </div>

      {subtitleExtra && (
        <div className="mt-1">{subtitleExtra}</div>
      )}

      {/* Signature Blue Dotted Divider */}
      <div className="w-full max-w-lg mx-auto mt-4 mb-2">
        <div className="border-b-4 border-dotted border-blue-500 w-full" />
      </div>
    </div>
  );
};
