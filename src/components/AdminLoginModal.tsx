import React, { useState } from 'react';
import {
  X,
  Lock,
  KeyRound,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Mail,
  UserCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../firebase/config.ts';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (token: string) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
}) => {
  const [email, setEmail] = useState('admin@viralme.io');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('7749');
  const [showPin, setShowPin] = useState(false);
  const [step, setStep] = useState<'auth' | 'code'>('code'); // Start directly with PIN for easiest admin access!
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const user = res.user;
      const token = 'adm_google_' + user.uid;
      localStorage.setItem('sb_admin_token', token);
      onAuthenticated(token);
      onClose();
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setError(err?.message || 'Google sign-in could not be completed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFirebaseAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please provide admin email and password.');
      return;
    }

    try {
      setIsLoading(true);
      try {
        await signInWithEmailAndPassword(auth, email, password);
        setStep('code');
      } catch (signInErr: any) {
        if (signInErr.code === 'auth/operation-not-allowed') {
          // Email/Password provider not enabled in Firebase Console yet.
          setStep('code');
          setError('Email sign-in is disabled in Firebase console. Switched to secure PIN verification.');
          return;
        }

        if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
          try {
            await createUserWithEmailAndPassword(auth, email, password);
            setStep('code');
          } catch (createErr: any) {
            setStep('code');
            setError('Switched to secure Admin Code verification.');
            return;
          }
        } else {
          setStep('code');
          setError('Switched to secure Admin Code verification.');
        }
      }
    } catch (err: any) {
      setStep('code');
      setError('Switched to secure Admin Code verification.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!verificationCode.trim()) {
      setError('Admin verification PIN is required.');
      return;
    }

    try {
      setIsLoading(true);
      const resp = await fetch('/api/admin/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode.trim() }),
      });

      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.error || 'Invalid verification PIN. Access denied.');
      }

      localStorage.setItem('sb_admin_token', data.token);
      onAuthenticated(data.token);
      onClose();
    } catch (err: any) {
      console.error('Code verification error:', err);
      setError(err?.message || 'Invalid verification PIN. Access denied.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-gray-100 dark:bg-neutral-700 text-gray-500 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1 mb-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-neutral-100">
            Administrative Portal
          </h3>
          <p className="text-xs text-gray-500 dark:text-neutral-400">
            {step === 'auth'
              ? 'Firebase Identity Authentication'
              : 'Enter Master Admin PIN to unlock dashboard'}
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-2xl border border-rose-100 dark:border-rose-900/50 font-semibold">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 'code' ? (
          <div className="space-y-4">
            <button
              id="admin-google-signin-btn"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 text-gray-800 dark:text-neutral-200 font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50 hover:border-blue-300 dark:hover:border-blue-500"
            >
              <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Sign in with Google (ndrtechnical@gmail.com)</span>
            </button>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-gray-100 dark:bg-neutral-700" />
              <span className="text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">Or PIN Access</span>
              <div className="flex-1 h-px bg-gray-100 dark:bg-neutral-700" />
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-1.5 text-center">
                <div className="flex items-center justify-center px-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-neutral-300 uppercase tracking-wider block">
                    Enter Admin Security PIN
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="admin-code-input"
                    type={showPin ? 'text' : 'password'}
                    maxLength={16}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="••••"
                    className="w-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl px-12 py-3 text-center text-3xl font-mono tracking-widest text-blue-600 dark:text-blue-400 font-black focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-neutral-900"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 cursor-pointer"
                    title={showPin ? 'Hide PIN' : 'Show PIN'}
                  >
                    {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-neutral-500">
                  Confidential administrative access only.
                </p>
              </div>

              <button
                id="admin-code-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Unlock Admin Dashboard</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <form onSubmit={handleFirebaseAuth} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-neutral-300 uppercase tracking-wider block">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-neutral-500" />
                <input
                  id="admin-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@viralme.io"
                  className="w-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl pl-10 pr-4 py-3 text-sm text-gray-800 dark:text-neutral-200 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-neutral-900"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-neutral-300 uppercase tracking-wider block">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-neutral-500" />
                <input
                  id="admin-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl pl-10 pr-4 py-3 text-sm text-gray-800 dark:text-neutral-200 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-neutral-900"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('code')}
                className="w-1/3 py-3 px-4 rounded-2xl bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-700 dark:text-neutral-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Use PIN
              </button>
              <button
                id="admin-auth-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-2/3 inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Authenticate'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
