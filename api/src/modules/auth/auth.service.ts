import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import { conflict, unauthorized } from '../../lib/errors';
import { signToken } from '../../lib/jwt';
import type { LoginInput, SignupInput } from './auth.schema';

const safeUser = (u: any) => ({
  id: u.id,
  fullName: u.fullName,
  email: u.email,
  avatar: u.avatar,
  theme: u.theme,
  points: u.points,
  dailyStreak: u.dailyStreak,
  createdAt: u.createdAt,
});

export async function signup(input: SignupInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw conflict('Email already registered');

  const password = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: { fullName: input.fullName, email: input.email, password },
  });

  const token = signToken({ sub: user.id, email: user.email });
  return { token, user: safeUser(user) };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw unauthorized('Invalid email or password');

  const ok = await bcrypt.compare(input.password, user.password);
  if (!ok) throw unauthorized('Invalid email or password');

  const token = signToken({ sub: user.id, email: user.email });
  return { token, user: safeUser(user) };
}