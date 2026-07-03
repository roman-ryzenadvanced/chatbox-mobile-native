import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
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

    // Save user message to database
    await db.message.create({
      data: {
        role: 'user',
        content: message,
        conversationId,
      },
    });

    // Update conversation timestamp
    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Fetch conversation for system prompt
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Fetch past messages for context
    const pastMessages = await db.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: { role: true, content: true },
    });

    // Build message history for the AI
    const chatMessages = [
      { role: 'system' as const, content: conversation.systemPrompt },
      ...pastMessages.map((m) => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    // Initialize ZAI SDK
    const zai = await ZAI.create();

    // Buffer to collect the full response for saving to DB
    let fullContent = '';

    // Stream the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await zai.chat.completions.create({
            messages: chatMessages,
            stream: true,
          });

          // The SDK returns a stream - handle it based on the response type
          if (response && typeof response === 'object' && Symbol.asyncIterator in Object(response)) {
            // AsyncIterable stream
            for await (const chunk of response as AsyncIterable<any>) {
              const content =
                chunk?.choices?.[0]?.delta?.content ||
                chunk?.content ||
                '';
              if (content) {
                fullContent += content;
                const data = JSON.stringify({ content });
                controller.enqueue(`data: ${data}\n\n`);
              }
            }
          } else if (response && typeof response === 'string') {
            // Plain string response
            fullContent = response;
            const data = JSON.stringify({ content: response });
            controller.enqueue(`data: ${data}\n\n`);
          } else if (response) {
            // Try to extract content from the response object
            const content =
              response?.choices?.[0]?.message?.content ||
              response?.content ||
              '';
            if (content) {
              fullContent = content;
              const data = JSON.stringify({ content });
              controller.enqueue(`data: ${data}\n\n`);
            }
          }

          // Send done signal
          controller.enqueue('data: [DONE]\n\n');
          controller.close();

          // Save the assistant's full response to the database (fire and forget)
          if (fullContent) {
            await db.message.create({
              data: {
                role: 'assistant',
                content: fullContent,
                conversationId,
              },
            }).catch((err) => {
              console.error('Failed to save assistant message:', err);
            });
          }
        } catch (streamError) {
          console.error('Stream error:', streamError);

          // Save whatever content we have so far
          if (fullContent) {
            await db.message.create({
              data: {
                role: 'assistant',
                content: fullContent,
                conversationId,
              },
            }).catch((err) => {
              console.error('Failed to save partial assistant message:', err);
            });
          }

          controller.enqueue('data: [DONE]\n\n');
          controller.close();
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
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}