import type { Request, Response } from 'express';
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
export async function dashboard(req: Request, res: Response) {
  const id = userId(req);
  const data = await service.getDashboard(id);
  res.json(data);
}

/**
 * GET /api/progress — payloads for the /dashboard/my-progress screen.
 * Returns user, productivityScore, all-target breakdown, 30-day trend,
 * HIGH/MED/LOW points distribution.
 */
export async function progress(req: Request, res: Response) {
  const id = userId(req);
  const data = await service.getProgress(id);
  res.json(data);
}
