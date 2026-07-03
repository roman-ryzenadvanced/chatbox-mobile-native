'use client';

import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatStore, type Message } from '@/lib/store';
import { MessageBubble } from './MessageBubble';
import { WelcomeScreen } from './WelcomeScreen';

interface ChatViewProps {
  onSuggestionClick: (text: string) => void;
}

export function ChatView({ onSuggestionClick }: ChatViewProps) {
  const messages = useChatStore((s) => s.messages);
  const isSending = useChatStore((s) => s.isSending);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or streaming content updates
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent]);

  // Build the streaming message if present
  const streamingMessage: Message | null =
    isSending && streamingContent
      ? {
          id: 'streaming',
          role: 'assistant',
          content: streamingContent,
          createdAt: new Date().toISOString(),
        }
      : null;

  // Also show a typing placeholder if sending but no content yet
  const typingMessage: Message | null =
    isSending && !streamingContent
      ? {
          id: 'typing',
          role: 'assistant',
          content: '',
          createdAt: new Date().toISOString(),
        }
      : null;

  const showWelcome = !activeConversationId || messages.length === 0;

  return (
    <div className="chat-scroll-area flex flex-1 overflow-hidden">
      {showWelcome ? (
        <WelcomeScreen onSuggestionClick={onSuggestionClick} />
      ) : (
        <ScrollArea className="h-full w-full">
          <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-4 pb-2">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {typingMessage && (
              <MessageBubble message={typingMessage} isStreaming />
            )}
            {streamingMessage && (
              <MessageBubble message={streamingMessage} isStreaming />
            )}
            <div ref={bottomRef} className="h-1" />
          </div>
        </ScrollArea>
      )}
    </div>
  );
}