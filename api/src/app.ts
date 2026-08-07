import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import targetRoutes from './modules/targets/targets.routes';
import taskRoutes from './modules/tasks/tasks.routes';
import futureGoalRoutes from './modules/futureGoal/futureGoal.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import { errorHandler } from './middlewares/error';
import { prisma } from './lib/prisma';

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, service: 'progress-copilot-api', db: 'up' });
  } catch (err: any) {
    res.status(503).json({ ok: false, service: 'progress-copilot-api', db: 'down', error: err?.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/targets', targetRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/future-goal', futureGoalRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(errorHandler);

export default app;
