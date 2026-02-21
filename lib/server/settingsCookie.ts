import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { AppSettings, DEFAULT_SETTINGS } from './types';

const COOKIE_NAME = 'jirasnap_settings';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
const DEV_FALLBACK_SECRET = 'jirasnap-dev-fallback-secret-change-me';

function getSecretKey(): Buffer {
  const secret = process.env.APP_SETTINGS_SECRET || process.env.NEXTAUTH_SECRET;
  const effectiveSecret = secret || (process.env.NODE_ENV !== 'production' ? DEV_FALLBACK_SECRET : '');

  if (!effectiveSecret) {
    throw new Error('APP_SETTINGS_SECRET is required in production to encrypt settings cookies');
  }

  return crypto.createHash('sha256').update(effectiveSecret).digest();
}

function encrypt(settings: AppSettings): string {
  const key = getSecretKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(settings), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join('.');
}

function decrypt(value: string): AppSettings {
  const [ivRaw, tagRaw, encryptedRaw] = value.split('.');
  if (!ivRaw || !tagRaw || !encryptedRaw) {
    throw new Error('Invalid encrypted settings payload');
  }

  const key = getSecretKey();
  const iv = Buffer.from(ivRaw, 'base64url');
  const tag = Buffer.from(tagRaw, 'base64url');
  const encrypted = Buffer.from(encryptedRaw, 'base64url');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');

  return JSON.parse(plain) as AppSettings;
}

export function readSettingsFromCookie(request: NextRequest): AppSettings {
  const value = request.cookies.get(COOKIE_NAME)?.value;
  if (!value) {
    return DEFAULT_SETTINGS;
  }

  try {
    return decrypt(value);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function writeSettingsCookie(response: NextResponse, settings: AppSettings): void {
  const encrypted = encrypt(settings);

  response.cookies.set({
    name: COOKIE_NAME,
    value: encrypted,
    maxAge: COOKIE_MAX_AGE,
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}
