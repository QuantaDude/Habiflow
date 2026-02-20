import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { TodayView } from './components/TodayView';
import { CalendarView } from './components/CalendarView';
import { HabitsManager } from './components/HabitsManager';
import { StatsView } from './components/StatsView';
import { HistoryView } from './components/HistoryView';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: TodayView },
      { path: 'calendar', Component: CalendarView },
      { path: 'stats', Component: StatsView },
      { path: 'habits', Component: HabitsManager },
    ],
  },
  {
    // Full-screen history view — outside main Layout (no bottom nav)
    path: '/history',
    Component: HistoryView,
  },
]);
