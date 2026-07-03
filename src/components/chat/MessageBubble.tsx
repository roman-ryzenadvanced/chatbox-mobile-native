'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Message } from '@/lib/store';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      aria-label="Copy message"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-2">
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ animationDelay: '0.2s' }} />
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ animationDelay: '0.4s' }} />
    </div>
  );
}

function CodeBlock({
  language,
  children,
}: {
  language: string;
  children: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-2 overflow-hidden rounded-lg border border-border/50">
      <div className="flex items-center justify-between border-b border-border/50 bg-muted/50 px-3 py-1.5">
        <span className="text-xs text-muted-foreground">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto bg-black/40 p-3">
        <code className="text-[13px] leading-relaxed text-foreground/90">
          {children}
        </code>
      </pre>
    </div>
  );
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="message-bubble flex justify-end"
      >
        <div className="flex max-w-[85%] flex-col gap-1 sm:max-w-[70%]">
          <div className="flex items-center justify-end gap-2">
            <span className="text-[11px] text-muted-foreground">
              {formatTime(message.createdAt)}
            </span>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
              <User className="h-3.5 w-3.5 text-emerald-400" />
            </div>
          </div>
          <div className="rounded-2xl rounded-tr-md bg-emerald-600 px-4 py-2.5 text-[15px] leading-relaxed text-white">
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Assistant message
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="message-bubble flex justify-start"
    >
      <div className="flex max-w-[85%] flex-col gap-1 sm:max-w-[75%]">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
            <Bot className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <span className="text-[11px] text-muted-foreground">
            {formatTime(message.createdAt)}
          </span>
        </div>
        <div className="group relative rounded-2xl rounded-tl-md border border-border/50 bg-card px-4 py-2.5 dark:bg-card/80">
          {!message.content && isStreaming ? (
            <TypingIndicator />
          ) : (
            <div className="message-markdown text-[15px] leading-relaxed text-foreground">
              <ReactMarkdown
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match;
                    return isInline ? (
                      <code
                        className="rounded bg-muted px-1.5 py-0.5 text-[13px] text-emerald-400"
                        {...props}
                      >
                        {children}
                      </code>
                    ) : (
                      <CodeBlock language={match[1]}>
                        {String(children).replace(/\n$/, '')}
                      </CodeBlock>
                    );
                  },
                  a({ children, ...props }) {
                    return (
                      <a
                        {...props}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300"
                      >
                        {children}
                      </a>
                    );
                  },
                  p({ children }) {
                    return <p className="mb-2 last:mb-0">{children}</p>;
                  },
                  ul({ children }) {
                    return <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>;
                  },
                  ol({ children }) {
                    return <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>;
                  },
                  li({ children }) {
                    return <li className="leading-relaxed">{children}</li>;
                  },
                  h1({ children }) {
                    return <h1 className="mb-2 mt-3 text-lg font-bold">{children}</h1>;
                  },
                  h2({ children }) {
                    return <h2 className="mb-2 mt-3 text-base font-bold">{children}</h2>;
                  },
                  h3({ children }) {
                    return <h3 className="mb-1 mt-2 text-sm font-semibold">{children}</h3>;
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote className="mb-2 border-l-2 border-emerald-500/50 pl-3 italic text-muted-foreground">
                        {children}
                      </blockquote>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="mb-2 overflow-x-auto rounded-lg border border-border/50">
                        <table className="w-full text-sm">{children}</table>
                      </div>
                    );
                  },
                  th({ children }) {
                    return (
                      <th className="border-b border-border/50 bg-muted/50 px-3 py-2 text-left font-medium">
                        {children}
                      </th>
                    );
                  },
                  td({ children }) {
                    return (
                      <td className="border-b border-border/50 px-3 py-2">{children}</td>
                    );
                  },
                  hr() {
                    return <hr className="my-3 border-border/50" />;
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
          {message.content && (
            <div className="mt-1 flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
              <CopyButton text={message.content} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}