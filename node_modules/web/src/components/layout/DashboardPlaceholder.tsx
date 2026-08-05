import type { ReactNode } from 'react';

/**
 * PlaceholderCard — used for every "Coming soon" route in the dashboard.
 * Keeps tone consistent while the real pages land in later phases.
 */
export function DashboardPlaceholder({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon?: ReactNode;
}) {
  return (
    <section
      className={[
        'rounded-2xl border border-white/10 p-6 sm:p-8',
        'bg-gradient-to-br from-white/[0.06] to-white/[0.02]',
        'backdrop-blur-xl shadow-xl shadow-black/30',
        'min-h-[60vh] flex flex-col items-center justify-center text-center',
      ].join(' ')}
    >
      {icon && (
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600/20 ring-1 ring-purple-400/40 text-purple-300">
          {icon}
        </div>
      )}
      <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-sm text-gray-400">{subtitle}</p>
      <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-gray-300 ring-1 ring-white/10">
        <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
        Coming soon
      </div>
    </section>
  );
}