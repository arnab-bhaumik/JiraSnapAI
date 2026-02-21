import { NextRequest, NextResponse } from 'next/server';
import { AppSettings } from '@/lib/server/types';
import { readSettingsFromCookie, writeSettingsCookie } from '@/lib/server/settingsCookie';

export async function GET(request: NextRequest) {
  const settings = readSettingsFromCookie(request);
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  try {
    const settings = (await request.json()) as AppSettings;
    const response = NextResponse.json({ success: true, message: 'Settings saved successfully!' });
    writeSettingsCookie(response, settings);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save settings';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
