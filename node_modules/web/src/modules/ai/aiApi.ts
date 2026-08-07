import { api } from '../../lib/api';
import type {
  ChatMessage,
  ChatSummary,
  RenameChatArgs,
  SendMessageArgs,
  SendMessageResponse,
} from '../../lib/types';

/**
 * Thin Axios wrapper around `/api/ai/*`. Mirrors the convention used
 * by `tasksApi` / `targetsApi` — keep this file dumb; React Query
 * lives in `useAi.ts`.
 */
export const aiApi = {
  listChats: (): Promise<ChatSummary[]> =>
    api
      .get<{ chats: ChatSummary[] }>('/api/ai/chats')
      .then((r) => r.data.chats),

  createChat: (title?: string): Promise<ChatSummary> =>
    api
      .post<{ chat: ChatSummary }>('/api/ai/chats', title ? { title } : {})
      .then((r) => r.data.chat),

  getMessages: (chatId: string): Promise<ChatMessage[]> =>
    api
      .get<{ messages: ChatMessage[] }>(`/api/ai/chats/${chatId}/messages`)
      .then((r) => r.data.messages),

  sendMessage: (args: SendMessageArgs): Promise<SendMessageResponse> =>
    api
      .post<SendMessageResponse>('/api/ai/chat', args)
      .then((r) => r.data),

  renameChat: (chatId: string, args: RenameChatArgs): Promise<ChatSummary> =>
    api
      .patch<{ chat: ChatSummary }>(`/api/ai/chats/${chatId}`, args)
      .then((r) => r.data.chat),

  deleteChat: (chatId: string): Promise<{ ok: true; id: string }> =>
    api
      .delete<{ ok: true; id: string }>(`/api/ai/chats/${chatId}`)
      .then((r) => r.data),
};
