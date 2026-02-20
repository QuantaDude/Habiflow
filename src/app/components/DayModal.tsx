import { motion, AnimatePresence } from 'motion/react';
import { X, Check, AlertTriangle, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useHabits } from '../context/HabitContext';

interface DayModalProps {
  date: string;
  onClose: () => void;
}

export function DayModal({ date, onClose }: DayModalProps) {
  const {
    habits, today,
    isGoodHabitDone, isBadHabitIndulged,
    toggleGoodHabit, toggleBadHabit,
    calculateDayScore,
    getDayDetails,
    logs,
  } = useHabits();

  const isPast    = date < today;
  const isToday   = date === today;
  const isFuture  = date > today;

  // Habits visible in the day modal:
  //   - active habits: always show
  //   - deleted habits: show in past data (they show up in history per spec)
  //   - archived habits: hidden (they are hidden "when seeing the past data")
  const visibleGoodHabits = habits.filter(h =>
    h.type === 'good' && h.status !== 'archived'
  );
  const visibleBadHabits  = habits.filter(h =>
    h.type === 'bad'  && h.status !== 'archived'
  );

  // Only show deleted habits that actually have log entries for this date
  const goodHabitsToShow = visibleGoodHabits.filter(h =>
    h.status === 'active' || logs.some(l => l.date === date && l.habitId === h.id)
  );
  const badHabitsToShow  = visibleBadHabits.filter(h =>
    h.status === 'active' || logs.some(l => l.date === date && l.habitId === h.id)
  );

  const score   = calculateDayScore(date);
  const details = getDayDetails(date);

  const dateObj  = parseISO(date);
  const dayLabel = isToday ? 'Today' : format(dateObj, 'EEEE');
  const dateLabel = format(dateObj, 'MMMM d, yyyy');

  const canToggle = (status: string) => !isFuture && status === 'active';

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Sheet */}
        <motion.div
          className="relative w-full max-w-md bg-white rounded-t-3xl overflow-hidden"
          style={{ maxHeight: '85vh' }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 400 }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-start justify-between px-5 pb-3 pt-1">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-gray-900" style={{ fontSize: '18px', fontWeight: 700 }}>{dayLabel}</h2>
                {isToday && (
                  <span className="bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full" style={{ fontSize: '11px', fontWeight: 600 }}>Today</span>
                )}
                {isPast && (
                  <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full" style={{ fontSize: '11px', fontWeight: 600 }}>Past</span>
                )}
              </div>
              <p className="text-gray-400" style={{ fontSize: '13px' }}>{dateLabel}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-gray-100 text-gray-500">
              <X size={16} />
            </button>
          </div>

          {/* Score Summary */}
          {!isFuture && (
            <div className={`mx-5 mb-4 p-3 rounded-2xl flex items-center justify-between ${
              score > 0 ? 'bg-emerald-50 border border-emerald-100' :
              score < 0 ? 'bg-red-50 border border-red-100' :
              'bg-gray-50 border border-gray-100'
            }`}>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: '22px' }}>{score > 0 ? '🌟' : score < 0 ? '⚠️' : '😐'}</span>
                <div>
                  <p style={{ fontSize: '11px' }} className="text-gray-500">Day Score</p>
                  <p style={{ fontSize: '20px', fontWeight: 700 }} className={
                    score > 0 ? 'text-emerald-600' : score < 0 ? 'text-red-500' : 'text-gray-400'
                  }>
                    {score > 0 ? '+' : ''}{score}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 text-right">
                {details.goodDone > 0 && (
                  <div>
                    <p style={{ fontSize: '16px', fontWeight: 700 }} className="text-emerald-500">+{details.goodDone}</p>
                    <p style={{ fontSize: '10px' }} className="text-gray-400">good done</p>
                  </div>
                )}
                {details.badIndulged > 0 && (
                  <div>
                    <p style={{ fontSize: '16px', fontWeight: 700 }} className="text-red-500">-{details.badIndulged}</p>
                    <p style={{ fontSize: '10px' }} className="text-gray-400">indulged</p>
                  </div>
                )}
                {details.badAvoided > 0 && (
                  <div>
                    <p style={{ fontSize: '16px', fontWeight: 700 }} className="text-blue-500">+{details.badAvoided}</p>
                    <p style={{ fontSize: '10px' }} className="text-gray-400">avoided</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {isFuture && (
            <div className="mx-5 mb-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
              <p className="text-gray-400" style={{ fontSize: '14px' }}>Future days are not yet trackable</p>
            </div>
          )}

          {/* Habits List */}
          {!isFuture && (
            <div className="overflow-y-auto px-5 pb-8" style={{ maxHeight: 'calc(85vh - 230px)' }}>

              {/* Good Habits */}
              {goodHabitsToShow.length > 0 && (
                <>
                  <p className="text-gray-400 mb-2" style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Good Habits
                  </p>
                  <div className="flex flex-col gap-2 mb-4">
                    {goodHabitsToShow.map(habit => {
                      const done    = isGoodHabitDone(habit.id, date);
                      const deleted = habit.status === 'deleted';
                      const clickable = canToggle(habit.status);
                      return (
                        <motion.button
                          key={habit.id}
                          whileTap={clickable ? { scale: 0.98 } : {}}
                          onClick={() => clickable && toggleGoodHabit(habit.id, date)}
                          disabled={!clickable}
                          className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                            done     ? 'bg-emerald-50 border-emerald-200' :
                            deleted  ? 'bg-gray-50 border-gray-100 opacity-70' :
                            'bg-white border-gray-100'
                          }`}
                        >
                          <span style={{ fontSize: '20px', opacity: deleted ? 0.5 : 1 }}>{habit.emoji}</span>
                          <span className={`flex-1 ${done ? 'text-emerald-700' : 'text-gray-700'}`} style={{ fontSize: '15px', fontWeight: 500 }}>
                            {habit.name}
                          </span>
                          {deleted && (
                            <span className="flex items-center gap-1 bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full" style={{ fontSize: '10px' }}>
                              <Trash2 size={10} /> deleted
                            </span>
                          )}
                          {!deleted && (
                            <span className="text-emerald-500" style={{ fontSize: '12px', fontWeight: 600 }}>+{habit.points}</span>
                          )}
                          {!deleted && (
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                              done ? 'bg-emerald-500' : 'border-2 border-gray-200'
                            }`}>
                              {done && <Check size={12} color="white" strokeWidth={3} />}
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Bad Habits */}
              {badHabitsToShow.length > 0 && (
                <>
                  <p className="text-gray-400 mb-2" style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Bad Habits — tap if you indulged
                  </p>
                  <div className="flex flex-col gap-2">
                    {badHabitsToShow.map(habit => {
                      const indulged = isBadHabitIndulged(habit.id, date);
                      const deleted  = habit.status === 'deleted';
                      const clickable = canToggle(habit.status);
                      return (
                        <motion.button
                          key={habit.id}
                          whileTap={clickable ? { scale: 0.98 } : {}}
                          onClick={() => clickable && toggleBadHabit(habit.id, date)}
                          disabled={!clickable}
                          className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                            indulged ? 'bg-red-50 border-red-200' :
                            deleted  ? 'bg-gray-50 border-gray-100 opacity-70' :
                            'bg-white border-gray-100'
                          }`}
                        >
                          <span style={{ fontSize: '20px', opacity: deleted ? 0.5 : 1 }}>{habit.emoji}</span>
                          <span className={`flex-1 ${indulged ? 'text-red-700' : 'text-gray-700'}`} style={{ fontSize: '15px', fontWeight: 500 }}>
                            {habit.name}
                          </span>
                          {deleted && (
                            <span className="flex items-center gap-1 bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full" style={{ fontSize: '10px' }}>
                              <Trash2 size={10} /> deleted
                            </span>
                          )}
                          {!deleted && (
                            <span className={indulged ? 'text-red-500' : 'text-gray-300'} style={{ fontSize: '12px', fontWeight: 600 }}>
                              -{habit.points}
                            </span>
                          )}
                          {!deleted && (
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                              indulged ? 'bg-red-500' : 'border-2 border-gray-200'
                            }`}>
                              {indulged && <AlertTriangle size={11} color="white" strokeWidth={3} />}
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </>
              )}

              {isPast && (
                <div className="mt-4 p-3 rounded-2xl bg-blue-50 border border-blue-100">
                  <p className="text-blue-600" style={{ fontSize: '12px' }}>
                    💡 Bad habits not marked as indulged on past days are automatically counted as avoided and add bonus points.
                  </p>
                </div>
              )}

              {goodHabitsToShow.length === 0 && badHabitsToShow.length === 0 && (
                <div className="text-center py-8">
                  <p style={{ fontSize: '36px' }}>📭</p>
                  <p className="text-gray-400 mt-2" style={{ fontSize: '14px' }}>No habit data for this day</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
