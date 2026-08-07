import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ContributionCell } from '../../lib/types';

/**
 * TaskCompletionTrendChart — 30-day completion area chart for My Progress.
 *
 * Uses an AreaChart instead of a LineChart to soften the trend — the user
 * is looking at their own behaviour, not industry data, so a filled curve
 * reads more friendly than a sharp polyline.
 */
export function TaskCompletionTrendChart({
  data,
  height = 220,
}: {
  data: ContributionCell[];
  height?: number;
}) {
  // X-axis labels every 5th day so we don't crowd the axis.
  const chartData = data.map((d, i) => ({
    label: `${i + 1}`,
    count: d.count,
    date: d.date,
    tick: i % 5 === 0,
  }));
  const total = data.reduce((s, d) => s + d.count, 0);
  const avg = data.length ? (total / data.length).toFixed(1) : '0';

  return (
    <div className="w-full">
      <div className="flex items-baseline gap-4 mb-2">
        <div className="text-2xl font-extrabold tabular-nums">{total}</div>
        <div className="text-xs text-gray-400">
          tasks in last {data.length} days · avg {avg}/day
        </div>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#a855f7" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            // Render only every 5th label.
            tickFormatter={(value, index) =>
              chartData[index]?.tick ? value : ''
            }
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={24}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(15, 7, 30, 0.95)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              fontSize: 12,
              color: 'white',
            }}
            labelFormatter={(_label, payload) => {
              const item = payload?.[0]?.payload as
                | { date?: string }
                | undefined;
              return item?.date ?? '';
            }}
            formatter={(value: number) => [`${value} tasks`, 'Completed']}
            cursor={{ stroke: 'rgba(255,255,255,0.18)' }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#a855f7"
            strokeWidth={2}
            fill="url(#trendFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}