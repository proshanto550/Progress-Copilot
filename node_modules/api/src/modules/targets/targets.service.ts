import { prisma } from '../../lib/prisma';
import { badRequest, notFound, unauthorized } from '../../lib/errors';
import type {
  CreateTargetInput,
  UpdateTargetInput,
} from './targets.schema';

/**
 * Targets service — Phase 4.
 *
 * Auto-completion rule:
 *   • If the target has zero sub-tasks, leave its status alone — an empty
 *     target should not auto-complete the moment it's created.
 *   • Otherwise, mark COMPLETED iff every sub-task isCompleted; otherwise
 *     INCOMPLETE.
 *
 * The `recomputeTargetStatus` helper is exported because the tasks
 * service calls it whenever a sub-task toggles — keeping the rule in one
 * place avoids drift between the two entry points.
 */

async function ensureOwnTarget(userId: string, targetId: string) {
  const target = await prisma.target.findUnique({
    where: { id: targetId },
    select: { id: true, userId: true },
  });
  if (!target) throw notFound('Target not found');
  if (target.userId !== userId) throw unauthorized('Not your target');
  return target;
}

export async function listTargets(userId: string) {
  return prisma.target.findMany({
    where: { userId },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });
}

/**
 * Phase 5 helper — list targets with sub-task progress counts so the
 * Dashboard / My Progress endpoints don't have to re-derive the percent
 * rule in three places. The rule matches the rest of the service:
 *   • target with 0 sub-tasks  → percent = 0  (never auto-completes)
 *   • otherwise                 → percent = round(doneTotal / taskTotal * 100)
 */
export async function getTargetsWithProgress(userId: string) {
  const rows = await prisma.target.findMany({
    where: { userId },
    select: {
      id: true,
      userId: true,
      title: true,
      description: true,
      deadline: true,
      priority: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { tasks: true } },
      tasks: { select: { isCompleted: true } },
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });

  return rows.map((t) => {
    const taskTotal = t._count.tasks;
    const doneTotal = t.tasks.filter((x) => x.isCompleted).length;
    const percent =
      taskTotal === 0 ? 0 : Math.round((doneTotal / taskTotal) * 100);
    // Strip the heavy Prisma `_count` / `tasks` arrays from the response —
    // the frontend only needs the derived totals.
    const { _count, tasks, ...rest } = t;
    void _count;
    void tasks;
    return { ...rest, taskTotal, doneTotal, percent };
  });
}

export async function getTarget(userId: string, targetId: string) {
  await ensureOwnTarget(userId, targetId);
  const target = await prisma.target.findUnique({
    where: { id: targetId },
    include: {
      tasks: {
        orderBy: [{ isCompleted: 'asc' }, { createdAt: 'desc' }],
      },
    },
  });
  return target;
}

export async function createTarget(userId: string, input: CreateTargetInput) {
  // Zod already guarantees `subTasks` is present with at least 1 row.
  // We re-check defensively so this contract survives a future schema refactor.
  const seeds = input.subTasks ?? [];
  if (seeds.length === 0) {
    throw badRequest('A target needs at least one sub-task');
  }

  const priority = input.priority ?? 'MEDIUM';

  // Create the target + its first batch of sub-tasks atomically so we never
  // end up with a "childless" target on disk if anything in between fails.
  const target = await prisma.$transaction(async (tx) => {
    const t = await tx.target.create({
      data: {
        userId,
        title: input.title,
        description: input.description ?? null,
        deadline: input.deadline ?? null,
        priority,
      },
    });

    await tx.task.createMany({
      data: seeds.map((s) => ({
        userId,
        targetId: t.id,
        title: s.title,
        description: null,
        deadline: s.deadline ?? null,
        priority, // sub-tasks inherit target priority at creation time
        isCompleted: false,
      })),
    });

    // A target with one or more sub-tasks starts INCOMPLETE — even if the
    // only sub-task is already pre-completed (which isn't possible at
    // creation since we don't accept that flag, but the rule stays correct).
    if (t.status === 'COMPLETED') {
      await tx.target.update({
        where: { id: t.id },
        data: { status: 'INCOMPLETE' },
      });
    }

    return t;
  });

  return target;
}

export async function updateTarget(
  userId: string,
  targetId: string,
  input: UpdateTargetInput,
) {
  await ensureOwnTarget(userId, targetId);
  const data: Record<string, unknown> = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.deadline !== undefined) data.deadline = input.deadline;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.status !== undefined) data.status = input.status;

  const updated = await prisma.target.update({
    where: { id: targetId },
    data,
  });
  return updated;
}

export async function deleteTarget(userId: string, targetId: string) {
  await ensureOwnTarget(userId, targetId);
  // Cascade-delete is wired in the Prisma schema (Task → Target onDelete
  // Cascade) so sub-tasks will be cleaned up automatically.
  await prisma.target.delete({ where: { id: targetId } });
  return { ok: true };
}

/**
 * Recompute a target's COMPLETED/INCOMPLETE flag based on its sub-tasks.
 * Called from the tasks service whenever a sub-task toggles completion.
 *
 * Returns the target's new status (or null if it has no sub-tasks — in
 * which case we don't touch the status field).
 */
export async function recomputeTargetStatus(targetId: string) {
  const tasks = await prisma.task.findMany({
    where: { targetId },
    select: { isCompleted: true },
  });

  // No sub-tasks? Leave the user-set status alone.
  if (tasks.length === 0) return null;

  const allDone = tasks.every((t) => t.isCompleted);
  const newStatus = allDone ? 'COMPLETED' : 'INCOMPLETE';

  await prisma.target.update({
    where: { id: targetId },
    data: { status: newStatus },
  });
  return newStatus;
}