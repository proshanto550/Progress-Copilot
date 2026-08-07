import { useEffect, useMemo, useRef, useState } from 'react';
import type { ContributionCell } from '../../lib/types';

/**
 * ContributionGrid — GitHub-style heatmap.
 *
 * Layout:
 *   ┌──────┬─────────────────────────────────────────────┐
 *   │      │ Aug  Sep  Oct  Nov  Dec  Jan  Feb  …  Jul   │  ← month labels
 *   ├──────┼─────────────────────────────────────────────┤
 *   │ Mon  │ ▢ ▢ ▢ ▣ ▢ ▣ ▣ ▢ ▢ ▣ ▣ ▣ ▢ …                 │
 *   │      │                                             │
 *   │ Wed  │ ▢ ▢ ▣ ▣ ▢ ▣ ▢ ▣ ▢ ▣ ▢ ▢ ▢ …                 │
 *   │      │                                             │
 *   │ Fri  │ ▢ ▢ ▢ ▢ ▣ ▣ ▣ ▢ ▣ ▢ ▢ ▢ ▢ …                 │
 *   └──────┴─────────────────────────────────────────────┘
 *                                              Less ▢▣▤▥ More
 *
 * Color buckets (per spec):
 *   0  → empty       (white/5)
 *   1  → level 1     (emerald-900)
 *   2  → level 2     (emerald-700)
 *   3  → level 3     (emerald-500)
 *   4+ → level 4     (emerald-300)
 *
 * Width handling: the grid is wrapped in a `ResizeObserver` so `cellSize`
 * shrinks automatically when the column is narrow (e.g. nested inside a
 * `lg:grid-cols-2` card). The grid itself never overflows its parent.
 */

const COLOR_CLASSES = [
  'bg-white/5',
  'bg-emerald-900/80',
  'bg-emerald-700/90',
  'bg-emerald-500',
  'bg-emerald-300',
];

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const DAY_LABELS = [
  '', // Sun (hidden)
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

/**
 * Bucket the dense cells array into weeks (Sun-first) and compute the
 * month label position for each column. The first column is left-padded
 * so the first cell always falls on its actual Sun–Sat row.
 */
export function buildWeeks(cells: ContributionCell[]) {
  if (!cells.length) {
    return { weeks: [] as Array<Array<ContributionCell | null>>, monthLabels: [] as Array<{ week: number; label: string }> };
  }

  const first = new Date(cells[0].date + 'T00:00:00Z');
  const leadPad = first.getUTCDay(); // 0 = Sun

  const padded: Array<ContributionCell | null> = [
    ...Array.from({ length: leadPad }, () => null),
    ...cells,
  ];
  // Round up to a full week.
  while (padded.length % 7 !== 0) padded.push(null);

  const weeks: Array<Array<ContributionCell | null>> = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  // Month label: tag the first week of each new month.
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

/**
 * Derive the list of calendar years present in the cells array. Used by
 * the year-filter <select> in the card header.
 */
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
  cellSize: cellSizeProp,
  gap = 3,
  onDayClick,
}: {
  cells: ContributionCell[];
  /** Filter to a single calendar year; `null` = "all" / "last year". */
  selectedYear?: number | null;
  onYearChange?: (year: number | null) => void;
  /** Override auto cell size (used in tests / future zoom view). */
  cellSize?: number;
  gap?: number;
  onDayClick?: (cell: ContributionCell) => void;
}) {
  // ── Filter by selected year, if any ───────────────────────────────────
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

  // ── Auto-scaling cell size so the grid never overflows the card ───────
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [cellSize, setCellSize] = useState(cellSizeProp ?? 12);

  useEffect(() => {
    if (cellSizeProp) {
      setCellSize(cellSizeProp);
      return;
    }
    const el = containerRef.current;
    if (!el) return;
    const compute = () => {
      const width = el.clientWidth;
      // Reserve room for day labels (~28px) and a small bit of slack.
      const available = Math.max(0, width - 28);
      // Aim for ~7 columns minimum visible, but prefer smaller cells when
      // wider. We pick the largest cell size that fits the year width.
      const expectedCols = weeks.length || 53;
      const cols = Math.max(expectedCols, 7);
      const totalGap = gap * (cols - 1);
      const ideal = Math.floor((available - totalGap) / cols);
      const clamped = Math.max(7, Math.min(13, ideal));
      setCellSize(clamped);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [weeks.length, cellSizeProp, gap]);

  const years = useMemo(() => getYears(cells), [cells]);
  const totalActive = useMemo(
    () => filteredCells.filter((c) => c.count > 0).length,
    [filteredCells],
  );

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="relative w-full select-none"
        aria-label={`Contribution grid, ${filteredCells.length} days, ${totalActive} active`}
      >
        {/* Day labels (left column) */}
        <div
          className="flex flex-col text-[10px] text-gray-500 absolute left-0 top-0"
          style={{ rowGap: gap, paddingTop: 18 /* reserve row for month labels */ }}
        >
          {DAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="leading-none"
              style={{ height: cellSize }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Month labels (top row) */}
        <div
          className="absolute top-0 text-[10px] text-gray-500"
          style={{
            left: 28,
            right: 0,
            height: 14,
          }}
        >
          <div
            className="relative"
            style={{ width: weeks.length * (cellSize + gap) - gap, height: 14 }}
          >
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

        {/* Grid */}
        <div
          className="flex"
          style={{
            marginLeft: 28,
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
                    title={`${cell.date}: ${cell.count} task${cell.count === 1 ? '' : 's'}`}
                    onClick={onDayClick ? () => onDayClick(cell) : undefined}
                    className={`rounded-[2px] ${COLOR_CLASSES[level]} hover:ring-1 hover:ring-white/40 transition`}
                    style={{ width: cellSize, height: cellSize }}
                    aria-label={`${cell.date}, ${cell.count} completed`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Footer row: year filter chips (left) + Less/More legend (right) */}
      <div className="mt-3 flex items-center justify-between gap-3 text-[10px] text-gray-400">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onYearChange?.(null)}
            className={
              'px-2 py-1 rounded-md transition ' +
              (selectedYear == null
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5')
            }
          >
            Last year
          </button>
          {years.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => onYearChange?.(y)}
              className={
                'px-2 py-1 rounded-md transition ' +
                (selectedYear === y
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5')
              }
            >
              {y}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span>Less</span>
          {COLOR_CLASSES.map((c, i) => (
            <span
              key={i}
              className={`rounded-[2px] ${c}`}
              style={{ width: 11, height: 11 }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}