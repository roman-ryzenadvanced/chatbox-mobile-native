import { create } from 'zustand';

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
}

export const useChatStore = create<ChatStore>((set) => ({
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

  setActiveConversation: (id) =>
    set({ activeConversationId: id, messages: [], streamingContent: '' }),

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
}));