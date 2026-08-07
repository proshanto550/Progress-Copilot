import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const PALETTE = {
  high: '#ef4444',   // rose-500
  medium: '#f59e0b', // amber-500
  low: '#22c55e',    // emerald-500
};

/**
 * PointsDistributionChart — donut showing how the user's earned points
 * split across HIGH / MEDIUM / LOW priority tasks.
 *
 * Hidden entirely when there's no data — an empty donut looks broken.
 *
 * Note: we render the legend ourselves (below the chart) instead of
 * using <Legend verticalAlign="bottom" /> — the built-in Legend can
 * push the chart past the card edge on narrow columns. Custom legend
 * keeps everything tucked inside the card.
 */
export function PointsDistributionChart({
  data,
  height = 220,
}: {
  data: { high: number; medium: number; low: number };
  height?: number;
}) {
  const rows = [
    { key: 'HIGH', label: 'High priority', value: data.high, color: PALETTE.high },
    { key: 'MED', label: 'Medium priority', value: data.medium, color: PALETTE.medium },
    { key: 'LOW', label: 'Low priority', value: data.low, color: PALETTE.low },
  ];
  const total = rows.reduce((s, r) => s + r.value, 0);

  if (total === 0) {
    return (
      <div
        className="grid place-items-center text-sm text-gray-400 italic"
        style={{ height }}
      >
        Complete a task to see your points breakdown.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-baseline gap-4 mb-2">
        <div className="text-2xl font-extrabold tabular-nums">{total}</div>
        <div className="text-xs text-gray-400">total points earned</div>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={rows}
              dataKey="value"
              nameKey="label"
              innerRadius="50%"
              outerRadius="75%"
              paddingAngle={3}
              strokeWidth={0}
            >
              {rows.map((r) => (
                <Cell key={r.key} fill={r.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'rgba(15, 7, 30, 0.95)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8,
                fontSize: 12,
                color: 'white',
              }}
              formatter={(value: number, _name, item) => [
                `${value} pts`,
                (item as unknown as { payload?: { label?: string } })?.payload?.label ??
                  '',
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Custom legend — keeps the chart inside the card. */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-300">
        {rows.map((r) => (
          <span key={r.key} className="inline-flex items-center gap-2">
            <span
              className="inline-block rounded-full"
              style={{ width: 9, height: 9, background: r.color }}
            />
            {r.label}
            <span className="text-gray-500 tabular-nums">{r.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}