import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Archive, ArchiveRestore, X, Check, TrendingUp, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useHabits, Habit } from '../context/HabitContext';

const EMOJIS = [
  '🏃','📚','🧘','💧','😴','🥗','🎯','💪','🎵','🌿','🚶','✍️','🎨','🤸','🏋️','🧹','🍎','☀️','🛁','📝',
  '🚬','🍔','📱','🛋️','🌙','🍺','🎰','🍭','😤','🎮','🍕','☕','🚗','📺','💳',
];

const POINTS_OPTIONS = [5, 10, 15, 20, 25, 30, 40, 50];

interface AddHabitSheetProps {
  onClose: () => void;
  onAdd: (habit: Omit<Habit, 'id' | 'status'>) => void;
}

function AddHabitSheet({ onClose, onAdd }: AddHabitSheetProps) {
  const { habits, unarchiveHabit } = useHabits();
  const [name, setName]             = useState('');
  const [type, setType]             = useState<'good' | 'bad'>('good');
  const [points, setPoints]         = useState(10);
  const [emoji, setEmoji]           = useState('🏃');
  const [showEmojis, setShowEmojis] = useState(false);

  // Detect any existing habit (any status) with the same name
  const conflict = useMemo(() => {
    if (!name.trim()) return null;
    return habits.find(h => h.name.toLowerCase() === name.trim().toLowerCase()) ?? null;
  }, [name, habits]);

  const handleRestore = () => {
    if (!conflict) return;
    unarchiveHabit(conflict.id);
    onClose();
  };

  const handleSubmit = () => {
    if (!name.trim() || conflict?.status === 'active') return;
    onAdd({ name: name.trim(), type, points, emoji });
    onClose();
  };

  const conflictBanner = (() => {
    if (!conflict) return null;
    if (conflict.status === 'active') return (
      <div className="mb-4 flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
        <span style={{ fontSize: '15px' }}>⚠️</span>
        <div className="flex-1">
          <p className="text-amber-700" style={{ fontSize: '13px', fontWeight: 600 }}>Already active</p>
          <p className="text-amber-600" style={{ fontSize: '12px' }}>You already have an active habit with this name.</p>
        </div>
      </div>
    );
    if (conflict.status === 'archived') return (
      <div className="mb-4 flex items-start gap-2 px-3 py-2.5 bg-violet-50 border border-violet-200 rounded-xl">
        <span style={{ fontSize: '15px' }}>📦</span>
        <div className="flex-1">
          <p className="text-violet-700" style={{ fontSize: '13px', fontWeight: 600 }}>This habit is archived</p>
          <p className="text-violet-500" style={{ fontSize: '12px' }}>Restore it to keep its history instead of creating a duplicate.</p>
        </div>
        <button
          onClick={handleRestore}
          className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-violet-600 text-white rounded-lg"
          style={{ fontSize: '12px', fontWeight: 600 }}
        >
          <ArchiveRestore size={12} /> Restore
        </button>
      </div>
    );
    if (conflict.status === 'deleted') return (
      <div className="mb-4 flex items-start gap-2 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-xl">
        <span style={{ fontSize: '15px' }}>🗂️</span>
        <div className="flex-1">
          <p className="text-blue-700" style={{ fontSize: '13px', fontWeight: 600 }}>This habit was deleted</p>
          <p className="text-blue-500" style={{ fontSize: '12px' }}>Restore it to recover its history, or continue to create a fresh copy.</p>
        </div>
        <button
          onClick={handleRestore}
          className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white rounded-lg"
          style={{ fontSize: '12px', fontWeight: 600 }}
        >
          <ArchiveRestore size={12} /> Restore
        </button>
      </div>
    );
    return null;
  })();

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative w-full max-w-md bg-white rounded-t-3xl overflow-hidden"
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 400 }}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>
          <div className="flex items-center justify-between px-5 pb-3 pt-2">
            <h2 style={{ fontSize: '18px', fontWeight: 700 }} className="text-gray-900">Add Habit</h2>
            <button onClick={onClose} className="p-2 rounded-full bg-gray-100"><X size={16} className="text-gray-500" /></button>
          </div>

          <div className="px-5 pb-8 overflow-y-auto" style={{ maxHeight: '70vh' }}>
            {/* Type Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => { setType('good'); setEmoji('🏃'); }}
                className={`flex-1 py-2.5 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                  type === 'good' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-500'
                }`}
              >
                <TrendingUp size={15} />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Good Habit</span>
              </button>
              <button
                onClick={() => { setType('bad'); setEmoji('🚬'); }}
                className={`flex-1 py-2.5 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                  type === 'bad' ? 'bg-red-50 border-red-300 text-red-600' : 'bg-gray-50 border-gray-200 text-gray-500'
                }`}
              >
                <AlertTriangle size={15} />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Bad Habit</span>
              </button>
            </div>

            {/* Emoji */}
            <div className="mb-4">
              <label className="text-gray-500 mb-2 block" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Icon</label>
              <button
                onClick={() => setShowEmojis(!showEmojis)}
                className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center"
                style={{ fontSize: '28px' }}
              >
                {emoji}
              </button>
              {showEmojis && (
                <div className="mt-2 grid grid-cols-7 gap-1 bg-gray-50 rounded-2xl p-2 border border-gray-100">
                  {EMOJIS.map(e => (
                    <button
                      key={e}
                      onClick={() => { setEmoji(e); setShowEmojis(false); }}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${emoji === e ? 'bg-violet-100' : 'hover:bg-gray-100'}`}
                      style={{ fontSize: '18px' }}
                    >{e}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="text-gray-500 mb-2 block" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Habit Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={type === 'good' ? 'e.g. Morning jog' : 'e.g. Late night snacking'}
                className={`w-full px-4 py-3 rounded-xl bg-gray-50 border outline-none transition-colors ${
                  conflict?.status === 'active' ? 'border-amber-300 focus:border-amber-400' :
                  conflict ? 'border-violet-300 focus:border-violet-400' :
                  'border-gray-200 focus:border-violet-400'
                }`}
                style={{ fontSize: '15px' }}
              />
            </div>

            {/* Conflict banner — shown after name input */}
            {conflictBanner}

            {/* Points */}
            <div className="mb-6">
              <label className="text-gray-500 mb-2 block" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {type === 'good' ? 'Points Earned' : 'Points Deducted'}
              </label>
              <div className="flex flex-wrap gap-2">
                {POINTS_OPTIONS.map(p => (
                  <button
                    key={p}
                    onClick={() => setPoints(p)}
                    className={`px-4 py-2 rounded-xl border transition-all ${
                      points === p
                        ? type === 'good' ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-red-100 border-red-300 text-red-600'
                        : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}
                    style={{ fontSize: '14px', fontWeight: 600 }}
                  >
                    {type === 'good' ? '+' : '-'}{p}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!name.trim() || conflict?.status === 'active'}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 transition-all ${
                name.trim() && conflict?.status !== 'active' ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' : 'bg-gray-100 text-gray-400'
              }`}
            >
              <Plus size={18} />
              <span style={{ fontSize: '16px', fontWeight: 700 }}>
                {conflict?.status === 'deleted' ? 'Add as New Copy' : 'Add Habit'}
              </span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

type ActionMenu = { id: string; type: 'delete' | 'archive' | 'confirm-delete' | 'confirm-permanent' } | null;

function HabitRow({ habit, onAction }: {
  habit: Habit;
  onAction: (id: string, action: 'archive' | 'delete' | 'unarchive' | 'permanent') => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<'delete' | 'permanent' | null>(null);

  const isDeleted  = habit.status === 'deleted';
  const isArchived = habit.status === 'archived';

  const handleDelete = () => {
    setMenuOpen(false);
    setConfirmState('delete');
  };
  const handleArchive = () => {
    setMenuOpen(false);
    onAction(habit.id, 'archive');
  };
  const handleUnarchive = () => onAction(habit.id, 'unarchive');
  const handlePermanent = () => {
    setMenuOpen(false);
    setConfirmState('permanent');
  };
  const confirmAction = () => {
    if (confirmState === 'delete')    onAction(habit.id, 'delete');
    if (confirmState === 'permanent') onAction(habit.id, 'permanent');
    setConfirmState(null);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      className={`bg-white border rounded-2xl shadow-sm ${
        isDeleted ? 'border-red-100 opacity-70' :
        isArchived ? 'border-amber-100 opacity-75' :
        'border-gray-100'
      }`}
    >
      <div className="flex items-center gap-3 p-4">
        <span style={{ fontSize: '22px' }}>{habit.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-gray-800 truncate" style={{ fontSize: '15px', fontWeight: 600 }}>{habit.name}</p>
            {isDeleted && (
              <span className="flex-shrink-0 bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full flex items-center gap-0.5" style={{ fontSize: '10px' }}>
                <Trash2 size={9} /> deleted
              </span>
            )}
          </div>
          <p style={{ fontSize: '12px' }} className={habit.type === 'good' ? 'text-emerald-500' : 'text-red-400'}>
            {habit.type === 'good' ? `+${habit.points} pts` : `-${habit.points} pts`}
            {habit.type === 'bad' && <span className="text-blue-400"> · +{Math.floor(habit.points * 0.4)} if avoided</span>}
          </p>
        </div>

        {/* Confirm prompt */}
        {confirmState && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500" style={{ fontSize: '12px' }}>
              {confirmState === 'delete' ? 'Soft delete?' : 'Delete forever?'}
            </span>
            <button onClick={confirmAction} className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <Check size={14} className="text-red-500" />
            </button>
            <button onClick={() => setConfirmState(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <X size={14} className="text-gray-400" />
            </button>
          </div>
        )}

        {/* Archived habit — restore or soft-delete (keeps logs/past data) */}
        {!confirmState && isArchived && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleUnarchive}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-600"
              style={{ fontSize: '12px', fontWeight: 600 }}
            >
              <ArchiveRestore size={13} />
              Restore
            </button>
            <button
              onClick={handleDelete}
              className="w-8 h-8 rounded-full bg-red-50 border border-red-200 flex items-center justify-center"
              title="Soft-delete (keeps past data)"
            >
              <Trash2 size={13} className="text-red-500" />
            </button>
          </div>
        )}

        {/* Deleted habit — permanent delete or restore */}
        {!confirmState && isDeleted && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onAction(habit.id, 'unarchive')}
              className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center"
              title="Restore to active"
            >
              <ArchiveRestore size={13} className="text-emerald-600" />
            </button>
            <button
              onClick={handlePermanent}
              className="w-8 h-8 rounded-full bg-red-50 border border-red-200 flex items-center justify-center"
              title="Permanently delete"
            >
              <Trash2 size={13} className="text-red-500" />
            </button>
          </div>
        )}

        {/* Active habit — action menu */}
        {!confirmState && !isArchived && !isDeleted && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(m => !m)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
            >
              {menuOpen ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -5 }}
                  className="absolute right-0 top-10 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl w-52"
                >
                  <button
                    onClick={handleArchive}
                    className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-amber-50 text-left transition-colors"
                  >
                    <Archive size={14} className="text-amber-500" />
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600 }} className="text-gray-800">Archive</p>
                      <p style={{ fontSize: '11px' }} className="text-gray-400">Hide but keep score</p>
                    </div>
                  </button>
                  <div className="border-t border-gray-100" />
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-red-50 text-left transition-colors"
                  >
                    <Trash2 size={14} className="text-red-500" />
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600 }} className="text-gray-800">Delete</p>
                      <p style={{ fontSize: '11px' }} className="text-gray-400">Keep in past data</p>
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function HabitsManager() {
  const { activeHabits, archivedHabits, habits, addHabit, deleteHabit, archiveHabit, unarchiveHabit, permanentlyDeleteHabit } = useHabits();
  const [showAdd, setShowAdd]           = useState(false);
  const [activeTab, setActiveTab]       = useState<'good' | 'bad'>('good');
  const [showArchived, setShowArchived] = useState(false);

  const goodHabits = activeHabits.filter(h => h.type === 'good');
  const badHabits  = activeHabits.filter(h => h.type === 'bad');
  const deletedHabits = habits.filter(h => h.status === 'deleted');
  const displayed  = activeTab === 'good' ? goodHabits : badHabits;

  const handleAction = (id: string, action: 'archive' | 'delete' | 'unarchive' | 'permanent') => {
    if (action === 'archive')   archiveHabit(id);
    if (action === 'delete')    deleteHabit(id);
    if (action === 'unarchive') unarchiveHabit(id);
    if (action === 'permanent') permanentlyDeleteHabit(id);
  };

  const archivedAndDeleted = [...archivedHabits, ...deletedHabits];

  return (
    <div className="pb-24">
      {/* Tab Selector */}
      <div className="flex gap-3 px-4 mt-4 mb-4">
        <button
          onClick={() => setActiveTab('good')}
          className={`flex-1 py-2.5 rounded-xl border transition-all flex items-center justify-center gap-2 ${
            activeTab === 'good' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-gray-100 text-gray-400'
          }`}
        >
          <TrendingUp size={15} />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Good ({goodHabits.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('bad')}
          className={`flex-1 py-2.5 rounded-xl border transition-all flex items-center justify-center gap-2 ${
            activeTab === 'bad' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-100 text-gray-400'
          }`}
        >
          <AlertTriangle size={15} />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Bad ({badHabits.length})</span>
        </button>
      </div>

      {/* Scoring Info */}
      <div className={`mx-4 mb-4 p-3 rounded-2xl border ${activeTab === 'good' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
        <p style={{ fontSize: '12px' }} className={activeTab === 'good' ? 'text-emerald-600' : 'text-red-500'}>
          {activeTab === 'good'
            ? '✅ Completing a good habit adds its points to your daily score.'
            : '⚠️ Indulging a bad habit deducts points. Avoiding it all day earns 40% of its points as a reward.'}
        </p>
      </div>

      {/* Active Habit List */}
      <div className="px-4 flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {displayed.map(habit => (
            <HabitRow key={habit.id} habit={habit} onAction={handleAction} />
          ))}
        </AnimatePresence>

        {displayed.length === 0 && (
          <div className="text-center py-10">
            <p style={{ fontSize: '36px' }}>{activeTab === 'good' ? '🌱' : '🛡️'}</p>
            <p className="text-gray-400 mt-2" style={{ fontSize: '14px' }}>No {activeTab} habits yet. Add one!</p>
          </div>
        )}
      </div>

      {/* Archived & Deleted Section */}
      {archivedAndDeleted.length > 0 && (
        <div className="px-4 mt-6">
          <button
            onClick={() => setShowArchived(s => !s)}
            className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm mb-2"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                <Archive size={14} className="text-amber-600" />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 600 }} className="text-gray-700">
                Archived & Deleted
              </span>
              <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full" style={{ fontSize: '11px', fontWeight: 600 }}>
                {archivedAndDeleted.length}
              </span>
            </div>
            {showArchived
              ? <ChevronUp size={16} className="text-gray-400" />
              : <ChevronDown size={16} className="text-gray-400" />
            }
          </button>

          <AnimatePresence>
            {showArchived && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <div className="flex flex-col gap-2 mb-2">
                  <p className="text-gray-400" style={{ fontSize: '12px' }}>
                    <strong>Archived:</strong> hidden everywhere, score preserved. &nbsp;
                    <strong>Deleted:</strong> hidden from today, visible in past day logs.
                  </p>
                  <AnimatePresence mode="popLayout">
                    {archivedAndDeleted.map(habit => (
                      <HabitRow key={habit.id} habit={habit} onAction={handleAction} />
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-violet-600 rounded-full shadow-xl shadow-violet-300 flex items-center justify-center z-10"
      >
        <Plus size={24} color="white" strokeWidth={2.5} />
      </motion.button>

      {showAdd && (
        <AddHabitSheet onClose={() => setShowAdd(false)} onAdd={addHabit} />
      )}
    </div>
  );
}