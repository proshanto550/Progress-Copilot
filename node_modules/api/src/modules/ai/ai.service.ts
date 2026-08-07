import { prisma } from '../../lib/prisma';
import { badRequest, notFound, unauthorized } from '../../lib/errors';
import type { SendMessageInput } from './ai.schema';

/**
 * AI Assistant service — Phase 6.
 *
 * Responsibilities:
 *   1. CRUD on `ChatHistory` rows (one per conversation).
 *   2. Persist user + assistant messages into `Message`.
 *   3. Build the prompt history from prior messages and call Gemini.
 *   4. Auto-derive the chat title from the first user prompt when the
 *      chat is freshly created.
 *
 * Gemini API:
 *   We hit Google's `generateContent` endpoint directly via `fetch` so
 *   we don't pin to a specific SDK version. The model is configurable
 *   via `GEMINI_MODEL` (default `gemini-flash-latest`). If `GEMINI_API_KEY`
 *   is missing we fall back to a deterministic stub so the dev server
 *   still works without a paid key — the stub echoes the user's intent
 *   with a friendly Edith-style reply.
 *
 * Identity:
 *   Every request is preceded by an "Edith" system prompt that
 *   establishes Edith as the AI assistant for Progress Copilot. The
 *   assistant MUST always identify as Edith if asked.
 */

const EDITH_SYSTEM_PROMPT = `You are Edith, an AI assistant built into Progress Copilot — a productivity platform for tracking targets, tasks, notes, courses, reminders, and life-path goals.

Your identity rules:
• You must always identify as "Edith" when asked your name.
• You are warm, concise, and helpful. Default to short answers (2–6 sentences) unless the user explicitly asks for depth.
• You have access to the user's live app data (loaded automatically on every message). Use it to give personalized, data-driven answers — don't ask the user for numbers you already have.
• When the user shares a new fact about themselves (a deadline, a mood, a preference), treat it as in-session context for the rest of the conversation. Don't try to "save" it.

Your responsibilities:
• Help the user plan, prioritize, and reflect on their progress with reference to their real targets, streaks, points, and recent task activity.
• Call out patterns you see in their data (e.g. "you've completed N tasks this week, mostly HIGH priority — solid week").
• Suggest concrete next actions — a target to revisit, a task to break down, a reminder to schedule — based on what they actually have.
• Motivate without being preachy. Acknowledge streaks and progress; be honest about gaps.

Tone:
• Friendly and direct. Address the user by their first name when you know it.
• No fluff. Use markdown only when it adds clarity (lists, code, headings).
• If you don't know something, say so plainly rather than guessing.

## About the app owner (for context only)
Progress Copilot is built by Proshanto Kumar Das (@proshanto550 on GitHub), a B.Sc. CSE student at Metropolitan University, Sylhet, Bangladesh, currently in his 4th year / 1st semester. His teammate on the project is Tanim Sakib.
When users ask "who built this app?" or "who made you?" you can share that — but never treat the owner as the user chatting with you. The user in front of you is whoever is signed in; their profile starts with just their fullName and email. As that user logs targets, tasks, notes, and reminders, you'll learn about them through their data, not from a pre-filled bio.`;

/**
 * Default Gemini model. `gemini-flash-latest` always points to the
 * current Flash-tier stable release and currently resolves to
 * Gemini 3.x Flash — fast and cheap, great for a chat assistant.
 * Override with the `GEMINI_MODEL` env var if you want a specific
 * pinned model.
 */
const GEMINI_DEFAULT_MODEL = 'gemini-flash-latest';
/**
 * Base URL for Google's `generateContent` REST endpoint. We append
 * `/<model>:generateContent?key=<KEY>` per call.
 */
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
/**
 * If the configured model 404s, we'll try these in order before giving
 * up. This keeps the app working when Google retires or renames a
 * specific model identifier.
 */
const GEMINI_FALLBACK_MODELS = [
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
];
const TITLE_MAX_LEN = 48;

/**
 * Generate a short, human-readable title from the first user prompt.
 * Falls back to the truncated prompt itself if the call to Gemini
 * fails (so the chat is still usable).
 */
function autoTitleFromPrompt(prompt: string): string {
  const cleaned = prompt
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length <= TITLE_MAX_LEN) return cleaned;
  return cleaned.slice(0, TITLE_MAX_LEN - 1).trimEnd() + '…';
}

/**
 * Resolve the Edith system prompt for a given user. Combines the
 * base Edith persona with a live personalization block (profile +
 * aggregates) loaded from the database. Failures inside the
 * personalization loader fall back to the bare-bones prompt so a
 * transient DB blip never breaks the chat.
 */
/**
 * Live stats block injected into the system prompt for the signed-in
 * user. Owner info (Proshanto, Tanim Sakib) lives in EDITH_SYSTEM_PROMPT
 * as static context — never in user data.
 */
type LiveStatsBlock = {
  points: number;
  dailyStreak: number;
  targetCount: number;
  completedTargetCount: number;
  pendingTaskCount: number;
  completedTasksLast7d: number;
  topTargetsByTaskLoad: { title: string; taskCount: number; completedTaskCount: number }[];
  pointsDistribution: { high: number; medium: number; low: number };
  upcomingReminderCount: number;
};

/**
 * Load a live snapshot of the signed-in user's data so Edith can answer
 * with real numbers instead of asking the user to paste them.
 *
 * Everything here is per-user (not owner context). If anything fails
 * we return an empty-ish block so the prompt still resolves.
 */
async function loadPersonalization(
  userId: string,
): Promise<{ displayName: string; firstName: string; stats: LiveStatsBlock }> {
  const empty: LiveStatsBlock = {
    points: 0,
    dailyStreak: 0,
    targetCount: 0,
    completedTargetCount: 0,
    pendingTaskCount: 0,
    completedTasksLast7d: 0,
    topTargetsByTaskLoad: [],
    pointsDistribution: { high: 0, medium: 0, low: 0 },
    upcomingReminderCount: 0,
  };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true, points: true, dailyStreak: true },
  });
  if (!user) {
    return { displayName: 'there', firstName: 'there', stats: empty };
  }

  const displayName = user.fullName?.trim() || 'there';
  const firstName = displayName.split(/\s+/)[0] || displayName;

  const [
    targetGroups,
    completedTargets,
    pendingTasks,
    completedLast7d,
    topTargets,
    pointsByPriority,
    upcomingReminders,
  ] = await Promise.all([
    prisma.target.groupBy({
      by: ['status'],
      where: { userId },
      _count: { _all: true },
    }),
    prisma.target.count({
      where: { userId, status: 'COMPLETED' },
    }),
    prisma.task.count({
      where: { userId, isCompleted: false },
    }),
    prisma.task.count({
      where: {
        userId,
        isCompleted: true,
        completedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.target.findMany({
      where: { userId, status: 'INCOMPLETE' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        title: true,
        _count: { select: { tasks: true } },
        tasks: {
          where: { isCompleted: true },
          select: { id: true },
        },
      },
    }),
    prisma.task.groupBy({
      by: ['priority'],
      where: { userId, isCompleted: true },
      _count: { _all: true },
    }),
    prisma.reminder.count({
      where: {
        userId,
        isSent: false,
        time: { gte: new Date() },
      },
    }),
  ]);

  const targetCount = targetGroups.reduce((acc, g) => acc + g._count._all, 0);

  const pointsDistribution = { high: 0, medium: 0, low: 0 };
  for (const row of pointsByPriority) {
    if (row.priority === 'HIGH') pointsDistribution.high = row._count._all;
    else if (row.priority === 'MEDIUM') pointsDistribution.medium = row._count._all;
    else if (row.priority === 'LOW') pointsDistribution.low = row._count._all;
  }

  const stats: LiveStatsBlock = {
    points: user.points ?? 0,
    dailyStreak: user.dailyStreak ?? 0,
    targetCount,
    completedTargetCount: completedTargets,
    pendingTaskCount: pendingTasks,
    completedTasksLast7d: completedLast7d,
    topTargetsByTaskLoad: topTargets.map((t) => ({
      title: t.title,
      taskCount: t._count.tasks,
      completedTaskCount: t.tasks.length,
    })),
    pointsDistribution,
    upcomingReminderCount: upcomingReminders,
  };

  return { displayName, firstName, stats };
}

/**
 * Render the live stats block for the signed-in user. No owner info
 * here — owner info is in EDITH_SYSTEM_PROMPT as static context.
 */
function renderPersonalization(
  displayName: string,
  firstName: string,
  stats: LiveStatsBlock,
): string {
  const topTargetsLine = stats.topTargetsByTaskLoad.length
    ? stats.topTargetsByTaskLoad
        .map(
          (t) =>
            `- ${t.title} — ${t.completedTaskCount}/${t.taskCount} tasks done`,
        )
        .join('\n')
    : '- (no active targets yet)';

  const today = new Date().toISOString().slice(0, 10);

  return `Hi ${firstName}, here's what I know about you right now (${today}):

Personal info available to me:
- Full name: ${displayName}
- Other profile fields (hometown, university, hobbies, etc.) are not yet stored — that arrives in Phase 7. If the user asks about themselves and it isn't on this list, say you don't have it yet.

Live data snapshot:
- Points: ${stats.points}
- Daily streak: ${stats.dailyStreak} day(s)
- Targets: ${stats.targetCount} total, ${stats.completedTargetCount} completed, ${stats.targetCount - stats.completedTargetCount} still active
- Tasks: ${stats.pendingTaskCount} pending, ${stats.completedTasksLast7d} completed in the last 7 days
- Upcoming reminders: ${stats.upcomingReminderCount}
- Points distribution by task priority (completed tasks): HIGH ${stats.pointsDistribution.high}, MEDIUM ${stats.pointsDistribution.medium}, LOW ${stats.pointsDistribution.low}
- Top active targets by task load:
${topTargetsLine}

Reminder: if the user asks anything about themselves that isn't covered above, tell them you don't have it yet and suggest they add it once Phase 7 ships. Don't invent profile details.`;
}

/**
 * Resolve the Edith system prompt for a given user. Combines the
 * base Edith persona (which includes the app-owner context block)
 * with a live data snapshot for the signed-in user. Failures inside
 * the loader fall back to the bare-bones prompt so a transient DB blip
 * never breaks the chat.
 */
async function buildSystemPrompt(userId: string): Promise<string> {
  try {
    const { displayName, firstName, stats } = await loadPersonalization(userId);
    return `${EDITH_SYSTEM_PROMPT}\n\n---\n\n${renderPersonalization(
      displayName,
      firstName,
      stats,
    )}`;
  } catch (err) {
    // Log and continue with just the base prompt — chat must always work.
    console.error('[ai.service] loadPersonalization failed, using base prompt:', err);
    return EDITH_SYSTEM_PROMPT;
  }
}

/**
 * Chat message in a provider-neutral shape. Gemini's `contents[]`
 * format uses `role: "user" | "model"` plus a `parts: [{ text }]`
 * payload, so we adapt this shape inside `callGemini()`.
 */
type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

/**
 * Call Google's Gemini `generateContent` endpoint and return the
 * assistant text.
 *
 * If the configured model 404s, we walk through a small fallback list
 * before giving up — that way a future model rename on Google's side
 * doesn't break the app for users who haven't updated their env vars.
 *
 * Throws on any other transport / API error so the controller can
 * surface it to the user.
 */
async function callGemini(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const configured = process.env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL;

  if (!apiKey) {
    // Offline fallback — keeps the chat usable in dev without a key.
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const echoed = lastUser?.content ?? '';
    return [
      `*(Edith is running in offline mode — set GEMINI_API_KEY on the API server to enable live replies.)*`,
      ``,
      `You said: "${echoed.length > 200 ? echoed.slice(0, 200) + '…' : echoed}"`,
      ``,
      `Try one of these prompts to see how I'll respond once the key is configured:`,
      `• "Help me plan a 30-day study sprint for AWS certification."`,
      `• "Summarize my week and suggest three priorities for Monday."`,
      `• "I'm stuck on a target — can you help me break it into sub-tasks?"`,
    ].join('\n');
  }

  // Split the system prompt from the conversation — Gemini's API
  // expects `systemInstruction` separately from `contents[]`.
  const systemMessage = messages.find((m) => m.role === 'system')?.content;
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  // Build the model list: configured first, then the fallbacks (de-duped).
  const models = Array.from(
    new Set([configured, ...GEMINI_FALLBACK_MODELS]),
  );

  let lastError: string | null = null;
  for (const model of models) {
    const url = `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(systemMessage
          ? { systemInstruction: { role: 'system', parts: [{ text: systemMessage }] } }
          : {}),
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };
      const text = data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? '')
        .join('')
        .trim();
      if (text) return text;
      lastError = 'Gemini returned an empty response';
      // Try the next model — sometimes a given model returns blank
      // for certain prompts and a sibling model handles it fine.
      continue;
    }

    const text = await res.text().catch(() => '');

    // Only treat "model not found" as a fallback signal; everything else
    // (auth, rate limit, bad request) is fatal and should surface to the user.
    if (res.status === 404 || (res.status === 400 && /not found/i.test(text))) {
      lastError = `model "${model}" not available`;
      continue;
    }

    throw badRequest(
      `Gemini API error (${res.status}): ${text.slice(0, 200) || res.statusText}`,
    );
  }

  throw badRequest(
    `No Gemini model accepted the request (${lastError ?? 'unknown reason'}). ` +
      `Set GEMINI_MODEL in api/.env to a model listed at ` +
      `https://ai.google.dev/models.`,
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Ownership helpers
   ────────────────────────────────────────────────────────────────────────── */

async function ensureOwnChat(userId: string, chatId: string) {
  const chat = await prisma.chatHistory.findUnique({
    where: { id: chatId },
    select: { id: true, userId: true, title: true },
  });
  if (!chat) throw notFound('Chat not found');
  if (chat.userId !== userId) throw unauthorized('Not your chat');
  return chat;
}

/* ──────────────────────────────────────────────────────────────────────────
   Public API
   ────────────────────────────────────────────────────────────────────────── */

/** List the user's chats (newest first). Returns lightweight summaries. */
export async function listChats(userId: string) {
  const rows = await prisma.chatHistory.findMany({
    where: { userId },
    orderBy: [{ updatedAt: 'desc' }],
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  });
  return rows.map((c) => ({
    id: c.id,
    title: c.title,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    messageCount: c._count.messages,
  }));
}

/** Single chat header info (no messages; pull those via getMessages). */
export async function getChat(userId: string, chatId: string) {
  const chat = await ensureOwnChat(userId, chatId);
  return { id: chat.id, title: chat.title };
}

/** Full message history for a chat, oldest first. */
export async function getMessages(userId: string, chatId: string) {
  await ensureOwnChat(userId, chatId);
  return prisma.message.findMany({
    where: { chatId },
    orderBy: [{ createdAt: 'asc' }],
    select: {
      id: true,
      sender: true,
      content: true,
      createdAt: true,
    },
  });
}

/** Create an empty chat (used by the "+ New Chat" sidebar button). */
export async function createChat(userId: string, title?: string) {
  const chat = await prisma.chatHistory.create({
    data: {
      userId,
      title: title?.trim() || 'New chat',
    },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });
  return { ...chat, messageCount: 0 };
}

/** Rename a chat (used by inline edit in the sidebar). */
export async function renameChat(userId: string, chatId: string, title: string) {
  const chat = await ensureOwnChat(userId, chatId);
  const updated = await prisma.chatHistory.update({
    where: { id: chat.id },
    data: { title: title.trim() },
    select: { id: true, title: true, updatedAt: true },
  });
  return updated;
}

/** Delete a chat (cascades to messages). */
export async function deleteChat(userId: string, chatId: string) {
  const chat = await ensureOwnChat(userId, chatId);
  await prisma.chatHistory.delete({ where: { id: chat.id } });
  return { ok: true as const, id: chat.id };
}

/**
 * Send a user message. If `chatId` is omitted, a new chat is created
 * (its title auto-derived from the prompt). The user message is
 * persisted, then the assistant reply is generated via Gemini and
 * persisted. The full updated chat history is returned so the UI
 * can refresh in one round-trip.
 */
export async function sendMessage(userId: string, input: SendMessageInput) {
  // 1. Resolve / create the chat.
  let chatId = input.chatId ?? null;
  if (chatId) {
    const owned = await ensureOwnChat(userId, chatId);
    chatId = owned.id;
  } else {
    const created = await prisma.chatHistory.create({
      data: {
        userId,
        title: 'New chat', // will be patched after persist
      },
      select: { id: true },
    });
    chatId = created.id;
  }

  // 2. Persist the user message.
  const userMessage = await prisma.message.create({
    data: {
      chatId,
      sender: 'USER',
      content: input.content,
    },
    select: {
      id: true,
      sender: true,
      content: true,
      createdAt: true,
    },
  });

  // 3. Auto-title the chat on the first user turn.
  const existingCount = await prisma.message.count({
    where: { chatId, sender: 'USER' },
  });

  // 4. Build the prompt history (oldest first) and call Gemini.
  const history = await prisma.message.findMany({
    where: { chatId },
    orderBy: [{ createdAt: 'asc' }],
    select: { sender: true, content: true },
  });
  const systemPrompt = await buildSystemPrompt(userId);
  const geminiMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({
      role: m.sender === 'USER' ? ('user' as const) : ('assistant' as const),
      content: m.content,
    })),
  ];

  let reply: string;
  try {
    reply = await callGemini(geminiMessages);
  } catch (err) {
    // If the assistant call fails, we still want to keep the user's
    // message. Roll back the title guess (so we don't store a
    // misleading name on an unfinished conversation) and rethrow.
    if (existingCount === 1) {
      await prisma.chatHistory.update({
        where: { id: chatId },
        data: { title: 'New chat' },
      });
    }
    throw err;
  }

  // 5. Persist the assistant reply.
  const assistantMessage = await prisma.message.create({
    data: {
      chatId,
      sender: 'AI',
      content: reply,
    },
    select: {
      id: true,
      sender: true,
      content: true,
      createdAt: true,
    },
  });

  // 6. Update chat title (after first successful turn) + bump updatedAt.
  if (existingCount === 1) {
    await prisma.chatHistory.update({
      where: { id: chatId },
      data: { title: autoTitleFromPrompt(input.content) },
    });
  } else {
    await prisma.chatHistory.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });
  }

  return {
    chatId,
    userMessage,
    assistantMessage,
  };
}