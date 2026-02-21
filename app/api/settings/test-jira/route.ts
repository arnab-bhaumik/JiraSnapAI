import { NextRequest, NextResponse } from 'next/server';
import { AppSettings } from '@/lib/server/types';
import { testJiraConnection } from '@/lib/server/jiraService';

export async function POST(request: NextRequest) {
  try {
    const { jira } = (await request.json()) as AppSettings;
    if (!jira?.jiraUrl || !jira?.email || !jira?.apiToken) {
      return NextResponse.json({ success: false, message: 'Please provide Jira URL, email, and API token.' }, { status: 400 });
    }

    const result = await testJiraConnection(jira);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
