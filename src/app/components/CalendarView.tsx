import { useState, useMemo } from 'react';
import { format, subWeeks, startOfWeek, addDays, startOfYear } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Info, History } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useHabits } from '../context/HabitContext';
import { DayModal } from './DayModal';
import { HabitHeatmap, HEATMAP_LEGEND, getHeatColor } from './HabitHeatmap';

type Range = '1M' | '3M' | '6M' | '1Y' | 'YTD';

const RANGES: { label: string; value: Range }[] = [
  { label: '1M',  value: '1M'  },
  { label: '3M',  value: '3M'  },
  { label: '6M',  value: '6M'  },
  { label: '1Y',  value: '1Y'  },
  { label: 'YTD', value: 'YTD' },
];

function buildWeeks(range: Range): string[][] {
  const todayDate = new Date();
  let startDate: Date;

  switch (range) {
    case '1M':
      startDate = startOfWeek(subWeeks(todayDate, 4), { weekStartsOn: 0 });
      break;
    case '3M':
      startDate = startOfWeek(subWeeks(todayDate, 13), { weekStartsOn: 0 });
      break;
    case '6M':
      startDate = startOfWeek(subWeeks(todayDate, 26), { weekStartsOn: 0 });
      break;
    case '1Y':
      startDate = startOfWeek(subWeeks(todayDate, 52), { weekStartsOn: 0 });
      break;
    case 'YTD':
      startDate = startOfWeek(startOfYear(todayDate), { weekStartsOn: 0 });
      break;
  }

  const weeks: string[][] = [];
  let current = startDate;
  while (current <= todayDate) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(format(current, 'yyyy-MM-dd'));
      current = addDays(current, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function getCellSize(range: Range): { size: number; gap: number } {
  switch (range) {
    case '1M':  return { size: 18, gap: 4 };
    case '3M':  return { size: 14, gap: 3 };
    case '6M':  return { size: 11, gap: 3 };
    case '1Y':  return { size: 8,  gap: 2 };
    case 'YTD': return { size: 11, gap: 3 };
  }
}

function getRangeLabel(range: Range): string {
  switch (range) {
    case '1M':  return 'Last month';
    case '3M':  return 'Last 3 months';
    case '6M':  return 'Last 6 months';
    case '1Y':  return 'Last 12 months';
    case 'YTD': return `${new Date().getFullYear()} so far`;
  }
}

export function CalendarView() {
  const { logs, calculateDayScore, today } = useHabits();
  const navigate = useNavigate();
  const [range, setRange] = useState<Range>('6M');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const weeks = useMemo(() => buildWeeks(range), [range]);
  const { size: cellSize, gap: cellGap } = getCellSize(range);

  // Overall stats (all-time)
  const allLogDates = useMemo(() => [...new Set(logs.map(l => l.date))], [logs]);
  const positiveDays = allLogDates.filter(d => calculateDayScore(d) > 0).length;
  const negativeDays = allLogDates.filter(d => calculateDayScore(d) < 0).length;
  const bestScore = allLogDates.reduce((max, d) => Math.max(max, calculateDayScore(d)), 0);

  // Stats within current range window
  const rangeStart = weeks.length > 0 ? weeks[0][0] : today;
  const rangeDates = allLogDates.filter(d => d >= rangeStart && d <= today);
  const rangePosScore = rangeDates.reduce((s, d) => {
    const sc = calculateDayScore(d);
    return s + (sc > 0 ? sc : 0);
  }, 0);
  const rangeNegScore = rangeDates.reduce((s, d) => {
    const sc = calculateDayScore(d);
    return s + (sc < 0 ? sc : 0);
  }, 0);

  const handleDayClick = (date: string) => {
    setSelectedDate(date);
  };

  return (
    <div className="pb-4">
      {/* All-time quick stats */}
      <div className="grid grid-cols-3 gap-3 px-4 mt-4 mb-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-3 text-center shadow-sm">
          <p className="text-emerald-500" style={{ fontSize: '22px', fontWeight: 800 }}>{positiveDays}</p>
          <p className="text-gray-400" style={{ fontSize: '10px' }}>Green days</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-3 text-center shadow-sm">
          <p className="text-red-400" style={{ fontSize: '22px', fontWeight: 800 }}>{negativeDays}</p>
          <p className="text-gray-400" style={{ fontSize: '10px' }}>Red days</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-3 text-center shadow-sm">
          <p className="text-violet-500" style={{ fontSize: '22px', fontWeight: 800 }}>
            {bestScore > 0 ? `+${bestScore}` : bestScore}
          </p>
          <p className="text-gray-400" style={{ fontSize: '10px' }}>Best day</p>
        </div>
      </div>

      {/* Heatmap card */}
      <div className="bg-white border border-gray-100 mx-4 rounded-3xl p-4 shadow-sm">

        {/* Header + range label */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-gray-800" style={{ fontSize: '15px', fontWeight: 700 }}>Activity Heatmap</h3>
            <p className="text-gray-400" style={{ fontSize: '11px' }}>{getRangeLabel(range)}</p>
          </div>
          {/* Range score chips */}
          <div className="flex flex-col items-end gap-0.5">
            {rangePosScore > 0 && (
              <span className="text-emerald-500" style={{ fontSize: '12px', fontWeight: 700 }}>+{rangePosScore} pts</span>
            )}
            {rangeNegScore < 0 && (
              <span className="text-red-400" style={{ fontSize: '12px', fontWeight: 700 }}>{rangeNegScore} pts</span>
            )}
          </div>
        </div>

        {/* Range Selector Pills */}
        <div className="flex gap-1.5 mb-4">
          {RANGES.map(({ label, value }) => (
            <motion.button
              key={value}
              whileTap={{ scale: 0.93 }}
              onClick={() => setRange(value)}
              className={`flex-1 py-1.5 rounded-xl border transition-all ${
                range === value
                  ? 'bg-violet-600 border-violet-600 text-white shadow-sm shadow-violet-200'
                  : 'bg-gray-50 border-gray-200 text-gray-500'
              }`}
              style={{ fontSize: '12px', fontWeight: range === value ? 700 : 500 }}
            >
              {label}
            </motion.button>
          ))}
          {/* All History button */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => navigate('/history')}
            className="flex-1 py-1.5 rounded-xl border border-dashed border-violet-300 bg-violet-50 text-violet-500 flex items-center justify-center gap-0.5"
            style={{ fontSize: '11px', fontWeight: 600 }}
          >
            <History size={11} />
            All
          </motion.button>
        </div>

        {/* Animated heatmap swap */}
        <AnimatePresence mode="wait">
          <motion.div
            key={range}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <HabitHeatmap
              weeks={weeks}
              cellSize={cellSize}
              cellGap={cellGap}
              onDayClick={handleDayClick}
            />
          </motion.div>
        </AnimatePresence>

        {/* Legend */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-gray-400" style={{ fontSize: '10px' }}>Less</span>
          <div className="flex gap-1">
            {HEATMAP_LEGEND.map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, backgroundColor: c, borderRadius: 2 }} />
            ))}
          </div>
          <span className="text-gray-400" style={{ fontSize: '10px' }}>More</span>
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-red-400" style={{ fontSize: '9px' }}>← Bad days</span>
          <span className="text-emerald-500" style={{ fontSize: '9px' }}>Good days →</span>
        </div>
      </div>

      {/* Hint */}
      <div className="flex items-center gap-2 mx-4 mt-3 p-3 bg-violet-50 border border-violet-100 rounded-2xl">
        <Info size={14} className="text-violet-500 flex-shrink-0" />
        <p className="text-violet-600" style={{ fontSize: '12px' }}>
          Tap any cell to view or edit habits for that day. Purple outline = today. Tap <strong>All</strong> to see full history.
        </p>
      </div>

      {/* Recent 7 days */}
      <div className="px-4 mt-4">
        <h3 className="text-gray-800 mb-3" style={{ fontSize: '15px', fontWeight: 700 }}>Recent Days</h3>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = format(d, 'yyyy-MM-dd');
            const hasActivity = logs.some(l => l.date === dateStr);
            const isTodayDate = i === 0;
            const score = (hasActivity || isTodayDate) ? calculateDayScore(dateStr) : null;

            return (
              <motion.button
                key={dateStr}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedDate(dateStr)}
                className="w-full flex items-center gap-3 p-3.5 bg-white border border-gray-100 rounded-2xl shadow-sm text-left"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: score !== null
                      ? getHeatColor(score, hasActivity || isTodayDate)
                      : '#f3f4f6'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>
                    {isTodayDate ? '📅' : score === null ? '—' : score > 0 ? '🌿' : score < 0 ? '⚠️' : '😐'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-800" style={{ fontSize: '14px', fontWeight: 600 }}>
                    {isTodayDate ? 'Today' : format(d, 'EEEE')}
                  </p>
                  <p className="text-gray-400" style={{ fontSize: '12px' }}>{format(d, 'MMM d, yyyy')}</p>
                </div>
                {score !== null ? (
                  <span
                    style={{ fontSize: '16px', fontWeight: 800 }}
                    className={score > 0 ? 'text-emerald-500' : score < 0 ? 'text-red-400' : 'text-gray-400'}
                  >
                    {score > 0 ? '+' : ''}{score}
                  </span>
                ) : (
                  <span className="text-gray-300" style={{ fontSize: '13px' }}>No data</span>
                )}
                <ChevronRight size={16} className="text-gray-300" />
              </motion.button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <DayModal date={selectedDate} onClose={() => setSelectedDate(null)} />
      )}
    </div>
  );
}
