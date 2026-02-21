import { NextRequest, NextResponse } from 'next/server';
import { AnalyzeRequest, AnalyzeResponse } from '@/lib/server/types';
import { readSettingsFromCookie } from '@/lib/server/settingsCookie';
import { analyzeScreenshot } from '@/lib/server/groqService';
import { createBugTicket } from '@/lib/server/jiraService';

export async function POST(request: NextRequest) {
  try {
    const { image, mimeType, notes } = (await request.json()) as AnalyzeRequest;

    if (!image) {
      return NextResponse.json(
        { success: false, message: 'No image provided. Please drag and drop a screenshot.' } as AnalyzeResponse,
        { status: 400 },
      );
    }

    const settings = readSettingsFromCookie(request);

    if (!settings.groq.apiKey) {
      return NextResponse.json(
        { success: false, message: 'Groq API key not configured. Please go to Settings.' } as AnalyzeResponse,
        { status: 400 },
      );
    }

    if (!settings.jira.jiraUrl || !settings.jira.email || !settings.jira.apiToken || !settings.jira.projectName) {
      return NextResponse.json(
        { success: false, message: 'Jira settings not fully configured. Please go to Settings.' } as AnalyzeResponse,
        { status: 400 },
      );
    }

    const extractedText = await analyzeScreenshot(settings.groq.apiKey, image, mimeType || 'image/png', notes);
    const summaryMatch = extractedText.match(/\*\*Summary:\*\*\s*(.+)/);
    const summary = summaryMatch ? summaryMatch[1].trim() : `Bug Report - ${new Date().toISOString().split('T')[0]}`;

    const { ticketKey } = await createBugTicket(settings.jira, summary, extractedText, image, mimeType);

    return NextResponse.json({
      success: true,
      ticketKey,
      extractedText,
      message: `Bug ticket ${ticketKey} created successfully!`,
    } as AnalyzeResponse);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message: `Analysis failed: ${message}` } as AnalyzeResponse, { status: 500 });
  }
}
