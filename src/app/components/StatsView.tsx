import { useMemo } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { useHabits } from '../context/HabitContext';
import { TrendingUp, TrendingDown, Target, Flame, Star, Shield } from 'lucide-react';

export function StatsView() {
  const { habits, logs, calculateDayScore, getTotalScore, today } = useHabits();

  const totalScore = getTotalScore();
  const goodHabits = habits.filter(h => h.type === 'good');
  const badHabits = habits.filter(h => h.type === 'bad');

  // Last 14 days chart data
  const chartData = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = subDays(new Date(), 13 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const score = calculateDayScore(dateStr);
      const hasLogs = logs.some(l => l.date === dateStr);
      return {
        date: format(d, 'MMM d'),
        score: hasLogs || dateStr === today ? score : 0,
        hasData: hasLogs || dateStr === today,
        dateStr,
      };
    });
  }, [logs, calculateDayScore, today]);

  // Per-habit stats
  const habitStats = useMemo(() => {
    return habits.map(habit => {
      if (habit.type === 'good') {
        const doneLogs = logs.filter(l => l.habitId === habit.id && l.action === 'done');
        return { habit, count: doneLogs.length, label: 'times completed' };
      } else {
        const indulgedLogs = logs.filter(l => l.habitId === habit.id && l.action === 'indulged');
        return { habit, count: indulgedLogs.length, label: 'times indulged' };
      }
    }).sort((a, b) => b.count - a.count);
  }, [habits, logs]);

  const goodHabitStats = habitStats.filter(s => s.habit.type === 'good');
  const badHabitStats = habitStats.filter(s => s.habit.type === 'bad');

  // Streak calculation
  const currentStreak = useMemo(() => {
    let streak = 0;
    for (let i = 0; i <= 365; i++) {
      const d = subDays(new Date(), i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const hasLogs = logs.some(l => l.date === dateStr);
      if (hasLogs) streak++;
      else break;
    }
    return streak;
  }, [logs]);

  // Best day
  const bestDay = useMemo(() => {
    const allDates = [...new Set(logs.map(l => l.date))];
    if (allDates.length === 0) return null;
    let best = { date: allDates[0], score: calculateDayScore(allDates[0]) };
    for (const d of allDates) {
      const s = calculateDayScore(d);
      if (s > best.score) best = { date: d, score: s };
    }
    return best;
  }, [logs, calculateDayScore]);

  const totalGoodDone = logs.filter(l => l.action === 'done').length;
  const totalBadIndulged = logs.filter(l => l.action === 'indulged').length;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const score = payload[0].value;
      return (
        <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-lg">
          <p className="text-gray-500" style={{ fontSize: '11px' }}>{label}</p>
          <p style={{ fontSize: '16px', fontWeight: 700 }} className={score >= 0 ? 'text-emerald-500' : 'text-red-400'}>
            {score > 0 ? '+' : ''}{score} pts
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="pb-4 px-4">
      {/* Total Score Hero */}
      <div className={`mt-4 rounded-3xl p-5 relative overflow-hidden ${
        totalScore >= 0 ? 'bg-gradient-to-br from-violet-600 to-indigo-700' : 'bg-gradient-to-br from-rose-500 to-red-600'
      }`}>
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="flex items-center gap-3">
          <Star size={28} color="rgba(255,255,255,0.8)" />
          <div>
            <p className="text-white/70" style={{ fontSize: '12px' }}>Total Score</p>
            <p className="text-white" style={{ fontSize: '40px', fontWeight: 800, lineHeight: 1 }}>
              {totalScore > 0 ? '+' : ''}{totalScore}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Flame size={16} className="text-orange-400" />
            <span className="text-gray-400" style={{ fontSize: '12px' }}>Current Streak</span>
          </div>
          <p className="text-gray-800" style={{ fontSize: '28px', fontWeight: 800 }}>{currentStreak}</p>
          <p className="text-gray-400" style={{ fontSize: '11px' }}>days tracked</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Star size={16} className="text-yellow-400" />
            <span className="text-gray-400" style={{ fontSize: '12px' }}>Best Day</span>
          </div>
          <p className="text-emerald-500" style={{ fontSize: '28px', fontWeight: 800 }}>
            {bestDay ? `+${bestDay.score}` : '—'}
          </p>
          <p className="text-gray-400" style={{ fontSize: '11px' }}>
            {bestDay ? format(parseISO(bestDay.date), 'MMM d') : 'No data yet'}
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-emerald-400" />
            <span className="text-gray-400" style={{ fontSize: '12px' }}>Good Done</span>
          </div>
          <p className="text-emerald-500" style={{ fontSize: '28px', fontWeight: 800 }}>{totalGoodDone}</p>
          <p className="text-gray-400" style={{ fontSize: '11px' }}>total completions</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={16} className="text-red-400" />
            <span className="text-gray-400" style={{ fontSize: '12px' }}>Indulged</span>
          </div>
          <p className="text-red-400" style={{ fontSize: '28px', fontWeight: 800 }}>{totalBadIndulged}</p>
          <p className="text-gray-400" style={{ fontSize: '11px' }}>bad habit slips</p>
        </div>
      </div>

      {/* 14-Day Chart */}
      <div className="bg-white border border-gray-100 rounded-3xl p-4 mt-4 shadow-sm">
        <h3 className="text-gray-800 mb-4" style={{ fontSize: '15px', fontWeight: 700 }}>Last 14 Days</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval={2} />
            <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
            <ReferenceLine y={0} stroke="#e5e7eb" />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(124,58,237,0.05)' }} />
            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={!entry.hasData ? '#e5e7eb' : entry.score >= 0 ? '#10b981' : '#f87171'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Good Habits */}
      <div className="bg-white border border-gray-100 rounded-3xl p-4 mt-4 shadow-sm">
        <h3 className="text-gray-800 mb-3" style={{ fontSize: '15px', fontWeight: 700 }}>Good Habit Completions</h3>
        {goodHabitStats.length === 0 ? (
          <p className="text-gray-400 text-center py-4" style={{ fontSize: '13px' }}>No good habits tracked yet</p>
        ) : (
          <div className="flex flex-col gap-3">
            {goodHabitStats.map(({ habit, count }) => {
              const maxCount = Math.max(...goodHabitStats.map(s => s.count), 1);
              const pct = (count / maxCount) * 100;
              return (
                <div key={habit.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: '16px' }}>{habit.emoji}</span>
                      <span className="text-gray-700" style={{ fontSize: '13px', fontWeight: 500 }}>{habit.name}</span>
                    </div>
                    <span className="text-emerald-500" style={{ fontSize: '13px', fontWeight: 700 }}>{count}×</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bad Habit Indulgences */}
      <div className="bg-white border border-gray-100 rounded-3xl p-4 mt-4 shadow-sm">
        <h3 className="text-gray-800 mb-3" style={{ fontSize: '15px', fontWeight: 700 }}>Bad Habit Indulgences</h3>
        {badHabitStats.every(s => s.count === 0) ? (
          <div className="text-center py-4">
            <p style={{ fontSize: '28px' }}>🎉</p>
            <p className="text-gray-400" style={{ fontSize: '13px' }}>No indulgences tracked! Keep it up!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {badHabitStats.filter(s => s.count > 0).map(({ habit, count }) => {
              const maxCount = Math.max(...badHabitStats.map(s => s.count), 1);
              const pct = (count / maxCount) * 100;
              return (
                <div key={habit.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: '16px' }}>{habit.emoji}</span>
                      <span className="text-gray-700" style={{ fontSize: '13px', fontWeight: 500 }}>{habit.name}</span>
                    </div>
                    <span className="text-red-400" style={{ fontSize: '13px', fontWeight: 700 }}>{count}×</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
