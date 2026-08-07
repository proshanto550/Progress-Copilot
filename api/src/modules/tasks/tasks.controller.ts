import type { Request } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import * as service from './tasks.service';
import {
  createTaskSchema,
  toggleTaskSchema,
  updateTaskSchema,
} from './tasks.schema';

function userId(req: Request): string {
  const id = (req as any).user?.id as string | undefined;
  if (!id) {
    // The auth middleware should have rejected the request before we get
    // here, but guard defensively in case the route is mounted outside
    // the auth gate by accident.
    const err: any = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  return id;
}

export const list = asyncHandler(async (req, res) => {
  const id = userId(req);
  const targetId = typeof req.query.targetId === 'string' ? req.query.targetId : undefined;
  const tasks = await service.listTasks(id, targetId ? { targetId } : undefined);
  res.json({ tasks });
});

export const listByTarget = asyncHandler(async (req, res) => {
  const id = userId(req);
  const tasks = await service.listTasksForTarget(id, req.params.targetId);
  res.json({ tasks });
});

export const getOne = asyncHandler(async (req, res) => {
  const id = userId(req);
  const task = await service.getTask(id, req.params.id);
  res.json({ task });
});

export const create = asyncHandler(async (req, res) => {
  const id = userId(req);
  const data = createTaskSchema.parse(req.body);
  const task = await service.createTask(id, data);
  res.status(201).json({ task });
});

export const update = asyncHandler(async (req, res) => {
  const id = userId(req);
  const data = updateTaskSchema.parse(req.body);
  const task = await service.updateTask(id, req.params.id, data);
  res.json({ task });
});

export const toggle = asyncHandler(async (req, res) => {
  const id = userId(req);
  const { isCompleted } = toggleTaskSchema.parse(req.body);
  const result = await service.toggleTask(id, req.params.id, { isCompleted });
  res.json(result);
});

export const remove = asyncHandler(async (req, res) => {
  const id = userId(req);
  const out = await service.deleteTask(id, req.params.id);
  res.json(out);
});