import type { TargetWithProgress } from '../../lib/types';
import { Link } from 'react-router-dom';
import { CheckCircle2, Target as TargetIcon } from 'lucide-react';

/**
 * TargetProgressBars — list of targets rendered as clean cards with borders and progress bars.
 */
export function TargetProgressBars({
  targets,
  layout = 'list',
  emptyMessage = 'No targets yet — create one to start tracking progress.',
}: {
  targets: TargetWithProgress[];
  layout?: 'list' | 'compact';
  emptyMessage?: string;
}) {
  if (!targets.length) {
    return (
      <p className="text-sm text-slate-500 dark:text-violet-300/70 italic py-4">{emptyMessage}</p>
    );
  }

  return (
    <div className={layout === 'list' ? 'space-y-2.5' : 'space-y-2'}>
      {targets.map((t) => {
        const pct = t.percent;
        const isDone = t.status === 'COMPLETED' || pct >= 100;
        const color =
          isDone
            ? 'from-emerald-400 to-emerald-600'
            : pct >= 60
            ? 'from-sky-400 to-indigo-500'
            : pct >= 30
            ? 'from-amber-400 to-orange-500'
            : 'from-purple-500 to-fuchsia-600';

        return (
          <Link
            key={t.id}
            to="/dashboard/targets"
            className={`block group rounded-xl p-3 border transition-all ${
              isDone
                ? 'bg-slate-100/50 dark:bg-white/[0.01] border-emerald-500/30'
                : 'bg-slate-50/80 dark:bg-white/[0.02] border-purple-200/50 dark:border-white/5 hover:border-purple-400/50'
            }`}
            title={t.title}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                {isDone ? (
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                ) : (
                  <TargetIcon size={16} className="text-purple-600 dark:text-fuchsia-400 shrink-0" />
                )}
                <span
                  className={`truncate text-sm font-bold transition-colors ${
                    isDone
                      ? 'line-through text-slate-500 dark:text-violet-300/60'
                      : 'text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-fuchsia-300'
                  }`}
                >
                  {t.title}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    t.priority === 'HIGH'
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                      : t.priority === 'MEDIUM'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {t.priority}
                </span>

                <span className="text-xs font-bold tabular-nums text-slate-500 dark:text-violet-300/70">
                  {t.doneTotal}/{t.taskTotal} ({pct}%)
                </span>
              </div>
            </div>

            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${color} transition-[width] duration-500`}
                style={{ width: `${Math.max(2, pct)}%` }}
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}