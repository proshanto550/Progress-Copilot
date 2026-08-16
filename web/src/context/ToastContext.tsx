import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type Toast = {
  id: string;
  title: string;
  message?: string;
  type?: 'success' | 'info' | 'warning' | 'reminder';
  duration?: number;
};

type ToastContextType = {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const duration = toast.duration ?? 5000;
      const newToast: Toast = { ...toast, id };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-3 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="pointer-events-auto rounded-2xl border border-purple-200/80 dark:border-purple-500/30 bg-white/95 dark:bg-[#160e2e]/95 backdrop-blur-xl p-4 shadow-xl flex items-start gap-3 text-slate-900 dark:text-white"
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  toast.type === 'success'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : toast.type === 'warning'
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : toast.type === 'reminder'
                    ? 'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 animate-pulse'
                    : 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                }`}
              >
                {toast.type === 'success' && <CheckCircle2 size={18} />}
                {toast.type === 'warning' && <AlertTriangle size={18} />}
                {toast.type === 'reminder' && <Bell size={18} />}
                {(!toast.type || toast.type === 'info') && <Info size={18} />}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm leading-tight text-slate-900 dark:text-white">
                  {toast.title}
                </h4>
                {toast.message && (
                  <p className="text-xs text-slate-600 dark:text-violet-300/80 mt-0.5 leading-relaxed">
                    {toast.message}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition shrink-0"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
