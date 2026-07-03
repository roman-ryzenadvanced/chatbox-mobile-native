'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Menu, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useChatStore, type Message, type Conversation } from '@/lib/store';
import { Sidebar } from '@/components/chat/Sidebar';
import { ChatView } from '@/components/chat/ChatView';
import { MessageInput } from '@/components/chat/MessageInput';
import { SettingsSheet } from '@/components/chat/SettingsSheet';

function Header() {
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);
  const setSettingsOpen = useChatStore((s) => s.setSettingsOpen);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const conversations = useChatStore((s) => s.conversations);

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const title = activeConv?.title ?? 'ChatBox';

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 bg-background/80 px-3 backdrop-blur-md">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSidebarOpen(true)}
        className="h-11 w-11 -ml-1"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <h1 className="max-w-[60%] truncate text-base font-semibold text-foreground">
        {title}
      </h1>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSettingsOpen(true)}
        className="h-11 w-11 -mr-1"
        aria-label="Settings"
      >
        <Settings className="h-5 w-5" />
      </Button>
    </header>
  );
}

export default function Home() {
  const store = useChatStore();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch conversations on mount
  const fetchConversations = useCallback(async () => {
    try {
      store.setIsLoadingConversations(true);
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        store.setConversations(data);
      }
    } catch {
      toast.error('Failed to load conversations');
    } finally {
      store.setIsLoadingConversations(false);
    }
  }, [store]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(
    async (conversationId: string) => {
      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages`);
        if (res.ok) {
          const data: Message[] = await res.json();
          store.setMessages(data);
        }
      } catch {
        toast.error('Failed to load messages');
      }
    },
    [store]
  );

  // Handle selecting a conversation
  const handleSelectConversation = useCallback(
    async (id: string) => {
      store.setActiveConversation(id);
      await fetchMessages(id);
    },
    [store, fetchMessages]
  );

  // Handle new chat
  const handleNewChat = useCallback(() => {
    store.resetChat();
  }, [store]);

  // Handle sending a message
  const handleSend = useCallback(
    async (text: string) => {
      let conversationId = store.activeConversationId;

      // If no active conversation, create one
      if (!conversationId) {
        try {
          const res = await fetch('/api/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: text.slice(0, 30) + (text.length > 30 ? '...' : ''),
              systemPrompt: store.systemPrompt,
            }),
          });
          if (!res.ok) throw new Error('Failed to create conversation');
          const conv: Conversation = await res.json();
          conversationId = conv.id;
          store.setActiveConversation(conversationId);
          store.setConversations([conv, ...store.conversations]);
        } catch {
          toast.error('Failed to start conversation');
          return;
        }
      }

      // Optimistically add user message
      const userMessage: Message = {
        id: `temp-user-${Date.now()}`,
        role: 'user',
        content: text,
        createdAt: new Date().toISOString(),
      };
      store.addMessage(userMessage);

      // Start streaming
      store.setIsSending(true);
      store.setStreamingContent('');

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            message: text,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to get response');
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response stream');

        const decoder = new TextDecoder();
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          // Parse SSE format: split by newlines, filter for "data: " lines
          const lines = chunk.split('\n');

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const data = trimmed.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.content || parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  fullContent += content;
                  store.appendStreamingContent(content);
                }
              } catch {
                // If not JSON, treat the raw data as content
                if (data && data !== '[DONE]') {
                  fullContent += data;
                  store.appendStreamingContent(data);
                }
              }
            }
          }
        }

        // Streaming complete - reload messages from server to get persisted versions
        store.setStreamingContent('');
        store.setIsSending(false);
        abortControllerRef.current = null;

        if (conversationId) {
          await fetchMessages(conversationId);
          // Refresh conversation list to get updated message counts
          fetchConversations();
        }
      } catch (err: unknown) {
        store.setIsSending(false);
        store.setStreamingContent('');
        abortControllerRef.current = null;

        if (err instanceof Error && err.name === 'AbortError') {
          // User cancelled - try to reload messages
          if (conversationId) {
            await fetchMessages(conversationId);
          }
        } else {
          toast.error(err instanceof Error ? err.message : 'Something went wrong');
        }
      }
    },
    [store, fetchMessages, fetchConversations]
  );

  // Handle stop generating
  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    (text: string) => {
      handleSend(text);
    },
    [handleSend]
  );

  // Handle delete conversation
  const handleDeleteConversation = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
        if (res.ok) {
          if (store.activeConversationId === id) {
            store.resetChat();
          }
          store.setConversations(store.conversations.filter((c) => c.id !== id));
          toast.success('Conversation deleted');
        }
      } catch {
        toast.error('Failed to delete conversation');
      }
    },
    [store]
  );

  // Handle clear all conversations
  const handleClearAll = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations', { method: 'DELETE' });
      if (res.ok) {
        store.setConversations([]);
        store.resetChat();
        toast.success('All conversations cleared');
      }
    } catch {
      toast.error('Failed to clear conversations');
    }
  }, [store]);

  return (
    <div className="flex h-dvh flex-col bg-background">
      <Header />
      <ChatView onSuggestionClick={handleSuggestionClick} />
      <MessageInput onSend={handleSend} onStop={handleStop} />

      <Sidebar
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      <SettingsSheet onClearAll={handleClearAll} />
    </div>
  );
}