'use client';

import { useEffect } from 'react';
import { Moon, Sun, Trash2, Info } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useChatStore } from '@/lib/store';
import { useTheme } from 'next-themes';

interface SettingsSheetProps {
  onClearAll: () => void;
}

export function SettingsSheet({ onClearAll }: SettingsSheetProps) {
  const settingsOpen = useChatStore((s) => s.settingsOpen);
  const setSettingsOpen = useChatStore((s) => s.setSettingsOpen);
  const systemPrompt = useChatStore((s) => s.systemPrompt);
  const setSystemPrompt = useChatStore((s) => s.setSystemPrompt);
  const { theme, setTheme } = useTheme();

  // Sync store theme with next-themes on mount
  useEffect(() => {
    const stored = useChatStore.getState().theme;
    if (stored) setTheme(stored);
  }, [setTheme]);

  const handleThemeChange = (checked: boolean) => {
    const newTheme = checked ? 'dark' : 'light';
    useChatStore.getState().setTheme(newTheme);
    setTheme(newTheme);
  };

  return (
    <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
      <SheetContent side="right" className="w-[85vw] max-w-sm !p-0">
        <SheetHeader className="border-b border-border/50 px-4 py-4">
          <SheetTitle className="text-lg font-bold">Settings</SheetTitle>
          <SheetDescription>Customize your ChatBox experience</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 overflow-y-auto px-4 py-5">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                {theme === 'dark' ? (
                  <Moon className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Sun className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div>
                <Label className="text-sm font-medium">Dark Mode</Label>
                <p className="text-[11px] text-muted-foreground">
                  Toggle between light and dark theme
                </p>
              </div>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={handleThemeChange}
            />
          </div>

          <Separator />

          {/* System Prompt */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">System Prompt</Label>
            <p className="text-[11px] text-muted-foreground">
              Customize how the AI responds in new conversations
            </p>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="min-h-[120px] resize-none text-sm"
              placeholder="Enter system prompt..."
            />
          </div>

          <Separator />

          {/* Clear All */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
                <Trash2 className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <Label className="text-sm font-medium text-destructive">
                  Clear All Chats
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Delete all conversations permanently
                </p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  Clear
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all conversations?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your conversations and messages.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onClearAll}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <Separator />

          {/* About */}
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <Info className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <Label className="text-sm font-medium">About ChatBox</Label>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                ChatBox is a mobile-first AI chat assistant built with Next.js.
                It provides a native app-like experience with streaming responses,
                markdown rendering, and a beautiful dark/light theme.
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground/60">
                Version 1.0.0
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}