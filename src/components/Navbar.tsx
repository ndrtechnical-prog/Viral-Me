import React from 'react';
import { BadgeCheck, Package, Sparkles } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle.tsx';

interface NavbarProps {
  onOpenLookup: () => void;
  onOpenAdminLogin?: () => void;
  isAdminLoggedIn?: boolean;
  onOpenAdminDashboard?: () => void;
  onOpenFreeTools?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenLookup,
  onOpenFreeTools,
}) => {
  return (
    <header className="w-full border-b border-gray-200/80 dark:border-neutral-800/80 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md sticky top-0 z-40 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="font-black text-xl text-blue-600 dark:text-blue-400 tracking-tight flex items-center gap-1">
            <span>Viral Me</span>
            <BadgeCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 fill-blue-100 dark:fill-blue-950 inline" />
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Free Tools Button */}
          {onOpenFreeTools && (
            <button
              type="button"
              onClick={onOpenFreeTools}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-50 dark:bg-pink-950/50 hover:bg-pink-100 dark:hover:bg-pink-900/50 border border-pink-200 dark:border-pink-850 text-xs font-bold text-pink-700 dark:text-pink-300 transition-colors cursor-pointer shadow-2xs"
              title="Explore Free Viral Creator Tools"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
              <span className="hidden xs:inline">Free</span>
              <span>Tools</span>
            </button>
          )}

          {/* Global Theme Toggle */}
          <ThemeToggle />

          {/* My Orders / Tracking Button */}
          <button
            id="my-orders-header-btn"
            type="button"
            onClick={onOpenLookup}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-700 dark:text-blue-300 transition-colors cursor-pointer shadow-2xs"
          >
            <Package className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>My Orders</span>
          </button>
        </div>
      </div>
    </header>
  );
};
