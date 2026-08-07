# Progress Copilot

> A platform for smarter progress — user-centric progress tracking with targets, tasks, reminders, notes, courses, AI assistant, GitHub projects, life path timeline and reports.

## Stack

- **web/** — React (Vite) + TypeScript + Tailwind + Framer Motion + React Router + React Query + Axios + Recharts
- **api/** — Node + Express + TypeScript + Prisma + PostgreSQL + JWT + Bcrypt + Zod
- AI: Google Gemini (Edith assistant, added in later phases)

## Quick start

```bash
# 1. Install workspaces (run once at repo root)
npm install

# 2. Configure api
cp api/.env.example api/.env
# edit DATABASE_URL, JWT_SECRET, etc.

# 3. Generate Prisma client + apply schema (first time)
npm run prisma:generate
npm run prisma:migrate

# 4. Run both apps
npm run dev        # api on :4000, web on :5173

# Or run individually
npm run dev:api
npm run dev:web
```

## Folder layout

```
Progress Copilot/
├── package.json           # npm workspaces root
├── api/
│   ├── prisma/schema.prisma
│   └── src/               # server.ts, app.ts (added in later phases)
└── web/
    └── src/               # React entry (added in later phases)
```

## Phase 1 scope

- Monorepo scaffold (`api` + `web`)
- Tooling and dependencies for the entire stack
- Complete `schema.prisma`: User, FutureGoal, Target, Task, Note, Course, Reminder, ChatHistory, Message
- No business logic yet — that ships feature-by-feature.