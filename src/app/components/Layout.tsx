import { useState } from 'react';
import { NavLink, Outlet } from 'react-router';
import { CalendarDays, Home, BarChart2, Settings, Cloud, CloudOff, Loader } from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { useAuth } from '../context/AuthContext';
import { SyncModal } from './SyncModal';

const tabs = [
  { to: '/',         label: 'Today',    icon: Home         },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays  },
  { to: '/stats',    label: 'Stats',    icon: BarChart2     },
  { to: '/habits',   label: 'Habits',   icon: Settings      },
];

export function Layout() {
  const { getTotalScore } = useHabits();
  const { user, syncStatus } = useAuth();
  const totalScore = getTotalScore();
  const [showSync, setShowSync] = useState(false);

  const SyncIcon = () => {
    if (syncStatus === 'syncing') return <Loader size={16} className="animate-spin text-violet-500" />;
    if (user) return <Cloud size={16} className={syncStatus === 'error' ? 'text-red-400' : 'text-violet-500'} />;
    return <CloudOff size={16} className="text-gray-400" />;
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 relative overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 pt-10 pb-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-gray-900" style={{ fontSize: '20px', fontWeight: 700 }}>HabiFlow</h1>
          <p className="text-gray-400" style={{ fontSize: '12px' }}>Build better habits</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sync button */}
          <button
            onClick={() => setShowSync(true)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center relative ${
              user ? 'bg-violet-50 border border-violet-200' : 'bg-gray-100'
            }`}
          >
            <SyncIcon />
            {/* Status dot */}
            {user && (
              <span
                className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                  syncStatus === 'error'   ? 'bg-red-400'    :
                  syncStatus === 'success' ? 'bg-emerald-400' :
                  syncStatus === 'syncing' ? 'bg-amber-400'   :
                  'bg-gray-300'
                }`}
              />
            )}
          </button>

          {/* Score pill */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
            totalScore >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'
          }`}>
            <span style={{ fontSize: '14px' }}>⚡</span>
            <span style={{ fontSize: '16px', fontWeight: 700 }} className={totalScore >= 0 ? 'text-emerald-600' : 'text-red-500'}>
              {totalScore > 0 ? '+' : ''}{totalScore}
            </span>
            <span style={{ fontSize: '11px' }} className="text-gray-400">pts</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-100 flex-shrink-0 pb-safe">
        <div className="flex">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
                  isActive ? 'text-violet-600' : 'text-gray-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-violet-100' : ''}`}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: isActive ? 600 : 400 }}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {showSync && <SyncModal onClose={() => setShowSync(false)} />}
    </div>
  );
}