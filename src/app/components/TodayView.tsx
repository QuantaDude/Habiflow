import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Check, AlertTriangle, Zap, TrendingUp, TrendingDown, Shield } from 'lucide-react';
import { useHabits } from '../context/HabitContext';

export function TodayView() {
  const {
    activeHabits, today,
    isGoodHabitDone, isBadHabitIndulged,
    toggleGoodHabit, toggleBadHabit,
    calculateDayScore,
  } = useHabits();

  const [feedback, setFeedback] = useState<{ id: string; msg: string; positive: boolean } | null>(null);

  const goodHabits = activeHabits.filter(h => h.type === 'good');
  const badHabits = activeHabits.filter(h => h.type === 'bad');
  const todayScore = calculateDayScore(today);

  const goodDoneCount = goodHabits.filter(h => isGoodHabitDone(h.id, today)).length;
  const badIndulgedCount = badHabits.filter(h => isBadHabitIndulged(h.id, today)).length;
  const badAvoidedCount = badHabits.filter(h => !isBadHabitIndulged(h.id, today)).length;

  const totalGoodPossible = goodHabits.reduce((s, h) => s + h.points, 0);
  const goodProgress = totalGoodPossible > 0 ? (goodHabits.filter(h => isGoodHabitDone(h.id, today)).reduce((s, h) => s + h.points, 0) / totalGoodPossible) * 100 : 0;

  const showFeedback = (id: string, msg: string, positive: boolean) => {
    setFeedback({ id, msg, positive });
    setTimeout(() => setFeedback(null), 1800);
  };

  const handleGoodToggle = (habit: typeof goodHabits[0]) => {
    const wasDone = isGoodHabitDone(habit.id, today);
    toggleGoodHabit(habit.id, today);
    showFeedback(habit.id, wasDone ? `-${habit.points} pts removed` : `+${habit.points} pts earned!`, !wasDone);
  };

  const handleBadToggle = (habit: typeof badHabits[0]) => {
    const wasIndulged = isBadHabitIndulged(habit.id, today);
    toggleBadHabit(habit.id, today);
    showFeedback(habit.id, wasIndulged ? 'Unmarked — stay strong! 💪' : `-${habit.points} pts — oh no!`, wasIndulged);
  };

  const dateLabel = format(new Date(), 'EEEE, MMMM d');

  const getScoreEmoji = () => {
    if (todayScore >= 40) return '🔥';
    if (todayScore >= 20) return '⭐';
    if (todayScore >= 10) return '😊';
    if (todayScore >= 0) return '😐';
    if (todayScore >= -20) return '😬';
    return '😰';
  };

  return (
    <div className="pb-4">
      {/* Score Hero */}
      <div className={`mx-4 mt-4 rounded-3xl p-5 relative overflow-hidden ${
        todayScore >= 0
          ? 'bg-gradient-to-br from-violet-600 to-indigo-700'
          : 'bg-gradient-to-br from-rose-500 to-red-600'
      }`}>
        {/* bg decoration */}
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -right-2 bottom-0 w-20 h-20 rounded-full bg-white/5" />

        <p className="text-white/70 mb-1" style={{ fontSize: '13px' }}>{dateLabel}</p>
        <div className="flex items-end gap-3 mb-4">
          <span style={{ fontSize: '48px', lineHeight: 1 }}>{getScoreEmoji()}</span>
          <div>
            <p className="text-white/70" style={{ fontSize: '12px' }}>Today's Score</p>
            <p className="text-white" style={{ fontSize: '38px', fontWeight: 800, lineHeight: 1 }}>
              {todayScore > 0 ? '+' : ''}{todayScore}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white/15 rounded-2xl p-2.5 text-center">
            <p className="text-white" style={{ fontSize: '18px', fontWeight: 700 }}>{goodDoneCount}/{goodHabits.length}</p>
            <p className="text-white/70" style={{ fontSize: '10px' }}>Good done</p>
          </div>
          <div className="flex-1 bg-white/15 rounded-2xl p-2.5 text-center">
            <p className="text-white" style={{ fontSize: '18px', fontWeight: 700 }}>{badAvoidedCount}/{badHabits.length}</p>
            <p className="text-white/70" style={{ fontSize: '10px' }}>Bad avoided</p>
          </div>
          <div className="flex-1 bg-white/15 rounded-2xl p-2.5 text-center">
            <p className={`${badIndulgedCount > 0 ? 'text-red-300' : 'text-white'}`} style={{ fontSize: '18px', fontWeight: 700 }}>{badIndulgedCount}</p>
            <p className="text-white/70" style={{ fontSize: '10px' }}>Indulged</p>
          </div>
        </div>

        {/* Good Habit Progress Bar */}
        {goodHabits.length > 0 && (
          <div className="mt-3">
            <div className="flex justify-between mb-1">
              <p className="text-white/70" style={{ fontSize: '11px' }}>Good habit progress</p>
              <p className="text-white/70" style={{ fontSize: '11px' }}>{Math.round(goodProgress)}%</p>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${goodProgress}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Feedback Toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            key={feedback.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg ${
              feedback.positive ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            <p style={{ fontSize: '14px', fontWeight: 600 }}>{feedback.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Good Habits Section */}
      <div className="px-4 mt-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
            <TrendingUp size={14} className="text-emerald-600" />
          </div>
          <h3 className="text-gray-800" style={{ fontSize: '15px', fontWeight: 700 }}>Good Habits</h3>
          <span className="ml-auto text-gray-400" style={{ fontSize: '13px' }}>
            {goodDoneCount}/{goodHabits.length} done
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {goodHabits.map((habit) => {
            const done = isGoodHabitDone(habit.id, today);
            return (
              <motion.button
                key={habit.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleGoodToggle(habit)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                  done
                    ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                    : 'bg-white border-gray-100 shadow-sm'
                }`}
              >
                <span style={{ fontSize: '22px' }}>{habit.emoji}</span>
                <div className="flex-1">
                  <p className={done ? 'text-emerald-700' : 'text-gray-800'} style={{ fontSize: '15px', fontWeight: 600 }}>
                    {habit.name}
                  </p>
                  <p className="text-gray-400" style={{ fontSize: '12px' }}>
                    {done ? 'Completed ✓' : 'Tap to mark done'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`${done ? 'text-emerald-500' : 'text-gray-300'}`} style={{ fontSize: '13px', fontWeight: 700 }}>
                    +{habit.points}
                  </span>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    done ? 'bg-emerald-500 shadow-md shadow-emerald-200' : 'border-2 border-gray-200'
                  }`}>
                    {done && <Check size={14} color="white" strokeWidth={3} />}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Bad Habits Section */}
      <div className="px-4 mt-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center">
            <Shield size={14} className="text-red-500" />
          </div>
          <h3 className="text-gray-800" style={{ fontSize: '15px', fontWeight: 700 }}>Bad Habits</h3>
          <span className="ml-auto text-gray-400" style={{ fontSize: '13px' }}>
            tap if you indulged
          </span>
        </div>

        <div className="flex flex-col gap-2 mb-4">
          {badHabits.map((habit) => {
            const indulged = isBadHabitIndulged(habit.id, today);
            return (
              <motion.button
                key={habit.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleBadToggle(habit)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                  indulged
                    ? 'bg-red-50 border-red-200 shadow-sm'
                    : 'bg-white border-gray-100 shadow-sm'
                }`}
              >
                <span style={{ fontSize: '22px' }}>{habit.emoji}</span>
                <div className="flex-1">
                  <p className={indulged ? 'text-red-700' : 'text-gray-800'} style={{ fontSize: '15px', fontWeight: 600 }}>
                    {habit.name}
                  </p>
                  <p className="text-gray-400" style={{ fontSize: '12px' }}>
                    {indulged ? 'Indulged today 😔' : 'Resisting — great job! 💪'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`${indulged ? 'text-red-500' : 'text-gray-300'}`} style={{ fontSize: '13px', fontWeight: 700 }}>
                    -{habit.points}
                  </span>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    indulged ? 'bg-red-500 shadow-md shadow-red-200' : 'border-2 border-gray-200'
                  }`}>
                    {indulged && <AlertTriangle size={13} color="white" strokeWidth={3} />}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Hint */}
        <div className="bg-violet-50 border border-violet-100 rounded-2xl p-3 flex items-start gap-2">
          <Zap size={14} className="text-violet-500 mt-0.5 flex-shrink-0" />
          <p className="text-violet-600" style={{ fontSize: '12px' }}>
            Avoiding bad habits earns you bonus points at the end of the day. Stay strong!
          </p>
        </div>
      </div>
    </div>
  );
}