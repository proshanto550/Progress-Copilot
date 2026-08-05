import type { Request, Response } from 'express';
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

export async function get(req: Request, res: Response) {
  const id = userId(req);
  const goal = await service.getFutureGoal(id);
  res.json({ goal });
}

export async function put(req: Request, res: Response) {
  const id = userId(req);
  const data = futureGoalSchema.parse(req.body);
  const goal = await service.upsertFutureGoal(id, data);
  res.json({ goal });
}