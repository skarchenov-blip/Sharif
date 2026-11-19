import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useBusiness();

  return (
    <div
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] sm:w-auto pointer-events-none"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon =
            t.variant === 'error'
              ? AlertCircle
              : t.variant === 'info'
                ? Info
                : CheckCircle2;
          const iconColor =
            t.variant === 'error'
              ? 'text-rose-500'
              : t.variant === 'info'
                ? 'text-sky-400'
                : 'text-emerald-500';

          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-lg"
            >
              <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />
              <span className="text-sm font-medium flex-1">{t.title}</span>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                aria-label="Скрыть уведомление"
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
