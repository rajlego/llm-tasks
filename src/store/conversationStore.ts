import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConversationMessage } from '../models/conversation';

interface ConversationState {
  // Map of conversationId -> messages
  conversations: Record<string, ConversationMessage[]>;

  addMessage: (conversationId: string, message: ConversationMessage) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<ConversationMessage>) => void;
  getMessages: (conversationId: string) => ConversationMessage[];
  clearConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
}

export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      conversations: {},

      addMessage: (conversationId, message) => {
        set(state => ({
          conversations: {
            ...state.conversations,
            [conversationId]: [
              ...(state.conversations[conversationId] || []),
              message,
            ],
          },
        }));
      },

      updateMessage: (conversationId, messageId, updates) => {
        set(state => ({
          conversations: {
            ...state.conversations,
            [conversationId]: (state.conversations[conversationId] || []).map(m =>
              m.id === messageId ? { ...m, ...updates } : m,
            ),
          },
        }));
      },

      getMessages: (conversationId) => {
        return get().conversations[conversationId] || [];
      },

      clearConversation: (conversationId) => {
        set(state => ({
          conversations: {
            ...state.conversations,
            [conversationId]: [],
          },
        }));
      },

      deleteConversation: (conversationId) => {
        set(state => {
          const { [conversationId]: _, ...rest } = state.conversations;
          return { conversations: rest };
        });
      },
    }),
    {
      name: 'llm-tasks-conversations',
    },
  ),
);
