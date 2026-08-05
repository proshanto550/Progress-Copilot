import { prisma } from '../../lib/prisma';
import type { FutureGoalInput } from './futureGoal.schema';

/**
 * Future Goal — singleton per user.
 *
 * Prisma's `FutureGoal.userId @unique` makes this naturally a one-to-one
 * upsert, so the service exposes two operations: GET and PUT. PUT always
 * writes the row (creating it on first call, updating it on subsequent
 * calls) so the frontend doesn't have to know whether the goal exists.
 */

export async function getFutureGoal(userId: string) {
  return prisma.futureGoal.findUnique({ where: { userId } });
}

export async function upsertFutureGoal(
  userId: string,
  input: FutureGoalInput,
) {
  // upsert by userId — the schema's @unique makes this safe and atomic.
  const goal = await prisma.futureGoal.upsert({
    where: { userId },
    update: { title: input.title },
    create: { userId, title: input.title },
  });
  return goal;
}