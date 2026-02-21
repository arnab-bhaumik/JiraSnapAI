import { NextRequest, NextResponse } from 'next/server';
import { AppSettings } from '@/lib/server/types';
import { testGroqConnection } from '@/lib/server/groqService';

export async function POST(request: NextRequest) {
  try {
    const { groq } = (await request.json()) as AppSettings;
    if (!groq?.apiKey) {
      return NextResponse.json({ success: false, message: 'Please provide a Groq API key.' }, { status: 400 });
    }

    const result = await testGroqConnection(groq.apiKey);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
