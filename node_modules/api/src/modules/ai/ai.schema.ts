import { z } from 'zod';

/**
 * Zod schemas for the AI Assistant module.
 *
 * The wire shape is intentionally minimal — the frontend sends only
 * the user's prompt + the chatId; the service is responsible for
 * loading message history, calling Gemini, and persisting the result.
 */

/** Body of POST /api/ai/chats (creates an empty chat). */
export const createChatSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
});

/** Body of PATCH /api/ai/chats/:id (rename a chat). */
export const renameChatSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
  })
  .strict();

/**
 * Body of POST /api/ai/chat (one-shot user turn).
 * `content` is the user's new message; `chatId` is optional —
 * pass `null`/omit to spawn a brand new conversation.
 */
export const sendMessageSchema = z.object({
  chatId: z.string().trim().min(1).nullable().optional(),
  content: z.string().trim().min(1, 'Message cannot be empty').max(4000),
});

export type CreateChatInput = z.infer<typeof createChatSchema>;
export type RenameChatInput = z.infer<typeof renameChatSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;