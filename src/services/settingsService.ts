import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config.ts';
import type { AdminSettings } from '../types/index.ts';

export const DEFAULT_SETTINGS: AdminSettings = {
  baseAdCost: 1450,
  baseViews: 24840,
  profitPercentage: 30,
  minimumOrderAmount: 200,
  minimumDays: 1,
  maximumDays: 30,
  defaultDailyVolume: 2638,
  defaultReach: 2638,
  defaultAmount: 200,
  volumeGrowthRate: 1.0,
  reachGrowthRate: 1.0,
  amountGrowthRate: 1.0,
};

const SETTINGS_DOC_REF = doc(db, 'adminSettings', 'defaultSettings');

export async function getAdminSettings(): Promise<AdminSettings> {
  try {
    const snap = await getDoc(SETTINGS_DOC_REF);
    if (snap.exists()) {
      return { ...DEFAULT_SETTINGS, ...snap.data() } as AdminSettings;
    }
    // Initialize defaults in firestore if not exists
    await setDoc(SETTINGS_DOC_REF, {
      ...DEFAULT_SETTINGS,
      updatedAt: new Date().toISOString()
    });
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.warn('[SettingsService] Using local default settings due to read error:', error);
    return DEFAULT_SETTINGS;
  }
}

export function subscribeAdminSettings(onUpdate: (settings: AdminSettings) => void) {
  return onSnapshot(
    SETTINGS_DOC_REF,
    (snap) => {
      if (snap.exists()) {
        onUpdate({ ...DEFAULT_SETTINGS, ...snap.data() } as AdminSettings);
      } else {
        onUpdate(DEFAULT_SETTINGS);
      }
    },
    (err) => {
      console.warn('[SettingsService] Snapshot listener error, using defaults:', err);
      onUpdate(DEFAULT_SETTINGS);
    }
  );
}

export async function saveAdminSettings(settings: AdminSettings): Promise<void> {
  await setDoc(SETTINGS_DOC_REF, {
    ...settings,
    updatedAt: new Date().toISOString()
  });
}
