import type { Request } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { prisma } from '../../lib/prisma';

const updateMeSchema = z.object({
  theme: z.enum(['light', 'dark']).optional(),
  fullName: z.string().min(1).max(80).optional(),
});

export const updateMe = asyncHandler(async (req: Request, res) => {
  const data = updateMeSchema.parse(req.body);
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
  });

  const safe = {
    id: updated.id,
    fullName: updated.fullName,
    email: updated.email,
    avatar: updated.avatar,
    theme: updated.theme,
    points: updated.points,
    dailyStreak: updated.dailyStreak,
    createdAt: updated.createdAt,
    hometown: updated.hometown,
    university: updated.university,
    degree: updated.degree,
    yearSemester: updated.yearSemester,
    hobbies: updated.hobbies,
    interests: updated.interests,
    aiBio: updated.aiBio,
  };
  return res.json({ user: safe });
});
