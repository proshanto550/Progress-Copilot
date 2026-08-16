import type { ReactNode } from 'react';

/**
 * ProgressScore — circular progress ring + numeric badge.
 * Displays overall progress score accurately based on targets, tasks, and streaks.
 */
export function ProgressScore({
  score,
  subtitle,
  size = 132,
  children,
}: {
  score: number;
  subtitle?: string;
  size?: number;
  children?: ReactNode;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(score)));
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative grid place-items-center"
        style={{ width: size, height: size }}
        aria-label={`Progress score ${pct} percent`}
        role="img"
      >
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-purple-200/40 dark:text-white/10"
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#progressScoreGradient)"
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={`${dash} ${circumference}`}
            style={{ transition: 'stroke-dasharray 600ms ease' }}
          />
          <defs>
            <linearGradient id="progressScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="50%" stopColor="#c026d3" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-3xl font-extrabold tabular-nums leading-none text-slate-900 dark:text-white">
              {pct}
              <span className="text-base font-bold text-slate-500 dark:text-violet-300/70">%</span>
            </div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-purple-700 dark:text-fuchsia-400 mt-1">
              Progress
            </div>
          </div>
        </div>
      </div>
      <div className="min-w-0">
        {children}
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-violet-300/70 mt-1 font-medium">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export { ProgressScore as ProductivityScore };