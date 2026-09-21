import type { AdminSettings, ServiceType } from '../types/index.ts';

export interface TikTokPricingSettings {
  baseAdCost: number;         // e.g. 1450 PKR
  baseViews: number;          // e.g. 24840 views
  profitPercentage: number;   // e.g. 30 (%)
  minimumOrderAmount: number; // e.g. 200 PKR
  minimumDays: number;        // e.g. 1
  maximumDays: number;        // e.g. 30
}

export interface DynamicPricingResult {
  days: number;
  dailyReach: number;
  totalReach: number;
  amount: number;
  baseCostPerView: number;
  sellingCostPerView: number;
  minimumOrderAmount: number;
  minimumReachForDays: number;
  minimumSingleDayReach: number;
  isMinimumClamped: boolean;
  ratePer1000Views: number;
  serviceMultiplier: number;
}

/**
 * Service-specific pricing multipliers requested by user:
 * - followers: 200 x 3 = minimum Rs. 600 (multiplier 3)
 * - comments: 200 x 2 = minimum Rs. 400 (multiplier 2)
 * - all other (views, likes, shares, saves): minimum Rs. 200 (multiplier 1)
 */
export function getServiceMultiplier(serviceType?: ServiceType): number {
  if (serviceType === 'followers') return 3;
  if (serviceType === 'comments') return 2;
  return 1;
}

/**
 * Normalizes and extracts pricing settings from AdminSettings or defaults
 */
export function getPricingConfig(settings?: Partial<AdminSettings>): TikTokPricingSettings {
  const baseAdCost = Number(settings?.baseAdCost) > 0 ? Number(settings?.baseAdCost) : 1450;
  const baseViews = Number(settings?.baseViews) > 0 ? Number(settings?.baseViews) : 24840;
  const profitPercentage = settings?.profitPercentage !== undefined && !isNaN(Number(settings.profitPercentage))
    ? Number(settings.profitPercentage)
    : 30;
  const minimumOrderAmount = Number(settings?.minimumOrderAmount) > 0 ? Number(settings?.minimumOrderAmount) : 200;
  const minimumDays = Number(settings?.minimumDays) > 0 ? Number(settings?.minimumDays) : 1;
  const maximumDays = Number(settings?.maximumDays) > 0 ? Number(settings?.maximumDays) : 30;

  return {
    baseAdCost,
    baseViews,
    profitPercentage,
    minimumOrderAmount,
    minimumDays,
    maximumDays
  };
}

/**
 * Effective minimum order amount accounting for service multiplier:
 * followers = 200 * 3 = 600 PKR
 * comments = 200 * 2 = 400 PKR
 * other = 200 PKR
 */
export function getEffectiveMinimumOrder(
  serviceTypeOrSettings?: ServiceType | Partial<AdminSettings>,
  maybeSettings?: Partial<AdminSettings>
): number {
  let serviceType: ServiceType = 'views';
  let settings: Partial<AdminSettings> | undefined = maybeSettings;

  if (typeof serviceTypeOrSettings === 'object' && serviceTypeOrSettings !== null) {
    settings = serviceTypeOrSettings;
    serviceType = 'views';
  } else if (typeof serviceTypeOrSettings === 'string') {
    serviceType = serviceTypeOrSettings;
  }

  const config = getPricingConfig(settings);
  const mult = getServiceMultiplier(serviceType);
  return config.minimumOrderAmount * mult;
}

/**
 * Base cost per single view: Ad Cost / Video Views (e.g. 1450 / 24840 = 0.05837)
 */
export function getBaseCostPerView(settings?: Partial<AdminSettings>): number {
  const config = getPricingConfig(settings);
  return config.baseAdCost / config.baseViews;
}

/**
 * Selling cost per view with profit margin: baseCostPerView * (1 + profit% / 100)
 */
export function getSellingCostPerView(settings?: Partial<AdminSettings>): number {
  const config = getPricingConfig(settings);
  const baseCost = getBaseCostPerView(settings);
  return baseCost * (1 + config.profitPercentage / 100);
}

/**
 * Unit selling cost for the chosen service type (e.g. views * multiplier)
 */
export function getSellingCostPerUnit(
  serviceTypeOrSettings?: ServiceType | Partial<AdminSettings>,
  maybeSettings?: Partial<AdminSettings>
): number {
  let serviceType: ServiceType = 'views';
  let settings: Partial<AdminSettings> | undefined = maybeSettings;

  if (typeof serviceTypeOrSettings === 'object' && serviceTypeOrSettings !== null) {
    settings = serviceTypeOrSettings;
    serviceType = 'views';
  } else if (typeof serviceTypeOrSettings === 'string') {
    serviceType = serviceTypeOrSettings;
  }

  const baseSelling = getSellingCostPerView(settings);
  const mult = getServiceMultiplier(serviceType);
  return baseSelling * mult;
}

/**
 * Selling rate per 1,000 views (e.g. ~75.80 PKR)
 */
export function getRatePer1000Views(settings?: Partial<AdminSettings>): number {
  return getSellingCostPerView(settings) * 1000;
}

/**
 * Minimum reach required to satisfy the minimum order amount
 */
export function getMinimumReach(
  serviceTypeOrSettings?: ServiceType | Partial<AdminSettings>,
  maybeSettings?: Partial<AdminSettings>
): number {
  let serviceType: ServiceType = 'views';
  let settings: Partial<AdminSettings> | undefined = maybeSettings;

  if (typeof serviceTypeOrSettings === 'object' && serviceTypeOrSettings !== null) {
    settings = serviceTypeOrSettings;
    serviceType = 'views';
  } else if (typeof serviceTypeOrSettings === 'string') {
    serviceType = serviceTypeOrSettings;
  }

  const minAmount = getEffectiveMinimumOrder(serviceType, settings);
  const unitCost = getSellingCostPerUnit(serviceType, settings);
  if (unitCost <= 0) return 2638;
  return Math.round(minAmount / unitCost);
}

/**
 * Recalculate when DAYS is updated:
 * Recalculates total Reach and Amount based on daily pacing.
 */
export function recalculateFromDays(
  newDays: number,
  currentDailyReach: number,
  serviceType?: ServiceType,
  settings?: Partial<AdminSettings>
): DynamicPricingResult {
  const config = getPricingConfig(settings);
  const mult = getServiceMultiplier(serviceType);
  const minOrderAmount = getEffectiveMinimumOrder(serviceType, settings);
  const unitCost = getSellingCostPerUnit(serviceType, settings);
  const minSingleReach = getMinimumReach(serviceType, settings);

  const days = Math.max(config.minimumDays, Math.min(config.maximumDays, Math.round(newDays) || 1));
  const dailyReach = Math.max(10, Math.round(currentDailyReach) || minSingleReach);
  const rawTotalReach = dailyReach * days;

  const rawAmount = Math.round(rawTotalReach * unitCost);
  const isMinimumClamped = rawAmount < minOrderAmount;
  const amount = Math.max(minOrderAmount, rawAmount);

  const totalReach = isMinimumClamped
    ? Math.max(rawTotalReach, minSingleReach)
    : rawTotalReach;

  const adjustedDailyReach = Math.max(1, Math.round(totalReach / days));

  return {
    days,
    dailyReach: adjustedDailyReach,
    totalReach,
    amount,
    baseCostPerView: getBaseCostPerView(settings),
    sellingCostPerView: unitCost,
    minimumOrderAmount: minOrderAmount,
    minimumReachForDays: minSingleReach,
    minimumSingleDayReach: minSingleReach,
    isMinimumClamped,
    ratePer1000Views: getSellingCostPerView(settings) * 1000,
    serviceMultiplier: mult
  };
}

/**
 * Recalculate when REACH / VIDEO VIEWS is updated:
 */
export function recalculateFromReach(
  reachInput: number,
  isTotal: boolean,
  currentDays: number,
  serviceType?: ServiceType,
  settings?: Partial<AdminSettings>
): DynamicPricingResult {
  const config = getPricingConfig(settings);
  const mult = getServiceMultiplier(serviceType);
  const minOrderAmount = getEffectiveMinimumOrder(serviceType, settings);
  const unitCost = getSellingCostPerUnit(serviceType, settings);
  const minSingleReach = getMinimumReach(serviceType, settings);

  const days = Math.max(config.minimumDays, Math.min(config.maximumDays, Math.round(currentDays) || 1));

  let totalReach: number;
  let dailyReach: number;

  if (isTotal) {
    totalReach = Math.max(1, Math.round(reachInput) || minSingleReach);
    dailyReach = Math.max(1, Math.round(totalReach / days));
  } else {
    dailyReach = Math.max(1, Math.round(reachInput) || Math.round(minSingleReach / days));
    totalReach = dailyReach * days;
  }

  const rawAmount = Math.round(totalReach * unitCost);
  const isMinimumClamped = rawAmount < minOrderAmount || totalReach < minSingleReach;

  let finalAmount = rawAmount;
  let finalTotalReach = totalReach;
  let finalDailyReach = dailyReach;

  if (isMinimumClamped) {
    finalAmount = minOrderAmount;
    finalTotalReach = Math.max(totalReach, minSingleReach);
    finalDailyReach = Math.max(1, Math.round(finalTotalReach / days));
  }

  return {
    days,
    dailyReach: finalDailyReach,
    totalReach: finalTotalReach,
    amount: finalAmount,
    baseCostPerView: getBaseCostPerView(settings),
    sellingCostPerView: unitCost,
    minimumOrderAmount: minOrderAmount,
    minimumReachForDays: minSingleReach,
    minimumSingleDayReach: minSingleReach,
    isMinimumClamped,
    ratePer1000Views: getSellingCostPerView(settings) * 1000,
    serviceMultiplier: mult
  };
}

/**
 * Master calculation when AMOUNT (Price in PKR) is updated:
 * Recalculates estimated Reach and daily pacing.
 * followers = min 600, comments = min 400, others = min 200.
 */
export function recalculateFromAmount(
  amountInput: number,
  currentDays: number,
  serviceType?: ServiceType,
  settings?: Partial<AdminSettings>
): DynamicPricingResult {
  const config = getPricingConfig(settings);
  const mult = getServiceMultiplier(serviceType);
  const minOrderAmount = getEffectiveMinimumOrder(serviceType, settings);
  const unitCost = getSellingCostPerUnit(serviceType, settings);
  const minSingleReach = getMinimumReach(serviceType, settings);

  const days = Math.max(config.minimumDays, Math.min(config.maximumDays, Math.round(currentDays) || 1));

  const isMinimumClamped = (Number(amountInput) || 0) < minOrderAmount;
  const amount = Math.max(minOrderAmount, Math.round(amountInput) || minOrderAmount);

  // Recalculate estimated reach: Amount / unitCost
  const totalReach = Math.max(minSingleReach, Math.round(amount / unitCost));
  const dailyReach = Math.max(1, Math.round(totalReach / days));

  return {
    days,
    dailyReach,
    totalReach,
    amount,
    baseCostPerView: getBaseCostPerView(settings),
    sellingCostPerView: unitCost,
    minimumOrderAmount: minOrderAmount,
    minimumReachForDays: minSingleReach,
    minimumSingleDayReach: minSingleReach,
    isMinimumClamped,
    ratePer1000Views: getSellingCostPerView(settings) * 1000,
    serviceMultiplier: mult
  };
}
