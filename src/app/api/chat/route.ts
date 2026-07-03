import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Ensure SDK config is available at runtime (needed for Vercel serverless)
function ensureZAIConfig() {
  const configStr = process.env.Z_AI_CONFIG;
  if (!configStr) return;

  // Write to current working directory (first place SDK looks)
  const cwdPath = path.join(process.cwd(), '.z-ai-config');
  try {
    if (!fs.existsSync(cwdPath)) {
      fs.writeFileSync(cwdPath, configStr, 'utf-8');
    }
  } catch {}

  // Also write to home dir as fallback
  const homePath = path.join(os.homedir(), '.z-ai-config');
  try {
    if (!fs.existsSync(homePath)) {
      fs.writeFileSync(homePath, configStr, 'utf-8');
    }
  } catch {}

  // Also write to /tmp as last resort
  const tmpPath = path.join(os.tmpdir(), '.z-ai-config');
  try {
    if (!fs.existsSync(tmpPath)) {
      fs.writeFileSync(tmpPath, configStr, 'utf-8');
    }
  } catch {}
}

export async function POST(req: NextRequest) {
  try {
    ensureZAIConfig();

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