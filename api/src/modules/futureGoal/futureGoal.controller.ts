import type { Request } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import * as service from './futureGoal.service';
import { futureGoalSchema } from './futureGoal.schema';

function userId(req: Request): string {
  const id = (req as any).user?.id as string | undefined;
  if (!id) {
    const err: any = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  return id;
}

export const get = asyncHandler(async (req, res) => {
  const id = userId(req);
  const goal = await service.getFutureGoal(id);
  res.json({ goal, futureGoal: goal });
});

export const put = asyncHandler(async (req, res) => {
  const id = userId(req);
  const data = futureGoalSchema.parse(req.body);
  const goal = await service.upsertFutureGoal(id, data);
  res.json({ goal, futureGoal: goal });
});