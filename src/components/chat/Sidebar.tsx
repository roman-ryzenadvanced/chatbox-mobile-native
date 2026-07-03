'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquarePlus, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useChatStore, type Conversation } from '@/lib/store';

interface SidebarProps {
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
}: {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.15 }}
    >
      <button
        onClick={onSelect}
        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
          isActive
            ? 'bg-accent text-foreground'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
        }`}
      >
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            isActive ? 'bg-emerald-500/20' : 'bg-muted'
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-muted-foreground'}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{conversation.title}</p>
          <p className="text-[11px] text-muted-foreground">
            {conversation.messages?.length ?? 0} messages · {formatDate(conversation.updatedAt)}
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
              aria-label="Delete conversation"
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &quot;{conversation.title}&quot; and all its messages.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </button>
    </motion.div>
  );
}

export function Sidebar({
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
}: SidebarProps) {
  const sidebarOpen = useChatStore((s) => s.sidebarOpen);
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);
  const conversations = useChatStore((s) => s.conversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);

  // Group conversations by time period
  const today: Conversation[] = [];
  const yesterday: Conversation[] = [];
  const older: Conversation[] = [];

  const now = new Date();
  conversations.forEach((c) => {
    const date = new Date(c.updatedAt);
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) today.push(c);
    else if (diffDays === 1) yesterday.push(c);
    else older.push(c);
  });

  const renderGroup = (label: string, items: Conversation[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-2">
        <p className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="flex flex-col gap-0.5">
          <AnimatePresence mode="popLayout">
            {items.map((c) => (
              <ConversationItem
                key={c.id}
                conversation={c}
                isActive={c.id === activeConversationId}
                onSelect={() => {
                  onSelectConversation(c.id);
                  setSidebarOpen(false);
                }}
                onDelete={() => onDeleteConversation(c.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent
        side="left"
        className="w-[85vw] max-w-sm !p-0"
      >
        <SheetHeader className="border-b border-border/50 px-4 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-bold">Chats</SheetTitle>
            <Button
              onClick={() => {
                onNewChat();
                setSidebarOpen(false);
              }}
              size="sm"
              className="h-9 gap-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
            >
              <MessageSquarePlus className="h-4 w-4" />
              New Chat
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-3 py-3">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground/60">
                  Start a new chat to begin
                </p>
              </div>
            ) : (
              <>
                {renderGroup('Today', today)}
                {renderGroup('Yesterday', yesterday)}
                {renderGroup('Earlier', older)}
              </>
            )}
          </div>
        </ScrollArea>

        <Separator />
        <div className="px-4 py-3">
          <p className="text-center text-[11px] text-muted-foreground/60">
            ChatBox v1.0 · Mobile AI Assistant
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}