import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase/config.ts';
import type { OrderDraft, OrderStatus, PaymentStatus } from '../types/index.ts';
import { compressImage } from '../utils/imageCompressor.ts';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function generateOrderId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const datePart = Date.now().toString().slice(-4);
  return `ORD-${datePart}-${rand}`;
}

export function getOrCreateUserId(): string {
  let uid = localStorage.getItem('socialboost_uid');
  if (!uid) {
    uid = 'usr_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem('socialboost_uid', uid);
  }
  return uid;
}

export async function saveOrderDraft(draft: OrderDraft): Promise<void> {
  const docRef = doc(db, 'orders', draft.orderId);

  // Guarantee payment screenshot never breaches Firestore's 1MB document limit
  let screenshot = draft.paymentScreenshot || '';
  if (screenshot && screenshot.length > 100 * 1024) {
    try {
      screenshot = await compressImage(screenshot, 700, 900, 0.65);
    } catch (e) {
      console.warn('Screenshot compression notice:', e);
    }
  }

  // Hard safety check: ensure string does not exceed 300KB
  if (screenshot && screenshot.length > 300 * 1024) {
    try {
      screenshot = await compressImage(screenshot, 500, 700, 0.45);
    } catch {
      screenshot = '';
    }
  }

  // If still over 350KB, drop payload to ensure document write always succeeds
  if (screenshot && screenshot.length > 350 * 1024) {
    console.warn(`[OrderService] Dropping oversized screenshot (${screenshot.length} bytes) to protect document size limit`);
    screenshot = '';
  }

  // Check thumbnail size as well if it's a data URI
  let thumbnail = draft.thumbnail || '';
  if (thumbnail && thumbnail.startsWith('data:') && thumbnail.length > 80 * 1024) {
    try {
      thumbnail = await compressImage(thumbnail, 320, 240, 0.60);
    } catch {
      thumbnail = '';
    }
  }
  if (thumbnail && thumbnail.length > 200 * 1024) {
    thumbnail = '';
  }

  const dataToSave = {
    orderId: draft.orderId,
    platform: draft.platform,
    serviceType: draft.serviceType,
    startingVolume: draft.startingVolume,
    dailyVolume: draft.dailyVolume,
    totalVolume: draft.totalVolume,
    days: draft.days,
    engagement: draft.engagement,
    reach: draft.reach,
    estimatedReach: draft.estimatedReach,
    amount: draft.amount,
    videoUrl: (draft.videoUrl || '').slice(0, 1000),
    thumbnail: thumbnail,
    videoTitle: (draft.videoTitle || '').slice(0, 300),
    currentReach: (draft.currentReach || '').slice(0, 200),
    transactionId: (draft.transactionId || '').slice(0, 100),
    paymentScreenshot: screenshot,
    paymentStatus: draft.paymentStatus || 'pending',
    orderStatus: draft.orderStatus || 'pending',
    userId: draft.userId || getOrCreateUserId(),
    updatedAt: serverTimestamp(),
    createdAt: draft.createdAt || serverTimestamp(),
  };

  try {
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `orders/${draft.orderId}`);
  }
}

// Local storage management for customer order IDs (My Orders)
const MY_ORDERS_KEY = 'viralme_customer_order_ids';

export function saveMyOrderId(orderId: string): void {
  try {
    const raw = localStorage.getItem(MY_ORDERS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(orderId)) {
      list.unshift(orderId);
      localStorage.setItem(MY_ORDERS_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('Failed to save order ID locally', e);
  }
}

export function getMyOrderIds(): string[] {
  try {
    const raw = localStorage.getItem(MY_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function fetchOrder(orderId: string): Promise<OrderDraft | null> {
  const docRef = doc(db, 'orders', orderId);
  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as OrderDraft;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `orders/${orderId}`);
    return null;
  }
}

export async function updateOrderStatuses(
  orderId: string,
  orderStatus: OrderStatus,
  paymentStatus: PaymentStatus
): Promise<void> {
  const docRef = doc(db, 'orders', orderId);
  try {
    await updateDoc(docRef, {
      orderStatus,
      paymentStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
  }
}

export function subscribeToOrdersList(
  onUpdate: (orders: OrderDraft[]) => void,
  onError?: (err: unknown) => void
) {
  const ordersRef = collection(db, 'orders');
  const q = query(ordersRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const orders: OrderDraft[] = [];
      snapshot.forEach((d) => {
        orders.push(d.data() as OrderDraft);
      });
      onUpdate(orders);
    },
    (err) => {
      if (onError) {
        onError(err);
      }
      try {
        handleFirestoreError(err, OperationType.LIST, 'orders');
      } catch (formattedErr) {
        console.warn('[OrderService] Orders subscription paused:', (err as Error).message);
      }
    }
  );
}

export function subscribeToOrderById(
  orderId: string,
  onUpdate: (order: OrderDraft) => void,
  onError?: (err: unknown) => void
) {
  const docRef = doc(db, 'orders', orderId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as OrderDraft);
      }
    },
    (err) => {
      if (onError) onError(err);
      console.warn(`[OrderService] Order subscription notice for ${orderId}:`, (err as Error).message);
    }
  );
}
