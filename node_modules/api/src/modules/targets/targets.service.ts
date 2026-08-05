import { prisma } from '../../lib/prisma';
import { notFound, unauthorized } from '../../lib/errors';
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
  const target = await prisma.target.create({
    data: {
      userId,
      title: input.title,
      description: input.description ?? null,
      deadline: input.deadline ?? null,
      priority: input.priority ?? 'MEDIUM',
    },
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