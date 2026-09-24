import React, { useState } from 'react';
import {
  Lightbulb,
  Sparkles,
  ChevronDown,
  TrendingUp,
  Zap,
  Clock,
  MessageCircle,
  Share2,
  CheckCircle2
} from 'lucide-react';

interface Tip {
  id: string;
  category: string;
  titleUrdu: string;
  titleEn: string;
  actionUrdu: string;
  actionEn: string;
  badge: string;
  keywordTag: string;
}

const TIPS: Tip[] = [
  {
    id: 'hook',
    category: 'Retention',
    badge: 'First 3 Seconds',
    titleUrdu: 'Pehle 3 Seconds Ka Strong Hook',
    titleEn: '3-Second Hook Retention',
    actionUrdu:
      'TikTok algorithm video retention check karta hai. Pehle 3 second me sawal ya curiosity create karein taake video reach aur video views organic tor par double ho sakein.',
    actionEn:
      'The TikTok algorithm prioritizes initial watch time. Deliver your hook in the first 3 seconds to spike retention and unlock organic video promotion.',
    keywordTag: 'increase video views • video reach'
  },
  {
    id: 'engagement',
    category: 'Engagement',
    badge: 'Algorithm Signals',
    titleUrdu: 'Shares aur Saves Ka Call-to-Action',
    titleEn: 'Saves & Shares Engagement Loop',
    actionUrdu:
      'Video ke aakhir me viewer ko "Save for later" ya "Dost ko bhejo" ka ishara dein. Saves aur shares se TikTok FYP engine video engagement service ko 3x boost deta hai.',
    actionEn:
      'Prompt viewers to save or share. High save-to-view ratios signal valuable content, reinforcing your video engagement service results on the FYP.',
    keywordTag: 'video engagement service • TikTok growth'
  },
  {
    id: 'timing',
    category: 'Pacing',
    badge: 'Peak Hours PKT',
    titleUrdu: 'Campaign Duration & Pacing',
    titleEn: 'Multi-Day Promotion Pacing',
    actionUrdu:
      'Apne order ko 2 se 7 days par divide karein. Rozana mutanasib views aane se TikTok algorithm video marketing ko natural viral trend samajhta hai.',
    actionEn:
      'Spreading campaign days (2–7 days) simulates organic momentum, maximizing video likes promotion and TikTok followers conversion.',
    keywordTag: 'organic video promotion • video marketing'
  },
  {
    id: 'seo-caption',
    category: 'Discovery',
    badge: 'Search Engine Index',
    titleUrdu: 'Caption & On-Screen SEO Keywords',
    titleEn: 'On-Screen & Caption Keyword SEO',
    actionUrdu:
      'TikTok search bar search queries scan karta hai. Caption me relevant keywords aur on-screen text likhein taake social media growth aur creator promotion barh sake.',
    actionEn:
      'TikTok operates as a video search engine. Use clear keyword captions to index your content for sustained social media growth.',
    keywordTag: 'social media growth • creator promotion'
  }
];

export const GrowthTips: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTipIndex, setActiveTipIndex] = useState(0);

  const activeTip = TIPS[activeTipIndex];

  return (
    <div className="w-full bg-white dark:bg-neutral-900 border border-amber-200/70 dark:border-amber-900/40 rounded-2xl p-3.5 sm:p-4 shadow-2xs transition-all duration-200">
      {/* Top Banner Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Lightbulb className="w-4 h-4 fill-amber-500/20" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-gray-900 dark:text-neutral-100 tracking-tight">
                Organic Growth Tips
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                TikTok Growth Guide
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-neutral-400 truncate">
              Video engagement service &amp; reach barhane ke ahem tareeqay
            </p>
          </div>
        </div>

        {/* Expand / Minimize Toggle */}
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-neutral-800/80 hover:bg-amber-100/70 border border-amber-200/60 dark:border-neutral-700 cursor-pointer transition-colors shrink-0"
        >
          <span>{isExpanded ? 'Hide' : 'Quick Tips'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Expanded Interactive Tips Area */}
      {isExpanded && (
        <div className="mt-3.5 pt-3.5 border-t border-amber-100 dark:border-neutral-800 space-y-3 animate-fadeIn">
          {/* Tip Navigation Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {TIPS.map((tip, idx) => (
              <button
                key={tip.id}
                type="button"
                onClick={() => setActiveTipIndex(idx)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                  activeTipIndex === idx
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
                }`}
              >
                <span>{tip.badge}</span>
              </button>
            ))}
          </div>

          {/* Active Tip Card */}
          <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-neutral-850 border border-amber-200/50 dark:border-neutral-700/80 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-gray-900 dark:text-neutral-100">
                <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{activeTip.titleUrdu}</span>
                <span className="text-gray-400 dark:text-neutral-500 font-normal">({activeTip.titleEn})</span>
              </div>
              <span className="text-[10px] font-semibold text-gray-400 dark:text-neutral-500">
                {activeTipIndex + 1}/{TIPS.length}
              </span>
            </div>

            <p className="text-xs text-gray-700 dark:text-neutral-200 leading-relaxed">
              {activeTip.actionUrdu}
            </p>

            <div className="text-[11px] text-gray-500 dark:text-neutral-400 leading-relaxed italic border-t border-amber-200/40 dark:border-neutral-750 pt-1.5">
              {activeTip.actionEn}
            </div>

            {/* Keyword Anchor Tag */}
            <div className="flex items-center gap-1 pt-1 text-[10px] text-amber-700 dark:text-amber-400 font-bold">
              <Zap className="w-3 h-3 fill-current" />
              <span>SEO Focus: {activeTip.keywordTag}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
