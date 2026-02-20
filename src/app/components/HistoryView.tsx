import { useState, useMemo } from 'react';
import { format, startOfWeek, addDays, getYear } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronDown, ChevronUp, Calendar, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useHabits } from '../context/HabitContext';
import { HabitHeatmap, HEATMAP_LEGEND, getHeatColor } from './HabitHeatmap';
import { DayModal } from './DayModal';

function buildYearWeeks(year: number): string[][] {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  const startDate = startOfWeek(yearStart, { weekStartsOn: 0 });
  const weeks: string[][] = [];
  let current = startDate;

  while (current <= yearEnd) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(format(current, 'yyyy-MM-dd'));
      current = addDays(current, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

interface YearSectionProps {
  year: number;
  isCurrentYear: boolean;
  onDayClick: (date: string) => void;
}

function YearSection({ year, isCurrentYear, onDayClick }: YearSectionProps) {
  const { logs, calculateDayScore, today } = useHabits();
  const [collapsed, setCollapsed] = useState(false);

  const weeks = useMemo(() => {
    // For current year, only go up to today
    const todayDate = new Date();
    if (isCurrentYear) {
      const yearStart = new Date(year, 0, 1);
      const startDate = startOfWeek(yearStart, { weekStartsOn: 0 });
      const ws: string[][] = [];
      let current = startDate;
      while (current <= todayDate) {
        const week: string[] = [];
        for (let d = 0; d < 7; d++) {
          week.push(format(current, 'yyyy-MM-dd'));
          current = addDays(current, 1);
        }
        ws.push(week);
      }
      return ws;
    }
    return buildYearWeeks(year);
  }, [year, isCurrentYear]);

  // Year stats
  const yearStr = String(year);
  const yearLogDates = useMemo(() =>
    [...new Set(logs.filter(l => l.date.startsWith(yearStr)).map(l => l.date))],
    [logs, yearStr]
  );

  const yearStats = useMemo(() => {
    const positiveDays = yearLogDates.filter(d => calculateDayScore(d) > 0).length;
    const negativeDays = yearLogDates.filter(d => calculateDayScore(d) < 0).length;
    const totalScore = yearLogDates.reduce((s, d) => s + calculateDayScore(d), 0);
    const bestScore = yearLogDates.reduce((max, d) => Math.max(max, calculateDayScore(d)), 0);
    const worstScore = yearLogDates.reduce((min, d) => Math.min(min, calculateDayScore(d)), 0);
    return { positiveDays, negativeDays, totalScore, bestScore, worstScore, activeDays: yearLogDates.length };
  }, [yearLogDates, calculateDayScore]);

  return (
    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
      {/* Year header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isCurrentYear ? 'bg-violet-100' : 'bg-gray-100'
          }`}>
            <Calendar size={18} className={isCurrentYear ? 'text-violet-600' : 'text-gray-500'} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '20px', fontWeight: 800 }} className={isCurrentYear ? 'text-violet-700' : 'text-gray-800'}>
                {year}
              </span>
              {isCurrentYear && (
                <span className="bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full" style={{ fontSize: '10px', fontWeight: 600 }}>
                  Current
                </span>
              )}
            </div>
            <span className="text-gray-400" style={{ fontSize: '12px' }}>
              {yearStats.activeDays} active {yearStats.activeDays === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            style={{ fontSize: '16px', fontWeight: 700 }}
            className={yearStats.totalScore >= 0 ? 'text-emerald-500' : 'text-red-400'}
          >
            {yearStats.totalScore > 0 ? '+' : ''}{yearStats.totalScore}
          </span>
          {collapsed
            ? <ChevronDown size={18} className="text-gray-400" />
            : <ChevronUp size={18} className="text-gray-400" />
          }
        </div>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            {/* Mini stats row */}
            <div className="grid grid-cols-4 gap-2 px-4 pb-3">
              <div className="bg-emerald-50 rounded-xl p-2 text-center">
                <p className="text-emerald-600" style={{ fontSize: '16px', fontWeight: 800 }}>{yearStats.positiveDays}</p>
                <p className="text-gray-400" style={{ fontSize: '9px' }}>Green</p>
              </div>
              <div className="bg-red-50 rounded-xl p-2 text-center">
                <p className="text-red-400" style={{ fontSize: '16px', fontWeight: 800 }}>{yearStats.negativeDays}</p>
                <p className="text-gray-400" style={{ fontSize: '9px' }}>Red</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-2 text-center">
                <p className="text-emerald-500" style={{ fontSize: '16px', fontWeight: 800 }}>
                  {yearStats.bestScore > 0 ? `+${yearStats.bestScore}` : yearStats.bestScore}
                </p>
                <p className="text-gray-400" style={{ fontSize: '9px' }}>Best</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-2 text-center">
                <p className="text-red-400" style={{ fontSize: '16px', fontWeight: 800 }}>{yearStats.worstScore}</p>
                <p className="text-gray-400" style={{ fontSize: '9px' }}>Worst</p>
              </div>
            </div>

            {/* Heatmap */}
            <div className="px-4 pb-4">
              <HabitHeatmap
                weeks={weeks}
                cellSize={9}
                cellGap={2}
                onDayClick={onDayClick}
              />

              {/* Legend */}
              <div className="flex items-center justify-between mt-2">
                <span className="text-gray-400" style={{ fontSize: '9px' }}>Less</span>
                <div className="flex gap-0.5">
                  {HEATMAP_LEGEND.map((c, i) => (
                    <div key={i} style={{ width: 9, height: 9, backgroundColor: c, borderRadius: 2 }} />
                  ))}
                </div>
                <span className="text-gray-400" style={{ fontSize: '9px' }}>More</span>
              </div>
            </div>

            {/* Monthly breakdown */}
            <MonthlyBreakdown year={year} yearLogDates={yearLogDates} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MonthlyBreakdown({ year, yearLogDates }: { year: number; yearLogDates: string[] }) {
  const { calculateDayScore } = useHabits();
  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, m) => {
      const monthStr = `${year}-${String(m + 1).padStart(2, '0')}`;
      const monthDates = yearLogDates.filter(d => d.startsWith(monthStr));
      const score = monthDates.reduce((s, d) => s + calculateDayScore(d), 0);
      const activeDays = monthDates.length;
      return {
        month: new Date(year, m, 1),
        score,
        activeDays,
        monthStr,
      };
    }).filter(m => m.activeDays > 0 || m.month <= new Date());
  }, [year, yearLogDates, calculateDayScore]);

  if (months.every(m => m.activeDays === 0)) return null;

  const maxAbs = Math.max(...months.map(m => Math.abs(m.score)), 1);

  return (
    <div className="border-t border-gray-100 px-4 py-3">
      <p className="text-gray-400 mb-2" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Monthly Scores
      </p>
      <div className="flex flex-col gap-1.5">
        {months.filter(m => m.activeDays > 0).map(({ month, score, activeDays }) => {
          const pct = (Math.abs(score) / maxAbs) * 100;
          const positive = score >= 0;
          return (
            <div key={month.toISOString()} className="flex items-center gap-2">
              <span className="text-gray-500 w-8 text-right flex-shrink-0" style={{ fontSize: '11px' }}>
                {format(month, 'MMM')}
              </span>
              <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${positive ? 'bg-emerald-400' : 'bg-red-400'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span
                style={{ fontSize: '11px', fontWeight: 700, minWidth: '36px', textAlign: 'right' }}
                className={positive ? 'text-emerald-500' : 'text-red-400'}
              >
                {score > 0 ? '+' : ''}{score}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HistoryView() {
  const { logs, calculateDayScore, getTotalScore } = useHabits();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const totalScore = getTotalScore();
  const currentYear = getYear(new Date());

  // Find all years that have activity
  const years = useMemo(() => {
    const yearSet = new Set<number>();
    logs.forEach(l => {
      const y = parseInt(l.date.slice(0, 4));
      if (!isNaN(y)) yearSet.add(y);
    });
    // Always include current year
    yearSet.add(currentYear);
    return Array.from(yearSet).sort((a, b) => b - a); // most recent first
  }, [logs, currentYear]);

  // All-time stats
  const allLogDates = useMemo(() => [...new Set(logs.map(l => l.date))], [logs]);
  const totalActiveDays = allLogDates.length;
  const totalGreenDays = allLogDates.filter(d => calculateDayScore(d) > 0).length;
  const totalRedDays = allLogDates.filter(d => calculateDayScore(d) < 0).length;
  const bestEver = allLogDates.reduce((max, d) => Math.max(max, calculateDayScore(d)), 0);
  const earliestDate = allLogDates.length > 0 ? allLogDates.sort()[0] : null;

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4 flex items-center gap-3 sticky top-0 z-10">
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </motion.button>
        <div>
          <h1 className="text-gray-900" style={{ fontSize: '18px', fontWeight: 800 }}>Full History</h1>
          {earliestDate && (
            <p className="text-gray-400" style={{ fontSize: '12px' }}>
              Since {format(new Date(earliestDate + 'T12:00:00'), 'MMM d, yyyy')}
            </p>
          )}
        </div>
      </div>

      <div className="px-4 pb-8 pt-4 flex flex-col gap-4">

        {/* All-time hero stats */}
        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
          <p className="text-white/70 mb-1" style={{ fontSize: '12px' }}>All-time Score</p>
          <p className="text-white mb-4" style={{ fontSize: '44px', fontWeight: 800, lineHeight: 1 }}>
            {totalScore > 0 ? '+' : ''}{totalScore}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/15 rounded-2xl p-2.5 text-center">
              <p className="text-white" style={{ fontSize: '20px', fontWeight: 800 }}>{totalActiveDays}</p>
              <p className="text-white/60" style={{ fontSize: '10px' }}>Active days</p>
            </div>
            <div className="bg-white/15 rounded-2xl p-2.5 text-center">
              <p className="text-emerald-300" style={{ fontSize: '20px', fontWeight: 800 }}>{totalGreenDays}</p>
              <p className="text-white/60" style={{ fontSize: '10px' }}>Green days</p>
            </div>
            <div className="bg-white/15 rounded-2xl p-2.5 text-center">
              <p className="text-red-300" style={{ fontSize: '20px', fontWeight: 800 }}>{totalRedDays}</p>
              <p className="text-white/60" style={{ fontSize: '10px' }}>Red days</p>
            </div>
          </div>
        </div>

        {/* Best ever */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <span style={{ fontSize: '24px' }}>🏆</span>
            <div>
              <p className="text-gray-400" style={{ fontSize: '11px' }}>Best day ever</p>
              <p className="text-emerald-500" style={{ fontSize: '22px', fontWeight: 800 }}>+{bestEver}</p>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <span style={{ fontSize: '24px' }}>📅</span>
            <div>
              <p className="text-gray-400" style={{ fontSize: '11px' }}>Years tracked</p>
              <p className="text-violet-600" style={{ fontSize: '22px', fontWeight: 800 }}>{years.length}</p>
            </div>
          </div>
        </div>

        {/* Year sections */}
        {years.length === 0 || (years.length === 1 && allLogDates.length === 0) ? (
          <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center shadow-sm">
            <span style={{ fontSize: '48px' }}>📊</span>
            <p className="text-gray-500 mt-3" style={{ fontSize: '16px', fontWeight: 600 }}>No history yet</p>
            <p className="text-gray-400 mt-1" style={{ fontSize: '13px' }}>Start tracking habits on the Today tab to build your history.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-gray-400" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              By Year
            </p>
            {years.map(year => (
              <YearSection
                key={year}
                year={year}
                isCurrentYear={year === currentYear}
                onDayClick={setSelectedDate}
              />
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-gray-500 mb-3" style={{ fontSize: '12px', fontWeight: 600 }}>Score Color Guide</p>
          <div className="flex flex-col gap-2">
            {[
              { color: '#1a7f37', label: 'Score ≥ 40 — Excellent day!' },
              { color: '#26a641', label: 'Score 25–39 — Great day' },
              { color: '#3fc95c', label: 'Score 10–24 — Good day' },
              { color: '#9be9a8', label: 'Score 1–9 — Positive day' },
              { color: '#ebedf0', label: 'Score 0 — No activity' },
              { color: '#ffd8d8', label: 'Score -1 to -9 — Slightly off' },
              { color: '#ffaaaa', label: 'Score -10 to -19 — Rough day' },
              { color: '#ff6b6b', label: 'Score -20 to -34 — Bad day' },
              { color: '#c92a2a', label: 'Score ≤ -35 — Very bad day' },
            ].map(({ color, label }) => (
              <div key={color} className="flex items-center gap-3">
                <div style={{ width: 16, height: 16, backgroundColor: color, borderRadius: 4, flexShrink: 0 }} />
                <span className="text-gray-600" style={{ fontSize: '12px' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedDate && (
        <DayModal date={selectedDate} onClose={() => setSelectedDate(null)} />
      )}
    </div>
  );
}
