import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../modules/dashboard/useDashboard';
import { useTasks } from '../modules/tasks/useTasks';
import { DashboardCard } from '../components/dashboard/DashboardCard';
import { ContributionGrid } from '../components/dashboard/ContributionGrid';
import { ProductivityScore } from '../components/dashboard/ProductivityScore';
import { TargetProgressBars } from '../components/dashboard/TargetProgressBars';
import type { Task } from '../lib/types';
import { getErrorMessage } from '../lib/api';

/**
 * DashboardHomePage — the /dashboard default route.
 *
 * Layout (responsive):
 *   ┌──────────────────────────────────────────────────────────┐
 *   │ Greeting row · avatar + ProductivityScore ring          │
 *   ├────────────────────────────┬─────────────────────────────┤
 *   │ Top 4 Targets (View All)   │ Pending Tasks (View All)   │
 *   ├────────────────────────────┴─────────────────────────────┤
 *   │ Reminders strip                  │ Projects strip (Ph 8) │
 *   ├──────────────────────────────────────────────────────────┤
 *   │ 365-day contribution grid + streak chip                  │
 *   └──────────────────────────────────────────────────────────┘
 *
 * Toggling a task strikes-through the title immediately (optimistic),
 * then awaits the API call. If the call fails, the strike is reverted
 * and an inline error appears under the row.
 */
export function DashboardHomePage() {
  const { user, refresh } = useAuth();
  const { data, loading, error, reload } = useDashboard();
  const { toggle } = useTasks();

  // Per-task local state for optimistic strike-through.
  const [pendingToggles, setPendingToggles] = useState<Set<string>>(new Set());
  const [strikeOverrides, setStrikeOverrides] = useState<
    Record<string, boolean>
  >({});
  const [toggleError, setToggleError] = useState<string | null>(null);

  const handleToggle = async (task: Task) => {
    const next = !task.isCompleted;
    setPendingToggles((s) => new Set(s).add(task.id));
    setStrikeOverrides((m) => ({ ...m, [task.id]: next }));
    setToggleError(null);
    try {
      await toggle(task.id, next);
      // Refresh top-level counters (points, streak) on the navbar.
      await refresh();
      // Re-fetch the dashboard so the score + grid + pending list stay fresh.
      await reload();
    } catch (e) {
      // Revert the optimistic strike.
      setStrikeOverrides((m) => {
        const c = { ...m };
        delete c[task.id];
        return c;
      });
      setToggleError(getErrorMessage(e, 'Failed to update task'));
    } finally {
      setPendingToggles((s) => {
        const c = new Set(s);
        c.delete(task.id);
        return c;
      });
    }
  };

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  if (error && !data) {
    return (
      <DashboardCard title="Dashboard">
        <p className="text-rose-400 text-sm">{error}</p>
      </DashboardCard>
    );
  }

  if (!data) return null;

  const { user: dashUser, topTargets, pendingTasks, upcomingReminders, projects, contributionGrid } = data;
  const name = user?.fullName || dashUser.fullName || 'there';
  const firstName = name.split(' ')[0];

  // Days in the trailing 365-day window where the user completed at least
  // one task — feeds the "X Days Active in last year" card title.
  const activeDays = contributionGrid.cells.filter((c) => c.count > 0).length;

  return (
    <div className="space-y-6">
      {/* ─── Greeting row ─────────────────────────────────────────── */}
      <DashboardCard>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar
              name={user?.fullName || dashUser.fullName}
              avatar={user?.avatar || dashUser.avatar}
            />
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome back, {firstName}.
              </h1>
              <p className="text-sm text-gray-400">
                Here's your progress at a glance.
              </p>
            </div>
          </div>
          <ProductivityScore
            score={dashUser.productivityScore}
            subtitle={`${dashUser.points} pts · ${dashUser.dailyStreak}-day streak`}
          >
            <div className="text-xs uppercase tracking-wider text-gray-400">
              Productivity
            </div>
            <div className="text-sm text-gray-300">
              Keep stacking task completions.
            </div>
          </ProductivityScore>
        </div>
      </DashboardCard>

      {/* ─── Top targets + pending tasks ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard
          title="Top targets"
          subtitle="Active targets — progress is based on sub-task completion."
          action={
            <Link
              to="/dashboard/targets"
              className="text-xs font-semibold text-purple-300 hover:text-purple-200 transition"
            >
              View all →
            </Link>
          }
        >
          <TargetProgressBars
            targets={topTargets}
            emptyMessage="No active targets. Create one to start tracking."
          />
        </DashboardCard>

        <DashboardCard
          title="Pending tasks"
          subtitle="Quick wins — tick to complete (+2 pts each)."
          action={
            <Link
              to="/dashboard/tasks"
              className="text-xs font-semibold text-purple-300 hover:text-purple-200 transition"
            >
              View all →
            </Link>
          }
        >
          {pendingTasks.length === 0 ? (
            <p className="text-sm text-gray-400 italic">
              No pending tasks. Nice work!
            </p>
          ) : (
            <ul className="space-y-2">
              {pendingTasks.map((t) => {
                const strikethrough = strikeOverrides[t.id] ?? t.isCompleted;
                const busy = pendingToggles.has(t.id);
                return (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/5 transition"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggle(t)}
                      disabled={busy}
                      aria-label={
                        strikethrough ? 'Mark as not done' : 'Mark as done'
                      }
                      className={
                        'h-5 w-5 shrink-0 rounded-full border-2 grid place-items-center ' +
                        'transition-all ' +
                        (strikethrough
                          ? 'bg-emerald-500 border-emerald-400'
                          : 'border-white/30 hover:border-emerald-400') +
                        (busy ? ' opacity-50' : '')
                      }
                    >
                      {strikethrough && (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3}
                          className="h-3 w-3 text-white"
                        >
                          <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                    <span
                      className={
                        'truncate text-sm ' +
                        (strikethrough
                          ? 'line-through text-gray-500'
                          : 'text-gray-100')
                      }
                    >
                      {t.title}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          {toggleError && (
            <p className="text-xs text-rose-400 mt-2">{toggleError}</p>
          )}
        </DashboardCard>
      </div>

      {/* ─── Reminders + Projects strip ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard
          title="Upcoming reminders"
          action={
            <Link
              to="/dashboard/reminders"
              className="text-xs font-semibold text-purple-300 hover:text-purple-200 transition"
            >
              View all →
            </Link>
          }
        >
          {upcomingReminders.length === 0 ? (
            <p className="text-sm text-gray-400 italic">
              No reminders scheduled. Set one from a target or task.
            </p>
          ) : (
            <ul className="space-y-2">
              {upcomingReminders.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-lg p-2 hover:bg-white/5 transition"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-gray-100 truncate">
                      {r.target?.title ?? r.task?.title ?? 'Reminder'}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500">
                      {r.targetId ? 'Target' : 'Task'}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400 shrink-0">
                    {new Date(r.time).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>

        <DashboardCard
          title="Projects"
          subtitle="GitHub repos ship in Phase 8."
          action={
            <Link
              to="/dashboard/projects"
              className="text-xs font-semibold text-purple-300 hover:text-purple-200 transition"
            >
              View all →
            </Link>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <ProjectStat
              label="Connected"
              value={projects.githubConnected ? 'Yes' : 'Not yet'}
              tone={projects.githubConnected ? 'emerald' : 'slate'}
            />
            <ProjectStat
              label="Repositories"
              value={projects.repoCount}
              tone="purple"
            />
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Connect your GitHub account to see repos + the 365-day contribution
            grid here.
          </p>
        </DashboardCard>
      </div>

      {/* ─── Streak + contribution grid ─────────────────────────── */}
      <DashboardCard
        title={`${activeDays} ${activeDays === 1 ? 'Day' : 'Days'} Active in last year`}
        subtitle="Each cell counts the tasks you completed on that UTC day."
      >
        <ContributionGrid
          cells={contributionGrid.cells}
        />
      </DashboardCard>
    </div>
  );
}

/* ────────────────────────── Sub-components ────────────────────────── */

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

function ProjectStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: 'emerald' | 'purple' | 'slate';
}) {
  const tones = {
    emerald: 'from-emerald-500/20 to-teal-500/10 text-emerald-300 ring-emerald-400/30',
    purple: 'from-purple-500/20 to-fuchsia-500/10 text-purple-300 ring-purple-400/30',
    slate: 'from-slate-500/20 to-slate-700/10 text-slate-200 ring-slate-400/30',
  } as const;
  return (
    <div className={`rounded-xl p-3 ring-1 bg-gradient-to-br ${tones[tone]}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-80">
        {label}
      </div>
      <div className="mt-1 text-lg font-extrabold tabular-nums">{value}</div>
    </div>
  );
}

function DashboardSkeleton() {
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