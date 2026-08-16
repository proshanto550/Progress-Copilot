import type { Request } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { prisma } from '../../lib/prisma';
import { notFound } from '../../lib/errors';

const courseSchema = z.object({
  title: z.string().min(1, 'Course title is required').max(150),
  resourceLink: z.string().min(1, 'Resource link is required'),
  semester: z.string().min(1, 'Semester is required').default('1st Semester'),
});

export const getCourses = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string;
  const courses = await prisma.course.findMany({
    where: { userId },
    orderBy: [{ semester: 'asc' }, { createdAt: 'desc' }],
  });
  return res.json({ courses });
});

export const createCourse = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string;
  const { title, resourceLink, semester } = courseSchema.parse(req.body);
  const course = await prisma.course.create({
    data: { userId, title, resourceLink, semester },
  });
  return res.status(201).json({ course });
});

export const updateCourse = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string;
  const { id } = req.params;
  const { title, resourceLink, semester } = courseSchema.parse(req.body);

  const existing = await prisma.course.findFirst({ where: { id, userId } });
  if (!existing) throw notFound('Course not found');

  const course = await prisma.course.update({
    where: { id },
    data: { title, resourceLink, semester },
  });
  return res.json({ course });
});

export const deleteCourse = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string;
  const { id } = req.params;

  const existing = await prisma.course.findFirst({ where: { id, userId } });
  if (!existing) throw notFound('Course not found');

  await prisma.course.delete({ where: { id } });
  return res.json({ ok: true });
});
