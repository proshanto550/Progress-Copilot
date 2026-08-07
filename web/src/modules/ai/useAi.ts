import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { aiApi } from './aiApi';
import { getErrorMessage } from '../../lib/api';
import type {
  ChatMessage,
  ChatSummary,
  SendMessageArgs,
  SendMessageResponse,
} from '../../lib/types';

/**
 * useAi — React Query hooks for the AI Assistant (Phase 6).
 *
 * Query keys:
 *   ['ai', 'chats']                       list of chats
 *   ['ai', 'chats', chatId, 'messages']   messages for one chat
 *
 * Mutations:
 *   sendMessage  — appends user + assistant messages optimistically so
 *                  the UI feels instant. Reconciles with the server
 *                  reply when it arrives. On error the user message
 *                  stays visible and the error surfaces in `mutation.error`.
 *   createChat   — adds an empty chat to the list and selects it.
 *   renameChat   — patches the sidebar row.
 *   deleteChat   — removes the chat (and its messages cache).
 */

export const aiKeys = {
  all: ['ai'] as const,
  chats: () => [...aiKeys.all, 'chats'] as const,
  chat: (id: string) => [...aiKeys.chats(), id] as const,
  messages: (chatId: string) =>
    [...aiKeys.all, 'chats', chatId, 'messages'] as const,
};

/* ────────────────────────────────────────────────────────────────────── */
/* Queries                                                                */
/* ────────────────────────────────────────────────────────────────────── */

export function useChats() {
  return useQuery<ChatSummary[]>({
    queryKey: aiKeys.chats(),
    queryFn: aiApi.listChats,
  });
}

export function useMessages(chatId: string | null) {
  return useQuery<ChatMessage[]>({
    queryKey: chatId ? aiKeys.messages(chatId) : aiKeys.messages('none'),
    queryFn: () => aiApi.getMessages(chatId as string),
    enabled: !!chatId,
  });
}

/* ────────────────────────────────────────────────────────────────────── */
/* Mutations                                                              */
/* ────────────────────────────────────────────────────────────────────── */

/**
 * Helper that resolves the cache slot key for a given chatId. When the
 * caller has just created a brand-new chat, `data.chatId` is the fresh
 * id — we want the optimistic message written into THAT slot, not a
 * sentinel key the page will never read.
 */
function messagesKey(chatId: string) {
  return aiKeys.messages(chatId);
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation<
    SendMessageResponse,
    Error,
    { args: SendMessageArgs; chatId: string },
    { previousMessages: ChatMessage[]; tempId: string; chatId: string }
  >({
    mutationFn: ({ args }) => aiApi.sendMessage(args),

    // Optimistic update — show the user's message immediately in the
    // chat they're already looking at. The `chatId` passed in via vars
    // is the resolved id (either the existing chat, or a brand-new one
    // we created during submit).
    onMutate: async ({ args, chatId }) => {
      const key = messagesKey(chatId);
      await qc.cancelQueries({ queryKey: key });
      const previousMessages = qc.getQueryData<ChatMessage[]>(key) ?? [];

      const tempId = `temp-${Date.now()}`;
      const optimisticUser: ChatMessage = {
        id: tempId,
        sender: 'USER',
        content: args.content,
        createdAt: new Date().toISOString(),
      };

      qc.setQueryData<ChatMessage[]>(key, [...previousMessages, optimisticUser]);

      return { previousMessages, tempId, chatId };
    },

    // Reconcile with the server response — swap the optimistic user
    // bubble for the real one and append Edith's reply.
    onSuccess: (data, _vars, ctx) => {
      const key = messagesKey(data.chatId);
      const current = qc.getQueryData<ChatMessage[]>(key) ?? [];

      const withoutTemp = current.filter((m) => m.id !== ctx?.tempId);
      qc.setQueryData<ChatMessage[]>(key, [
        ...withoutTemp,
        data.userMessage,
        data.assistantMessage,
      ]);

      // Refresh the sidebar so it picks up the auto-titled chat name.
      qc.invalidateQueries({ queryKey: aiKeys.chats() });
    },

    // On error: keep the user's message visible (don't punish them by
    // silently deleting what they typed) and remove only the optimistic
    // bubble. The mutation error is surfaced via the composer's red banner.
    onError: (_err, _vars, ctx) => {
      if (!ctx) return;
      const key = messagesKey(ctx.chatId);
      const current = qc.getQueryData<ChatMessage[]>(key) ?? [];
      qc.setQueryData<ChatMessage[]>(
        key,
        current.filter((m) => m.id !== ctx.tempId),
      );
    },
  });
}

export function useCreateChat() {
  const qc = useQueryClient();
  return useMutation<ChatSummary, Error, void>({
    mutationFn: () => aiApi.createChat(),
    onSuccess: (chat) => {
      qc.setQueryData<ChatSummary[]>(aiKeys.chats(), (prev) => [
        chat,
        ...(prev ?? []),
      ]);
    },
  });
}

export function useRenameChat() {
  const qc = useQueryClient();
  return useMutation<
    ChatSummary,
    Error,
    { chatId: string; title: string }
  >({
    mutationFn: ({ chatId, title }) => aiApi.renameChat(chatId, { title }),
    onSuccess: (chat) => {
      qc.setQueryData<ChatSummary[]>(aiKeys.chats(), (prev) =>
        (prev ?? []).map((c) => (c.id === chat.id ? { ...c, ...chat } : c)),
      );
    },
  });
}

export function useDeleteChat() {
  const qc = useQueryClient();
  return useMutation<{ ok: true; id: string }, Error, string>({
    mutationFn: (chatId) => aiApi.deleteChat(chatId),
    onSuccess: (out) => {
      qc.setQueryData<ChatSummary[]>(aiKeys.chats(), (prev) =>
        (prev ?? []).filter((c) => c.id !== out.id),
      );
      qc.removeQueries({ queryKey: aiKeys.messages(out.id) });
    },
  });
}

/* ────────────────────────────────────────────────────────────────────── */
/* Convenience helpers                                                    */
/* ────────────────────────────────────────────────────────────────────── */

/** Convert a mutation error to a user-readable string. */
export function mutationError(err: unknown, fallback = 'Something went wrong') {
  return getErrorMessage(err, fallback);
}