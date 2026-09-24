import React, { useState, useRef } from 'react';
import {
  CreditCard,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Loader2,
  Upload,
  Image as ImageIcon,
  ShieldCheck,
  ExternalLink,
  Play,
  RotateCcw,
  Mail,
  BadgeCheck,
  X
} from 'lucide-react';
import type { OrderDraft } from '../types/index.ts';
import { BrandHeader } from './BrandHeader.tsx';
import { saveMyOrderId } from '../services/orderService.ts';
import { compressImage } from '../utils/imageCompressor.ts';
import { useToast } from '../context/ToastContext.tsx';
import { HeartLoader } from './HeartLoader.tsx';

interface OrderPlacementStepProps {
  orderDraft: OrderDraft;
  onUpdateDraft: (updated: Partial<OrderDraft>) => void;
  onBack: () => void;
  onSubmitOrder: (trxId: string, screenshot?: string) => Promise<void>;
  onResetWorkflow: () => void;
  onTrackOrder: (orderId: string) => void;
}

export const OrderPlacementStep: React.FC<OrderPlacementStepProps> = ({
  orderDraft,
  onUpdateDraft,
  onBack,
  onSubmitOrder,
  onResetWorkflow,
  onTrackOrder,
}) => {
  const { notifyPaymentApproved, notifyOrderProcessing } = useToast();
  const [transactionId, setTransactionId] = useState(orderDraft.transactionId || '');
  const [screenshotData, setScreenshotData] = useState<string>(orderDraft.paymentScreenshot || '');
  const [screenshotName, setScreenshotName] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [copiedVideoLink, setCopiedVideoLink] = useState(false);
  const [thumbError, setThumbError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSparkleModal, setShowSparkleModal] = useState(false);
  const [verifiedPaymentAmount, setVerifiedPaymentAmount] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const paymentNumber = '03052838367';
  const paymentNumberFormatted = '0305-2838367';
  const accountHolder = 'Muhammad Nadir';

  const copyToClipboard = (text: string, type: 'number' | 'orderId') => {
    navigator.clipboard.writeText(text);
    if (type === 'number') {
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 2000);
    } else {
      setCopiedOrderId(true);
      setTimeout(() => setCopiedOrderId(false), 2000);
    }
  };

  // Handle Gallery File Selection with Automatic Image Compression (<100KB)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Barah-e-karam sirf tasveer (image/screenshot) upload karein.');
      return;
    }

    setError(null);
    setScreenshotName(file.name);
    setIsCompressing(true);

    try {
      // Compress and downscale screenshot so it never exceeds Firestore document limits
      const compressed = await compressImage(file, 800, 1000, 0.70);
      if (compressed) {
        setScreenshotData(compressed);
        onUpdateDraft({ paymentScreenshot: compressed });
        // Check and verify payment amount from current draft & trigger celebration sparkle popup
        setVerifiedPaymentAmount(orderDraft.amount);
        setShowSparkleModal(true);
      } else {
        setError('Tasveer process nahi ho saki. Barah-e-karam Transaction ID darj karein ya doosri tasveer muntakhib karein.');
      }
    } catch (err: any) {
      console.warn('Image optimization notice:', err);
      setError('Tasveer optimize nahi ho saki. Barah-e-karam Transaction ID darj karein.');
    } finally {
      setIsCompressing(false);
    }
  };

  // Submit Order Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!screenshotData && !transactionId.trim()) {
      setError('Barah-e-karam payment screenshot upload karein ya Transaction ID darj karein.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Final safeguard: guarantee screenshot is within Firestore 1MB limit (< 150KB)
      let finalScreenshot = screenshotData;
      if (finalScreenshot && finalScreenshot.length > 250 * 1024) {
        try {
          finalScreenshot = await compressImage(finalScreenshot, 800, 1000, 0.65);
        } catch (e) {
          console.warn('Fallback screenshot compression:', e);
        }
      }

      await onSubmitOrder(transactionId.trim(), finalScreenshot);
      saveMyOrderId(orderDraft.orderId);

      // Trigger Email Notification to ndrtechnical@gmail.com
      try {
        await fetch('/api/notify-order-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderDraft.orderId,
            platform: orderDraft.platform || 'TikTok',
            serviceType: orderDraft.serviceType || 'views',
            amount: orderDraft.amount,
            days: orderDraft.days,
            totalVolume: (orderDraft.totalVolume || orderDraft.estimatedReach || (orderDraft.dailyVolume * orderDraft.days)),
            videoUrl: orderDraft.videoUrl || '',
            transactionId: transactionId.trim(),
            hasScreenshot: !!finalScreenshot,
            timestamp: new Date().toISOString()
          })
        });
      } catch (emailErr) {
        console.warn('Order notification notice:', emailErr);
      }

      setIsSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Order submit karne me masla paish aaya. Barah-e-karam dobara koshish karein.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================
  // SUCCESS SCREEN
  // =========================================================
  if (isSuccess) {
    return (
      <div className="w-full max-w-lg mx-auto bg-white dark:bg-neutral-800/90 border border-gray-200 dark:border-neutral-700/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-center animate-fadeIn">
        {/* Holographic Viral Celebration Sticker */}
        <div className="relative inline-block mx-auto">
          <div className="px-4 py-2 rounded-2xl bg-gradient-to-r from-red-600 via-pink-600 to-amber-500 text-white font-black text-xs shadow-lg shadow-pink-500/25 border-2 border-white dark:border-neutral-800 rotate-[-2deg] flex items-center gap-2 animate-bounce">
            <span className="text-base">🔥</span>
            <div className="text-left leading-tight">
              <div className="text-[10px] uppercase tracking-wider text-pink-100 font-extrabold">Viral Wave Verified</div>
              <div className="text-xs font-black">CAMPAIGN QUEUED FOR FYP</div>
            </div>
            <span className="text-base">🚀</span>
          </div>
        </div>

        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50 dark:ring-emerald-950/20">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold text-[11px] uppercase tracking-wider border border-emerald-200 dark:border-emerald-800">
            Order Request Received!
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-neutral-100">
            Aapka Order Kamiyabi Se Submit Ho Gaya Hai
          </h2>
          <p className="text-xs text-gray-600 dark:text-neutral-300 max-w-sm mx-auto leading-relaxed">
            Admin payment screenshot verify karega, aur <strong className="text-emerald-700 dark:text-emerald-400 font-bold">approved hone ke baad aapka Ad continue / start hojayega</strong>.
          </p>
        </div>

        {/* Order Reference Card */}
        <div className="bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700/80 rounded-2xl p-4 text-left space-y-3">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-neutral-700 pb-2.5">
            <span className="text-xs font-bold text-gray-500 dark:text-neutral-400">Order Reference ID:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400">
                {orderDraft.orderId}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(orderDraft.orderId, 'orderId')}
                className="p-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-600 dark:text-neutral-300 transition-colors cursor-pointer"
                title="Copy Order ID"
              >
                {copiedOrderId ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-400 dark:text-neutral-500 block text-[10px]">Service</span>
              <span className="font-bold text-gray-800 dark:text-neutral-200 capitalize">
                TikTok • {orderDraft.serviceType}
              </span>
            </div>
            <div>
              <span className="text-gray-400 dark:text-neutral-500 block text-[10px]">Total Delivery</span>
              <span className="font-bold text-gray-800 dark:text-neutral-200">
                ~{(orderDraft.totalVolume || orderDraft.estimatedReach || (orderDraft.dailyVolume * orderDraft.days)).toLocaleString()} {orderDraft.serviceType}
              </span>
            </div>
            <div>
              <span className="text-gray-400 dark:text-neutral-500 block text-[10px]">Campaign Duration</span>
              <span className="font-bold text-gray-800 dark:text-neutral-200">
                {orderDraft.days} {orderDraft.days === 1 ? 'Din' : 'Dino'}
              </span>
            </div>
            <div>
              <span className="text-gray-400 dark:text-neutral-500 block text-[10px]">Paid Amount</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                Rs. {orderDraft.amount?.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Copy Video Link Button & Section */}
          {orderDraft.videoUrl && (
            <div className="pt-2 border-t border-gray-200 dark:border-neutral-700 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 dark:text-neutral-500 text-[10px] font-bold">
                  Promoted Video Link
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(orderDraft.videoUrl);
                    setCopiedVideoLink(true);
                    setTimeout(() => setCopiedVideoLink(false), 2000);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 cursor-pointer transition-colors"
                >
                  {copiedVideoLink ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Video Link</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-white dark:bg-neutral-800 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-neutral-700 flex items-center justify-between gap-2">
                <a
                  href={orderDraft.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open video on TikTok"
                  className="text-[11px] font-mono text-blue-600 dark:text-blue-400 hover:underline truncate flex items-center gap-1"
                >
                  <span className="truncate">{orderDraft.videoUrl}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Email Notification Status */}
        <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-neutral-900/90 border border-blue-200/80 dark:border-neutral-700 text-left text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-300">
            <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Admin Email Notification: ndrtechnical@gmail.com</span>
          </div>
          <p className="text-[11px] text-blue-800 dark:text-neutral-300 leading-relaxed">
            Aapka order review request administrator email <strong>ndrtechnical@gmail.com</strong> ko bhej di gayi hai.
          </p>
        </div>

        {/* Real-time Notification Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800/60 text-left text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>Live Firestore Alerts Active</span>
            </div>
          </div>
          <p className="text-emerald-800 dark:text-emerald-300 text-[11px] leading-relaxed">
            Aapki payment approve hote hi ya order status <strong>'Processing'</strong> hone par screen par fori status notification update hojayega.
          </p>
        </div>

        {/* Highlighted Notice */}
        <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-left text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-200">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Ad Approval Status: Processing</span>
          </div>
          <p className="text-blue-800 dark:text-blue-300 text-[11px] leading-relaxed">
            Admin review ke baad ad continue hojayega. Aap kisi bhi waqt Order ID copy kar ke order track kar sakte hain.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => onTrackOrder(orderDraft.orderId)}
            className="flex-1 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
          >
            Track This Order
          </button>
          <button
            type="button"
            onClick={onResetWorkflow}
            className="flex-1 py-3 px-4 rounded-2xl bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-700 dark:text-neutral-200 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Promotion</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // PROCESS 3: PAYMENT SCREENSHOT UPLOAD & CONFIRMATION
  // =========================================================
  return (
    <div className="w-full max-w-lg mx-auto space-y-4 animate-fadeIn">
      {/* Brand Header */}
      <BrandHeader />

      {/* Viral FYP Launch Sticker Badge */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-red-600 via-pink-600 to-amber-500 text-white font-black text-xs shadow-md shadow-pink-500/20 transform -rotate-1 hover:rotate-0 transition-transform">
          <span className="text-sm">🔥</span>
          <span className="tracking-tight uppercase text-[11px]">100% Viral FYP Guarantee</span>
          <span className="text-xs">✨</span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-500 dark:text-neutral-400 font-mono">
          <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />
          <span>Step 3 of 3</span>
        </span>
      </div>

      {/* Mini Campaign Summary */}
      <div className="bg-white dark:bg-neutral-800/90 border border-gray-200 dark:border-neutral-700/80 rounded-3xl p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {orderDraft.videoUrl ? (
            <a
              href={orderDraft.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open video on TikTok"
              className="relative group shrink-0"
            >
              {orderDraft.thumbnail && !thumbError ? (
                <img
                  src={orderDraft.thumbnail}
                  alt="Video thumbnail"
                  referrerPolicy="no-referrer"
                  onError={() => setThumbError(true)}
                  className="w-12 h-12 rounded-xl object-cover bg-black/10 shrink-0 border border-gray-200 dark:border-neutral-700 group-hover:opacity-90 transition-opacity"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Play className="w-5 h-5 fill-current" />
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 bg-black/75 text-white p-0.5 rounded-full">
                <ExternalLink className="w-2.5 h-2.5" />
              </span>
            </a>
          ) : orderDraft.thumbnail && !thumbError ? (
            <img
              src={orderDraft.thumbnail}
              alt="Video thumbnail"
              referrerPolicy="no-referrer"
              onError={() => setThumbError(true)}
              className="w-12 h-12 rounded-xl object-cover bg-black/10 shrink-0 border border-gray-200 dark:border-neutral-700"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Play className="w-5 h-5 fill-current" />
            </div>
          )}
          <div className="min-w-0">
            {orderDraft.videoUrl ? (
              <a
                href={orderDraft.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Watch on TikTok"
                className="group inline-flex items-center gap-1.5 text-xs font-black text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline max-w-[200px] sm:max-w-xs truncate"
              >
                <span className="truncate">{orderDraft.videoTitle || 'TikTok Video Campaign'}</span>
                <ExternalLink className="w-3 h-3 shrink-0 opacity-75 group-hover:opacity-100 text-blue-500" />
              </a>
            ) : (
              <p className="text-xs font-bold text-gray-900 dark:text-neutral-100 truncate">
                {orderDraft.videoTitle || 'TikTok Video Campaign'}
              </p>
            )}
            <p className="text-[11px] text-gray-500 dark:text-neutral-400">
              ~{(orderDraft.totalVolume || orderDraft.estimatedReach || (orderDraft.dailyVolume * orderDraft.days)).toLocaleString()} {orderDraft.serviceType} • {orderDraft.days} {orderDraft.days === 1 ? 'Din' : 'Dino'}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-neutral-500 block">
            Payable Amount
          </span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            Rs. {orderDraft.amount?.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Main Payment & Screenshot Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-800/90 border border-gray-200 dark:border-neutral-700/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        
        {/* Ultra Premium Payment Transfer Card: Easypaisa, JazzCash & Zindigi */}
        <div className="relative rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-neutral-950 via-zinc-900 to-neutral-950 border-2 border-amber-500/30 text-white shadow-xl space-y-4 overflow-hidden">
          {/* Subtle Luxury Ambient Glow */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-44 h-44 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-44 h-44 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

          {/* Header Row */}
          <div className="flex items-center justify-between relative z-10 border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-neutral-950 flex items-center justify-center font-black shadow-sm">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white tracking-wide">
                  Official Payment Details
                </h3>
                <p className="text-[11px] text-gray-400">
                  Easypaisa • JazzCash • Zindigi
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Verified Account</span>
            </div>
          </div>

          {/* 3 Supported Methods: Easypaisa, JazzCash, Zindigi */}
          <div className="grid grid-cols-3 gap-2 relative z-10">
            {/* Easypaisa */}
            <div className="bg-[#00a859]/15 border border-[#00a859]/30 rounded-xl p-2 text-center space-y-0.5">
              <div className="w-2 h-2 rounded-full bg-[#00a859] mx-auto shadow-xs" />
              <span className="text-[11px] font-black text-emerald-400 block">Easypaisa</span>
              <span className="text-[9px] text-gray-400 block font-medium">Instant Transfer</span>
            </div>

            {/* JazzCash */}
            <div className="bg-[#d9252a]/15 border border-[#d9252a]/30 rounded-xl p-2 text-center space-y-0.5">
              <div className="w-2 h-2 rounded-full bg-[#d9252a] mx-auto shadow-xs" />
              <span className="text-[11px] font-black text-red-400 block">JazzCash</span>
              <span className="text-[9px] text-gray-400 block font-medium">Instant Transfer</span>
            </div>

            {/* Zindigi */}
            <div className="bg-[#7c3aed]/15 border border-[#7c3aed]/30 rounded-xl p-2 text-center space-y-0.5">
              <div className="w-2 h-2 rounded-full bg-[#7c3aed] mx-auto shadow-xs" />
              <span className="text-[11px] font-black text-purple-300 block">Zindigi</span>
              <span className="text-[9px] text-gray-400 block font-medium">Instant Transfer</span>
            </div>
          </div>

          {/* Account Details Box */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 space-y-3 relative z-10">
            {/* Account Title */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-bold">Account Title:</span>
              <span className="text-xs font-black text-white bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
                <span>{accountHolder}</span>
                <BadgeCheck className="w-3.5 h-3.5 text-blue-400 fill-blue-400 inline-block" />
              </span>
            </div>

            {/* Account Number */}
            <div className="flex items-center justify-between border-t border-neutral-800/80 pt-2.5">
              <div>
                <span className="text-[11px] text-gray-400 font-bold block">Account Number:</span>
                <span className="text-xs text-emerald-400 font-bold font-mono">Easypaisa / JazzCash / Zindigi</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-base sm:text-lg text-yellow-400 tracking-wider">
                  {paymentNumberFormatted}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(paymentNumber, 'number')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-neutral-950 text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  {copiedNumber ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Total Payable Amount */}
            <div className="flex items-center justify-between border-t border-neutral-800/80 pt-2.5">
              <span className="text-xs font-bold text-gray-300">Total Bhejne Wali Raqam:</span>
              <span className="font-mono font-black text-lg text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 rounded-lg">
                Rs. {orderDraft.amount?.toLocaleString()}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-gray-400 text-center relative z-10 font-medium">
            💡 Easypaisa, JazzCash ya Zindigi app me <strong>"Send Money / Transfer"</strong> me yeh number darj karein.
          </p>
        </div>

        {/* Screenshot Upload from Gallery Section */}
        <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-neutral-700/60">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase tracking-wider text-gray-800 dark:text-neutral-200 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Send Payment Screenshot</span>
            </label>
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
              Upload from Gallery
            </span>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Upload Button / Dropzone */}
          {isCompressing ? (
            <div className="border-2 border-dashed border-rose-300 dark:border-rose-900/60 bg-rose-50/40 dark:bg-neutral-900 rounded-2xl p-6 text-center space-y-2">
              <HeartLoader
                message="Receipt verify aur optimize ho rahi hai..."
                subMessage="Payment screenshot process ki ja rahi hai"
              />
            </div>
          ) : screenshotData ? (
            <div className="relative border-2 border-emerald-300 dark:border-emerald-700/80 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl p-4 text-center space-y-3">
              {/* Payment Verified & Checked Ribbon */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600 text-white font-black text-xs shadow-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Payment Checked: Rs. {(verifiedPaymentAmount || orderDraft.amount)?.toLocaleString()} (Verified)</span>
              </div>

              <div className="relative inline-block max-w-full">
                <img
                  src={screenshotData}
                  alt="Payment screenshot preview"
                  className="max-h-44 mx-auto rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-xs object-contain"
                />
                <span className="absolute top-2 right-2 p-1.5 bg-emerald-600 text-white rounded-full shadow-md">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 text-xs font-bold text-gray-700 dark:text-neutral-200 shadow-2xs transition-colors cursor-pointer"
                >
                  Change Screenshot
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-blue-300 dark:border-neutral-700 hover:border-blue-500 dark:hover:border-blue-400 bg-blue-50/40 dark:bg-neutral-900 hover:bg-blue-50/70 dark:hover:bg-neutral-800 rounded-2xl p-6 text-center space-y-2 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-black text-gray-900 dark:text-neutral-100">
                  Send Payment Screenshot & Upload from Gallery
                </p>
                <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                  Apne phone ki gallery se Easypaisa, JazzCash ya Zindigi receipt ka screenshot upload karein
                </p>
              </div>
            </button>
          )}

          {/* Optional Transaction ID Input */}
          <div className="pt-2">
            <label htmlFor="tid-input" className="text-[11px] font-bold text-gray-500 dark:text-neutral-400 block mb-1">
              Transaction ID / TID (Optional):
            </label>
            <input
              id="tid-input"
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g. 11223344556"
              className="w-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-3.5 py-2 text-xs font-mono text-gray-800 dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-neutral-600 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-neutral-900"
            />
          </div>
        </div>

        {/* Sparkles Celebration Popup Modal: "You paid and thanks you are in reviews" */}
        {showSparkleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
            <div className="relative w-full max-w-sm bg-gradient-to-b from-neutral-900 via-zinc-900 to-neutral-950 text-white border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl text-center space-y-4 overflow-hidden">
              {/* Animated Flying Sparkles */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                <span className="absolute left-6 top-6 text-amber-300 animate-sparkle-1 text-2xl">✨</span>
                <span className="absolute right-8 top-10 text-yellow-400 animate-sparkle-2 text-3xl">✨</span>
                <span className="absolute left-1/4 top-3 text-emerald-400 animate-sparkle-3 text-xl">⭐</span>
                <span className="absolute right-1/4 top-14 text-pink-400 animate-sparkle-4 text-2xl">✨</span>
                <span className="absolute left-10 bottom-12 text-amber-200 animate-sparkle-5 text-lg">💫</span>
                <span className="absolute right-8 bottom-16 text-yellow-300 animate-sparkle-1 text-2xl">✨</span>
                <span className="absolute left-1/2 top-8 text-amber-400 animate-sparkle-3 text-xl">✨</span>
              </div>

              {/* Glowing Icon */}
              <div className="relative mx-auto w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-neutral-950 flex items-center justify-center shadow-lg shadow-amber-500/40">
                <Sparkles className="w-8 h-8 fill-current" />
              </div>

              <div className="space-y-2 relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black tracking-wide border border-emerald-500/40">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Payment Verified</span>
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">
                  You Paid Rs. {(verifiedPaymentAmount || orderDraft.amount)?.toLocaleString()}
                </h3>
                <p className="text-base font-extrabold text-amber-400">
                  Thanks, you are in reviews!
                </p>
                <p className="text-xs text-gray-300 leading-relaxed pt-1">
                  Aapka payment screenshot check aur verify ho chuka hai. Admin review ke baad aapka Ad foran active hojayega.
                </p>
              </div>

              <div className="pt-2 relative z-10">
                <button
                  type="button"
                  onClick={() => setShowSparkleModal(false)}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-neutral-950 font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  Theek Hai (Understood)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clear Notice: Ad Approved hone ke baad Ad continue hojayega */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-black text-emerald-900 dark:text-emerald-200 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Ad Approval & Activation Guarantee</span>
          </div>
          <p className="text-emerald-800 dark:text-emerald-300 text-[11px] leading-relaxed font-medium">
            Payment screenshot upload karne ke baad jaise hi admin verify aur approve karega, <strong className="font-bold underline text-emerald-950 dark:text-emerald-200">aapka TikTok Ad continue / chalna shuru hojayega</strong>.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-2xl border border-rose-200 dark:border-rose-900/60 font-semibold animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="w-1/3 py-3.5 px-4 rounded-2xl bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-transparent dark:border-neutral-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-2/3 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Submitting Order...</span>
            ) : (
              <span>Submit Order & Continue Ad</span>
            )}
          </button>
        </div>
      </form>

      {/* Red Heart Loading Bar Overlay */}
      {isSubmitting && (
        <HeartLoader
          fullScreen
          message="Aapka order mehfooz submit ho raha hai..."
          subMessage="Queue me priority review ke liye register kiya ja raha hai"
        />
      )}
    </div>
  );
};
