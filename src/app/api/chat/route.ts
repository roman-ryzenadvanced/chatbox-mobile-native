import { NextRequest, NextResponse } from 'next/server';
import { memoryStore, isServerless } from '@/lib/memory-store';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, message } = body;

    if (!conversationId || !message) {
      return NextResponse.json(
        { error: 'Missing conversationId or message' },
        { status: 400 }
      );
    }

    // Save user message
    if (isServerless) {
      memoryStore.addMessage(conversationId, 'user', message);
    } else {
      const { db } = await import('@/lib/db');
      await db.message.create({
        data: { role: 'user', content: message, conversationId },
      });
      await db.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
    }

    // Build message history
    let chatMessages: Array<{ role: string; content: string }>;

    if (isServerless) {
      const conv = memoryStore.getConversation(conversationId);
      if (!conv) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
      chatMessages = [
        { role: 'system', content: conv.systemPrompt },
        ...memoryStore.getMessages(conversationId).map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
      ];
    } else {
      const { db } = await import('@/lib/db');
      const conversation = await db.conversation.findUnique({ where: { id: conversationId } });
      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
      const pastMessages = await db.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        select: { role: true, content: true },
      });
      chatMessages = [
        { role: 'system', content: conversation.systemPrompt },
        ...pastMessages.map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
      ];
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create();
    let fullContent = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await zai.chat.completions.create({
            messages: chatMessages as any,
            stream: true,
          });

          // Handle different response types from the SDK
          if (response && typeof response === 'object' && Symbol.asyncIterator in Object(response)) {
            for await (const chunk of response as AsyncIterable<any>) {
              const content = chunk?.choices?.[0]?.delta?.content || chunk?.content || '';
              if (content) {
                fullContent += content;
                controller.enqueue(`data: ${JSON.stringify({ content })}\n\n`);
              }
            }
          } else if (response && typeof response === 'string') {
            fullContent = response;
            controller.enqueue(`data: ${JSON.stringify({ content: response })}\n\n`);
          } else if (response) {
            const content = response?.choices?.[0]?.message?.content || response?.content || '';
            if (content) {
              fullContent = content;
              controller.enqueue(`data: ${JSON.stringify({ content })}\n\n`);
            }
          }

          controller.enqueue('data: [DONE]\n\n');
          controller.close();

          // Save assistant response
          if (fullContent) {
            if (isServerless) {
              memoryStore.addMessage(conversationId, 'assistant', fullContent);
            } else {
              const { db } = await import('@/lib/db');
              await db.message.create({
                data: { role: 'assistant', content: fullContent, conversationId },
              }).catch((err: any) => console.error('Failed to save assistant message:', err));
            }
          }
        } catch (streamError: any) {
          console.error('Stream error, trying fallback:', streamError?.message);

          // If streaming fails, try non-streaming fallback
          try {
            const fallbackResponse = await zai.chat.completions.create({
              messages: chatMessages as any,
              stream: false,
            });

            const content = fallbackResponse?.choices?.[0]?.message?.content || fallbackResponse?.content || '';

            if (content) {
              fullContent = content;
              controller.enqueue(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch (fallbackError: any) {
            console.error('Fallback also failed:', fallbackError?.message);
            // Send error message to the client
            controller.enqueue(`data: ${JSON.stringify({ content: 'Sorry, I encountered an error. Please try again.', isError: true })}\n\n`);
          }

          controller.enqueue('data: [DONE]\n\n');
          controller.close();

          // Save whatever content we have
          if (fullContent) {
            if (isServerless) {
              memoryStore.addMessage(conversationId, 'assistant', fullContent);
            } else {
              try {
                const { db } = await import('@/lib/db');
                await db.message.create({
                  data: { role: 'assistant', content: fullContent, conversationId },
                });
              } catch {}
            }
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}