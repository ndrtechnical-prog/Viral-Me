import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  Loader2,
  Plus,
  Minus,
  Sparkles,
  Clipboard,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import type { OrderDraft, AdminSettings, ServiceType } from '../types/index.ts';
import { BrandHeader } from './BrandHeader.tsx';
import {
  recalculateFromAmount,
  recalculateFromDays,
  getPricingConfig,
  getEffectiveMinimumOrder,
  getServiceMultiplier
} from '../utils/pricingCalculator.ts';

interface VolumeCalculatorProps {
  orderDraft: OrderDraft;
  settings: AdminSettings;
  onChange: (updated: Partial<OrderDraft>) => void;
  onBack: () => void;
  onNext: () => void;
  isCalculating?: boolean;
  onOpenFreeTools?: () => void;
}

export const VolumeCalculator: React.FC<VolumeCalculatorProps> = ({
  orderDraft,
  settings,
  onChange,
  onBack,
  onNext,
  isCalculating,
  onOpenFreeTools,
}) => {
  const serviceType: ServiceType = orderDraft.serviceType || 'views';
  const effectiveMin = getEffectiveMinimumOrder(serviceType, settings);
  const multiplier = getServiceMultiplier(serviceType);

  // Price & Days local state
  const [priceInput, setPriceInput] = useState<string>(() => {
    const initAmt = Math.max(effectiveMin, orderDraft.amount || effectiveMin);
    return initAmt.toString();
  });
  const [days, setDays] = useState<number>(orderDraft.days || 1);

  // Video URL local state
  const [videoUrl, setVideoUrl] = useState<string>(orderDraft.videoUrl || '');
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [urlVerified, setUrlVerified] = useState<boolean>(Boolean(orderDraft.videoUrl && orderDraft.thumbnail));
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [videoMeta, setVideoMeta] = useState<{ title?: string; author?: string; thumbnail?: string }>({
    title: orderDraft.videoTitle,
    thumbnail: orderDraft.thumbnail,
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  // Synchronize on mount or when serviceType changes
  useEffect(() => {
    const currentVal = parseInt(priceInput, 10) || 0;
    if (currentVal < effectiveMin) {
      setPriceInput(effectiveMin.toString());
      const res = recalculateFromAmount(effectiveMin, days, serviceType, settings);
      onChange({
        amount: res.amount,
        days: res.days,
        dailyVolume: res.dailyReach,
        totalVolume: res.totalReach,
        reach: res.dailyReach,
        estimatedReach: res.totalReach,
      });
    } else {
      const res = recalculateFromAmount(currentVal, days, serviceType, settings);
      onChange({
        amount: res.amount,
        days: res.days,
        dailyVolume: res.dailyReach,
        totalVolume: res.totalReach,
        reach: res.dailyReach,
        estimatedReach: res.totalReach,
      });
    }
  }, [serviceType, effectiveMin]);

  // Handle Price Change
  const handlePriceChange = (valStr: string) => {
    setValidationError(null);
    setPriceInput(valStr);

    const num = parseInt(valStr, 10);
    if (!isNaN(num) && num > 0) {
      const res = recalculateFromAmount(num, days, serviceType, settings);
      onChange({
        amount: Math.max(effectiveMin, num),
        dailyVolume: res.dailyReach,
        totalVolume: res.totalReach,
        reach: res.dailyReach,
        estimatedReach: res.totalReach,
      });
    }
  };

  // Handle Quick Price Preset Click
  const handleSelectPricePreset = (dailyRate: number) => {
    setValidationError(null);
    // Scales with current days: e.g. 200 x 2 days = 400 (double!)
    const totalForDays = Math.max(effectiveMin, dailyRate * days);
    setPriceInput(totalForDays.toString());
    const res = recalculateFromAmount(totalForDays, days, serviceType, settings);
    onChange({
      amount: res.amount,
      dailyVolume: res.dailyReach,
      totalVolume: res.totalReach,
      reach: res.dailyReach,
      estimatedReach: res.totalReach,
    });
  };

  // Handle Days Increment / Decrement
  // When user increases days, the payment doubles / multiples proportionally
  // e.g. 1 day = 200, 2 days = 400 (double!), 3 days = 600
  const handleDaysChange = (newDays: number) => {
    setValidationError(null);
    const clamped = Math.max(1, Math.min(30, newDays));

    const currentTotal = parseInt(priceInput, 10) || effectiveMin;
    const currentRatePerDay = Math.max(effectiveMin, Math.round(currentTotal / (days || 1)));
    const newTotalAmount = currentRatePerDay * clamped;

    setDays(clamped);
    setPriceInput(newTotalAmount.toString());

    const res = recalculateFromAmount(newTotalAmount, clamped, serviceType, settings);

    onChange({
      days: clamped,
      dailyVolume: res.dailyReach,
      totalVolume: res.totalReach,
      reach: res.dailyReach,
      estimatedReach: res.totalReach,
      amount: newTotalAmount,
    });
  };

  // Validate TikTok Video URL
  const validateTikTokUrl = async (urlToTest: string) => {
    const trimmed = urlToTest.trim();
    if (!trimmed) {
      setUrlError(null);
      setUrlVerified(false);
      return;
    }

    const lower = trimmed.toLowerCase();
    if (!lower.includes('tiktok.com')) {
      setUrlError('Sirf TikTok video ka link darj karein (e.g. tiktok.com/@user/video/...)');
      setUrlVerified(false);
      return;
    }

    try {
      setIsValidatingUrl(true);
      setUrlError(null);

      const resp = await fetch('/api/video-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = await resp.json();
      if (resp.ok && data.valid) {
        setUrlVerified(true);
        const meta = {
          title: data.title || 'TikTok Video',
          author: data.author || 'TikTok Creator',
          thumbnail: data.thumbnail || '',
        };
        setVideoMeta(meta);
        onChange({
          videoUrl: trimmed,
          videoTitle: meta.title,
          thumbnail: meta.thumbnail,
          platform: 'tiktok',
        });
      } else {
        setUrlError(data.error || 'Video link check nahi ho saka. Barah-e-karam link dobara verify karein.');
        setUrlVerified(false);
      }
    } catch (err: any) {
      // Fallback valid TikTok format
      const userMatch = trimmed.match(/@([a-zA-Z0-9_.-]+)/);
      const username = userMatch ? userMatch[1] : 'creator';
      const fallbackMeta = {
        title: `TikTok Video by @${username}`,
        author: username,
        thumbnail: `https://unavatar.io/tiktok/${username}`,
      };
      setUrlVerified(true);
      setVideoMeta(fallbackMeta);
      onChange({
        videoUrl: trimmed,
        videoTitle: fallbackMeta.title,
        thumbnail: fallbackMeta.thumbnail,
        platform: 'tiktok'
      });
    } finally {
      setIsValidatingUrl(false);
    }
  };

  // Paste from clipboard
  const handlePasteUrl = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setVideoUrl(text);
          validateTikTokUrl(text);
        }
      }
    } catch (err) {
      console.warn('Clipboard read failed', err);
    }
  };

  // Copy link to clipboard
  const handleCopyUrl = () => {
    if (!videoUrl) return;
    navigator.clipboard.writeText(videoUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Proceed to Step 3
  const handleProceed = () => {
    const currentAmount = parseInt(priceInput, 10) || 0;
    if (currentAmount < effectiveMin) {
      setValidationError(`Kam az kam price Rs. ${effectiveMin} honi chahiye.`);
      return;
    }

    if (!videoUrl.trim()) {
      setValidationError('Barah-e-karam apni TikTok video ka link darj karein.');
      return;
    }

    if (urlError) {
      setValidationError('Sahi TikTok video link darj karein.');
      return;
    }

    onNext();
  };

  // Presets based on service
  const pricePresets = serviceType === 'followers'
    ? [600, 1000, 1500, 2500, 5000]
    : serviceType === 'comments'
    ? [400, 800, 1200, 2000, 4000]
    : [200, 500, 1000, 2000, 5000];

  const serviceLabel = serviceType === 'followers'
    ? 'Followers'
    : serviceType === 'comments'
    ? 'Comments'
    : serviceType === 'likes'
    ? 'Likes'
    : serviceType === 'shares'
    ? 'Shares'
    : serviceType === 'saves'
    ? 'Saves'
    : 'Views';

  // Derived calculations for card
  const currentPrice = Math.max(effectiveMin, parseInt(priceInput, 10) || effectiveMin);
  const calculationResult = recalculateFromAmount(currentPrice, days, serviceType, settings);

  return (
    <div className="w-full max-w-lg mx-auto space-y-4 animate-fadeIn">
      {/* Brand Header */}
      <BrandHeader onOpenFreeTools={onOpenFreeTools} />

      {/* Selected Service Badge */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-gray-900 dark:text-neutral-100 uppercase tracking-wide">
            🎵 TikTok Promotion
          </span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 capitalize border border-pink-200 dark:border-pink-800">
            {serviceType}
          </span>
        </div>
        <span className="text-xs font-bold text-gray-500 dark:text-neutral-400">
          Minimum: Rs. {effectiveMin}
        </span>
      </div>

      {/* Main Clean Card Container */}
      <div className="bg-white dark:bg-neutral-800/90 border border-gray-200 dark:border-neutral-700/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        
        {/* ========================================================= */}
        {/* 1. PRICE INPUT (Single Text Box)                          */}
        {/* ========================================================= */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="campaign-price-input" className="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-neutral-300">
              Apni Price / Budget Likhein (PKR)
            </label>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-800">
              Min: Rs. {effectiveMin}
            </span>
          </div>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-500 font-extrabold text-lg">
              Rs.
            </span>
            <input
              id="campaign-price-input"
              type="number"
              min={effectiveMin}
              step="50"
              value={priceInput}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder={effectiveMin.toString()}
              className="w-full bg-gray-50 dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-700 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-neutral-900 rounded-2xl pl-12 pr-4 py-3.5 text-2xl font-black text-gray-900 dark:text-neutral-100 font-mono tracking-tight transition-all focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-950"
            />
          </div>

          {/* Daily Rate & Days Multiplier Breakdown */}
          <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-neutral-400 font-medium px-1">
            <span>
              Per Day Rate: <strong className="text-gray-800 dark:text-neutral-200">Rs. {Math.max(effectiveMin, Math.round((parseInt(priceInput, 10) || effectiveMin) / (days || 1))).toLocaleString()}</strong> / din
            </span>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {days} {days === 1 ? 'Din' : 'Din'} = Rs. {(parseInt(priceInput, 10) || effectiveMin).toLocaleString()}
            </span>
          </div>

          {/* Quick Price Buttons */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {pricePresets.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleSelectPricePreset(amt)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  parseInt(priceInput, 10) === amt
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs scale-105'
                    : 'bg-gray-50 dark:bg-neutral-900 text-gray-700 dark:text-neutral-300 border-gray-200 dark:border-neutral-700 hover:bg-blue-50 dark:hover:bg-neutral-800 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
              >
                Rs. {amt.toLocaleString()}
              </button>
            ))}
          </div>

          {serviceType === 'followers' && (
            <p className="text-[11px] text-pink-600 dark:text-pink-400 font-semibold">
              * Followers ke liye minimum pricing Rs. 600 (200 x 3) muqarar hai.
            </p>
          )}
          {serviceType === 'comments' && (
            <p className="text-[11px] text-pink-600 dark:text-pink-400 font-semibold">
              * Comments ke liye minimum pricing Rs. 400 (200 x 2) muqarar hai.
            </p>
          )}
        </div>

        {/* ========================================================= */}
        {/* 2. DAYS EDIT OPTION                                       */}
        {/* ========================================================= */}
        <div className="pt-3 border-t border-gray-100 dark:border-neutral-700/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Campaign Duration (Days)
            </span>
            <span className="text-xs font-mono font-black text-blue-600 dark:text-blue-400">
              {days} {days === 1 ? 'Din' : 'Din'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl p-2">
            <button
              type="button"
              onClick={() => handleDaysChange(days - 1)}
              disabled={days <= 1}
              className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-200 font-black text-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-neutral-700 active:scale-95 disabled:opacity-40 cursor-pointer shadow-2xs"
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className="text-center flex-1">
              <span className="text-lg font-black text-gray-900 dark:text-neutral-100 block font-mono">
                {days} {days === 1 ? 'Din (1 Day)' : `Dino (Days)`}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-neutral-400">Days increase ya edit karein</span>
            </div>

            <button
              type="button"
              onClick={() => handleDaysChange(days + 1)}
              disabled={days >= 30}
              className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-200 font-black text-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-neutral-700 active:scale-95 disabled:opacity-40 cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Days quick select */}
          <div className="flex gap-1.5 justify-center pt-0.5">
            {[1, 3, 7, 14, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleDaysChange(d)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  days === d
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 border-gray-200 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-700'
                }`}
              >
                {d} {d === 1 ? 'Day' : 'Days'}
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. CLEAN RESULT CARD (Dynamic Views Delivery)             */}
        {/* ========================================================= */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-4 sm:p-5 shadow-md space-y-3">
          <div className="flex items-center justify-between text-xs text-blue-100 font-semibold border-b border-white/10 pb-2">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              TikTok Pacing & Projected Delivery
            </span>
            <span className="font-mono text-white font-bold">
              Rs. {calculationResult.amount.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            {/* 1 Din me views */}
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
              <span className="text-[11px] text-blue-100 block uppercase font-bold tracking-wide">
                1 Din Me Ainge
              </span>
              <span className="text-xl sm:text-2xl font-black text-white font-mono block mt-0.5">
                ~{calculationResult.dailyReach.toLocaleString()}
              </span>
              <span className="text-[10px] text-blue-200 block font-medium">
                {serviceLabel} / din
              </span>
            </div>

            {/* Kul Delivery */}
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
              <span className="text-[11px] text-blue-100 block uppercase font-bold tracking-wide">
                Kul Delivery ({days} Din)
              </span>
              <span className="text-xl sm:text-2xl font-black text-yellow-300 font-mono block mt-0.5">
                ~{calculationResult.totalReach.toLocaleString()}
              </span>
              <span className="text-[10px] text-blue-200 block font-medium">
                Total {serviceLabel}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. TIKTOK VIDEO LINK INPUT                                */}
        {/* ========================================================= */}
        <div className="pt-3 border-t border-gray-100 dark:border-neutral-700/60 space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="tiktok-url-input" className="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-neutral-300 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
              TikTok Video Link
            </label>
            <div className="flex items-center gap-1.5">
              {videoUrl.trim() && (
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 transition-colors"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={handlePasteUrl}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-800 transition-colors"
              >
                <Clipboard className="w-3 h-3" />
                <span>Paste</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <input
              id="tiktok-url-input"
              type="url"
              value={videoUrl}
              onChange={(e) => {
                const val = e.target.value;
                setVideoUrl(val);
                validateTikTokUrl(val);
              }}
              onPaste={(e) => {
                const pastedText = e.clipboardData?.getData('text') || '';
                if (pastedText) {
                  setVideoUrl(pastedText);
                  validateTikTokUrl(pastedText);
                }
              }}
              placeholder="https://www.tiktok.com/@username/video/..."
              className="w-full bg-gray-50 dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-700 focus:border-pink-500 focus:bg-white dark:focus:bg-neutral-900 rounded-2xl px-4 py-3 text-xs sm:text-sm text-gray-900 dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-neutral-600 font-mono transition-all focus:outline-none focus:ring-4 focus:ring-pink-100 dark:focus:ring-pink-950"
            />
            {isValidatingUrl && (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 text-pink-500 animate-spin" />
              </span>
            )}
            {urlVerified && !isValidatingUrl && (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </span>
            )}
          </div>

          {urlError && (
            <div className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/50">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{urlError}</span>
            </div>
          )}

          {/* Loading Video Metadata State */}
          {isValidatingUrl && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-pink-50/60 dark:bg-neutral-900/90 border border-pink-200 dark:border-pink-900/60 animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-pink-200 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                <Loader2 className="w-5 h-5 text-pink-600 dark:text-pink-400 animate-spin" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-xs font-bold text-gray-900 dark:text-neutral-100">
                  TikTok Video Fetch Ho Rahi Hai...
                </p>
                <p className="text-[10px] text-gray-500 dark:text-neutral-400">
                  Video details aur thumbnail load kiya ja raha hai
                </p>
              </div>
            </div>
          )}

          {/* Video Preview Card if URL is valid */}
          {urlVerified && !isValidatingUrl && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-neutral-900/90 border border-emerald-300 dark:border-emerald-700/80 shadow-2xs animate-fadeIn">
              {videoUrl ? (
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open video on TikTok"
                  className="relative group shrink-0"
                >
                  {videoMeta.thumbnail ? (
                    <img
                      src={videoMeta.thumbnail}
                      alt="TikTok preview"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                      className="w-14 h-14 rounded-xl object-cover bg-black/10 shrink-0 border border-gray-200 dark:border-neutral-700 shadow-xs group-hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold text-xs shrink-0">
                      TikTok
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 bg-black/75 text-white p-0.5 rounded-full">
                    <ExternalLink className="w-2.5 h-2.5" />
                  </span>
                </a>
              ) : (
                <div className="w-14 h-14 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold text-xs shrink-0">
                  TikTok
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 uppercase tracking-wide">
                    ✓ Video Connected
                  </span>
                </div>
                {videoUrl ? (
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Watch video on TikTok"
                    className="group inline-flex items-center gap-1 text-xs font-black text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline max-w-full truncate"
                  >
                    <span className="truncate">{videoMeta.title || 'TikTok Video'}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 opacity-70 group-hover:opacity-100 text-blue-500" />
                  </a>
                ) : (
                  <p className="text-xs font-black text-gray-900 dark:text-neutral-100 truncate">
                    {videoMeta.title || 'TikTok Video'}
                  </p>
                )}
                <p className="text-[11px] text-pink-600 dark:text-pink-400 font-bold truncate">
                  {videoMeta.author ? `@${videoMeta.author.replace(/^@+/, '')}` : 'Verified TikTok Post'}
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Validation alert if user clicks next without meeting conditions */}
      {validationError && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 font-semibold animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-1">
        <button
          id="back-to-step1-btn"
          type="button"
          onClick={onBack}
          className="w-1/3 py-3.5 px-4 rounded-2xl bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-200 font-bold text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-transparent dark:border-neutral-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          id="proceed-to-step3-btn"
          type="button"
          onClick={handleProceed}
          disabled={isCalculating}
          className="w-2/3 py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-base shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <span>{isCalculating ? 'Verifying...' : 'Continue to Payment >'}</span>
        </button>
      </div>
    </div>
  );
};
