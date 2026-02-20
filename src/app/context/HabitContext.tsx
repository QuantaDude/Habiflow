import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';

export type HabitStatus = 'active' | 'archived' | 'deleted';

export interface Habit {
  id: string;
  name: string;
  type: 'good' | 'bad';
  points: number;
  emoji: string;
  /** 'active' = normal | 'archived' = hidden everywhere but score preserved | 'deleted' = hidden from active but visible in past day data */
  status: HabitStatus;
}

export interface HabitLog {
  id: string;
  date: string; // YYYY-MM-DD
  habitId: string;
  action: 'done' | 'indulged';
  timestamp: number;
}

const DEFAULT_HABITS: Habit[] = [
  { id: 'h1', name: 'Exercise', type: 'good', points: 20, emoji: '🏃', status: 'active' },
  { id: 'h2', name: 'Read', type: 'good', points: 15, emoji: '📚', status: 'active' },
  { id: 'h3', name: 'Meditate', type: 'good', points: 10, emoji: '🧘', status: 'active' },
  { id: 'h4', name: 'Drink Water', type: 'good', points: 5, emoji: '💧', status: 'active' },
  { id: 'h5', name: 'Sleep 8h', type: 'good', points: 15, emoji: '😴', status: 'active' },
  { id: 'h6', name: 'Smoking', type: 'bad', points: 25, emoji: '🚬', status: 'active' },
  { id: 'h7', name: 'Junk Food', type: 'bad', points: 15, emoji: '🍔', status: 'active' },
  { id: 'h8', name: 'Social Media Binge', type: 'bad', points: 10, emoji: '📱', status: 'active' },
  { id: 'h9', name: 'Skip Workout', type: 'bad', points: 10, emoji: '🛋️', status: 'active' },
  { id: 'h10', name: 'Late Night Screen', type: 'bad', points: 10, emoji: '🌙', status: 'active' },
];

const STORAGE_HABITS = 'ht_habits_v3';
const STORAGE_LOGS = 'ht_logs_v2';

interface HabitContextType {
  /** ALL habits (active + archived + deleted) — used for historical score calculation */
  habits: Habit[];
  /** Only active habits — for Today tab / add-habit UI */
  activeHabits: Habit[];
  /** Archived habits — shown in the Archive section of Habits tab */
  archivedHabits: Habit[];
  logs: HabitLog[];
  today: string;

  getLogsForDate: (date: string) => HabitLog[];
  isGoodHabitDone: (habitId: string, date: string) => boolean;
  isBadHabitIndulged: (habitId: string, date: string) => boolean;
  toggleGoodHabit: (habitId: string, date: string) => void;
  toggleBadHabit: (habitId: string, date: string) => void;

  calculateDayScore: (date: string) => number;
  getTotalScore: () => number;
  getScoreLevel: (score: number) => string;
  getDayDetails: (date: string) => { goodDone: number; badIndulged: number; badAvoided: number; score: number };

  addHabit: (habit: Omit<Habit, 'id' | 'status'>) => void;
  /** Soft-delete: habit becomes status='deleted'. Logs kept; shows in past day data. */
  deleteHabit: (id: string) => void;
  /** Archive: habit becomes status='archived'. Hidden everywhere; score still silently counts. */
  archiveHabit: (id: string) => void;
  /** Restore an archived habit back to active. */
  unarchiveHabit: (id: string) => void;
  /** Permanent removal of a habit AND its logs. */
  permanentlyDeleteHabit: (id: string) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;

  /** Export raw data for cloud sync */
  exportData: () => { habits: Habit[]; logs: HabitLog[] };
  /** Import decrypted cloud data (replaces local) */
  importData: (habits: Habit[], logs: HabitLog[]) => void;
}

const HabitContext = createContext<HabitContextType | null>(null);

function migrateHabits(raw: any[]): Habit[] {
  return raw.map(h => ({
    ...h,
    status: h.status ?? 'active', // default legacy habits to active
  }));
}

export function HabitProvider({ children }: { children: React.ReactNode }) {
  const today = format(new Date(), 'yyyy-MM-dd');

  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_HABITS);
      return stored ? migrateHabits(JSON.parse(stored)) : DEFAULT_HABITS;
    } catch { return DEFAULT_HABITS; }
  });

  const [logs, setLogs] = useState<HabitLog[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_LOGS);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  useEffect(() => { localStorage.setItem(STORAGE_HABITS, JSON.stringify(habits)); }, [habits]);
  useEffect(() => { localStorage.setItem(STORAGE_LOGS, JSON.stringify(logs)); }, [logs]);

  const activeHabits = habits.filter(h => h.status === 'active');
  const archivedHabits = habits.filter(h => h.status === 'archived');

  const getLogsForDate = useCallback((date: string) =>
    logs.filter(l => l.date === date), [logs]);

  const isGoodHabitDone = useCallback((habitId: string, date: string) =>
    logs.some(l => l.date === date && l.habitId === habitId && l.action === 'done'), [logs]);

  const isBadHabitIndulged = useCallback((habitId: string, date: string) =>
    logs.some(l => l.date === date && l.habitId === habitId && l.action === 'indulged'), [logs]);

  const toggleGoodHabit = useCallback((habitId: string, date: string) => {
    setLogs(prev => {
      const existing = prev.find(l => l.date === date && l.habitId === habitId && l.action === 'done');
      if (existing) return prev.filter(l => l.id !== existing.id);
      return [...prev, { id: crypto.randomUUID(), date, habitId, action: 'done', timestamp: Date.now() }];
    });
  }, []);

  const toggleBadHabit = useCallback((habitId: string, date: string) => {
    setLogs(prev => {
      const existing = prev.find(l => l.date === date && l.habitId === habitId && l.action === 'indulged');
      if (existing) return prev.filter(l => l.id !== existing.id);
      return [...prev, { id: crypto.randomUUID(), date, habitId, action: 'indulged', timestamp: Date.now() }];
    });
  }, []);

  /**
   * Score calculation uses ALL habits (regardless of status) so that
   * archiving or soft-deleting a habit doesn't retroactively alter history.
   * Days with zero logs return 0 (no phantom avoided-bad-habit bonuses).
   */
  const calculateDayScore = useCallback((date: string) => {
    const dayLogs = logs.filter(l => l.date === date);
    if (dayLogs.length === 0) return 0;
    const isPast = date < today;
    let score = 0;
    for (const habit of habits) {
      if (habit.type === 'good') {
        if (dayLogs.some(l => l.habitId === habit.id && l.action === 'done')) {
          score += habit.points;
        }
      } else {
        if (dayLogs.some(l => l.habitId === habit.id && l.action === 'indulged')) {
          score -= habit.points;
        } else if (isPast) {
          score += Math.floor(habit.points * 0.4);
        }
      }
    }
    return score;
  }, [habits, logs, today]);

  const getTotalScore = useCallback(() => {
    const allDates = new Set<string>();
    logs.forEach(l => allDates.add(l.date));
    let total = 0;
    allDates.forEach(date => { total += calculateDayScore(date); });
    return total;
  }, [logs, calculateDayScore]);

  const getScoreLevel = useCallback((score: number) => {
    if (score >= 40) return 'excellent';
    if (score >= 20) return 'great';
    if (score >= 10) return 'good';
    if (score > 0) return 'ok';
    if (score === 0) return 'neutral';
    if (score > -10) return 'slightly-bad';
    if (score > -20) return 'bad';
    return 'very-bad';
  }, []);

  const getDayDetails = useCallback((date: string) => {
    const dayLogs = logs.filter(l => l.date === date);
    const isPast = date < today;
    // Only count active habits for the "detail" counts (what user sees)
    const goodHabits = habits.filter(h => h.type === 'good' && h.status !== 'archived');
    const badHabits = habits.filter(h => h.type === 'bad' && h.status !== 'archived');
    const goodDone = goodHabits.filter(h => dayLogs.some(l => l.habitId === h.id && l.action === 'done')).length;
    const badIndulged = badHabits.filter(h => dayLogs.some(l => l.habitId === h.id && l.action === 'indulged')).length;
    const badAvoided = isPast ? badHabits.filter(h => !dayLogs.some(l => l.habitId === h.id && l.action === 'indulged')).length : 0;
    return { goodDone, badIndulged, badAvoided, score: calculateDayScore(date) };
  }, [habits, logs, calculateDayScore, today]);

  const addHabit = useCallback((habit: Omit<Habit, 'id' | 'status'>) => {
    setHabits(prev => [...prev, { ...habit, id: crypto.randomUUID(), status: 'active' }]);
  }, []);

  /** Soft-delete: keeps data in history, visible in past day modals */
  const deleteHabit = useCallback((id: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, status: 'deleted' as HabitStatus } : h));
  }, []);

  /** Archive: hidden everywhere, score silently preserved */
  const archiveHabit = useCallback((id: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, status: 'archived' as HabitStatus } : h));
  }, []);

  const unarchiveHabit = useCallback((id: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, status: 'active' as HabitStatus } : h));
  }, []);

  /** Permanent: removes habit AND all its logs */
  const permanentlyDeleteHabit = useCallback((id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    setLogs(prev => prev.filter(l => l.habitId !== id));
  }, []);

  const updateHabit = useCallback((id: string, updates: Partial<Habit>) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  }, []);

  const exportData = useCallback(() => ({ habits, logs }), [habits, logs]);

  const importData = useCallback((newHabits: Habit[], newLogs: HabitLog[]) => {
    const migratedHabits = migrateHabits(newHabits);
    setHabits(migratedHabits);
    setLogs(newLogs);
  }, []);

  return (
    <HabitContext.Provider value={{
      habits, activeHabits, archivedHabits, logs, today,
      getLogsForDate, isGoodHabitDone, isBadHabitIndulged,
      toggleGoodHabit, toggleBadHabit,
      calculateDayScore, getTotalScore, getScoreLevel, getDayDetails,
      addHabit, deleteHabit, archiveHabit, unarchiveHabit, permanentlyDeleteHabit, updateHabit,
      exportData, importData,
    }}>
      {children}
    </HabitContext.Provider>
  );
}

export function useHabits() {
  const ctx = useContext(HabitContext);
  if (!ctx) throw new Error('useHabits must be used within HabitProvider');
  return ctx;
}
