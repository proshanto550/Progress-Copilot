import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';
import { prisma } from '../lib/prisma';
import { unauthorized } from '../lib/errors';

export async function authRequired(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const bearer = header?.startsWith('Bearer ') ? header.slice(7) : null;
    const cookieToken = (req as any).cookies?.token;
    const token = bearer || cookieToken;
    if (!token) throw unauthorized('Missing token');

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true, fullName: true, email: true, avatar: true, theme: true,
        points: true, dailyStreak: true, createdAt: true,
        hometown: true, university: true, degree: true, yearSemester: true,
        hobbies: true, interests: true, aiBio: true,
      },
    });
    if (!user) throw unauthorized('User not found');

    (req as any).user = user;
    next();
  } catch (e: any) {
    if (e?.name === 'JsonWebTokenError' || e?.name === 'TokenExpiredError') {
      next(unauthorized('Invalid or expired token'));
    } else {
      next(e);
    }
  }
}