import { NextRequest, NextResponse } from 'next/server';
import { memoryStore, isServerless } from '@/lib/memory-store';

// GET /api/conversations/[id]/messages
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (isServerless) {
      return NextResponse.json(memoryStore.getMessages(id));
    }

    const { db } = await import('@/lib/db');
    const result = await db.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}