import { z } from 'zod';

/**
 * Future Goal — singleton per user.
 *
 * The Prisma model only carries `title` today (description/deadline are
 * out of scope for Phase 4), so the schema reflects that. When the model
 * gains more fields later, just extend this schema; the controller code
 * stays the same.
 */
export const futureGoalSchema = z.object({
  title: z.string().trim().min(1, 'Future goal title is required').max(200),
});

export type FutureGoalInput = z.infer<typeof futureGoalSchema>;