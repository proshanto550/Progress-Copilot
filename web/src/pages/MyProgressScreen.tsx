import { useAuth } from '../context/AuthContext';
import { useProgress } from '../modules/dashboard/useDashboard';
import { DashboardCard } from '../components/dashboard/DashboardCard';
import { ProductivityScore } from '../components/dashboard/ProductivityScore';
import { TargetProgressBars } from '../components/dashboard/TargetProgressBars';
import { TaskCompletionTrendChart } from '../components/dashboard/TaskCompletionTrendChart';
import { PointsDistributionChart } from '../components/dashboard/PointsDistributionChart';

/**
 * MyProgressScreen — /dashboard/my-progress.
 *
 * Pure analytics view:
 *   • Score ring (same ProductivityScore component as the dashboard)
 *   • All-target progress bars (full list, not just 4)
 *   • 30-day task completion trend (Recharts AreaChart)
 *   • HIGH/MED/LOW points distribution donut (Recharts PieChart)
 *
 * Skeleton + inline error follow the same conventions as the dashboard
 * so the layout feels uniform across the private area.
 */
export function MyProgressScreen() {
  const { user } = useAuth();
  const { data, loading, error } = useProgress();

  if (loading && !data) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 rounded-2xl bg-white/5 animate-pulse"
            aria-label="Loading"
          />
        ))}
      </div>
    );
  }

  if (error && !data) {
    return (
      <DashboardCard title="My Progress">
        <p className="text-rose-400 text-sm">{error}</p>
      </DashboardCard>
    );
  }

  if (!data) return null;

  const {
    user: progUser,
    targetBreakdown,
    tasksCompletedLast30Days,
    pointsDistribution,
  } = data;

  const name = user?.fullName || progUser.fullName || 'there';
  const firstName = name.split(' ')[0];

  const completedCount = targetBreakdown.filter(
    (t) => t.status === 'COMPLETED',
  ).length;
  const activeCount = targetBreakdown.length - completedCount;

  return (
    <div className="space-y-6">
      {/* ─── Score row ───────────────────────────────────────────── */}
      <DashboardCard>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar
              name={user?.fullName || progUser.fullName}
              avatar={user?.avatar || progUser.avatar}
            />
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {firstName}'s progress
              </h1>
              <p className="text-sm text-gray-400">
                {activeCount} active · {completedCount} completed ·{' '}
                {progUser.points} pts earned
              </p>
            </div>
          </div>
          <ProductivityScore
            score={progUser.productivityScore}
            subtitle={`${progUser.dailyStreak}-day daily streak`}
          >
            <div className="text-xs uppercase tracking-wider text-gray-400">
              Productivity
            </div>
            <div className="text-sm text-gray-300">
              Driven by completed tasks.
            </div>
          </ProductivityScore>
        </div>
      </DashboardCard>

      {/* ─── Target completion bars ──────────────────────────────── */}
      <DashboardCard
        title="Target completion"
        subtitle="Each bar shows percent of sub-tasks done."
      >
        <TargetProgressBars
          targets={targetBreakdown}
          emptyMessage="You don't have any targets yet."
        />
      </DashboardCard>

      {/* ─── Trend + distribution ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard
          title="Task completion trend"
          subtitle="Last 30 days · one point per completed task."
          className="min-w-0"
        >
          <TaskCompletionTrendChart data={tasksCompletedLast30Days} />
        </DashboardCard>

        <DashboardCard
          title="Points distribution"
          subtitle="Total points earned, grouped by task priority."
          className="min-w-0"
        >
          <PointsDistributionChart data={pointsDistribution} />
        </DashboardCard>
      </div>
    </div>
  );
}

function Avatar({ name, avatar }: { name: string; avatar: string | null }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <div className="h-14 w-14 rounded-2xl overflow-hidden ring-2 ring-white/10 shrink-0">
      {avatar ? (
        <img src={avatar} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full grid place-items-center bg-gradient-to-tr from-purple-700 via-indigo-600 to-pink-500 text-white text-xl font-black">
          {initial}
        </div>
      )}
    </div>
  );
}