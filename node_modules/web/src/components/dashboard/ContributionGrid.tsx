import { useMemo } from 'react';
import type { ContributionCell } from '../../lib/types';

/**
 * ContributionGrid — GitHub-style activity & daily streak calendar.
 */

const COLOR_CLASSES = [
  'bg-purple-100/70 dark:bg-white/5 border border-purple-200/50 dark:border-white/5',
  'bg-emerald-300 dark:bg-emerald-900/80 border border-emerald-400 dark:border-emerald-700',
  'bg-emerald-400 dark:bg-emerald-700 border border-emerald-500 dark:border-emerald-600',
  'bg-emerald-500 dark:bg-emerald-500 border border-emerald-600 dark:border-emerald-400',
  'bg-emerald-600 dark:bg-emerald-300 border border-emerald-700 dark:border-emerald-200',
];

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const DAY_LABELS = [
  '', // Sun
  'Mon',
  '', // Tue
  'Wed',
  '', // Thu
  'Fri',
  '', // Sat
];

export function levelFor(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

export function buildWeeks(cells: ContributionCell[]) {
  if (!cells.length) {
    return { weeks: [] as Array<Array<ContributionCell | null>>, monthLabels: [] as Array<{ week: number; label: string }> };
  }

  const first = new Date(cells[0].date + 'T00:00:00Z');
  const leadPad = first.getUTCDay();

  const padded: Array<ContributionCell | null> = [
    ...Array.from({ length: leadPad }, () => null),
    ...cells,
  ];
  while (padded.length % 7 !== 0) padded.push(null);

  const weeks: Array<Array<ContributionCell | null>> = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  const monthLabels: Array<{ week: number; label: string }> = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const firstReal = week.find((c) => c !== null) as ContributionCell | undefined;
    if (!firstReal) return;
    const m = new Date(firstReal.date + 'T00:00:00Z').getUTCMonth();
    if (m !== lastMonth) {
      monthLabels.push({ week: wi, label: MONTHS_SHORT[m] });
      lastMonth = m;
    }
  });

  return { weeks, monthLabels };
}

export function getYears(cells: ContributionCell[]): number[] {
  if (!cells.length) return [];
  const years = new Set<number>();
  for (const c of cells) {
    years.add(new Date(c.date + 'T00:00:00Z').getUTCFullYear());
  }
  return Array.from(years).sort((a, b) => b - a);
}

export function ContributionGrid({
  cells,
  selectedYear,
  onYearChange,
  cellSize: cellSizeProp = 11,
  gap = 3,
  onDayClick,
}: {
  cells: ContributionCell[];
  selectedYear?: number | null;
  onYearChange?: (year: number | null) => void;
  cellSize?: number;
  gap?: number;
  onDayClick?: (cell: ContributionCell) => void;
}) {
  const filteredCells = useMemo(() => {
    if (!selectedYear) return cells;
    return cells.filter((c) => {
      const y = new Date(c.date + 'T00:00:00Z').getUTCFullYear();
      return y === selectedYear;
    });
  }, [cells, selectedYear]);

  const { weeks, monthLabels } = useMemo(
    () => buildWeeks(filteredCells),
    [filteredCells],
  );

  const cellSize = cellSizeProp;
  const years = useMemo(() => getYears(cells), [cells]);
  const totalActive = useMemo(
    () => filteredCells.filter((c) => c.count > 0).length,
    [filteredCells],
  );

  return (
    <div className="w-full flex flex-col items-center">
      {/* Horizontally centered and scrollable on small screens */}
      <div className="w-full overflow-x-auto py-2 flex justify-center">
        <div
          className="relative select-none inline-block pb-1"
          style={{ width: weeks.length * (cellSize + gap) + 36 }}
          aria-label={`Contribution grid, ${filteredCells.length} days, ${totalActive} active`}
        >
          {/* Day labels (left column) */}
          <div
            className="flex flex-col text-[10px] font-semibold text-slate-500 dark:text-violet-300/70 absolute left-0 top-0"
            style={{ rowGap: gap, paddingTop: 18 }}
          >
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="leading-none text-right pr-2"
                style={{ height: cellSize, lineHeight: `${cellSize}px` }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Month labels (top row) */}
          <div
            className="absolute top-0 text-[10px] font-bold text-slate-600 dark:text-violet-300/80"
            style={{ left: 30, right: 0, height: 14 }}
          >
            <div className="relative" style={{ height: 14 }}>
              {monthLabels.map((m) => (
                <span
                  key={`${m.week}-${m.label}`}
                  className="absolute"
                  style={{
                    left: m.week * (cellSize + gap),
                    lineHeight: '14px',
                  }}
                >
                  {m.label}
                </span>
              ))}
            </div>
          </div>

          {/* Grid columns */}
          <div
            className="flex"
            style={{
              marginLeft: 30,
              marginTop: 18,
              columnGap: gap,
            }}
          >
            {weeks.map((week, wi) => (
              <div
                key={wi}
                className="flex flex-col"
                style={{ rowGap: gap }}
              >
                {week.map((cell, di) => {
                  if (cell === null) {
                    return (
                      <div
                        key={di}
                        style={{ width: cellSize, height: cellSize }}
                      />
                    );
                  }
                  const level = levelFor(cell.count);
                  return (
                    <button
                      key={cell.date}
                      type="button"
                      title={`${cell.date}: ${cell.count} completion${cell.count === 1 ? '' : 's'}`}
                      onClick={onDayClick ? () => onDayClick(cell) : undefined}
                      className={`rounded-[2.5px] ${COLOR_CLASSES[level]} hover:ring-2 hover:ring-purple-500 transition-all cursor-pointer`}
                      style={{ width: cellSize, height: cellSize }}
                      aria-label={`${cell.date}, ${cell.count} completed`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer row: Year filter & Centered Less/More Legend */}
      <div className="mt-4 pt-3 border-t border-purple-200/60 dark:border-white/10 w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-violet-300/80 font-medium">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onYearChange?.(null)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              selectedYear == null
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-violet-300 hover:bg-purple-500/10'
            }`}
          >
            Last year
          </button>
          {years.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => onYearChange?.(y)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                selectedYear === y
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-violet-300 hover:bg-purple-500/10'
              }`}
            >
              {y}
            </button>
          ))}
        </div>

        {/* Less / More Legend with proper alignment */}
        <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-white/[0.04] px-3 py-1.5 rounded-xl border border-purple-200/50 dark:border-white/5">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-violet-300">Less</span>
          <div className="flex items-center gap-1">
            {COLOR_CLASSES.map((c, i) => (
              <span
                key={i}
                className={`rounded-[2.5px] ${c}`}
                style={{ width: 12, height: 12 }}
              />
            ))}
          </div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-violet-300">More</span>
        </div>
      </div>
    </div>
  );
}