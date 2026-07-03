import { NextRequest, NextResponse } from 'next/server';
import { memoryStore, isServerless } from '@/lib/memory-store';

// GET /api/conversations/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (isServerless) {
      const conv = memoryStore.getConversation(id);
      if (!conv) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      const msgs = memoryStore.getMessages(id);
      return NextResponse.json({ ...conv, messages: msgs });
    }

    const { db } = await import('@/lib/db');
    const conversation = await db.conversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Failed to fetch conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

// PATCH /api/conversations/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title } = body;

    if (isServerless) {
      const conv = memoryStore.updateConversation(id, { title });
      if (!conv) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(conv);
    }

    const { db } = await import('@/lib/db');
    const conversation = await db.conversation.update({
      where: { id },
      data: { title },
    });
    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Failed to update conversation:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (isServerless) {
      memoryStore.deleteConversation(id);
      return NextResponse.json({ success: true });
    }

    const { db } = await import('@/lib/db');
    await db.conversation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete conversation:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}