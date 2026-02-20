import { useMemo } from 'react';
import { motion } from 'motion/react';
import { parseISO, isToday, isFuture } from 'date-fns';
import { useHabits } from '../context/HabitContext';

const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function getHeatColor(score: number, hasActivity: boolean): string {
  if (!hasActivity) return '#ebedf0';
  if (score >= 40)  return '#1a7f37';
  if (score >= 25)  return '#26a641';
  if (score >= 10)  return '#3fc95c';
  if (score > 0)    return '#9be9a8';
  if (score === 0)  return '#d4f0da';
  if (score > -10)  return '#ffd8d8';
  if (score > -20)  return '#ffaaaa';
  if (score > -35)  return '#ff6b6b';
  return '#c92a2a';
}

interface HabitHeatmapProps {
  weeks: string[][];
  cellSize?: number;
  cellGap?: number;
  showDayLabels?: boolean;
  onDayClick?: (date: string) => void;
}

export function HabitHeatmap({
  weeks,
  cellSize = 11,
  cellGap = 3,
  showDayLabels = true,
  onDayClick,
}: HabitHeatmapProps) {
  const { logs, calculateDayScore, today } = useHabits();

  // Month label positions
  const monthLabels = useMemo(() => {
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      try {
        const d = parseISO(week[0]);
        const m = d.getMonth();
        if (m !== lastMonth) {
          labels.push({ label: MONTHS_SHORT[m], col: wi });
          lastMonth = m;
        }
      } catch {}
    });
    return labels;
  }, [weeks]);

  const dayLabelWidth = showDayLabels ? cellSize + 6 : 0;
  const totalWidth = weeks.length * (cellSize + cellGap) + dayLabelWidth;

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: totalWidth, width: totalWidth }}>
        {/* Month labels */}
        <div className="flex mb-1" style={{ paddingLeft: dayLabelWidth }}>
          {weeks.map((week, wi) => {
            const lbl = monthLabels.find(m => m.col === wi);
            return (
              <div
                key={wi}
                style={{ width: cellSize + cellGap, flexShrink: 0, overflow: 'visible' }}
              >
                {lbl && (
                  <span
                    style={{ fontSize: Math.max(7, cellSize * 0.65) + 'px', whiteSpace: 'nowrap', color: '#9ca3af' }}
                  >
                    {lbl.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Grid */}
        <div className="flex">
          {/* Day labels */}
          {showDayLabels && (
            <div className="flex flex-col flex-shrink-0" style={{ gap: cellGap, marginRight: 6, width: cellSize }}>
              {DAYS_SHORT.map((d, i) => (
                <div
                  key={i}
                  style={{ height: cellSize, fontSize: Math.max(6, cellSize * 0.6) + 'px', color: '#d1d5db', lineHeight: 1 }}
                  className="flex items-center justify-end"
                >
                  {i % 2 !== 0 ? d : ''}
                </div>
              ))}
            </div>
          )}

          {/* Week columns */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col flex-shrink-0" style={{ gap: cellGap, marginRight: cellGap }}>
              {week.map((date) => {
                const hasActivity = logs.some(l => l.date === date);
                const score = hasActivity ? calculateDayScore(date) : 0;
                const future = date > today;
                const isT = date === today;
                const color = future ? '#f3f4f6' : getHeatColor(score, hasActivity || isT);

                return (
                  <motion.div
                    key={date}
                    whileTap={!future && onDayClick ? { scale: 0.75 } : {}}
                    onClick={() => !future && onDayClick?.(date)}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: color,
                      borderRadius: Math.max(2, cellSize * 0.25),
                      cursor: future || !onDayClick ? 'default' : 'pointer',
                      outline: isT ? `2px solid #7c3aed` : 'none',
                      outlineOffset: '1px',
                      flexShrink: 0,
                    }}
                    title={`${date}: ${hasActivity ? (score > 0 ? '+' : '') + score + ' pts' : 'No activity'}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const HEATMAP_LEGEND = ['#c92a2a', '#ff6b6b', '#ffaaaa', '#ebedf0', '#9be9a8', '#3fc95c', '#26a641', '#1a7f37'];
