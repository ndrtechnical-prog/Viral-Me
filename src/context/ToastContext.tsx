import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  X,
  ArrowRight,
  Sparkles,
  Zap,
  Check,
  AlertCircle
} from 'lucide-react';

export type ToastType = 'payment_approved' | 'order_processing' | 'order_completed' | 'success' | 'info' | 'error';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  orderId?: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => string;
  dismissToast: (id: string) => void;
  notifyPaymentApproved: (orderId: string, onTrack?: () => void) => void;
  notifyOrderProcessing: (orderId: string, onTrack?: () => void) => void;
  notifyOrderCompleted: (orderId: string, onTrack?: () => void) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Synthesize pleasant, non-intrusive sound using Web Audio API
function playChime(type: 'success' | 'info') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      // Pleasant double chime: 587Hz (D5) -> 880Hz (A5)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } else {
      // Gentle energetic chime: 523Hz (C5) -> 659Hz (E5)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch {
    // AudioContext blocked or not supported
  }
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = 'toast_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      const newToast: ToastItem = { ...toast, id };

      setToasts((prev) => [newToast, ...prev].slice(0, 4)); // Max 4 stacked toasts

      if (toast.type === 'payment_approved' || toast.type === 'order_completed' || toast.type === 'success') {
        playChime('success');
      } else {
        playChime('info');
      }

      const duration = toast.duration ?? 7000;
      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast]
  );

  const notifyPaymentApproved = useCallback(
    (orderId: string, onTrack?: () => void) => {
      showToast({
        type: 'payment_approved',
        title: 'Payment Approved! 🎉',
        message: `Aapki payment order #${orderId} ke liye verify ho chuki hai. Campaign shuru hone ke liye ready hai!`,
        orderId,
        actionLabel: 'Track Order',
        onAction: onTrack,
        duration: 9000,
      });
    },
    [showToast]
  );

  const notifyOrderProcessing = useCallback(
    (orderId: string, onTrack?: () => void) => {
      showToast({
        type: 'order_processing',
        title: 'Order Status: Processing 🚀',
        message: `Order #${orderId} ab processing me hai! Views aur engagement campaign active kar di gayi hai.`,
        orderId,
        actionLabel: 'Check Live Status',
        onAction: onTrack,
        duration: 9000,
      });
    },
    [showToast]
  );

  const notifyOrderCompleted = useCallback(
    (orderId: string, onTrack?: () => void) => {
      showToast({
        type: 'order_completed',
        title: 'Order Completed! 🏆',
        message: `Order #${orderId} kamiyabi se mukammal ho chuka hai. Delivery report check karein.`,
        orderId,
        actionLabel: 'View Report',
        onAction: onTrack,
        duration: 9000,
      });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        dismissToast,
        notifyPaymentApproved,
        notifyOrderProcessing,
        notifyOrderCompleted,
      }}
    >
      {children}

      {/* Toast Notification Container */}
      <aside
        id="toast-notification-container"
        aria-label="Notifications"
        className="fixed top-4 right-4 left-4 sm:left-auto sm:w-[420px] z-[9999] pointer-events-none flex flex-col gap-2.5"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const isPaymentApproved = toast.type === 'payment_approved';
            const isProcessing = toast.type === 'order_processing';
            const isCompleted = toast.type === 'order_completed';

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.95 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={`pointer-events-auto rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all ${
                  isPaymentApproved
                    ? 'bg-white dark:bg-neutral-800 border-emerald-300 dark:border-emerald-700 text-gray-900 dark:text-neutral-100 ring-4 ring-emerald-500/10 dark:ring-emerald-500/20'
                    : isProcessing
                    ? 'bg-white dark:bg-neutral-800 border-blue-300 dark:border-blue-700 text-gray-900 dark:text-neutral-100 ring-4 ring-blue-500/10 dark:ring-blue-500/20'
                    : isCompleted
                    ? 'bg-white dark:bg-neutral-800 border-purple-300 dark:border-purple-700 text-gray-900 dark:text-neutral-100 ring-4 ring-purple-500/10 dark:ring-purple-500/20'
                    : 'bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-neutral-100 ring-4 ring-gray-500/5 dark:ring-neutral-700/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Status Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-bold ${
                      isPaymentApproved
                        ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-200 dark:ring-emerald-800'
                        : isProcessing
                        ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 ring-2 ring-blue-200 dark:ring-blue-800'
                        : isCompleted
                        ? 'bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 ring-2 ring-purple-200 dark:ring-purple-800'
                        : 'bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300'
                    }`}
                  >
                    {isPaymentApproved ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : isProcessing ? (
                      <Zap className="w-5 h-5 animate-pulse" />
                    ) : isCompleted ? (
                      <Sparkles className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isPaymentApproved
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : isProcessing
                            ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : isCompleted
                            ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            : 'bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300'
                        }`}
                      >
                        {isPaymentApproved
                          ? 'Payment Approved'
                          : isProcessing
                          ? 'Order In Progress'
                          : isCompleted
                          ? 'Campaign Complete'
                          : 'Update'}
                      </span>
                      {toast.orderId && (
                        <span className="text-[11px] font-mono font-bold text-gray-400 dark:text-neutral-500">
                          #{toast.orderId}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-black text-gray-900 dark:text-neutral-100 tracking-tight leading-snug">
                      {toast.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-neutral-300 mt-1 leading-relaxed">
                      {toast.message}
                    </p>

                    {/* Action Button */}
                    {toast.actionLabel && toast.onAction && (
                      <div className="mt-3 pt-2 border-t border-gray-100 dark:border-neutral-700/60 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            toast.onAction?.();
                            dismissToast(toast.id);
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer shadow-2xs ${
                            isPaymentApproved
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : isProcessing
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-gray-900 hover:bg-black dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white'
                          }`}
                        >
                          <span>{toast.actionLabel}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] text-gray-400 dark:text-neutral-500 font-medium">Click to track</span>
                      </div>
                    )}
                  </div>

                  {/* Close button */}
                  <button
                    type="button"
                    onClick={() => dismissToast(toast.id)}
                    className="shrink-0 p-1 text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
                    aria-label="Dismiss notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </aside>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
