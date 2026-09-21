export type PlatformType = 'tiktok' | 'instagram' | 'youtube' | 'facebook';

export type ServiceType = 'views' | 'likes' | 'comments' | 'followers' | 'shares' | 'saves';

export type PaymentStatus = 'pending' | 'verified' | 'rejected';

export type OrderStatus = 'pending' | 'payment_verified' | 'processing' | 'completed' | 'cancelled';

export interface ServiceOption {
  id: ServiceType;
  label: string;
  iconName: string;
  emoji: string;
  description: string;
  baseRatio: number;
}

export interface PlatformOption {
  id: PlatformType;
  name: string;
  icon: string;
  placeholder: string;
  regex: RegExp;
  color: string;
}

export interface OrderDraft {
  orderId: string;
  platform: PlatformType;
  serviceType: ServiceType;
  startingVolume: number;
  dailyVolume: number;
  totalVolume: number;
  days: number;
  engagement: number;
  reach: number;
  estimatedReach: number;
  amount: number;
  videoUrl: string;
  thumbnail: string;
  videoTitle?: string;
  currentReach: string;
  transactionId: string;
  paymentScreenshot?: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  userId: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface AdminSettings {
  // TikTok Promote Campaign Pricing Engine
  baseAdCost: number;          // Default: 1450 (PKR)
  baseViews: number;           // Default: 24840
  profitPercentage: number;    // Default: 30 (%)
  minimumOrderAmount: number;  // Default: 200 (PKR)
  minimumDays: number;         // Default: 1
  maximumDays: number;         // Default: 30

  // Optional / backward-compatible properties
  defaultDailyVolume?: number;
  defaultReach?: number;
  defaultAmount?: number;
  volumeGrowthRate?: number;
  reachGrowthRate?: number;
  amountGrowthRate?: number;
  updatedAt?: any;
}

export interface DayBreakdown {
  day: number;
  volume: number;
  reach: number;
  amount: number;
}

export interface VideoMetadata {
  valid: boolean;
  platform: PlatformType;
  title: string;
  author: string;
  thumbnail: string;
  currentReach: string;
  metricNote: string;
  estimatedReach: number;
}
