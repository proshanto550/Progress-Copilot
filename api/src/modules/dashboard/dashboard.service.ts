import { prisma } from '../../lib/prisma';
import { getTargetsWithProgress } from '../targets/targets.service';
import { unauthorized } from '../../lib/errors';

/**
 * Dashboard service — Phase 5.
 *
 * Aggregates everything the /dashboard home and /dashboard/my-progress
 * screens need into single round-trips so the frontend doesn't fan out
 * to 5 endpoints. All math lives here so the React layer is pure view.
 *
 * Conventions:
 *   • All date math happens in UTC (matching the streak logic in
 *     tasks.service). The frontend renders in the user's local timezone
 *     but the bins (days) are anchored to UTC so the contribution grid
 *     is consistent across timezones.
 *   • Productivity score is a soft saturation of points: 50 points = 100%.
 *     Tunable via PRODUCTIVITY_SATURATION below.
 */

const PRODUCTIVITY_SATURATION = 50; // points → 100% productivity
const DASHBOARD_DAY_LIMIT = 4;
const CONTRIBUTION_DAYS = 365;
const TREND_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUTCDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function isoDate(d: Date): string {
  // YYYY-MM-DD in UTC — stable key for grid buckets.
  return startOfUTCDay(d).toISOString().slice(0, 10);
}

function productivityScore(points: number): number {
  if (points <= 0) return 0;
  const pct = Math.round((points / PRODUCTIVITY_SATURATION) * 100);
  return Math.min(100, pct);
}

/* ───────────────────────────── /api/dashboard ───────────────────────────── */

export async function getDashboard(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      avatar: true,
      points: true,
      dailyStreak: true,
      createdAt: true,
    },
  });
  if (!user) throw unauthorized('User not found');

  // ── 1. Top 4 active targets (INCOMPLETE first, then by createdAt desc).
  const allTargets = await getTargetsWithProgress(userId);
  const topTargets = allTargets
    .filter((t) => t.status === 'INCOMPLETE')
    .slice(0, DASHBOARD_DAY_LIMIT);

  // ── 2. 4 oldest pending standalone tasks (no targetId).
  const pendingTasks = await prisma.task.findMany({
    where: { userId, isCompleted: false, targetId: null },
    include: {
      target: {
        select: { id: true, title: true, deadline: true, status: true },
      },
    },
    orderBy: [{ createdAt: 'asc' }],
    take: DASHBOARD_DAY_LIMIT,
  });

  // ── 3. Upcoming 4 reminders (unsent, future or recent past).
  const now = new Date();
  const upcomingReminders = await prisma.reminder.findMany({
    where: { userId, isSent: false, time: { gte: now } },
    include: {
      target: { select: { id: true, title: true } },
      task: { select: { id: true, title: true } },
    },
    orderBy: [{ time: 'asc' }],
    take: DASHBOARD_DAY_LIMIT,
  });

  // ── 4. Projects — Phase 8 fills the data; for now we just report whether
  //      the user has any Github connection (always false until Phase 8).
  //      Keeps the front-end card renderable in the meantime.
  const projects = {
    githubConnected: false,
    repoCount: 0,
  };

  // ── 5. 365-day contribution grid (count completed tasks per UTC day).
  const since = startOfUTCDay(
    new Date(now.getTime() - (CONTRIBUTION_DAYS - 1) * DAY_MS),
  );
  const completions = await prisma.task.findMany({
    where: {
      userId,
      isCompleted: true,
      completedAt: { gte: since },
    },
    select: { completedAt: true },
  });

  const counts = new Map<string, number>();
  for (const c of completions) {
    if (!c.completedAt) continue;
    const key = isoDate(c.completedAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  // Build a dense 365-length array so the frontend doesn't have to fill gaps.
  const cells: { date: string; count: number }[] = [];
  for (let i = 0; i < CONTRIBUTION_DAYS; i++) {
    const d = new Date(since.getTime() + i * DAY_MS);
    const key = isoDate(d);
    cells.push({ date: key, count: counts.get(key) ?? 0 });
  }

  return {
    user: {
      ...user,
      productivityScore: productivityScore(user.points),
    },
    topTargets,
    pendingTasks,
    upcomingReminders,
    projects,
    contributionGrid: {
      days: CONTRIBUTION_DAYS,
      cells,
    },
  };
}

/* ──────────────────────────── /api/progress ─────────────────────────────── */

export async function getProgress(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      avatar: true,
      points: true,
      dailyStreak: true,
    },
  });
  if (!user) throw unauthorized('User not found');

  const targetBreakdown = await getTargetsWithProgress(userId);

  // ── 30-day completion trend (per UTC day).
  const now = new Date();
  const trendStart = startOfUTCDay(
    new Date(now.getTime() - (TREND_DAYS - 1) * DAY_MS),
  );
  const trendCompletions = await prisma.task.findMany({
    where: {
      userId,
      isCompleted: true,
      completedAt: { gte: trendStart },
    },
    select: { completedAt: true },
  });
  const trendCounts = new Map<string, number>();
  for (const c of trendCompletions) {
    if (!c.completedAt) continue;
    const key = isoDate(c.completedAt);
    trendCounts.set(key, (trendCounts.get(key) ?? 0) + 1);
  }
  const tasksCompletedLast30Days: { date: string; count: number }[] = [];
  for (let i = 0; i < TREND_DAYS; i++) {
    const d = new Date(trendStart.getTime() + i * DAY_MS);
    const key = isoDate(d);
    tasksCompletedLast30Days.push({
      date: key,
      count: trendCounts.get(key) ?? 0,
    });
  }

  // ── Points distribution: total points earned per priority bucket.
  // We reconstruct from the completion log so this matches Phase 4 rules
  // exactly (5/4/3 for sub-tasks, 2 for standalone).
  const doneTasks = await prisma.task.findMany({
    where: { userId, isCompleted: true },
    select: { priority: true, targetId: true },
  });
  const pointsDistribution = { high: 0, medium: 0, low: 0 };
  for (const t of doneTasks) {
    const earned = t.targetId
      ? t.priority === 'HIGH'
        ? 5
        : t.priority === 'MEDIUM'
          ? 4
          : 3
      : 2;
    // Count the points against the priority bucket of the task, not the
    // kind (target/standalone). A standalone task's "priority" is whatever
    // the user picked at creation — we honor that.
    if (t.priority === 'HIGH') pointsDistribution.high += earned;
    else if (t.priority === 'MEDIUM') pointsDistribution.medium += earned;
    else pointsDistribution.low += earned;
  }

  return {
    user: {
      ...user,
      productivityScore: productivityScore(user.points),
    },
    targetBreakdown,
    tasksCompletedLast30Days,
    pointsDistribution,
  };
}
