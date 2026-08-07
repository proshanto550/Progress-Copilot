import type { TargetWithProgress } from '../../lib/types';
import { Link } from 'react-router-dom';

/**
 * TargetProgressBars — list of targets with a color bar + percent.
 *
 * The bar color reflects the percent (red → amber → emerald) so the
 * eye can scan progress at a glance without reading the labels.
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
      <p className="text-sm text-gray-400 italic">{emptyMessage}</p>
    );
  }

  return (
    <div className={layout === 'list' ? 'space-y-3' : 'space-y-2'}>
      {targets.map((t) => {
        const pct = t.percent;
        const color =
          pct >= 100
            ? 'from-emerald-400 to-emerald-600'
            : pct >= 60
              ? 'from-sky-400 to-indigo-500'
              : pct >= 30
                ? 'from-amber-400 to-orange-500'
                : 'from-rose-400 to-pink-500';
        return (
          <Link
            key={t.id}
            to="/dashboard/targets"
            className="block group"
            title={t.title}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span
                className={
                  'truncate font-medium group-hover:text-white transition-colors ' +
                  (pct >= 100 ? 'text-emerald-300' : 'text-gray-200')
                }
              >
                {t.title}
              </span>
              <span className="text-xs tabular-nums text-gray-400 shrink-0">
                {t.doneTotal}/{t.taskTotal} · {pct}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
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