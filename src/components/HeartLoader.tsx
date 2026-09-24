import React from 'react';
import { Heart } from 'lucide-react';

interface HeartLoaderProps {
  message?: string;
  subMessage?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const HeartLoader: React.FC<HeartLoaderProps> = ({
  message = 'Loading...',
  subMessage,
  size = 'md',
  fullScreen = false
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-3 p-4 text-center">
      {/* Animated Beating Red Heart */}
      <div className="relative flex items-center justify-center">
        {/* Soft pulsing heart aura */}
        <div className="absolute w-12 h-12 rounded-full bg-rose-500/20 animate-ping" />
        <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/30 animate-bounce">
          <Heart className="w-5 h-5 text-white fill-white animate-pulse" />
        </div>
      </div>

      {/* Red Heart Shimmer Progress Bar */}
      <div className="w-48 sm:w-56 space-y-1.5">
        <div className="h-2 w-full bg-rose-100 dark:bg-neutral-800 rounded-full overflow-hidden relative shadow-inner">
          <div className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 rounded-full w-full animate-pulse relative overflow-hidden">
            {/* Shimmer sweep */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_1.4s_infinite]" />
          </div>
        </div>

        {/* Dynamic Message */}
        {message && (
          <p className="text-xs font-black text-rose-600 dark:text-rose-400 tracking-tight flex items-center justify-center gap-1">
            <span>{message}</span>
            <span className="inline-block animate-pulse">❤️</span>
          </p>
        )}
        {subMessage && (
          <p className="text-[10px] text-gray-500 dark:text-neutral-400 font-medium">
            {subMessage}
          </p>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-white dark:bg-neutral-900 border border-rose-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
