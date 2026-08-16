import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  Plus,
  Trash2,
  X,
  Save,
  Loader2,
  Target as TargetIcon,
  CheckSquare,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';

type Reminder = {
  id: string;
  targetId: string | null;
  taskId: string | null;
  time: string;
  isSent: boolean;
  target?: { id: string; title: string; priority: string } | null;
  task?: { id: string; title: string; priority: string } | null;
};

type TargetOption = { id: string; title: string };
type TaskOption = { id: string; title: string };

export function RemindersPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [linkType, setLinkType] = useState<'target' | 'task'>('target');
  const [selectedId, setSelectedId] = useState('');
  const [time, setTime] = useState('');

  // Fetch reminders
  const { data: remindersData, isLoading } = useQuery({
    queryKey: ['reminders'],
    queryFn: async () => {
      const { data } = await api.get('/api/reminders');
      return (data.reminders ?? []) as Reminder[];
    },
  });

  // Fetch targets & tasks for the dropdown
  const { data: targetsData } = useQuery({
    queryKey: ['targets'],
    queryFn: async () => {
      const { data } = await api.get('/api/targets');
      return (data.targets ?? []) as TargetOption[];
    },
  });

  const { data: tasksData } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await api.get('/api/tasks');
      return (data.tasks ?? []) as TaskOption[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { targetId?: string; taskId?: string; time: string }) => {
      const { data } = await api.post('/api/reminders', payload);
      return data.reminder as Reminder;
    },
    onSuccess: (reminder) => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setModalOpen(false);
      setSelectedId('');
      setTime('');
      addToast({
        type: 'success',
        title: 'Reminder Set!',
        message: `Reminder for "${reminder.target?.title || reminder.task?.title || 'item'}" has been scheduled.`,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/reminders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !time) return;

    const payload: { targetId?: string; taskId?: string; time: string } = { time };
    if (linkType === 'target') payload.targetId = selectedId;
    else payload.taskId = selectedId;

    createMutation.mutate(payload);
  };

  // Check for due reminders and fire toast notifications
  const reminders = remindersData ?? [];

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      reminders.forEach((r) => {
        const rTime = new Date(r.time);
        const diff = rTime.getTime() - now.getTime();
        if (diff <= 0 && diff > -60000 && !r.isSent) {
          addToast({
            type: 'reminder',
            title: '⏰ Reminder!',
            message: `Time for: ${r.target?.title || r.task?.title || 'your scheduled item'}`,
            duration: 8000,
          });
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [reminders, addToast]);

  const upcoming = [...reminders]
    .filter((r) => new Date(r.time) > new Date())
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  const past = [...reminders]
    .filter((r) => new Date(r.time) <= new Date())
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const targets = targetsData ?? [];
  const tasks = tasksData ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95 p-5 sm:p-6 shadow-md dark:shadow-glow-purple">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="text-purple-600 dark:text-fuchsia-400" size={26} /> Reminders
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-violet-300/80 mt-1">
            Schedule notifications for your targets and tasks. Get reminded when it matters.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-sky-600 text-white text-sm font-bold tracking-wide shadow-md hover:brightness-110 active:scale-[0.98] transition inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus size={18} /> New Reminder
        </button>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && reminders.length === 0 && (
        <div className="rounded-2xl border border-dashed border-purple-300 dark:border-purple-500/30 p-12 text-center bg-slate-50/50 dark:bg-cardBg/40">
          <Bell className="mx-auto text-purple-400 dark:text-purple-400/50 mb-3" size={42} />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">No Reminders Yet</h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-violet-300/70 mt-1 max-w-sm mx-auto">
            Click "+ New Reminder" to set a notification for a target or task.
          </p>
        </div>
      )}

      {/* Upcoming Reminders */}
      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="text-purple-600 dark:text-fuchsia-400" size={20} /> Upcoming
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-violet-300 font-semibold border border-purple-500/20">
              {upcoming.length}
            </span>
          </h2>
          {upcoming.map((r) => (
            <ReminderCard key={r.id} reminder={r} onDelete={() => deleteMutation.mutate(r.id)} />
          ))}
        </section>
      )}

      {/* Past Reminders */}
      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="text-slate-400 dark:text-violet-400" size={20} /> Past
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-300/30 text-slate-600 dark:text-violet-300/70 font-semibold border border-slate-300/40">
              {past.length}
            </span>
          </h2>
          {past.map((r) => (
            <ReminderCard key={r.id} reminder={r} onDelete={() => deleteMutation.mutate(r.id)} isPast />
          ))}
        </section>
      )}

      {/* Create Reminder Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg rounded-2xl border border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-[#181033] dark:via-[#120a27] dark:to-[#0b0718] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-purple-200/60 dark:border-cardBorder/40">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="text-purple-600 dark:text-fuchsia-400" size={20} /> Set New Reminder
                </h2>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-violet-300 hover:bg-purple-500/10 dark:hover:bg-white/10 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Link type toggle */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-violet-300/80 mb-2">
                    Remind me about a:
                  </label>
                  <div className="flex gap-3">
                    {(['target', 'task'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setLinkType(t);
                          setSelectedId('');
                        }}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold tracking-wide transition border ${
                          linkType === t
                            ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                            : 'border-purple-300 dark:border-cardBorder text-slate-700 dark:text-violet-200 hover:bg-purple-500/10'
                        }`}
                      >
                        {t === 'target' ? (
                          <span className="inline-flex items-center gap-1.5">
                            <TargetIcon size={14} /> Target
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5">
                            <CheckSquare size={14} /> Task
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Select target/task */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-violet-300/80 mb-1">
                    Select {linkType === 'target' ? 'Target' : 'Task'}
                  </label>
                  <select
                    required
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="w-full rounded-xl bg-slate-100/90 dark:bg-[#0c0a17] border border-purple-200 dark:border-cardBorder px-4 py-2.5 text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none transition text-sm font-medium"
                  >
                    <option value="">-- Select --</option>
                    {(linkType === 'target' ? targets : tasks).map((item: any) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date/Time */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-violet-300/80 mb-1">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-xl bg-slate-100/90 dark:bg-[#0c0a17] border border-purple-200 dark:border-cardBorder px-4 py-2.5 text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none transition text-sm font-medium"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-200/60 dark:border-cardBorder/40">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-purple-300 dark:border-cardBorder text-slate-700 dark:text-violet-200 text-sm font-semibold hover:bg-purple-500/10 dark:hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || !selectedId || !time}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-sky-600 text-white text-sm font-bold tracking-wide shadow-md hover:brightness-110 active:scale-[0.98] disabled:opacity-50 inline-flex items-center gap-2 transition"
                  >
                    {createMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                    <Save size={16} /> Save Reminder
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReminderCard({
  reminder,
  onDelete,
  isPast = false,
}: {
  reminder: Reminder;
  onDelete: () => void;
  isPast?: boolean;
}) {
  const linkedTitle = reminder.target?.title || reminder.task?.title || 'Unknown';
  const isTarget = !!reminder.target;
  const dateStr = new Date(reminder.time).toLocaleString();

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 shadow-sm transition ${
        isPast
          ? 'border-slate-200/80 dark:border-cardBorder/40 bg-slate-100/60 dark:bg-[#0e0920]/60 opacity-70'
          : 'border-purple-200/80 dark:border-cardBorder bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#160e2e]/90 dark:to-[#0c071a]/95'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isTarget
              ? 'bg-purple-500/15 text-purple-700 dark:text-fuchsia-400'
              : 'bg-sky-500/15 text-sky-700 dark:text-sky-400'
          }`}
        >
          {isTarget ? <TargetIcon size={18} /> : <CheckSquare size={18} />}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">{linkedTitle}</h3>
          <p className="text-xs text-slate-500 dark:text-violet-300/70 flex items-center gap-1 mt-0.5">
            <Clock size={12} /> {dateStr}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="p-2 rounded-lg text-slate-500 dark:text-violet-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition self-end sm:self-auto shrink-0"
        title="Delete Reminder"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
