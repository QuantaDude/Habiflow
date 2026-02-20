import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Cloud, Lock, Mail, Eye, EyeOff,
  LogIn, UserPlus, LogOut, Upload, Download,
  CheckCircle, AlertCircle, Loader, Info, Shield,
  CloudOff,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth, getSessionPassword, setSessionPassword } from '../context/AuthContext';
import { useHabits } from '../context/HabitContext';
import { isSupabaseConfigured } from '../lib/supabase';

interface SyncModalProps {
  onClose: () => void;
}

type Screen = 'home' | 'login' | 'signup' | 'synced' | 'setup';

export function SyncModal({ onClose }: SyncModalProps) {
  const { user, syncStatus, lastSynced, syncError, signUp, signIn, signOut, pushData, pullData } = useAuth();
  const { exportData, importData, activeHabits, logs } = useHabits();

  const [screen, setScreen]           = useState<Screen>(user ? 'synced' : 'home');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPw, setConfirmPw]     = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [localError, setLocalError]   = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);

  const supabaseReady = isSupabaseConfigured();

  const clearForm = () => {
    setEmail(''); setPassword(''); setConfirmPw('');
    setLocalError(null); setLoading(false);
  };

  const handleSignUp = async () => {
    setLocalError(null);
    if (!email.trim()) return setLocalError('Email is required.');
    if (password.length < 8) return setLocalError('Password must be at least 8 characters.');
    if (password !== confirmPw) return setLocalError('Passwords do not match.');
    setLoading(true);
    try {
      const { habits, logs: allLogs } = exportData();
      await signUp(email.trim(), password, habits, allLogs);
      clearForm();
      setScreen('synced');
    } catch (e: any) {
      setLocalError(e.message ?? 'Sign up failed.');
    } finally { setLoading(false); }
  };

  const handleSignIn = async () => {
    setLocalError(null);
    if (!email.trim() || !password) return setLocalError('Email and password are required.');
    setLoading(true);
    try {
      const result = await signIn(email.trim(), password);
      if (result) {
        importData(result.habits, result.logs);
      }
      clearForm();
      setScreen('synced');
    } catch (e: any) {
      setLocalError(e.message ?? 'Sign in failed.');
    } finally { setLoading(false); }
  };

  const handlePush = async () => {
    setLocalError(null);
    const pw = getSessionPassword();
    if (!pw) return setLocalError('Session password not found. Please sign in again.');
    setLoading(true);
    try {
      const { habits, logs: allLogs } = exportData();
      await pushData(habits, allLogs, pw);
    } catch (e: any) {
      setLocalError(e.message ?? 'Sync failed.');
    } finally { setLoading(false); }
  };

  const handlePull = async () => {
    setLocalError(null);
    const pw = getSessionPassword();
    if (!pw) return setLocalError('Session password not found. Please sign in again.');
    setLoading(true);
    try {
      const result = await pullData(pw);
      if (result) {
        importData(result.habits, result.logs);
      }
    } catch (e: any) {
      setLocalError(e.message ?? 'Pull failed.');
    } finally { setLoading(false); }
  };

  const handleSignOut = async () => {
    await signOut();
    clearForm();
    setScreen('home');
  };

  // SQL setup moved to README.md

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          className="relative w-full max-w-md bg-white rounded-t-3xl overflow-hidden flex flex-col"
          style={{ maxHeight: '90vh' }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 400 }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-3 pt-1 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center">
                <Cloud size={16} className="text-violet-600" />
              </div>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 700 }} className="text-gray-900">Cloud Sync</h2>
                <p style={{ fontSize: '11px' }} className="text-gray-400">
                  {user ? user.email : 'Encrypted • Email & password only'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-gray-100">
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-5 pb-8">

            {/* ── Not Configured ── */}
            {!supabaseReady && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex gap-3">
                <CloudOff size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600 }} className="text-gray-600 mb-1">Sync unavailable</p>
                  <p style={{ fontSize: '12px' }} className="text-gray-400">
                    Cloud sync is not configured for this installation. Your data is still saved locally on this device.
                  </p>
                </div>
              </div>
            )}

            {/* ── Home screen ── */}
            {supabaseReady && screen === 'home' && (
              <div className="flex flex-col gap-4">
                {/* Encryption info */}
                <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 flex gap-3">
                  <Shield size={18} className="text-violet-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600 }} className="text-violet-700 mb-1">End-to-end encrypted</p>
                    <p style={{ fontSize: '12px' }} className="text-violet-600">
                      Your habits are encrypted with your password using AES-256-GCM before leaving your device. 
                      Only you can decrypt them — not even the server can read your data.
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 flex gap-2">
                  <Info size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p style={{ fontSize: '11px' }} className="text-amber-700">
                    <strong>Remember your password!</strong> If you forget it, your encrypted cloud data cannot be recovered. Local data on this device is always safe.
                  </p>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { clearForm(); setScreen('login'); }}
                  className="w-full py-4 bg-violet-600 text-white rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-violet-200"
                >
                  <LogIn size={18} />
                  <span style={{ fontSize: '16px', fontWeight: 700 }}>Sign In</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { clearForm(); setScreen('signup'); }}
                  className="w-full py-4 bg-white border-2 border-violet-200 text-violet-600 rounded-2xl flex items-center justify-center gap-2"
                >
                  <UserPlus size={18} />
                  <span style={{ fontSize: '16px', fontWeight: 700 }}>Create Account</span>
                </motion.button>
              </div>
            )}

            {/* ── Sign In ── */}
            {supabaseReady && screen === 'login' && (
              <div className="flex flex-col gap-4">
                <p style={{ fontSize: '13px' }} className="text-gray-500">
                  Sign in to pull your encrypted habits from the cloud.
                </p>

                <EmailField value={email} onChange={setEmail} />
                <PasswordField
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  show={showPw}
                  onToggle={() => setShowPw(s => !s)}
                  onEnter={handleSignIn}
                />

                {(localError || syncError) && <ErrorBox msg={localError ?? syncError!} />}

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSignIn}
                  disabled={loading}
                  className="w-full py-4 bg-violet-600 text-white rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? <Loader size={18} className="animate-spin" /> : <LogIn size={18} />}
                  <span style={{ fontSize: '16px', fontWeight: 700 }}>{loading ? 'Signing in…' : 'Sign In & Sync'}</span>
                </motion.button>

                <button onClick={() => { clearForm(); setScreen('home'); }} className="text-center text-gray-400" style={{ fontSize: '13px' }}>
                  ← Back
                </button>
              </div>
            )}

            {/* ── Sign Up ── */}
            {supabaseReady && screen === 'signup' && (
              <div className="flex flex-col gap-4">
                <p style={{ fontSize: '13px' }} className="text-gray-500">
                  Create an account to back up your encrypted habits. Your current local data will be uploaded.
                </p>

                <EmailField value={email} onChange={setEmail} />
                <PasswordField
                  label="Password (min 8 chars)"
                  value={password}
                  onChange={setPassword}
                  show={showPw}
                  onToggle={() => setShowPw(s => !s)}
                />
                <PasswordField
                  label="Confirm Password"
                  value={confirmPw}
                  onChange={setConfirmPw}
                  show={showConfirmPw}
                  onToggle={() => setShowConfirmPw(s => !s)}
                  onEnter={handleSignUp}
                />

                {(localError || syncError) && <ErrorBox msg={localError ?? syncError!} />}

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSignUp}
                  disabled={loading}
                  className="w-full py-4 bg-violet-600 text-white rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? <Loader size={18} className="animate-spin" /> : <UserPlus size={18} />}
                  <span style={{ fontSize: '16px', fontWeight: 700 }}>{loading ? 'Creating account…' : 'Create & Backup'}</span>
                </motion.button>

                <button onClick={() => { clearForm(); setScreen('home'); }} className="text-center text-gray-400" style={{ fontSize: '13px' }}>
                  ← Back
                </button>
              </div>
            )}

            {/* ── Synced / Logged in ── */}
            {supabaseReady && screen === 'synced' && user && (
              <div className="flex flex-col gap-4">
                {/* Status card */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
                  <CheckCircle size={20} className="text-emerald-500 flex-shrink-0" />
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600 }} className="text-emerald-700">Sync active</p>
                    <p style={{ fontSize: '12px' }} className="text-emerald-600">
                      {lastSynced ? `Last synced ${format(lastSynced, 'MMM d, h:mm a')}` : 'Ready to sync'}
                    </p>
                  </div>
                </div>

                {/* Data summary */}
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p style={{ fontSize: '24px', fontWeight: 800 }} className="text-violet-600">{activeHabits.length}</p>
                    <p style={{ fontSize: '11px' }} className="text-gray-400">Active habits</p>
                  </div>
                  <div className="text-center">
                    <p style={{ fontSize: '24px', fontWeight: 800 }} className="text-violet-600">{logs.length}</p>
                    <p style={{ fontSize: '11px' }} className="text-gray-400">Log entries</p>
                  </div>
                </div>

                {syncStatus === 'error' && (localError || syncError) && (
                  <ErrorBox msg={localError ?? syncError!} />
                )}

                {/* Push */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handlePush}
                  disabled={loading || syncStatus === 'syncing'}
                  className="w-full py-4 bg-violet-600 text-white rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-violet-200 disabled:opacity-60"
                >
                  {loading && syncStatus === 'syncing'
                    ? <Loader size={18} className="animate-spin" />
                    : <Upload size={18} />
                  }
                  <div className="text-left">
                    <div style={{ fontSize: '15px', fontWeight: 700 }}>Push to Cloud</div>
                    <div style={{ fontSize: '11px', opacity: 0.8 }}>Encrypt & upload local data</div>
                  </div>
                </motion.button>

                {/* Pull */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handlePull}
                  disabled={loading || syncStatus === 'syncing'}
                  className="w-full py-4 bg-white border-2 border-violet-200 text-violet-600 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Download size={18} />
                  <div className="text-left">
                    <div style={{ fontSize: '15px', fontWeight: 700 }}>Pull from Cloud</div>
                    <div style={{ fontSize: '11px', opacity: 0.7 }}>Replace local with cloud data</div>
                  </div>
                </motion.button>

                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 flex gap-2">
                  <Info size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
                  <p style={{ fontSize: '11px' }} className="text-blue-600">
                    Pull will <strong>overwrite</strong> your local data with the cloud version. Push will <strong>overwrite</strong> cloud with your local data.
                  </p>
                </div>

                {/* Sign out */}
                <button
                  onClick={handleSignOut}
                  className="w-full py-3 rounded-2xl border border-red-200 text-red-500 flex items-center justify-center gap-2"
                >
                  <LogOut size={16} />
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Helper sub-components ──────────────────────────────────────

function EmailField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-gray-500 mb-1.5 block" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
      <div className="relative">
        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="email"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="you@example.com"
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 outline-none focus:border-violet-400"
          style={{ fontSize: '15px' }}
          autoComplete="email"
        />
      </div>
    </div>
  );
}

function PasswordField({
  label, value, onChange, show, onToggle, onEnter,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  onEnter?: () => void;
}) {
  return (
    <div>
      <label className="text-gray-500 mb-1.5 block" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <div className="relative">
        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onEnter?.()}
          placeholder="••••••••"
          className="w-full pl-10 pr-12 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 outline-none focus:border-violet-400"
          style={{ fontSize: '15px' }}
          autoComplete="current-password"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2">
      <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
      <p style={{ fontSize: '13px' }} className="text-red-600">{msg}</p>
    </div>
  );
}