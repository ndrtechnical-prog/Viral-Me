import React from 'react';
import {
  ArrowLeft,
  Sparkles,
  Zap,
  Flame,
  Hash,
  Calculator,
  MessageSquare,
  Music,
  CheckCircle2,
  Clock,
  Rocket,
  ShieldCheck,
  BadgeCheck
} from 'lucide-react';
import { GrowthTips } from './GrowthTips.tsx';

interface FreeToolsPageProps {
  onBackToHome: () => void;
}

export const FreeToolsPage: React.FC<FreeToolsPageProps> = ({ onBackToHome }) => {
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-neutral-900 text-gray-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 w-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-gray-200/80 dark:border-neutral-800">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-neutral-200 hover:text-blue-600 dark:hover:text-blue-400 py-1.5 px-3 rounded-xl bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Viral Me</span>
          </button>

          <div className="flex items-center gap-1.5 font-black text-xs text-blue-600 dark:text-blue-400">
            <span>Viral Me Free Tools</span>
            <BadgeCheck className="w-4 h-4 fill-blue-500/20" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Animated Hero Header */}
        <div className="text-center space-y-3 pt-2">
          {/* Animated Glowing Coming Soon Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-500/10 border border-pink-300 dark:border-pink-800/80 text-pink-700 dark:text-pink-300 text-xs font-black tracking-wide shadow-sm animate-pulse">
            <Rocket className="w-3.5 h-3.5 text-pink-600 animate-bounce" />
            <span>FREE VIRAL CREATOR TOOLS</span>
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
            <span className="text-[10px] uppercase font-bold text-pink-600 dark:text-pink-400">100% Free</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-neutral-50">
            Creator Tools Suite
          </h1>

          <p className="text-xs sm:text-sm text-gray-600 dark:text-neutral-300 max-w-md mx-auto leading-relaxed">
            Pakistani creators aur influencers ke liye free algorithmic growth tools jo baghair kisi kharche ke FYP reach boost karte hain.
          </p>
        </div>

        {/* Big Coming Soon Animated Showcase Card */}
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 text-white border border-neutral-800 shadow-xl text-center space-y-5">
          {/* Shimmer Ambient Background */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Central Pulsing Icon */}
          <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#25F4EE] via-[#FE2C55] to-[#FFA800] p-0.5 shadow-lg shadow-pink-500/20 animate-pulse">
            <div className="w-full h-full bg-neutral-900 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-pink-400 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
          </div>

          {/* Coming Soon Animated Text */}
          <div className="space-y-1.5">
            <div className="inline-block">
              <span className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent tracking-tight animate-pulse">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              Our engineering team is actively building this suite. Launching soon for all creators!
            </p>
          </div>

          {/* Progress Bar */}
          <div className="max-w-xs mx-auto space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400">
              <span>Development Stage</span>
              <span className="text-pink-400 font-mono">85% Complete</span>
            </div>
            <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden relative">
              <div className="h-full bg-gradient-to-r from-[#25F4EE] via-[#FE2C55] to-[#FFA800] w-[85%] rounded-full relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
              </div>
            </div>
          </div>

          {/* Upcoming Tools Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-left">
            <div className="p-3 rounded-2xl bg-neutral-800/60 border border-neutral-700/60 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                <Hash className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-neutral-200">TikTok Hashtag Finder</h4>
                <p className="text-[10px] text-neutral-400 truncate">Pakistan trending FYP tags</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-800/60 border border-neutral-700/60 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <Calculator className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-neutral-200">Engagement Calculator</h4>
                <p className="text-[10px] text-neutral-400 truncate">Account authority score</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-800/60 border border-neutral-700/60 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-neutral-200">AI 3-Sec Hook Generator</h4>
                <p className="text-[10px] text-neutral-400 truncate">High-retention opening scripts</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-800/60 border border-neutral-700/60 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Music className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-neutral-200">Viral Sound Radar</h4>
                <p className="text-[10px] text-neutral-400 truncate">Early trend breakout tracks</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Organic Growth Tips (Moved here from main page per user request) */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-gray-800 dark:text-neutral-200 uppercase tracking-wider">
              Creator Organic Growth Playbook
            </span>
          </div>

          <GrowthTips />
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="w-full border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 py-6 text-xs text-gray-500 dark:text-neutral-400 text-center mt-auto">
        <div className="max-w-2xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© Viral Me • Powered By Viral Wave</p>
          <button
            type="button"
            onClick={onBackToHome}
            className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
          >
            ← Back to Order Promotion
          </button>
        </div>
      </footer>
    </div>
  );
};
