import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages: chatMessages } = body;

    if (!chatMessages || !Array.isArray(chatMessages) || chatMessages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create();
    let fullContent = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await zai.chat.completions.create({
            messages: chatMessages,
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
        } catch (streamError: any) {
          console.error('Stream error, trying non-streaming fallback:', streamError?.message);

          // Non-streaming fallback
          try {
            const fallbackResponse = await zai.chat.completions.create({
              messages: chatMessages,
              stream: false,
            });

            const content = fallbackResponse?.choices?.[0]?.message?.content || fallbackResponse?.content || '';
            if (content) {
              fullContent = content;
              controller.enqueue(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch (fallbackError: any) {
            console.error('Fallback failed:', fallbackError?.message);
            controller.enqueue(`data: ${JSON.stringify({ content: 'Sorry, I encountered an error. Please try again.' })}\n\n`);
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
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}