// Shared in-memory store for serverless environments (Vercel, AWS Lambda)
// This is used as a fallback when SQLite/Prisma is unavailable

export interface MemConversation {
  id: string;
  title: string;
  systemPrompt: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemMessage {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  createdAt: string;
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

class MemoryStore {
  conversations = new Map<string, MemConversation>();
  messages = new Map<string, MemMessage[]>();

  createConversation(data: { title?: string; systemPrompt?: string }): MemConversation {
    const id = generateId();
    const now = new Date().toISOString();
    const conv: MemConversation = {
      id,
      title: data.title || 'New Chat',
      systemPrompt: data.systemPrompt || 'You are a helpful AI assistant.',
      model: 'default',
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(id, conv);
    this.messages.set(id, []);
    return conv;
  }

  listConversations() {
    return Array.from(this.conversations.values())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map(c => ({
        ...c,
        messageCount: (this.messages.get(c.id) || []).length,
      }));
  }

  getConversation(id: string): MemConversation | undefined {
    return this.conversations.get(id);
  }

  updateConversation(id: string, data: { title?: string }): MemConversation | undefined {
    const conv = this.conversations.get(id);
    if (!conv) return undefined;
    if (data.title !== undefined) conv.title = data.title;
    conv.updatedAt = new Date().toISOString();
    return conv;
  }

  deleteConversation(id: string): boolean {
    this.messages.delete(id);
    return this.conversations.delete(id);
  }

  addMessage(conversationId: string, role: string, content: string): MemMessage {
    const msg: MemMessage = {
      id: generateId(),
      conversationId,
      role,
      content,
      createdAt: new Date().toISOString(),
    };
    const msgs = this.messages.get(conversationId) || [];
    msgs.push(msg);
    this.messages.set(conversationId, msgs);

    // Update conversation timestamp
    const conv = this.conversations.get(conversationId);
    if (conv) conv.updatedAt = new Date().toISOString();

    return msg;
  }

  getMessages(conversationId: string): MemMessage[] {
    return this.messages.get(conversationId) || [];
  }

  clearAll() {
    this.conversations.clear();
    this.messages.clear();
  }
}

// Singleton instance
export const memoryStore = new MemoryStore();

export const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;