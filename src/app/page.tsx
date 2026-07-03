'use client';

import { useCallback, useRef } from 'react';
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

  // Handle selecting a conversation
  const handleSelectConversation = useCallback(
    (id: string) => {
      store.setActiveConversation(id);
    },
    [store]
  );

  // Handle new chat
  const handleNewChat = useCallback(() => {
    store.resetChat();
  }, [store]);

  // Handle sending a message
  const handleSend = useCallback(
    async (text: string) => {
      let conversationId = store.activeConversationId;

      // If no active conversation, create one locally
      if (!conversationId) {
        const conv = store.createConversation(
          text.slice(0, 30) + (text.length > 30 ? '...' : ''),
          store.systemPrompt
        );
        conversationId = conv.id;
        store.setActiveConversation(conversationId);
      }

      // Build user message
      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: text,
        createdAt: new Date().toISOString(),
      };

      // Add to UI and local state
      store.addMessage(userMessage);
      store.addMessageToConversation(conversationId, userMessage);

      // Start streaming
      store.setIsSending(true);
      store.setStreamingContent('');

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        // Build message history for the API
        const conv = store.conversations.find(c => c.id === conversationId);
        const systemPrompt = conv?.systemPrompt || store.systemPrompt;
        const convMessages = conv?.messages || store.messages;

        const apiMessages = [
          { role: 'system', content: systemPrompt },
          ...convMessages.map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
          })),
        ];

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: apiMessages }),
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
          const lines = chunk.split('\n');

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const data = trimmed.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.content || '';
                if (content) {
                  fullContent += content;
                  store.appendStreamingContent(content);
                }
              } catch {
                if (data && data !== '[DONE]') {
                  fullContent += data;
                  store.appendStreamingContent(data);
                }
              }
            }
          }
        }

        // Streaming complete - save the assistant message
        store.setStreamingContent('');
        store.setIsSending(false);
        abortControllerRef.current = null;

        if (fullContent && conversationId) {
          const assistantMessage: Message = {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: fullContent,
            createdAt: new Date().toISOString(),
          };
          store.addMessage(assistantMessage);
          store.addMessageToConversation(conversationId, assistantMessage);
        }
      } catch (err: unknown) {
        store.setIsSending(false);
        store.setStreamingContent('');
        abortControllerRef.current = null;

        if (err instanceof Error && err.name === 'AbortError') {
          // User cancelled
        } else {
          toast.error(err instanceof Error ? err.message : 'Something went wrong');
        }
      }
    },
    [store]
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
    (id: string) => {
      store.deleteConversation(id);
      toast.success('Conversation deleted');
    },
    [store]
  );

  // Handle clear all conversations
  const handleClearAll = useCallback(() => {
    store.clearAllConversations();
    toast.success('All conversations cleared');
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