import type { Request } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
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

export const list = asyncHandler(async (req, res) => {
  const id = userId(req);
  const targets = await service.listTargets(id);
  res.json({ targets });
});

export const getOne = asyncHandler(async (req, res) => {
  const id = userId(req);
  const target = await service.getTarget(id, req.params.id);
  res.json({ target });
});

export const create = asyncHandler(async (req, res) => {
  const id = userId(req);
  const data = createTargetSchema.parse(req.body);
  const target = await service.createTarget(id, data);
  // Re-fetch with sub-tasks so the UI gets a fully-populated card in one go.
  const fresh = await service.getTarget(id, target.id);
  res.status(201).json({ target: fresh });
});

export const update = asyncHandler(async (req, res) => {
  const id = userId(req);
  const data = updateTargetSchema.parse(req.body);
  const target = await service.updateTarget(id, req.params.id, data);
  res.json({ target });
});

export const remove = asyncHandler(async (req, res) => {
  const id = userId(req);
  const out = await service.deleteTarget(id, req.params.id);
  res.json(out);
});