import type { Request, Response } from 'express';
import * as service from './targets.service';
import {
  createTargetSchema,
  updateTargetSchema,
} from './targets.schema';

function userId(req: Request): string {
  const id = (req as any).user?.id as string | undefined;
  if (!id) {
    const err: any = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  return id;
}

export async function list(req: Request, res: Response) {
  const id = userId(req);
  const targets = await service.listTargets(id);
  res.json({ targets });
}

export async function getOne(req: Request, res: Response) {
  const id = userId(req);
  const target = await service.getTarget(id, req.params.id);
  res.json({ target });
}

export async function create(req: Request, res: Response) {
  const id = userId(req);
  const data = createTargetSchema.parse(req.body);
  const target = await service.createTarget(id, data);
  res.status(201).json({ target });
}

export async function update(req: Request, res: Response) {
  const id = userId(req);
  const data = updateTargetSchema.parse(req.body);
  const target = await service.updateTarget(id, req.params.id, data);
  res.json({ target });
}

export async function remove(req: Request, res: Response) {
  const id = userId(req);
  const out = await service.deleteTarget(id, req.params.id);
  res.json(out);
}