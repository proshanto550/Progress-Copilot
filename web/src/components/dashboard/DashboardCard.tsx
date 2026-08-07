import type { ReactNode } from 'react';

/**
 * DashboardCard — the shared glass card used everywhere on the
 * Dashboard and My Progress pages. Keeps spacing, hover, and the
 * section header consistent so we don't repeat 12 lines of Tailwind
 * in every widget.
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
        'rounded-2xl border border-white/10 bg-gradient-to-br ' +
        'from-white/[0.06] to-white/[0.02] backdrop-blur-xl ' +
        'shadow-xl shadow-black/30 p-5 sm:p-6 ' +
        className
      }
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            {title && (
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={'min-w-0 ' + bodyClassName}>{children}</div>
    </section>
  );
}