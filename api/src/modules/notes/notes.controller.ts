import type { Request } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { prisma } from '../../lib/prisma';
import { notFound } from '../../lib/errors';

const noteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(150),
  content: z.string().default(''),
});

export const getNotes = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string;
  const notes = await prisma.note.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ notes });
});

export const createNote = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string;
  const { title, content } = noteSchema.parse(req.body);
  const note = await prisma.note.create({
    data: { userId, title, content },
  });
  return res.status(201).json({ note });
});

export const updateNote = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string;
  const { id } = req.params;
  const { title, content } = noteSchema.parse(req.body);

  const existing = await prisma.note.findFirst({ where: { id, userId } });
  if (!existing) throw notFound('Note not found');

  const note = await prisma.note.update({
    where: { id },
    data: { title, content },
  });
  return res.json({ note });
});

export const deleteNote = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string;
  const { id } = req.params;

  const existing = await prisma.note.findFirst({ where: { id, userId } });
  if (!existing) throw notFound('Note not found');

  await prisma.note.delete({ where: { id } });
  return res.json({ ok: true });
});
