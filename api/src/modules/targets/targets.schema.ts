import { z } from 'zod';

/**
 * Zod schemas for the Targets module.
 *
 * A Target is a goal that owns 0..N sub-tasks (Task rows where targetId
 * is set). When every sub-task is completed the target is automatically
 * marked COMPLETED; unchecking any sub-task flips it back to INCOMPLETE.
 */

const priority = z.enum(['HIGH', 'MEDIUM', 'LOW']);
const status = z.enum(['INCOMPLETE', 'COMPLETED']);

const isoDateOptional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length ? new Date(v) : null))
  .refine((v) => v === null || !Number.isNaN(v.getTime()), 'Invalid date');

export const createTargetSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  deadline: isoDateOptional,
  priority: priority.optional(),
});

export const updateTargetSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).optional().nullable(),
    deadline: isoDateOptional,
    priority: priority.optional(),
    status: status.optional(),
  })
  .strict();

export type CreateTargetInput = z.infer<typeof createTargetSchema>;
export type UpdateTargetInput = z.infer<typeof updateTargetSchema>;
