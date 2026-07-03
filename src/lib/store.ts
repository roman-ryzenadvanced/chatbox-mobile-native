import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  systemPrompt: string;
  model: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  messages?: Message[];
}

interface ChatStore {
  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoadingConversations: boolean;

  // Chat
  messages: Message[];
  isSending: boolean;
  streamingContent: string;

  // UI
  sidebarOpen: boolean;
  settingsOpen: boolean;
  theme: 'dark' | 'light';

  // Settings
  systemPrompt: string;

  // Actions
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversation: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateLastAssistantMessage: (content: string) => void;
  setIsSending: (val: boolean) => void;
  setStreamingContent: (val: string) => void;
  appendStreamingContent: (val: string) => void;
  setSidebarOpen: (val: boolean) => void;
  setSettingsOpen: (val: boolean) => void;
  setTheme: (val: 'dark' | 'light') => void;
  setSystemPrompt: (val: string) => void;
  resetChat: () => void;
  // Client-side conversation management
  createConversation: (title: string, systemPrompt: string) => Conversation;
  deleteConversation: (id: string) => void;
  clearAllConversations: () => void;
  addMessageToConversation: (conversationId: string, message: Message) => void;
  getConversationMessages: (conversationId: string) => Message[];
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      // Conversations
      conversations: [],
      activeConversationId: null,
      isLoadingConversations: false,

      // Chat
      messages: [],
      isSending: false,
      streamingContent: '',

      // UI
      sidebarOpen: false,
      settingsOpen: false,
      theme: 'dark',

      // Settings
      systemPrompt: 'You are a helpful AI assistant. Be concise and clear in your responses. Use markdown formatting when appropriate.',

      // Actions
      setConversations: (conversations) => set({ conversations }),

      setActiveConversation: (id) => {
        let msgs: Message[] = [];
        if (id) {
          msgs = get().conversations.find(c => c.id === id)?.messages || [];
        }
        set({ activeConversationId: id, messages: msgs, streamingContent: '' });
      },

      setMessages: (messages) => set({ messages }),

      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),

      updateLastAssistantMessage: (content) =>
        set((state) => {
          const msgs = [...state.messages];
          const lastIdx = msgs.findLastIndex((m) => m.role === 'assistant');
          if (lastIdx !== -1) {
            msgs[lastIdx] = { ...msgs[lastIdx], content };
          }
          return { messages: msgs };
        }),

      setIsSending: (val) => set({ isSending: val }),

      setStreamingContent: (val) => set({ streamingContent: val }),

      appendStreamingContent: (val) =>
        set((state) => ({ streamingContent: state.streamingContent + val })),

      setSidebarOpen: (val) => set({ sidebarOpen: val }),

      setSettingsOpen: (val) => set({ settingsOpen: val }),

      setTheme: (val) => set({ theme: val }),

      setSystemPrompt: (val) => set({ systemPrompt: val }),

      resetChat: () =>
        set({
          activeConversationId: null,
          messages: [],
          streamingContent: '',
          isSending: false,
        }),

      // Client-side conversation management
      createConversation: (title, systemPrompt) => {
        const now = new Date().toISOString();
        const conv: Conversation = {
          id: generateId(),
          title,
          systemPrompt: systemPrompt || get().systemPrompt,
          model: 'default',
          createdAt: now,
          updatedAt: now,
          messages: [],
        };
        set((state) => ({
          conversations: [conv, ...state.conversations],
        }));
        return conv;
      },

      deleteConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
          messages: state.activeConversationId === id ? [] : state.messages,
        })),

      clearAllConversations: () =>
        set({
          conversations: [],
          activeConversationId: null,
          messages: [],
        }),

      addMessageToConversation: (conversationId, message) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, messages: [...(c.messages || []), message], updatedAt: new Date().toISOString() }
              : c
          ),
        })),

      getConversationMessages: (conversationId) => {
        return get().conversations.find(c => c.id === conversationId)?.messages || [];
      },
    }),
    {
      name: 'chatbox-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        systemPrompt: state.systemPrompt,
        theme: state.theme,
      }),
    }
  )
);