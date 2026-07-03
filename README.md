# ChatBox - Mobile AI Assistant

<div align="center">
  <img src="public/logo.svg" alt="ChatBox Logo" width="64" height="64" />
  <h1>ChatBox</h1>
  <p><strong>Mobile-first AI Chat Application</strong></p>
  <p>A beautiful, native-feeling AI chat app built with Next.js 16, designed primarily for Android mobile devices.</p>
</div>

---

## ✨ Features

- 📱 **Mobile-First Design** — Optimized for Android phones with 44px touch targets, safe-area support, and native app feel
- 🌙 **Dark/Light Theme** — Dark mode by default with seamless toggle
- ⚡ **Streaming Responses** — Real-time AI response streaming with SSE
- 📝 **Markdown Rendering** — Full GFM support with code blocks, tables, lists, and more
- 💬 **Conversation Management** — Create, switch, rename, and delete conversations
- 🔍 **Searchable History** — Conversations grouped by Today, Yesterday, Earlier
- 🎨 **Beautiful UI** — Emerald accent, smooth animations with Framer Motion
- ⚙️ **Customizable** — Editable system prompt for personalized AI behavior
- 📲 **PWA Support** — Installable as a native Android app via browser
- 🚀 **Modern Stack** — Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui, Prisma, Zustand

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 16** | React framework with App Router |
| **TypeScript** | Type-safe development |
| **Tailwind CSS 4** | Utility-first styling |
| **shadcn/ui** | UI component library |
| **Zustand** | Client state management |
| **Prisma** | SQLite database ORM |
| **Framer Motion** | Smooth animations |
| **react-markdown** | Markdown rendering |
| **next-themes** | Dark/light theme |
| **z-ai-web-dev-sdk** | AI/LLM integration |

## 📁 Project Structure

```
├── prisma/
│   └── schema.prisma        # Database schema (Conversation, Message, AppSettings)
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── sw.js                # Service worker
│   ├── icon-192.png         # PWA icon
│   ├── icon-512.png         # PWA icon
│   └── logo.svg             # App logo
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout with ThemeProvider
│   │   ├── page.tsx         # Main chat page
│   │   ├── globals.css      # Global styles & animations
│   │   └── api/
│   │       ├── chat/route.ts           # POST: Send message, stream AI response
│   │       ├── conversations/route.ts  # GET: List, POST: Create, DELETE: Clear all
│   │       ├── conversations/[id]/route.ts     # GET, PATCH, DELETE single conversation
│   │       └── conversations/[id]/messages/route.ts  # GET messages
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatView.tsx        # Message list with auto-scroll
│   │   │   ├── MessageBubble.tsx   # User/assistant message rendering
│   │   │   ├── MessageInput.tsx    # Auto-growing input with send/stop
│   │   │   ├── Sidebar.tsx         # Conversation list drawer
│   │   │   ├── SettingsSheet.tsx   # Settings panel
│   │   │   └── WelcomeScreen.tsx   # Onboarding with suggestions
│   │   └── ui/                     # shadcn/ui components
│   ├── lib/
│   │   ├── store.ts         # Zustand state management
│   │   ├── db.ts            # Prisma client
│   │   └── utils.ts         # Utility functions
│   └── hooks/                # Custom React hooks
├── package.json
└── next.config.ts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- A valid `z-ai-web-dev-sdk` configuration

### Installation

```bash
# Clone the repository
git clone https://github.com/roman-ryzenadvanced/chatbox-mobile-native.git
cd chatbox-mobile-native

# Install dependencies
bun install

# Set up database
cp .env.example .env
bun run db:push

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) on your phone's browser and use "Add to Home Screen" for a native app experience.

## 📱 PWA Installation (Android)

1. Open the app in Chrome on your Android device
2. Tap the **three-dot menu** → **"Add to Home Screen"** or **"Install App"**
3. The app will appear on your home screen like a native app
4. It launches in standalone mode (no browser chrome)

## 🎨 Design System

### Color Palette
- **Primary Accent**: Emerald (#10b981)
- **User Messages**: Emerald-600 background
- **Assistant Messages**: Card background with border
- **Dark Background**: Near-black (#0a0a0a)
- **Light Background**: White

### Typography
- **Font**: Geist Sans / Geist Mono
- **Message Text**: 15px, leading-relaxed
- **UI Labels**: 11-14px

## 🔧 Configuration

### Environment Variables
- `DATABASE_URL` — SQLite database path (default: `file:./db/custom.db`)

### System Prompt
Customize the AI's behavior through Settings → System Prompt. Changes apply to new conversations.

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

## 🙏 Credits

- Inspired by [ChatBox AI](https://github.com/chatboxai/chatbox)
- Built with [Next.js](https://nextjs.org), [shadcn/ui](https://ui.shadcn.com), and [Tailwind CSS](https://tailwindcss.com)
