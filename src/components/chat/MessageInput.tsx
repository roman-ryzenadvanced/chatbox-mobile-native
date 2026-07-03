'use client';

import { useState, useRef, useCallback, type KeyboardEvent } from 'react';
import { ArrowUp, Square, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/lib/store';

interface MessageInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
}

export function MessageInput({ onSend, onStop }: MessageInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isSending = useChatStore((s) => s.isSending);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const maxHeight = 4 * 24; // ~4 lines
    const scrollH = textarea.scrollHeight;
    textarea.style.height = `${Math.min(scrollH, maxHeight)}px`;
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    onSend(trimmed);
    setText('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, isSending, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleClear = useCallback(() => {
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="border-t border-border/50 bg-background px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
      <div className="mx-auto flex max-w-2xl items-end gap-2">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              adjustHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="message-input resize-none overflow-y-auto rounded-xl border border-border/50 bg-card px-4 py-3 pr-10 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none dark:bg-card/50"
            style={{ maxHeight: '6rem' }}
          />
          {text && !isSending && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="absolute right-1.5 top-1.5 h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label="Clear input"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {isSending ? (
          <Button
            onClick={onStop}
            size="icon"
            className="h-11 w-11 shrink-0 rounded-xl bg-destructive text-white hover:bg-destructive/90"
            aria-label="Stop generating"
          >
            <Square className="h-4.5 w-4.5 fill-current" />
          </Button>
        ) : (
          <Button
            onClick={handleSend}
            disabled={!text.trim()}
            size="icon"
            className="h-11 w-11 shrink-0 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40"
            aria-label="Send message"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}