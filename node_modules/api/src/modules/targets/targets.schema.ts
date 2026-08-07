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
  .nullable()
  .transform((v) => {
    if (v === null || v === undefined) return null;
    if (typeof v !== 'string' || v.length === 0) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  });

const subTaskSeedSchema = z.object({
  title: z.string().trim().min(1, 'Sub-task title is required').max(200),
  deadline: isoDateOptional,
});

export const createTargetSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  deadline: isoDateOptional,
  priority: priority.optional(),
  // A target must be created with at least one sub-task. Each sub-task
  // inherits the target's priority when computing points.
  subTasks: z
    .array(subTaskSeedSchema)
    .min(1, 'Add at least one sub-task to create this target')
    .max(50, 'A target can have at most 50 sub-tasks at creation'),
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
