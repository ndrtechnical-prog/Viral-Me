import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.tsx';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ showLabel = false, className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      id="theme-toggle-btn"
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center gap-1.5 p-2 rounded-full border transition-all cursor-pointer shadow-2xs select-none ${
        isDark
          ? 'bg-neutral-800 hover:bg-neutral-700 text-amber-300 border-neutral-700 hover:border-neutral-600 ring-1 ring-amber-400/20'
          : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200 hover:border-gray-300 ring-1 ring-gray-200/50'
      } ${className}`}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={isDark ? 'Light mode par switch karein' : 'Dark mode par switch karein'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 transition-transform hover:rotate-45 duration-300 text-amber-300" />
      ) : (
        <Moon className="w-4 h-4 transition-transform hover:-rotate-12 duration-300 text-neutral-700" />
      )}
      {showLabel && (
        <span className="text-xs font-bold pr-1">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
};
