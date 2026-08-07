import { Router } from 'express';
import { authRequired } from '../../middlewares/auth';
import * as controller from './ai.controller';

/**
 * AI Assistant routes — Phase 6.
 *
 *   GET    /api/ai/chats                  list current user's chats
 *   POST   /api/ai/chats                  create empty chat
 *   GET    /api/ai/chats/:id/messages     chat history
 *   PATCH  /api/ai/chats/:id              rename a chat
 *   DELETE /api/ai/chats/:id              delete a chat
 *   POST   /api/ai/chat                   send a user message + get Edith's reply
 *
 * All endpoints require auth — the service scopes every Prisma call
 * to `req.user.id`.
 */
const router = Router();
router.use(authRequired);

router.get('/chats', controller.listChats);
router.post('/chats', controller.createChat);
router.get('/chats/:id/messages', controller.getMessages);
router.patch('/chats/:id', controller.renameChat);
router.delete('/chats/:id', controller.deleteChat);

router.post('/chat', controller.sendMessage);

export default router;