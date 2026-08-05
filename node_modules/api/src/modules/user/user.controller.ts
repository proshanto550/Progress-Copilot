import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';

const updateMeSchema = z.object({
  theme: z.enum(['light', 'dark']).optional(),
  fullName: z.string().min(1).max(80).optional(),
});

export async function updateMe(req: Request, res: Response) {
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
  };
  return res.json({ user: safe });
}
