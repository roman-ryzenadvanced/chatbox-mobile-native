'use client';

import { motion } from 'framer-motion';
import { Sparkles, Code, BookOpen, Plane } from 'lucide-react';

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
}

const suggestions = [
  {
    icon: Sparkles,
    text: 'Explain quantum computing simply',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Code,
    text: 'Write a Python function to sort a list',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
  {
    icon: BookOpen,
    text: 'What are the best practices for React?',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Plane,
    text: 'Help me plan a weekend trip',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
  },
];

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-3"
      >
        {/* Logo */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20">
          <svg
            viewBox="0 0 32 32"
            className="h-9 w-9 text-emerald-400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 8C6 6.89543 6.89543 6 8 6H24C25.1046 6 26 6.89543 26 8V18C26 19.1046 25.1046 20 24 20H15L9 26V20H8C6.89543 20 6 19.1046 6 18V8Z"
              fill="currentColor"
              fillOpacity="0.2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13 12C13 11.4477 13.4477 11 14 11H17C17.5523 11 18 11.4477 18 12C18 12.5523 17.5523 13 17 13H14C13.4477 13 13 12.5523 13 12Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">ChatBox</h1>
        <p className="text-sm text-muted-foreground">Mobile AI Assistant</p>
      </motion.div>

      {/* Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-10 grid w-full max-w-sm grid-cols-1 gap-3"
      >
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={suggestion.text}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
            onClick={() => onSuggestionClick(suggestion.text)}
            className="flex min-h-[52px] items-center gap-3 rounded-xl border border-border/50 bg-card/50 p-4 text-left transition-colors hover:bg-accent/50 active:scale-[0.98] dark:bg-card/30"
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${suggestion.bg}`}
            >
              <suggestion.icon className={`h-4.5 w-4.5 ${suggestion.color}`} />
            </div>
            <span className="text-sm text-foreground/80">{suggestion.text}</span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}