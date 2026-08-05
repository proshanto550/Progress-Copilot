export type User = {
  id: string;
  fullName: string;
  email: string;
  avatar: string | null;
  theme: 'light' | 'dark';
  points: number;
  dailyStreak: number;
  createdAt: string;
};

export type AuthResponse = { token: string; user: User };

/* ─────────────────────────────────────────────────────────────────── */
/* Phase 4 — Targets / Tasks / Future Goal                              */
/* ─────────────────────────────────────────────────────────────────── */

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export type TargetStatus = 'INCOMPLETE' | 'COMPLETED';

export type FutureGoal = {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type Target = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  deadline: string | null;
  priority: Priority;
  status: TargetStatus;
  createdAt: string;
  updatedAt: string;
  /** Sub-tasks are only populated on the GET /targets/:id endpoint. */
  tasks?: Task[];
};

export type Task = {
  id: string;
  userId: string;
  /** Null for a standalone task; set for a target sub-task. */
  targetId: string | null;
  title: string;
  description: string | null;
  deadline: string | null;
  isCompleted: boolean;
  priority: Priority;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Response shape for `PATCH /tasks/:id/toggle`.
 * `pointsDelta` is +5/4/3/2 on completion, or the negative of the same
 * value on uncheck. `streakBumped` is true only on the call that crossed
 * into a new UTC day.
 */
export type ToggleTaskResult = {
  task: Task;
  pointsDelta: number;
  streakBumped: boolean;
};

/* ── Input DTOs (mirror the backend Zod schemas so the wire contract is
     shared between the two packages without a build-time dependency). */

export type CreateTaskInput = {
  title: string;
  description?: string | null;
  deadline?: Date | string | null;
  priority?: Priority;
  targetId?: string | null;
};

export type UpdateTaskInput = Partial<CreateTaskInput>;

export type CreateTargetInput = {
  title: string;
  description?: string | null;
  deadline?: Date | string | null;
  priority?: Priority;
};

export type UpdateTargetInput = Partial<CreateTargetInput> & {
  status?: TargetStatus;
};