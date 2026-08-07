import type { Request } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import * as service from './dashboard.service';

function userId(req: Request): string {
  const id = (req as any).user?.id as string | undefined;
  if (!id) {
    const err: any = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  return id;
}

/**
 * GET /api/dashboard — payloads for the /dashboard home screen.
 * Returns user, productivityScore, top 4 targets, 4 pending tasks,
 * 4 upcoming reminders, projects stub, and a 365-day contribution grid.
 */
export const dashboard = asyncHandler(async (req, res) => {
  const id = userId(req);
  const data = await service.getDashboard(id);
  res.json(data);
});

/**
 * GET /api/progress — payloads for the /dashboard/my-progress screen.
 * Returns user, productivityScore, all-target breakdown, 30-day trend,
 * HIGH/MED/LOW points distribution.
 */
export const progress = asyncHandler(async (req, res) => {
  const id = userId(req);
  const data = await service.getProgress(id);
  res.json(data);
});
