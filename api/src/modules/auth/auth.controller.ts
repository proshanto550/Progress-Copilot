import { asyncHandler } from '../../lib/asyncHandler';
import * as service from './auth.service';
import { signupSchema, loginSchema } from './auth.schema';
import { cookieOptions } from '../../lib/jwt';

export const signup = asyncHandler(async (req, res) => {
  const data = signupSchema.parse(req.body);
  const { token, user } = await service.signup(data);
  res.cookie('token', token, cookieOptions);
  res.status(201).json({ token, user });
});

export const login = asyncHandler(async (req, res) => {
  const data = loginSchema.parse(req.body);
  const { token, user } = await service.login(data);
  res.cookie('token', token, cookieOptions);
  res.json({ token, user });
});

export const me = asyncHandler(async (_req, res) => {
  // populated by auth middleware
  res.json({ user: (_req as any).user });
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ ok: true });
});