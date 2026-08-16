import type { ReactNode } from 'react';

/**
 * DashboardCard — the shared glass card used everywhere on the
 * Dashboard and My Progress pages. Theme-aware with soft gradients,
 * distinct borders, and glowing shadows.
 */
export function DashboardCard({
  title,
  subtitle,
  action,
  children,
  className = '',
  bodyClassName = '',
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={
        'rounded-2xl border border-purple-200/80 dark:border-white/10 ' +
        'bg-gradient-to-br from-slate-50/95 via-indigo-50/70 to-purple-50/60 dark:from-[#181132]/90 dark:to-[#0f0a22]/95 backdrop-blur-xl ' +
        'shadow-md dark:shadow-2xl dark:shadow-black/40 p-5 sm:p-6 transition-all duration-300 ' +
        className
      }
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            {title && (
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs text-slate-600 dark:text-gray-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={'min-w-0 ' + bodyClassName}>{children}</div>
    </section>
  );
}