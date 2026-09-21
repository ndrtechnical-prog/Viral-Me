import { useEffect, useRef } from 'react';
import { useToast } from '../context/ToastContext.tsx';
import { getMyOrderIds, subscribeToOrderById } from '../services/orderService.ts';
import type { OrderDraft } from '../types/index.ts';

interface UseOrderNotificationsOptions {
  activeOrderId?: string;
  onOpenTrackOrder: (orderId: string) => void;
}

export function useOrderNotifications({
  activeOrderId,
  onOpenTrackOrder,
}: UseOrderNotificationsOptions) {
  const { notifyPaymentApproved, notifyOrderProcessing, notifyOrderCompleted } = useToast();

  // Stores previous status for each order to detect live transitions
  const previousStatusRef = useRef<Record<string, { paymentStatus: string; orderStatus: string }>>({});
  const isInitialLoadRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    // Collect all order IDs that belong to the user
    const savedIds = getMyOrderIds();
    const allIdsToWatch = Array.from(
      new Set([...savedIds, ...(activeOrderId ? [activeOrderId] : [])])
    ).filter(Boolean);

    if (allIdsToWatch.length === 0) return;

    const unsubs: Array<() => void> = [];

    allIdsToWatch.forEach((orderId) => {
      // Mark initial load for this order ID so we don't trigger toast for existing static state
      if (isInitialLoadRef.current[orderId] === undefined) {
        isInitialLoadRef.current[orderId] = true;
      }

      const unsub = subscribeToOrderById(orderId, (order: OrderDraft) => {
        const prev = previousStatusRef.current[orderId];
        const isInitial = isInitialLoadRef.current[orderId];

        const currentPaymentStatus = order.paymentStatus || 'pending';
        const currentOrderStatus = order.orderStatus || 'pending';

        if (isInitial) {
          // Record current state without alerting
          previousStatusRef.current[orderId] = {
            paymentStatus: currentPaymentStatus,
            orderStatus: currentOrderStatus,
          };
          isInitialLoadRef.current[orderId] = false;
          return;
        }

        // Check for Payment Approved Transition (e.g. pending -> verified / approved)
        const curPayStr = currentPaymentStatus as string;
        const prevPayStr = prev ? (prev.paymentStatus as string) : '';
        const isPaymentNowApproved =
          (curPayStr === 'verified' || curPayStr === 'approved') &&
          prevPayStr !== 'verified' &&
          prevPayStr !== 'approved';

        if (prev && isPaymentNowApproved) {
          notifyPaymentApproved(order.orderId, () => {
            onOpenTrackOrder(order.orderId);
          });
        }

        // Check for Order Status: Processing Transition (e.g. pending -> processing)
        const curOrderStr = currentOrderStatus as string;
        const prevOrderStr = prev ? (prev.orderStatus as string) : '';
        const isOrderNowProcessing =
          (curOrderStr === 'processing' || curOrderStr === 'in_progress') &&
          prevOrderStr !== 'processing' &&
          prevOrderStr !== 'in_progress';

        if (prev && isOrderNowProcessing) {
          notifyOrderProcessing(order.orderId, () => {
            onOpenTrackOrder(order.orderId);
          });
        }

        // Check for Order Status: Completed Transition
        if (prev && prev.orderStatus !== 'completed' && currentOrderStatus === 'completed') {
          notifyOrderCompleted(order.orderId, () => {
            onOpenTrackOrder(order.orderId);
          });
        }

        // Update recorded state
        previousStatusRef.current[orderId] = {
          paymentStatus: currentPaymentStatus,
          orderStatus: currentOrderStatus,
        };
      });

      unsubs.push(unsub);
    });

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [activeOrderId, notifyPaymentApproved, notifyOrderProcessing, notifyOrderCompleted, onOpenTrackOrder]);
}
