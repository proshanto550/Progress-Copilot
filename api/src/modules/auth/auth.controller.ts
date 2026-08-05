import type { Request, Response } from 'express';
import * as service from './auth.service';
import { signupSchema, loginSchema } from './auth.schema';
import { cookieOptions } from '../../lib/jwt';

export async function signup(req: Request, res: Response) {
  const data = signupSchema.parse(req.body);
  const { token, user } = await service.signup(data);
  res.cookie('token', token, cookieOptions);
  res.status(201).json({ token, user });
}

export async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);
  const { token, user } = await service.login(data);
  res.cookie('token', token, cookieOptions);
  res.json({ token, user });
}

export async function me(req: Request, res: Response) {
  // populated by auth middleware
  res.json({ user: (req as any).user });
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie('token', { path: '/' });
  res.json({ ok: true });
}