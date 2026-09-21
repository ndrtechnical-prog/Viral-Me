import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { StepProgress } from './components/StepProgress.tsx';
import { ServiceSelector } from './components/ServiceSelector.tsx';
import { VolumeCalculator } from './components/VolumeCalculator.tsx';
import { OrderPlacementStep } from './components/OrderPlacementStep.tsx';
import { AdminLoginModal } from './components/AdminLoginModal.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { OrderLookupModal } from './components/OrderLookupModal.tsx';

import type { OrderDraft, AdminSettings } from './types/index.ts';
import { DEFAULT_SETTINGS, subscribeAdminSettings } from './services/settingsService.ts';
import {
  generateOrderId,
  getOrCreateUserId,
  saveOrderDraft,
  subscribeToOrdersList
} from './services/orderService.ts';
import { auth } from './firebase/config.ts';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { Lock, BadgeCheck, Bell, CheckCircle2, Zap } from 'lucide-react';
import { ToastProvider, useToast } from './context/ToastContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { useOrderNotifications } from './hooks/useOrderNotifications.ts';

function MainApp() {
  const { notifyPaymentApproved, notifyOrderProcessing } = useToast();
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxAccessibleStep, setMaxAccessibleStep] = useState<number>(1);

  // Modals state
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [prefillLookupId, setPrefillLookupId] = useState<string>('');

  // Admin authentication & Firebase User
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [ordersList, setOrdersList] = useState<OrderDraft[]>([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  // Active Order Draft with TikTok Promote base parameters
  const [orderDraft, setOrderDraft] = useState<OrderDraft>(() => ({
    orderId: generateOrderId(),
    platform: 'tiktok',
    serviceType: 'views',
    startingVolume: 0,
    dailyVolume: 2638,
    totalVolume: 2638,
    days: 1,
    engagement: 100,
    reach: 2638,
    estimatedReach: 2638,
    amount: 200,
    videoUrl: '',
    thumbnail: '',
    videoTitle: '',
    currentReach: '',
    transactionId: '',
    paymentStatus: 'pending',
    orderStatus: 'pending',
    userId: getOrCreateUserId(),
  }));

  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Subscribe to live Admin Settings
  useEffect(() => {
    const unsubscribeSettings = subscribeAdminSettings((newSettings) => {
      setSettings(newSettings);
    });

    const storedToken = localStorage.getItem('sb_admin_token');
    if (storedToken) {
      setAdminToken(storedToken);
    }

    return () => {
      unsubscribeSettings();
    };
  }, []);

  // Subscribe to live Orders List ONLY when admin is authenticated in Firebase Auth
  useEffect(() => {
    const isAuthorizedAdmin = currentUser && (currentUser.email === 'ndrtechnical@gmail.com' || adminToken);
    if (isAuthorizedAdmin) {
      const unsubscribeOrders = subscribeToOrdersList((orders) => {
        setOrdersList(orders);
      });
      return () => {
        unsubscribeOrders();
      };
    }
  }, [currentUser, adminToken]);

  const handleUpdateDraft = (updated: Partial<OrderDraft>) => {
    setOrderDraft((prev) => ({ ...prev, ...updated }));
  };

  // Step 1 -> Step 2
  const handleProceedToVolume = async () => {
    try {
      setIsSavingDraft(true);
      await saveOrderDraft(orderDraft);
      setCurrentStep(2);
      setMaxAccessibleStep((prev) => Math.max(prev, 2));
    } catch (err) {
      console.warn('Draft save notice:', err);
      setCurrentStep(2);
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Step 2 -> Step 3
  const handleProceedToPaymentStep = async () => {
    try {
      setIsRecalculating(true);
      const resp = await fetch('/api/recalculate-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyVolume: orderDraft.dailyVolume,
          days: orderDraft.days,
          serviceType: orderDraft.serviceType,
          settings,
        }),
      });

      if (resp.ok) {
        const verified = await resp.json();
        const updated = {
          ...orderDraft,
          totalVolume: verified.totalVolume,
          estimatedReach: verified.totalEstimatedReach,
          amount: verified.amount,
        };
        setOrderDraft(updated);
        await saveOrderDraft(updated);
      }
    } catch (err) {
      console.warn('Recalculation notice:', err);
    } finally {
      setIsRecalculating(false);
      setCurrentStep(3);
      setMaxAccessibleStep((prev) => Math.max(prev, 3));
    }
  };

  // Final submission of order in Step 3
  const handleFinalizeOrder = async (trxId: string, screenshot?: string) => {
    const finalized: OrderDraft = {
      ...orderDraft,
      transactionId: trxId,
      paymentScreenshot: screenshot || orderDraft.paymentScreenshot || '',
      paymentStatus: 'pending',
      orderStatus: 'pending',
    };

    setOrderDraft(finalized);
    await saveOrderDraft(finalized);
  };

  // Reset workflow for a fresh promotion
  const handleResetWorkflow = () => {
    const newId = generateOrderId();
    setOrderDraft({
      orderId: newId,
      platform: 'tiktok',
      serviceType: 'views',
      startingVolume: 0,
      dailyVolume: 2638,
      totalVolume: 2638,
      days: 1,
      engagement: 100,
      reach: 2638,
      estimatedReach: 2638,
      amount: settings.minimumOrderAmount || 200,
      videoUrl: '',
      thumbnail: '',
      videoTitle: '',
      currentReach: '',
      transactionId: '',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      userId: getOrCreateUserId(),
    });
    setCurrentStep(1);
    setMaxAccessibleStep(1);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('sb_admin_token');
    setAdminToken(null);
    setIsAdminDashboardOpen(false);
  };

  const handleOpenTrackOrder = (orderId?: string) => {
    if (orderId) setPrefillLookupId(orderId);
    setIsLookupOpen(true);
  };

  // Real-time Firestore notification watcher for customer's orders
  useOrderNotifications({
    activeOrderId: orderDraft.orderId,
    onOpenTrackOrder: handleOpenTrackOrder,
  });

  // Admin Dashboard view
  if (isAdminDashboardOpen && adminToken) {
    return (
      <AdminPanel
        orders={ordersList}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings(newSettings)}
        onClose={() => setIsAdminDashboardOpen(false)}
        onLogout={handleAdminLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-neutral-900 text-gray-900 dark:text-neutral-100 flex flex-col font-sans antialiased selection:bg-blue-500 selection:text-white transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        onOpenLookup={() => handleOpenTrackOrder()}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        isAdminLoggedIn={Boolean(adminToken)}
        onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 sm:py-6 space-y-4">
        {/* Step Indicator */}
        <StepProgress
          currentStep={currentStep}
          maxAccessibleStep={maxAccessibleStep}
          onStepClick={(step) => {
            if (step <= maxAccessibleStep) {
              setCurrentStep(step);
            }
          }}
        />

        {/* Dynamic Process Screens */}
        {currentStep === 1 && (
          <ServiceSelector
            orderDraft={orderDraft}
            settings={settings}
            onChange={handleUpdateDraft}
            onNext={handleProceedToVolume}
            isSaving={isSavingDraft}
          />
        )}

        {currentStep === 2 && (
          <VolumeCalculator
            orderDraft={orderDraft}
            settings={settings}
            onChange={handleUpdateDraft}
            onBack={() => setCurrentStep(1)}
            onNext={handleProceedToPaymentStep}
            isCalculating={isRecalculating}
          />
        )}

        {currentStep === 3 && (
          <OrderPlacementStep
            orderDraft={orderDraft}
            onUpdateDraft={handleUpdateDraft}
            onBack={() => setCurrentStep(2)}
            onSubmitOrder={handleFinalizeOrder}
            onResetWorkflow={handleResetWorkflow}
            onTrackOrder={handleOpenTrackOrder}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 py-6 text-xs text-gray-500 dark:text-neutral-400 mt-auto transition-colors">
        <div className="max-w-2xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-1.5 font-bold text-gray-700 dark:text-neutral-300">
            <span>Viral Me</span>
            <span>•</span>
            <span className="text-gray-400 dark:text-neutral-500 font-normal">Powered By Viral Wave</span>
            <BadgeCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 fill-blue-100 dark:fill-blue-950/60 inline" />
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-end">
            {/* Live Alerts Indicator & Quick Test */}
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-neutral-400 bg-gray-100/90 dark:bg-neutral-800 px-2.5 py-1 rounded-full border border-gray-200/60 dark:border-neutral-700 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-gray-700 dark:text-neutral-300">Live Alerts</span>
              <span className="text-gray-300 dark:text-neutral-600">|</span>
              <button
                type="button"
                onClick={() => notifyPaymentApproved(orderDraft.orderId, () => handleOpenTrackOrder(orderDraft.orderId))}
                className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-bold hover:underline cursor-pointer"
                title="Preview Payment Approved Toast Alert"
              >
                Test Approved
              </button>
              <span className="text-gray-300 dark:text-neutral-600">|</span>
              <button
                type="button"
                onClick={() => notifyOrderProcessing(orderDraft.orderId, () => handleOpenTrackOrder(orderDraft.orderId))}
                className="text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold hover:underline cursor-pointer"
                title="Preview Order Processing Toast Alert"
              >
                Test Processing
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleOpenTrackOrder()}
              className="text-gray-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors cursor-pointer"
            >
              Track Order
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setIsAdminLoginOpen(true)}
              className="inline-flex items-center gap-1 text-gray-400 dark:text-neutral-500 hover:text-gray-700 dark:hover:text-neutral-300 transition-colors cursor-pointer"
              title="Staff Portal"
            >
              <Lock className="w-3 h-3" />
              <span>Admin Access</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onAuthenticated={(token) => {
          setAdminToken(token);
          setIsAdminDashboardOpen(true);
        }}
      />

      <OrderLookupModal
        isOpen={isLookupOpen}
        onClose={() => {
          setIsLookupOpen(false);
          setPrefillLookupId('');
        }}
        prefillOrderId={prefillLookupId}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </ThemeProvider>
  );
}
