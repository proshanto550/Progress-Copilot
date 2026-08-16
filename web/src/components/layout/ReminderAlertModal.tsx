import { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Clock, Target, CheckSquare, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

type Reminder = {
  id: string;
  targetId: string | null;
  taskId: string | null;
  time: string;
  isSent: boolean;
  target?: { id: string; title: string; priority: string } | null;
  task?: { id: string; title: string; priority: string } | null;
};

/** Play a pleasant, modern dual-tone notification chime using Web Audio API */
function playReminderSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Tone 1: E5 (659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.6);

    // Tone 2: G5 (783.99 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, now + 0.15);
    gain2.gain.setValueAtTime(0.5, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.85);
  } catch {
    // Suppress audio context restrictions
  }
}

/** Show Native OS/Browser Desktop Notification (works across any tab or background) */
function triggerBrowserNotification(title: string, body: string) {
  try {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'reminder-alert',
        requireInteraction: true,
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
            tag: 'reminder-alert',
            requireInteraction: true,
          });
        }
      });
    }
  } catch {
    // Browser notification fallback
  }
}

export function ReminderAlertModal() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [activeAlert, setActiveAlert] = useState<Reminder | null>(null);
  const alertedIdsRef = useRef<Set<string>>(new Set());

  // Request browser notification permissions automatically on layout mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Poll for scheduled reminders every 3 seconds across the whole app chrome
  const { data: remindersData } = useQuery({
    queryKey: ['reminders'],
    queryFn: async () => {
      const { data } = await api.get('/api/reminders');
      return (data.reminders || []) as Reminder[];
    },
    refetchInterval: 3000,
  });

  const markSentMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/api/reminders/${id}/sent`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const reminders = remindersData || [];

  useEffect(() => {
    const now = new Date().getTime();
    for (const r of reminders) {
      const rTime = new Date(r.time).getTime();
      // Alert if scheduled time has arrived AND NOT previously alerted
      if (rTime <= now && !r.isSent && !alertedIdsRef.current.has(r.id)) {
        alertedIdsRef.current.add(r.id);
        setActiveAlert(r);

        const itemTitle = r.target?.title || r.task?.title || 'Scheduled item';

        // 1. Play audio chime
        playReminderSound();

        // 2. Trigger OS/Browser Native System Notification (shows outside browser tab)
        triggerBrowserNotification(
          '⏰ Reminder Alert!',
          `"${itemTitle}" is due now! Click to open Progress Copilot.`,
        );

        // 3. Mark sent in DB immediately to prevent repeat on reload
        markSentMutation.mutate(r.id);

        // 4. In-app toast popup
        addToast({
          type: 'reminder',
          title: '⏰ Reminder Alert!',
          message: `"${itemTitle}" is due now!`,
          duration: 12000,
        });
        break;
      }
    }
  }, [reminders, addToast, markSentMutation]);

  if (!activeAlert) return null;

  const linkedTitle = activeAlert.target?.title || activeAlert.task?.title || 'Scheduled Item';
  const isTarget = !!activeAlert.target;
  const timeStr = new Date(activeAlert.time).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="w-full max-w-md rounded-3xl border-2 border-fuchsia-500/50 bg-gradient-to-b from-slate-50 via-purple-50 to-indigo-50 dark:from-[#1e0f3d] dark:via-[#140a2a] dark:to-[#0b0617] p-6 sm:p-7 shadow-[0_25px_60px_rgba(168,85,247,0.35)] text-center relative overflow-hidden"
        >
          {/* Animated Glowing Ring */}
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-fuchsia-600 via-purple-600 to-sky-500 flex items-center justify-center text-white shadow-xl shadow-fuchsia-500/30 mb-4 animate-bounce">
            <Bell size={36} />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-300 font-extrabold text-xs tracking-wider uppercase mb-2 border border-fuchsia-500/30">
            ⏰ Active Reminder Alert
          </span>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 leading-tight">
            {linkedTitle}
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-violet-300/80 mt-2 flex items-center justify-center gap-1.5 font-semibold">
            <Clock size={15} /> Scheduled for {timeStr}
          </p>

          <div className="mt-4 p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center gap-2 text-xs font-bold text-purple-700 dark:text-fuchsia-300">
            {isTarget ? <Target size={15} /> : <CheckSquare size={15} />}
            {isTarget ? 'Linked Target Reminder' : 'Linked Task Reminder'}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setActiveAlert(null)}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-purple-300 dark:border-cardBorder text-slate-700 dark:text-violet-200 text-sm font-bold hover:bg-purple-500/10 transition"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveAlert(null);
                navigate('/dashboard/reminders');
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-sky-600 text-white text-sm font-bold shadow-md hover:brightness-110 active:scale-[0.98] transition inline-flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} /> Open Reminders
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
