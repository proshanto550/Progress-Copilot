import type { ReactNode } from 'react';

/**
 * ProductivityScore — circular progress ring + numeric badge.
 * Pure presentational; takes the percentage from the parent so the same
 * component can be used on Dashboard and My Progress.
 */
export function ProductivityScore({
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
        aria-label={`Productivity score ${pct} percent`}
        role="img"
      >
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-white/10"
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#scoreGradient)"
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={`${dash} ${circumference}`}
            style={{ transition: 'stroke-dasharray 600ms ease' }}
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="60%" stopColor="#d946ef" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-3xl font-extrabold tabular-nums leading-none">
              {pct}
              <span className="text-base font-bold text-gray-400">%</span>
            </div>
            <div className="text-[10px] uppercase tracking-wider text-gray-400 mt-1">
              Score
            </div>
          </div>
        </div>
      </div>
      <div className="min-w-0">
        {children}
        {subtitle && (
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}