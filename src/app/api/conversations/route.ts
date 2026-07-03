import { NextRequest, NextResponse } from 'next/server';
import { memoryStore, isServerless } from '@/lib/memory-store';

// GET /api/conversations - List all conversations
export async function GET() {
  try {
    if (isServerless) {
      return NextResponse.json(memoryStore.listConversations());
    }

    const { db } = await import('@/lib/db');
    const result = await db.conversation.findMany({
      select: {
        id: true,
        title: true,
        systemPrompt: true,
        model: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(result.map((c) => ({
      ...c,
      messageCount: c._count.messages,
    })));
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create a new conversation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, systemPrompt } = body;

    if (isServerless) {
      const conv = memoryStore.createConversation({ title, systemPrompt });
      return NextResponse.json(conv, { status: 201 });
    }

    const { db } = await import('@/lib/db');
    const conversation = await db.conversation.create({
      data: {
        title: title || 'New Chat',
        systemPrompt: systemPrompt || 'You are a helpful AI assistant.',
        model: 'default',
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('Failed to create conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations - Delete all conversations
export async function DELETE() {
  try {
    if (isServerless) {
      memoryStore.clearAll();
      return NextResponse.json({ success: true });
    }

    const { db } = await import('@/lib/db');
    await db.message.deleteMany({});
    await db.conversation.deleteMany({});
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to clear conversations:', error);
    return NextResponse.json(
      { error: 'Failed to clear conversations' },
      { status: 500 }
    );
  }
}