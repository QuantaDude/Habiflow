import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { encryptData, decryptData } from '../lib/crypto';
import type { Habit, HabitLog } from './HabitContext';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface AuthContextType {
  user:        User | null;
  session:     Session | null;
  syncStatus:  SyncStatus;
  lastSynced:  Date | null;
  syncError:   string | null;

  signUp:     (email: string, password: string, habits: Habit[], logs: HabitLog[]) => Promise<void>;
  signIn:     (email: string, password: string) => Promise<{ habits: Habit[]; logs: HabitLog[] } | null>;
  signOut:    () => Promise<void>;
  pushData:   (habits: Habit[], logs: HabitLog[], password: string) => Promise<void>;
  pullData:   (password: string) => Promise<{ habits: Habit[]; logs: HabitLog[] } | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// We keep the encryption password in memory only (never stored)
let _sessionPassword: string | null = null;

export function setSessionPassword(p: string)  { _sessionPassword = p; }
export function clearSessionPassword()          { _sessionPassword = null; }
export function getSessionPassword(): string | null { return _sessionPassword; }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,       setUser]       = useState<User | null>(null);
  const [session,    setSession]    = useState<Session | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncError,  setSyncError]  = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (!sess) clearSessionPassword();
    });
    return () => subscription.unsubscribe();
  }, []);

  const pushData = useCallback(async (habits: Habit[], logs: HabitLog[], password: string) => {
    setSyncStatus('syncing');
    setSyncError(null);
    try {
      const supabase  = getSupabase();
      const payload   = JSON.stringify({ habits, logs });
      const encrypted = await encryptData(payload, password);
      const { error } = await supabase.from('habit_sync').upsert({
        user_id:    user!.id,
        ciphertext: encrypted.ciphertext,
        salt:       encrypted.salt,
        iv:         encrypted.iv,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (error) throw error;
      setLastSynced(new Date());
      setSyncStatus('success');
    } catch (err: any) {
      setSyncError(err?.message ?? 'Sync failed');
      setSyncStatus('error');
      throw err;
    }
  }, [user]);

  const pullData = useCallback(async (password: string) => {
    setSyncStatus('syncing');
    setSyncError(null);
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('habit_sync')
        .select('ciphertext, salt, iv')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      if (!data) return null;
      const plaintext = await decryptData(
        { ciphertext: data.ciphertext, salt: data.salt, iv: data.iv },
        password
      );
      const parsed = JSON.parse(plaintext) as { habits: Habit[]; logs: HabitLog[] };
      setLastSynced(new Date());
      setSyncStatus('success');
      return parsed;
    } catch (err: any) {
      const msg = err?.message?.includes('operation-specific')
        ? 'Wrong password — could not decrypt data.'
        : (err?.message ?? 'Pull failed');
      setSyncError(msg);
      setSyncStatus('error');
      throw new Error(msg);
    }
  }, [user]);

  const signUp = useCallback(async (email: string, password: string, habits: Habit[], logs: HabitLog[]) => {
    setSyncStatus('syncing');
    setSyncError(null);
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error('Sign up failed — no user returned.');
      setSessionPassword(password);
      const payload   = JSON.stringify({ habits, logs });
      const encrypted = await encryptData(payload, password);
      await supabase.from('habit_sync').insert({
        user_id:    data.user.id,
        ciphertext: encrypted.ciphertext,
        salt:       encrypted.salt,
        iv:         encrypted.iv,
        updated_at: new Date().toISOString(),
      });
      setLastSynced(new Date());
      setSyncStatus('success');
    } catch (err: any) {
      setSyncError(err?.message ?? 'Sign up failed');
      setSyncStatus('error');
      throw err;
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setSyncStatus('syncing');
    setSyncError(null);
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setSessionPassword(password);
      const { data: row, error: rowErr } = await supabase
        .from('habit_sync')
        .select('ciphertext, salt, iv')
        .eq('user_id', data.user.id)
        .single();
      if (rowErr || !row) {
        setSyncStatus('success');
        return null;
      }
      const plaintext = await decryptData(
        { ciphertext: row.ciphertext, salt: row.salt, iv: row.iv },
        password
      );
      const parsed = JSON.parse(plaintext) as { habits: Habit[]; logs: HabitLog[] };
      setLastSynced(new Date());
      setSyncStatus('success');
      return parsed;
    } catch (err: any) {
      const msg = err?.message?.includes('operation-specific')
        ? 'Wrong password — data decryption failed.'
        : (err?.message ?? 'Sign in failed');
      setSyncError(msg);
      setSyncStatus('error');
      throw new Error(msg);
    }
  }, []);

  const signOut = useCallback(async () => {
    clearSessionPassword();
    if (isSupabaseConfigured()) await getSupabase().auth.signOut();
    setSyncStatus('idle');
    setLastSynced(null);
    setSyncError(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, session, syncStatus, lastSynced, syncError,
      signUp, signIn, signOut, pushData, pullData,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}