import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Settings,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowLeft,
  LogOut,
  ExternalLink,
  Eye,
  Check,
  XCircle,
  TrendingUp,
  Save,
  RotateCcw,
  Sliders,
  Globe,
  FileText,
  Copy,
  Tag,
  Code
} from 'lucide-react';
import type { OrderDraft, AdminSettings, OrderStatus, PaymentStatus, PlatformType, ServiceType } from '../types/index.ts';
import { updateOrderStatuses } from '../services/orderService.ts';
import { saveAdminSettings, DEFAULT_SETTINGS } from '../services/settingsService.ts';
import { auth } from '../firebase/config.ts';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, type User } from 'firebase/auth';
import {
  getPricingConfig,
  getBaseCostPerView,
  getSellingCostPerView,
  getRatePer1000Views,
  getMinimumReach
} from '../utils/pricingCalculator.ts';
import { useToast } from '../context/ToastContext.tsx';

interface AdminPanelProps {
  orders: OrderDraft[];
  settings: AdminSettings;
  onUpdateSettings: (newSettings: AdminSettings) => void;
  onClose: () => void;
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  orders,
  settings,
  onUpdateSettings,
  onClose,
  onLogout,
}) => {
  const { showToast, notifyPaymentApproved, notifyOrderProcessing } = useToast();
  const [activeTab, setActiveTab] = useState<'orders' | 'settings' | 'seo'>('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderDraft | null>(null);

  // Firebase Auth user state
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  const handleConnectGoogle = async () => {
    try {
      setIsSigningIn(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Failed to sign in with Google:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  // SEO & Keywords State
  const [seoData, setSeoData] = useState<any>(null);
  const [keywordQuery, setKeywordQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/seo/keywords')
      .then((res) => res.json())
      .then((data) => setSeoData(data))
      .catch((err) => console.warn('SEO fetch err', err));
  }, []);

  // Editable settings form state
  const [formSettings, setFormSettings] = useState<AdminSettings>({ ...settings });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pendingPayments = orders.filter((o) => o.paymentStatus === 'pending').length;
    const verifiedPayments = orders.filter((o) => o.paymentStatus === 'verified').length;
    const processingOrders = orders.filter((o) => o.orderStatus === 'processing').length;
    const completedOrders = orders.filter((o) => o.orderStatus === 'completed').length;
    const totalRevenue = orders
      .filter((o) => o.paymentStatus === 'verified')
      .reduce((sum, o) => sum + (o.amount || 0), 0);

    return {
      totalOrders,
      pendingPayments,
      verifiedPayments,
      processingOrders,
      completedOrders,
      totalRevenue,
    };
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Search by Order ID or Transaction ID
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesOrderId = o.orderId?.toLowerCase().includes(query);
        const matchesTrxId = o.transactionId?.toLowerCase().includes(query);
        if (!matchesOrderId && !matchesTrxId) return false;
      }

      // Filter by platform
      if (platformFilter !== 'all' && o.platform !== platformFilter) return false;

      // Filter by service
      if (serviceFilter !== 'all' && o.serviceType !== serviceFilter) return false;

      // Filter by payment status
      if (paymentFilter !== 'all' && o.paymentStatus !== paymentFilter) return false;

      // Filter by order status
      if (orderStatusFilter !== 'all' && o.orderStatus !== orderStatusFilter) return false;

      return true;
    });
  }, [orders, searchQuery, platformFilter, serviceFilter, paymentFilter, orderStatusFilter]);

  // Status modification
  const handleUpdateStatus = async (
    orderId: string,
    newOrderStatus: OrderStatus,
    newPaymentStatus: PaymentStatus
  ) => {
    try {
      setStatusUpdating(true);
      await updateOrderStatuses(orderId, newOrderStatus, newPaymentStatus);
      if (selectedOrder && selectedOrder.orderId === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          orderStatus: newOrderStatus,
          paymentStatus: newPaymentStatus,
        });
      }

      // Fire UI toast notification according to updated status
      if (newPaymentStatus === 'verified') {
        notifyPaymentApproved(orderId);
      } else if (newOrderStatus === 'processing') {
        notifyOrderProcessing(orderId);
      } else {
        showToast({
          type: 'success',
          title: 'Order Status Updated',
          message: `Order #${orderId} status set to ${newOrderStatus} (${newPaymentStatus}).`,
          orderId,
        });
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Order status update karne me masla paish aaya. Barah-e-karam dobara koshish karein.',
        orderId,
      });
    } finally {
      setStatusUpdating(false);
    }
  };

  // Save admin settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveAdminSettings(formSettings);
      onUpdateSettings(formSettings);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Failed to save settings to Firestore.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] text-neutral-100 p-4 sm:p-6 lg:p-8 space-y-8 animate-fadeIn">
      {/* Admin Top Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Return to App"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-neutral-100 tracking-tight">
                Staff Administration Dashboard
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono font-bold">
                Protected Mode
              </span>
            </div>
            <p className="text-xs text-neutral-300 mt-0.5">
              Secure Firestore Management & Live Pricing Configuration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="flex rounded-xl bg-neutral-900 p-1 border border-neutral-800">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Order Feed ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Platform Settings</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('seo')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'seo'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>SEO & Sitemap</span>
            </button>
          </div>

          {/* Test Toast Preview Trigger */}
          <div className="hidden md:flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Test Toast:</span>
            <button
              type="button"
              onClick={() => notifyPaymentApproved('ORD-DEMO-PAY', () => {})}
              className="px-2 py-1 text-[11px] font-bold rounded-lg bg-emerald-950/70 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/60 transition-colors cursor-pointer"
              title="Test Payment Approved Toast Alert"
            >
              Payment Approved
            </button>
            <button
              type="button"
              onClick={() => notifyOrderProcessing('ORD-DEMO-PROC', () => {})}
              className="px-2 py-1 text-[11px] font-bold rounded-lg bg-blue-950/70 hover:bg-blue-900 text-blue-400 border border-blue-800/60 transition-colors cursor-pointer"
              title="Test Order Processing Toast Alert"
            >
              Processing
            </button>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="p-2.5 rounded-xl bg-neutral-900 hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400 border border-neutral-800 hover:border-rose-900/50 transition-colors cursor-pointer ml-auto"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Metrics Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider">
            Total Orders
          </div>
          <div className="text-2xl font-black text-neutral-100 mt-1 font-mono">
            {stats.totalOrders}
          </div>
          <div className="text-[10px] text-neutral-300 mt-1">All recorded drafts</div>
        </div>

        <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
            Pending Payments
          </div>
          <div className="text-2xl font-black text-amber-400 mt-1 font-mono">
            {stats.pendingPayments}
          </div>
          <div className="text-[10px] text-neutral-300 mt-1">Awaiting TRX check</div>
        </div>

        <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
            Verified Payments
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
            {stats.verifiedPayments}
          </div>
          <div className="text-[10px] text-neutral-300 mt-1">Funds confirmed</div>
        </div>

        <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
            Processing Orders
          </div>
          <div className="text-2xl font-black text-indigo-400 mt-1 font-mono">
            {stats.processingOrders}
          </div>
          <div className="text-[10px] text-neutral-300 mt-1">In active delivery</div>
        </div>

        <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-teal-400 uppercase tracking-wider">
            Completed Orders
          </div>
          <div className="text-2xl font-black text-teal-400 mt-1 font-mono">
            {stats.completedOrders}
          </div>
          <div className="text-[10px] text-neutral-300 mt-1">Fulfilled campaigns</div>
        </div>

        <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-2xl p-4">
          <div className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">
            Total Revenue
          </div>
          <div className="text-xl font-black text-purple-400 mt-1 font-mono">
            Rs. {stats.totalRevenue.toLocaleString()}
          </div>
          <div className="text-[10px] text-neutral-300 mt-1">Verified gross volume</div>
        </div>
      </div>

      {activeTab === 'orders' ? (
        /* Orders View */
        <div className="space-y-4">
          {!currentUser && (
            <div className="bg-amber-950/40 border border-amber-800/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-amber-200">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  <strong>Firestore Live Sync:</strong> Connect your admin Google account (<strong>ndrtechnical@gmail.com</strong>) to stream real-time orders directly from Firestore.
                </span>
              </div>
              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={isSigningIn}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black transition-colors cursor-pointer shrink-0 shadow-sm"
              >
                {isSigningIn ? 'Connecting...' : 'Connect Admin Google'}
              </button>
            </div>
          )}

          {/* Search and Filters Bar */}
          <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search Query */}
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Order ID or Transaction ID..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Platform (TikTok Only) */}
              <div>
                <div className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-300 flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-1.5">
                    <span>🎵</span>
                    <span>Platform: TikTok</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-pink-500/20 text-pink-400 rounded">Only</span>
                </div>
              </div>

              {/* Service Filter */}
              <div>
                <select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">Service: All</option>
                  <option value="views">Views</option>
                  <option value="likes">Likes</option>
                  <option value="comments">Comments</option>
                  <option value="followers">Followers</option>
                  <option value="shares">Shares</option>
                  <option value="saves">Saves</option>
                </select>
              </div>

              {/* Payment Filter */}
              <div>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">Payment: All</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-neutral-300 pt-1 border-t border-neutral-800/60">
              <span>
                Displaying <strong>{filteredOrders.length}</strong> of {orders.length} orders
              </span>
              {(searchQuery || platformFilter !== 'all' || serviceFilter !== 'all' || paymentFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setPlatformFilter('all');
                    setServiceFilter('all');
                    setPaymentFilter('all');
                    setOrderStatusFilter('all');
                  }}
                  className="text-indigo-400 hover:text-indigo-300 cursor-pointer font-semibold"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Orders Table Feed */}
          <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900/60">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900 text-neutral-300 uppercase tracking-wider text-[11px] font-semibold">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Platform & Service</th>
                  <th className="py-3 px-4">Volume / Days</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">TRX ID</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Order Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-neutral-300">
                      No promotion orders found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr
                      key={order.orderId}
                      className="hover:bg-neutral-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-neutral-100">
                        {order.orderId}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-semibold text-neutral-200">
                          <span className="capitalize">{order.platform}</span>
                          <span className="text-neutral-600">•</span>
                          <span className="capitalize text-indigo-400">{order.serviceType}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-neutral-200">
                          {(order.dailyVolume * order.days).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-neutral-300 font-mono">
                          {order.dailyVolume}/day × {order.days}d
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-purple-400">
                        Rs. {order.amount?.toLocaleString()}
                      </td>

                      <td className="py-3 px-4 font-mono text-neutral-300">
                        {order.transactionId || <span className="text-neutral-600 italic">None</span>}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase ${
                            order.paymentStatus === 'verified'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : order.paymentStatus === 'rejected'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {order.paymentStatus || 'Pending'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase ${
                            order.orderStatus === 'completed'
                              ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                              : order.orderStatus === 'processing'
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              : order.orderStatus === 'payment_verified'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : order.orderStatus === 'cancelled'
                              ? 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                              : 'bg-neutral-800 text-neutral-300'
                          }`}
                        >
                          {order.orderStatus ? order.orderStatus.replace('_', ' ') : 'Pending'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Manage</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Admin Settings View */
        <div className="max-w-3xl mx-auto bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div>
              <h2 className="text-xl font-black text-neutral-100 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-pink-500" />
                <span>TikTok Promote Pricing Engine & Formula</span>
              </h2>
              <p className="text-xs text-neutral-300 mt-1">
                Centralized campaign pricing parameters saved to Firestore. Never hardcoded.
              </p>
            </div>
            {settingsSaved && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Saved & Propagated</span>
              </span>
            )}
          </div>

          {/* Live Mathematical Formula & Rate Inspector */}
          {(() => {
            const previewConfig = getPricingConfig(formSettings);
            const baseCost = getBaseCostPerView(formSettings);
            const sellingCost = getSellingCostPerView(formSettings);
            const rate1k = getRatePer1000Views(formSettings);
            const minReach = getMinimumReach(formSettings);

            return (
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Live Formula Metrics (Preview)
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400">
                    baseCost = {previewConfig.baseAdCost} / {previewConfig.baseViews} = Rs {baseCost.toFixed(5)}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 block uppercase font-semibold">1k Views Rate</span>
                    <span className="text-sm font-black text-pink-400 font-mono">
                      Rs. {rate1k.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 block uppercase font-semibold">Min Reach (Rs 200)</span>
                    <span className="text-sm font-black text-emerald-400 font-mono">
                      ~{minReach.toLocaleString()} Views
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 block uppercase font-semibold">10k Views Rate</span>
                    <span className="text-sm font-black text-blue-400 font-mono">
                      Rs. {(10 * rate1k).toFixed(0)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 block uppercase font-semibold">100k Views Rate</span>
                    <span className="text-sm font-black text-purple-400 font-mono">
                      Rs. {(100 * rate1k).toFixed(0)}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-neutral-400 flex flex-wrap items-center justify-between pt-1 border-t border-neutral-800/60">
                  <span>Selling Cost/View: <strong className="text-white font-mono">Rs {sellingCost.toFixed(5)}</strong> (+{previewConfig.profitPercentage}% profit)</span>
                  <span>Minimum Order Gate: <strong className="text-emerald-400 font-mono">Rs. {previewConfig.minimumOrderAmount}</strong></span>
                </div>
              </div>
            );
          })()}

          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* 1. Base Ad Cost */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                  1. Base Ad Cost (PKR)
                </label>
                <input
                  type="number"
                  min="100"
                  step="10"
                  value={formSettings.baseAdCost ?? 1450}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, baseAdCost: parseInt(e.target.value) || 1450 })
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm font-mono text-pink-400 focus:outline-none focus:border-pink-500"
                  required
                />
                <p className="text-[11px] text-neutral-400">TikTok baseline campaign expense (Default: Rs. 1,450)</p>
              </div>

              {/* 2. Base Reach / Video Views */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                  2. Base Video Views
                </label>
                <input
                  type="number"
                  min="1000"
                  step="100"
                  value={formSettings.baseViews ?? 24840}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, baseViews: parseInt(e.target.value) || 24840 })
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm font-mono text-pink-400 focus:outline-none focus:border-pink-500"
                  required
                />
                <p className="text-[11px] text-neutral-400">Views generated from base ad cost (Default: 24,840)</p>
              </div>

              {/* 3. Profit Percentage */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                  3. Profit Margin (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  step="1"
                  value={formSettings.profitPercentage ?? 30}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, profitPercentage: parseInt(e.target.value) || 30 })
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                  required
                />
                <p className="text-[11px] text-neutral-400">Percentage markup added over base cost (Default: 30%)</p>
              </div>

              {/* 4. Minimum Order Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                  4. Minimum Order Amount (PKR)
                </label>
                <input
                  type="number"
                  min="50"
                  step="10"
                  value={formSettings.minimumOrderAmount ?? 200}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, minimumOrderAmount: parseInt(e.target.value) || 200 })
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm font-mono text-amber-400 focus:outline-none focus:border-amber-500"
                  required
                />
                <p className="text-[11px] text-neutral-400">Order cutoff floor for customer checkout (Default: Rs. 200)</p>
              </div>

              {/* 5. Minimum Days */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                  5. Minimum Campaign Days
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formSettings.minimumDays ?? 1}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, minimumDays: parseInt(e.target.value) || 1 })
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm font-mono text-blue-400 focus:outline-none focus:border-blue-500"
                  required
                />
                <p className="text-[11px] text-neutral-400">Lower bound duration slider (Default: 1 Day)</p>
              </div>

              {/* 6. Maximum Days */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                  6. Maximum Campaign Days
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={formSettings.maximumDays ?? 30}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, maximumDays: parseInt(e.target.value) || 30 })
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm font-mono text-purple-400 focus:outline-none focus:border-purple-500"
                  required
                />
                <p className="text-[11px] text-neutral-400">Upper bound duration slider (Default: 30 Days)</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setFormSettings({ ...DEFAULT_SETTINGS })}
                className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Factory Defaults (Rs 1,450 / 24,840 / 30% / Rs 200)</span>
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-sm shadow-lg shadow-pink-600/25 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save TikTok Promote Rules</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SEO & Search Keywords Management Tab */}
      {activeTab === 'seo' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Domain Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Primary Domain</span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Configured
                </span>
              </div>
              <div className="text-xl font-mono font-bold text-white">viralme.site</div>
              <div className="text-xs text-neutral-400">Canonical: https://viralme.site/</div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">XML Sitemap</span>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-bold"
                >
                  <span>Open Live</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="text-base font-mono font-bold text-blue-300 break-all">
                https://viralme.site/sitemap.xml
              </div>
              <div className="text-xs text-neutral-400">Protocol: sitemaps.org/0.9 • Priority 1.0</div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Indexed Backend Keywords</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[11px] font-bold border border-indigo-500/20">
                  Backend Route Active
                </span>
              </div>
              <div className="text-xl font-mono font-bold text-indigo-300">
                {seoData?.totalKeywordsCount || '38'} Active Keywords
              </div>
              <div className="text-xs text-neutral-400">Targeting TikTok, Insta, YouTube & Easypaisa</div>
            </div>
          </div>

          {/* Search Keywords Catalog & Interactive Tester */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-400" />
                  <span>Backend Search Keywords Engine</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  High-intent search terms served via <code className="text-indigo-400 bg-neutral-950 px-1 py-0.5 rounded">/api/seo/keywords</code> to power Google, Bing, and social search ranking for viralme.site.
                </p>
              </div>

              {/* Keyword Filter Search Input */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter keywords..."
                  value={keywordQuery}
                  onChange={(e) => setKeywordQuery(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Keyword Groups Grid */}
            <div className="space-y-6">
              {seoData?.keywordGroups ? (
                seoData.keywordGroups.map((group: any) => {
                  const filteredWords = keywordQuery
                    ? group.keywords.filter((kw: string) => kw.toLowerCase().includes(keywordQuery.toLowerCase()))
                    : group.keywords;

                  if (keywordQuery && filteredWords.length === 0) return null;

                  return (
                    <div key={group.category} className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <span className="text-sm font-bold text-neutral-200">{group.category}</span>
                          <p className="text-xs text-neutral-400">{group.description}</p>
                        </div>
                        <span className="text-[11px] font-mono text-neutral-500">
                          {filteredWords.length} terms
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {filteredWords.map((kw: string) => (
                          <button
                            key={kw}
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(kw);
                              setCopiedKey(kw);
                              setTimeout(() => setCopiedKey(null), 2000);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-mono transition-colors cursor-pointer group"
                            title="Click to copy keyword"
                          >
                            <span>{kw}</span>
                            {copiedKey === kw ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-2.5 h-2.5 text-neutral-500 group-hover:text-neutral-300" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-neutral-400 py-4">Loading backend keywords...</div>
              )}
            </div>

            {/* Structured Schema.org & Meta Tags Snippet */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                    Sitemap XML & Robots Links
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400">Live on viralme.site</span>
              </div>

              <div className="space-y-2 text-xs font-mono bg-neutral-900 p-4 rounded-xl border border-neutral-800 overflow-x-auto text-neutral-300">
                <div className="flex items-center justify-between gap-4">
                  <span>XML Sitemap: <strong className="text-blue-400">https://viralme.site/sitemap.xml</strong></span>
                  <a
                    href="/sitemap.xml"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-center justify-between gap-4 pt-1 border-t border-neutral-800">
                  <span>Robots File: <strong className="text-emerald-400">https://viralme.site/robots.txt</strong></span>
                  <a
                    href="/robots.txt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-400 hover:underline inline-flex items-center gap-1"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-center justify-between gap-4 pt-1 border-t border-neutral-800">
                  <span>Backend SEO API: <strong className="text-indigo-400">/api/seo/keywords</strong></span>
                  <a
                    href="/api/seo/keywords"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-400 hover:underline inline-flex items-center gap-1"
                  >
                    View JSON <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal / Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto space-y-6">
            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="text-xs text-indigo-400 font-mono font-bold">
                Order Management
              </div>
              <h3 className="text-2xl font-black text-neutral-100 font-mono">
                {selectedOrder.orderId}
              </h3>
            </div>

            {/* Video preview & submitted link */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4">
              {selectedOrder.thumbnail && (
                <img
                  src={selectedOrder.thumbnail}
                  alt="Post Thumbnail"
                  className="w-full sm:w-36 h-24 object-cover rounded-xl border border-neutral-800"
                />
              )}
              <div className="flex-1 space-y-1.5 text-xs">
                <div className="font-bold text-sm text-neutral-100">
                  {selectedOrder.videoTitle || 'Submitted Media Post'}
                </div>
                <div className="text-neutral-400 break-all font-mono">
                  {selectedOrder.videoUrl || 'No video URL attached'}
                </div>
                {selectedOrder.videoUrl && (
                  <a
                    href={selectedOrder.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold mt-1 cursor-pointer"
                  >
                    <span>Open Public Media Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Metric Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
              <div>
                <span className="text-neutral-500 uppercase text-[10px] block">Service</span>
                <span className="font-bold text-neutral-200 capitalize">
                  {selectedOrder.platform} • {selectedOrder.serviceType}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 uppercase text-[10px] block">Volume & Days</span>
                <span className="font-bold text-indigo-400">
                  {(selectedOrder.dailyVolume * selectedOrder.days).toLocaleString()} ({selectedOrder.days}d)
                </span>
              </div>
              <div>
                <span className="text-neutral-500 uppercase text-[10px] block">Est. Reach</span>
                <span className="font-bold text-emerald-400">
                  ~{(selectedOrder.reach * selectedOrder.days).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 uppercase text-[10px] block">Amount (PKR)</span>
                <span className="font-bold text-purple-400 font-mono">
                  Rs. {selectedOrder.amount?.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Transaction ID & Account info */}
            <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Submitted Transaction ID</span>
                <code className="font-mono font-bold text-sm text-neutral-100 bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                  {selectedOrder.transactionId || 'Awaiting customer entry'}
                </code>
              </div>
              <div className="flex items-center justify-between text-neutral-500">
                <span>Customer User ID</span>
                <code className="font-mono text-[11px]">{selectedOrder.userId}</code>
              </div>
            </div>

            {/* Payment Screenshot (if uploaded) */}
            {selectedOrder.paymentScreenshot ? (
              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2">
                <span className="text-neutral-400 text-xs font-semibold block">Customer Payment Screenshot Receipt:</span>
                <a href={selectedOrder.paymentScreenshot} target="_blank" rel="noopener noreferrer">
                  <img
                    src={selectedOrder.paymentScreenshot}
                    alt="Payment Receipt"
                    className="max-h-56 rounded-xl border border-neutral-800 object-contain mx-auto hover:opacity-90 transition-opacity"
                  />
                </a>
              </div>
            ) : null}

            {/* Status Change Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-800">
              {/* Payment Status */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                  Change Payment Status
                </label>
                <div className="flex gap-2">
                  {(['pending', 'verified', 'rejected'] as PaymentStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={statusUpdating}
                      onClick={() => handleUpdateStatus(selectedOrder.orderId, selectedOrder.orderStatus, st)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer border ${
                        selectedOrder.paymentStatus === st
                          ? st === 'verified'
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : st === 'rejected'
                            ? 'bg-rose-600 text-white border-rose-500'
                            : 'bg-amber-600 text-white border-amber-500'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Status */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                  Change Order Status
                </label>
                <select
                  value={selectedOrder.orderStatus}
                  disabled={statusUpdating}
                  onChange={(e) =>
                    handleUpdateStatus(
                      selectedOrder.orderId,
                      e.target.value as OrderStatus,
                      selectedOrder.paymentStatus
                    )
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-100 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="pending">Pending</option>
                  <option value="payment_verified">Payment Verified</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
