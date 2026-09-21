import React, { useState } from 'react';
import {
  X,
  Link2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Play,
  Layers,
  Calendar,
  DollarSign,
  TrendingUp,
  Info
} from 'lucide-react';
import type { OrderDraft, VideoMetadata } from '../types/index.ts';

interface VideoModalProps {
  isOpen: boolean;
  orderDraft: OrderDraft;
  onClose: () => void;
  onSuccess: (videoData: { url: string; thumbnail: string; title: string; currentReach: string }) => void;
  onProceedToPayment: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  orderDraft,
  onClose,
  onSuccess,
  onProceedToPayment,
}) => {
  const [videoUrl, setVideoUrl] = useState(orderDraft.videoUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedData, setFetchedData] = useState<VideoMetadata | null>(
    orderDraft.thumbnail
      ? {
          valid: true,
          platform: orderDraft.platform,
          title: orderDraft.videoTitle || 'Verified Social Content',
          author: 'Content Creator',
          thumbnail: orderDraft.thumbnail,
          currentReach: orderDraft.currentReach || 'Verified via URL parser',
          metricNote: 'Public live views are privacy-restricted by the provider platform.',
          estimatedReach: orderDraft.estimatedReach,
        }
      : null
  );

  if (!isOpen) return null;

  const handleFetchVideo = async () => {
    if (!videoUrl.trim()) {
      setError('Please enter a valid video link.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const resp = await fetch('/api/video-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoUrl.trim(), platform: orderDraft.platform }),
      });

      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || 'Failed to validate or retrieve video information.');
      }

      const data: VideoMetadata = await resp.json();
      setFetchedData(data);
      onSuccess({
        url: videoUrl.trim(),
        thumbnail: data.thumbnail,
        title: data.title,
        currentReach: data.currentReach,
      });
    } catch (err: any) {
      console.error('Fetch video error:', err);
      setError(err?.message || 'Unable to fetch video details. Please verify the URL.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAndContinue = () => {
    if (!fetchedData) {
      setError('Please fetch and verify your video URL first.');
      return;
    }
    onProceedToPayment();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Close Button */}
        <button
          id="close-video-modal-btn"
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1 mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
            <Link2 className="w-3.5 h-3.5" />
            <span>Process 3 — Verification</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-100">
            Enter Video Link
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300">
            Paste your {orderDraft.platform ? orderDraft.platform.toUpperCase() : 'social media'} video or post link to retrieve public metadata and verify configuration.
          </p>
        </div>

        {/* Input & Fetch Section */}
        <div className="space-y-3 mb-6">
          <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
            Paste your TikTok / Instagram / YouTube video link
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                id="input-video-url"
                type="url"
                value={videoUrl}
                onChange={(e) => {
                  setVideoUrl(e.target.value);
                  setError(null);
                }}
                placeholder="https://www.tiktok.com/@username/video/..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <button
              id="fetch-video-btn"
              type="button"
              onClick={handleFetchVideo}
              disabled={isLoading || !videoUrl}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Fetch Video</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-950/40 p-3 rounded-xl border border-rose-900/50">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick example link helper */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-300">
            <span>Examples:</span>
            <button
              type="button"
              onClick={() => {
                setVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
                setError(null);
              }}
              className="text-neutral-300 hover:text-neutral-200 underline cursor-pointer"
            >
              YouTube Demo
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                setVideoUrl('https://www.tiktok.com/@creative_creator/video/718293849102837482');
                setError(null);
              }}
              className="text-neutral-300 hover:text-neutral-200 underline cursor-pointer"
            >
              TikTok Demo
            </button>
          </div>
        </div>

        {/* Fetched Preview Display */}
        {fetchedData && (
          <div className="space-y-6 pt-4 border-t border-neutral-800 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Video Detected & Verified</span>
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono uppercase font-semibold">
                {fetchedData.platform}
              </span>
            </div>

            {/* Video Card Preview */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-neutral-950/80 border border-neutral-800/90 rounded-2xl p-4">
              <div className="relative w-full sm:w-40 h-28 rounded-xl overflow-hidden bg-neutral-900 shrink-0 border border-neutral-800">
                {fetchedData.thumbnail ? (
                  <img
                    src={fetchedData.thumbnail}
                    alt={fetchedData.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-600">
                    <Play className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                  <span className="text-[10px] text-white font-mono bg-black/60 px-1.5 py-0.5 rounded">
                    Preview
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-2 text-left w-full">
                <h4 className="text-sm font-bold text-neutral-100 line-clamp-2">
                  {fetchedData.title}
                </h4>
                <div className="text-xs text-neutral-300">
                  Creator / Channel: <span className="text-neutral-300 font-medium">{fetchedData.author}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-neutral-900/90 p-2 rounded-lg border border-neutral-800/80">
                    <div className="text-[10px] text-neutral-300 uppercase">Current Reach</div>
                    <div className="text-xs font-semibold text-neutral-300 truncate">
                      {fetchedData.currentReach}
                    </div>
                  </div>
                  <div className="bg-neutral-900/90 p-2 rounded-lg border border-neutral-800/80">
                    <div className="text-[10px] text-emerald-400 uppercase font-semibold">Estimated Reach</div>
                    <div className="text-xs font-bold text-emerald-400">
                      ~{(orderDraft.reach * orderDraft.days).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Confirmation Metrics (Selected Service, Volume, Days, Amount) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-4 text-center">
              <div>
                <span className="text-[10px] text-neutral-300 uppercase block">Service</span>
                <span className="text-sm font-bold text-neutral-100 capitalize">
                  {orderDraft.serviceType}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-300 uppercase block">Selected Volume</span>
                <span className="text-sm font-bold text-indigo-400">
                  {(orderDraft.dailyVolume * orderDraft.days).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-300 uppercase block">Days</span>
                <span className="text-sm font-bold text-neutral-100">
                  {orderDraft.days} Days
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-300 uppercase block">Total Amount</span>
                <span className="text-sm font-bold text-purple-400">
                  Rs. {orderDraft.amount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Important Disclaimer Warning */}
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/30 text-xs text-amber-300/90 leading-relaxed">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Analytics Disclaimer:</strong> Reach and impression figures represent analytical model projections based on selected delivery pacing. Algorithmic response varies based on audience affinity and video content quality.
              </span>
            </div>

            {/* OK Continue Button */}
            <div className="flex justify-end pt-2">
              <button
                id="video-ok-continue-btn"
                type="button"
                onClick={handleConfirmAndContinue}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <span>OK, Continue to Payment</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
