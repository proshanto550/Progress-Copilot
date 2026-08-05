import { z } from 'zod';

/**
 * Zod schemas for the Tasks module.
 *
 * A Task is either:
 *   - a standalone task (targetId is null), or
 *   - a sub-task belonging to a Target (targetId is set).
 *
 * The completion state carries point/streak side-effects handled by the
 * service layer — the schema only validates the wire shape.
 */

const priority = z.enum(['HIGH', 'MEDIUM', 'LOW']);
export type PriorityInput = z.infer<typeof priority>;

const isoDate = z
  .string()
  .trim()
  .min(1, 'Deadline is required')
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date')
  .transform((v) => new Date(v));

const isoDateOptional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length ? new Date(v) : null))
  .refine((v) => v === null || !Number.isNaN(v.getTime()), 'Invalid date');

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  deadline: isoDateOptional,
  priority: priority.optional(),
  targetId: z.string().trim().min(1).optional().nullable(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).optional().nullable(),
    deadline: isoDateOptional,
    priority: priority.optional(),
    targetId: z.string().trim().min(1).optional().nullable(),
  })
  .strict();

/**
 * Dedicated schema for the `PATCH /tasks/:id/toggle` route.
 * Only `isCompleted` is mutable from this endpoint — title edits go through
 * PATCH /tasks/:id to keep the points/streak pipeline in one place.
 */
export const toggleTaskSchema = z.object({
  isCompleted: z.boolean(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ToggleTaskInput = z.infer<typeof toggleTaskSchema>;
