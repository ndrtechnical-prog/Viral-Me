import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Loader2,
  Package,
  ArrowRight,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { fetchOrder, getMyOrderIds, subscribeToOrderById } from '../services/orderService.ts';
import type { OrderDraft } from '../types/index.ts';

interface OrderLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillOrderId?: string;
}

export const OrderLookupModal: React.FC<OrderLookupModalProps> = ({
  isOpen,
  onClose,
  prefillOrderId,
}) => {
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foundOrder, setFoundOrder] = useState<OrderDraft | null>(null);
  const [myOrderIds, setMyOrderIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Real-time live synchronization for currently inspected order
  useEffect(() => {
    if (!foundOrder?.orderId || !isOpen) return;
    const unsub = subscribeToOrderById(foundOrder.orderId, (updated) => {
      setFoundOrder(updated);
    });
    return () => unsub();
  }, [foundOrder?.orderId, isOpen]);

  // Load My Order IDs from localStorage whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const ids = getMyOrderIds();
      setMyOrderIds(ids);

      if (prefillOrderId) {
        setOrderId(prefillOrderId);
        handleLookup(prefillOrderId);
      } else if (ids.length > 0 && !foundOrder) {
        // Automatically prefill the latest order if available
        setOrderId(ids[0]);
      }
    }
  }, [isOpen, prefillOrderId]);

  if (!isOpen) return null;

  const copyToClipboard = (idToCopy: string) => {
    navigator.clipboard.writeText(idToCopy);
    setCopiedId(idToCopy);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLookup = async (searchId: string) => {
    const trimmed = searchId.trim().toUpperCase();
    if (!trimmed) return;

    try {
      setLoading(true);
      setError(null);
      setFoundOrder(null);

      const order = await fetchOrder(trimmed);
      if (!order) {
        setError('Is Order ID se koi order nahi mila. Barah-e-karam ID dobara check karein.');
      } else {
        setFoundOrder(order);
      }
    } catch (err: any) {
      setError('Order track karne me masla aaya. Barah-e-karam dobara koshish karein.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLookup(orderId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-y-auto max-h-[90vh] space-y-5">
        
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-gray-100 dark:bg-neutral-700 text-gray-500 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="text-xs text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" />
            <span>Order Management</span>
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-neutral-100">
            My Orders & Tracking
          </h3>
          <p className="text-xs text-gray-500 dark:text-neutral-400">
            Apne Order IDs copy karein aur live ad activation status track karein.
          </p>
        </div>

        {/* ========================================================= */}
        {/* MY ORDERS: Sirf Order IDs jinhe copy kr k track kr ske     */}
        {/* ========================================================= */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-neutral-300">
              My Orders List ({myOrderIds.length})
            </span>
            <span className="text-[11px] text-gray-400 dark:text-neutral-500">
              Click Copy or Track
            </span>
          </div>

          {myOrderIds.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-neutral-700/60 border border-gray-200 dark:border-neutral-700 rounded-2xl overflow-hidden bg-gray-50/50 dark:bg-neutral-900/60 max-h-48 overflow-y-auto">
              {myOrderIds.map((savedId) => (
                <div
                  key={savedId}
                  className="p-3 flex items-center justify-between gap-2 hover:bg-white dark:hover:bg-neutral-800/80 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                    <span className="font-mono font-black text-sm text-gray-900 dark:text-neutral-100 truncate">
                      {savedId}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={() => copyToClipboard(savedId)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600 text-gray-700 dark:text-neutral-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                      title="Copy Order ID"
                    >
                      {copiedId === savedId ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-gray-500 dark:text-neutral-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {/* Track Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setOrderId(savedId);
                        handleLookup(savedId);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      <span>Track</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 text-center text-xs text-gray-500 dark:text-neutral-400">
              Abhi tak is device par koi order nahi mila. Naya order place karne par yahan Order ID save hojayegi.
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* MANUAL SEARCH INPUT                                       */}
        {/* ========================================================= */}
        <form onSubmit={handleSubmit} className="space-y-2 pt-2 border-t border-gray-100 dark:border-neutral-700/60">
          <label htmlFor="search-order-id-input" className="text-xs font-bold text-gray-700 dark:text-neutral-300 block">
            Koi Bhi Order ID Track Karein:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-neutral-500" />
              <input
                id="search-order-id-input"
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="ORD-XXXX-XXXX"
                className="w-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-mono uppercase text-gray-900 dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-neutral-600 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-neutral-900"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !orderId.trim()}
              className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Track ID'}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-2xl border border-rose-100 dark:border-rose-900/50 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* ========================================================= */}
        {/* TRACKED ORDER RESULT CARD                                 */}
        {/* ========================================================= */}
        {foundOrder && (
          <div className="bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl p-4 space-y-3 text-xs animate-fadeIn">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-neutral-700 pb-2">
              <span className="text-gray-500 dark:text-neutral-400 font-bold">Order ID</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-black text-blue-600 dark:text-blue-400">{foundOrder.orderId}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(foundOrder.orderId)}
                  className="p-1 rounded bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-600 dark:text-neutral-300"
                  title="Copy ID"
                >
                  {copiedId === foundOrder.orderId ? (
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            {/* Live Campaign Status */}
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-neutral-400">Ad & Payment Status</span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                  foundOrder.paymentStatus === 'verified'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : foundOrder.paymentStatus === 'rejected'
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                }`}
              >
                {foundOrder.paymentStatus === 'verified'
                  ? 'Approved (Ad Active)'
                  : foundOrder.paymentStatus === 'rejected'
                  ? 'Payment Rejected'
                  : 'Pending Approval'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-neutral-400">Service</span>
              <span className="font-bold text-gray-800 dark:text-neutral-200 capitalize">
                TikTok • {foundOrder.serviceType}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-neutral-400">Total Delivery</span>
              <span className="font-bold text-gray-800 dark:text-neutral-200">
                ~{(foundOrder.totalVolume || foundOrder.estimatedReach || (foundOrder.dailyVolume * foundOrder.days)).toLocaleString()} {foundOrder.serviceType} ({foundOrder.days} Din)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-neutral-400">Amount</span>
              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                Rs. {foundOrder.amount?.toLocaleString()}
              </span>
            </div>

            {foundOrder.videoUrl && (
              <div className="pt-2 border-t border-gray-200 dark:border-neutral-700">
                <a
                  href={foundOrder.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold truncate"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">{foundOrder.videoUrl}</span>
                </a>
              </div>
            )}

            {foundOrder.paymentStatus === 'pending' && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-[11px] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Admin verification ke baad aapka Ad continue / start hojayega.</span>
              </div>
            )}
            {foundOrder.paymentStatus === 'verified' && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Ad Approved! Aapka TikTok promotion campaign chalu hai.</span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
