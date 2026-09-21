import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
  Loader2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import type { OrderDraft } from '../types/index.ts';

interface PaymentModalProps {
  isOpen: boolean;
  orderDraft: OrderDraft;
  onClose: () => void;
  onSubmitOrder: (trxId: string) => Promise<void>;
  onResetWorkflow: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  orderDraft,
  onClose,
  onSubmitOrder,
  onResetWorkflow,
}) => {
  const [transactionId, setTransactionId] = useState(orderDraft.transactionId || '');
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const paymentNumber = '03052838367';
  const accountName = 'Muhammad Nadir';

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

  const handlePlaceOrder = async () => {
    setError(null);

    // Validation rules
    if (!transactionId.trim()) {
      setError('Transaction ID is required to verify your payment.');
      return;
    }
    if (!orderDraft.videoUrl || !orderDraft.videoUrl.startsWith('http')) {
      setError('Please provide a valid video URL before placing the order.');
      return;
    }
    if (!orderDraft.serviceType) {
      setError('Please select a service type.');
      return;
    }
    if (orderDraft.amount <= 0) {
      setError('Order amount must be greater than zero.');
      return;
    }
    if (orderDraft.days < 1 || orderDraft.days > 30) {
      setError('Days must be between 1 and 30.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmitOrder(transactionId.trim());
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Order submission error:', err);
      setError(err?.message || 'Failed to submit order. Please check network connectivity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Background ambient lighting */}
        <div className="absolute -top-20 -left-20 w-52 h-52 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          id="close-payment-modal-btn"
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSuccess ? (
          /* Process 3 Payment Step */
          <div className="space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Instant Payment Gate</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-100">
                Complete Payment
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300">
                Order Reference:{' '}
                <span className="font-mono font-bold text-indigo-400">
                  {orderDraft.orderId}
                </span>
              </p>
            </div>

            {/* Prominent Payment Method Card */}
            <div className="bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💳</span>
                  <span className="font-extrabold text-base text-neutral-100">
                    Easypaisa / JazzCash
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-neutral-300 block font-semibold">Payable Total</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    Rs. {orderDraft.amount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800/80">
                  <span className="text-[11px] text-neutral-300 uppercase block">Account Name</span>
                  <span className="text-sm font-bold text-neutral-100 mt-0.5 block">
                    {accountName}
                  </span>
                </div>

                <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-neutral-300 uppercase block">Payment Number</span>
                    <span className="text-sm font-bold text-indigo-400 font-mono mt-0.5 block">
                      {paymentNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(paymentNumber, 'number')}
                    className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors cursor-pointer"
                    title="Copy Payment Number"
                  >
                    {copiedNumber ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Instructions Callout */}
              <div className="p-3.5 rounded-xl bg-indigo-950/25 border border-indigo-800/30 text-xs text-indigo-300/90 leading-relaxed">
                Send the exact payment amount to the account above, then enter your Transaction ID below.
              </div>
            </div>

            {/* Transaction ID Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                Enter Transaction ID
              </label>
              <input
                id="input-transaction-id"
                type="text"
                value={transactionId}
                onChange={(e) => {
                  setTransactionId(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. 03849182348 or TRX-94821"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm font-mono font-semibold text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-neutral-300">
                Generated upon payment transfer in your banking or Easypaisa/JazzCash application.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-950/40 p-3.5 rounded-xl border border-rose-900/50">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submission Button */}
            <button
              id="place-order-btn"
              type="button"
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white font-black text-base shadow-xl shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Validating & Finalizing...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Place Order</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Order Placed Successfully Screen */
          <div className="text-center space-y-6 py-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-neutral-100">
                Order Placed Successfully
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300 max-w-md mx-auto">
                Your order has been submitted and is waiting for payment verification.
              </p>
            </div>

            {/* Order Details Confirmation Card */}
            <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl p-5 text-left space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <span className="text-xs text-neutral-300 font-semibold uppercase">Order ID</span>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono font-bold text-indigo-400">
                    {orderDraft.orderId}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(orderDraft.orderId, 'orderId')}
                    className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    title="Copy Order ID"
                  >
                    {copiedOrderId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-300">Payment Status</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold font-mono">
                  <Clock className="w-3 h-3" />
                  <span>Pending Verification</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-300">Order Status</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold font-mono">
                  <span>Pending</span>
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-neutral-300">Transaction ID</span>
                <span className="font-mono text-neutral-200 font-semibold">
                  {transactionId}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-300">Amount Paid</span>
                <span className="font-mono text-emerald-400 font-bold">
                  Rs. {orderDraft.amount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onResetWorkflow();
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Create Another Promotion</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-indigo-600/25"
              >
                <span>Close & View Order</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
