import type { Request } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { prisma } from '../../lib/prisma';
import { badRequest, notFound } from '../../lib/errors';

const reminderSchema = z.object({
  targetId: z.string().nullable().optional(),
  taskId: z.string().nullable().optional(),
  time: z.string().min(1, 'Time is required'),
});

export const getReminders = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string;
  const reminders = await prisma.reminder.findMany({
    where: { userId },
    include: {
      target: { select: { id: true, title: true, priority: true } },
      task: { select: { id: true, title: true, priority: true } },
    },
    orderBy: { time: 'asc' },
  });
  return res.json({ reminders });
});

export const createReminder = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string;
  const { targetId, taskId, time } = reminderSchema.parse(req.body);

  if (!targetId && !taskId) {
    throw badRequest('Must specify either a Target or a Task');
  }

  const reminderTime = new Date(time);
  if (isNaN(reminderTime.getTime())) {
    throw badRequest('Invalid date/time');
  }

  const reminder = await prisma.reminder.create({
    data: {
      userId,
      targetId: targetId || null,
      taskId: taskId || null,
      time: reminderTime,
    },
    include: {
      target: { select: { id: true, title: true, priority: true } },
      task: { select: { id: true, title: true, priority: true } },
    },
  });
  return res.status(201).json({ reminder });
});

export const deleteReminder = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string;
  const { id } = req.params;

  const existing = await prisma.reminder.findFirst({ where: { id, userId } });
  if (!existing) throw notFound('Reminder not found');

  await prisma.reminder.delete({ where: { id } });
  return res.json({ ok: true });
});
