import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import * as service from './ai.service';
import {
  createChatSchema,
  renameChatSchema,
  sendMessageSchema,
} from './ai.schema';

function userId(req: Request): string {
  const id = (req as any).user?.id as string | undefined;
  if (!id) {
    const err: any = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  return id;
}

/** GET /api/ai/chats — list the current user's chat sessions. */
export const listChats = asyncHandler(async (req, res) => {
  const id = userId(req);
  const chats = await service.listChats(id);
  res.json({ chats });
});

/** POST /api/ai/chats — create an empty chat. */
export const createChat = asyncHandler(async (req, res) => {
  const id = userId(req);
  const data = createChatSchema.parse(req.body ?? {});
  const chat = await service.createChat(id, data.title);
  res.status(201).json({ chat });
});

/** GET /api/ai/chats/:id/messages — full history. */
export const getMessages = asyncHandler(async (req, res) => {
  const id = userId(req);
  const messages = await service.getMessages(id, req.params.id);
  res.json({ messages });
});

/** PATCH /api/ai/chats/:id — rename a chat. */
export const renameChat = asyncHandler(async (req, res) => {
  const id = userId(req);
  const data = renameChatSchema.parse(req.body);
  const chat = await service.renameChat(id, req.params.id, data.title);
  res.json({ chat });
});

/** DELETE /api/ai/chats/:id — delete a chat (and its messages). */
export const deleteChat = asyncHandler(async (req, res) => {
  const id = userId(req);
  const out = await service.deleteChat(id, req.params.id);
  res.json(out);
});

/**
 * POST /api/ai/chat — one-shot user turn.
 *
 * Body: { chatId?: string | null; content: string }
 * Response: { chatId, userMessage, assistantMessage }
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const id = userId(req);
  const data = sendMessageSchema.parse(req.body);
  const result = await service.sendMessage(id, data);
  res.status(201).json(result);
});