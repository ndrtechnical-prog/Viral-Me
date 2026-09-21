import React, { useState } from 'react';
import {
  Eye,
  Heart,
  MessageSquare,
  Users,
  Share2,
  Bookmark,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  BadgeCheck
} from 'lucide-react';
import type { PlatformType, ServiceType, OrderDraft, AdminSettings } from '../types/index.ts';
import { BrandHeader } from './BrandHeader.tsx';
import { getEffectiveMinimumOrder, recalculateFromAmount } from '../utils/pricingCalculator.ts';

interface ServiceSelectorProps {
  orderDraft: OrderDraft;
  settings: AdminSettings;
  onChange: (updated: Partial<OrderDraft>) => void;
  onNext: () => void;
  isSaving?: boolean;
}

interface ServiceCardItem {
  id: ServiceType;
  label: string;
  emoji: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SERVICE_ITEMS: ServiceCardItem[] = [
  { id: 'views', label: 'Views', emoji: '👁', badge: 'Min. Rs 200', icon: Eye },
  { id: 'likes', label: 'Likes', emoji: '❤️', badge: 'Min. Rs 200', icon: Heart },
  { id: 'followers', label: 'Followers', emoji: '👥', badge: 'Min. Rs 600 (200x3)', icon: Users },
  { id: 'comments', label: 'Comments', emoji: '💬', badge: 'Min. Rs 400 (200x2)', icon: MessageSquare },
  { id: 'shares', label: 'Shares', emoji: '🔄', badge: 'Min. Rs 200', icon: Share2 },
  { id: 'saves', label: 'Saves', emoji: '🔖', badge: 'Min. Rs 200', icon: Bookmark },
];

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  orderDraft,
  settings,
  onChange,
  onNext,
  isSaving,
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleSelectService = (serviceId: ServiceType) => {
    setError(null);
    const minAmt = getEffectiveMinimumOrder(serviceId, settings);
    const targetAmt = Math.max(minAmt, orderDraft.amount || minAmt);
    const days = orderDraft.days || 1;
    const calc = recalculateFromAmount(targetAmt, days, serviceId, settings);

    onChange({
      serviceType: serviceId,
      platform: 'tiktok',
      amount: calc.amount,
      dailyVolume: calc.dailyReach,
      totalVolume: calc.totalReach,
      reach: calc.dailyReach,
      estimatedReach: calc.totalReach,
    });
  };

  const validateAndProceed = () => {
    if (!orderDraft.serviceType) {
      setError('Please select a service type to continue.');
      return;
    }
    onNext();
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 animate-fadeIn">
      {/* Brand Header */}
      <BrandHeader />

      {/* Dedicated TikTok Promotion Badge */}
      <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 border border-gray-800 rounded-2xl p-3 sm:p-4 text-white flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl shadow-inner border border-white/10">
            🎵
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black tracking-wide text-white">TikTok Parmote</span>
              <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500 text-white inline-block shrink-0" />
            </div>
            <p className="text-xs text-gray-300 font-semibold">Only Real Engagment</p>
          </div>
        </div>
        <div className="hidden sm:block text-right">
          <span className="text-xs text-emerald-400 font-semibold block">Min. Order Rs. 200</span>
          <span className="text-[10px] text-gray-400">Easypaisa Verified</span>
        </div>
      </div>

      {/* Services Grid (Matches clean look from image: 2 columns with rounded cards) */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {SERVICE_ITEMS.map((service) => {
            const isSelected = orderDraft.serviceType === service.id;
            const Icon = service.icon;

            return (
              <button
                key={service.id}
                id={`service-card-${service.id}`}
                type="button"
                onClick={() => handleSelectService(service.id)}
                className={`py-3.5 sm:py-4 px-3 sm:px-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border-2 shadow-xs ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 ring-2 ring-blue-600/20'
                    : 'bg-white dark:bg-neutral-800/90 border-blue-200/80 dark:border-neutral-700/80 text-blue-600 dark:text-neutral-200 hover:border-blue-400 dark:hover:border-blue-500/70 hover:bg-blue-50/30 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-base sm:text-lg font-extrabold tracking-wide">{service.label}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isSelected
                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-neutral-700 text-gray-500 dark:text-neutral-300'
                }`}>
                  {service.badge}
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <p className="text-xs text-rose-500 font-semibold text-center">{error}</p>
        )}
      </div>

      {/* Next > Action Button */}
      <div className="pt-2">
        <button
          id="proceed-to-step2-btn"
          type="button"
          onClick={validateAndProceed}
          disabled={isSaving}
          className="w-full py-4 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-lg sm:text-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <span>{isSaving ? 'Saving...' : 'Next >'}</span>
        </button>
      </div>

      {/* Subtle reassurance */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-neutral-500 text-center">
        <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
        <span>Instant order draft generated • Ref: {orderDraft.orderId}</span>
      </div>
    </div>
  );
};
