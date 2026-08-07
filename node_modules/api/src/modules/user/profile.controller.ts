import type { Request } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { prisma } from '../../lib/prisma';

/**
 * GET /api/user/profile — full profile (incl. personalization fields that
 * power the Edith context block). Used by the AI settings page and by
 * the dashboard's "tell Edith about me" form.
 */
export const getProfile = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      avatar: true,
      theme: true,
      points: true,
      dailyStreak: true,
      createdAt: true,
      hometown: true,
      university: true,
      degree: true,
      yearSemester: true,
      hobbies: true,
      interests: true,
      aiBio: true,
    },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ profile: user });
});

/**
 * PUT /api/user/profile — update personalization fields.
 * All fields are optional so partial saves work; the controller
 * applies the patch with `undefined`-pruning so untouched columns
 * stay intact.
 */
const profileSchema = z.object({
  fullName: z.string().min(1).max(80).optional(),
  hometown: z.string().max(120).nullable().optional(),
  university: z.string().max(160).nullable().optional(),
  degree: z.string().max(160).nullable().optional(),
  yearSemester: z.string().max(60).nullable().optional(),
  hobbies: z.string().max(400).nullable().optional(),
  interests: z.string().max(400).nullable().optional(),
  aiBio: z.string().max(2000).nullable().optional(),
});

export const updateProfile = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const patch = profileSchema.parse(req.body);

  // Treat `null` and empty string both as "clear this field" so the
  // frontend can send a deliberate reset without an awkward two-step call.
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    data[key] = typeof value === 'string' && value.trim() === '' ? null : value;
  }

  if (Object.keys(data).length === 0) {
    return res.json({ profile: null, updated: 0 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      fullName: true,
      email: true,
      hometown: true,
      university: true,
      degree: true,
      yearSemester: true,
      hobbies: true,
      interests: true,
      aiBio: true,
    },
  });

  return res.json({ profile: updated, updated: 1 });
});
