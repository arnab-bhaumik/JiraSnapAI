const API_BASE = '/api';

export interface ApiSettings {
  jira: {
    projectName: string;
    email: string;
    apiToken: string;
    jiraUrl: string;
    issueType: string;
  };
  groq: {
    apiKey: string;
  };
}

export interface AnalyzePayload {
  image: string;
  mimeType: string;
  notes: string;
}

export interface AnalyzeResult {
  success: boolean;
  ticketKey?: string;
  extractedText?: string;
  message: string;
}

export interface TestResult {
  success: boolean;
  message: string;
}

export async function fetchSettings(): Promise<ApiSettings> {
  const res = await fetch(`${API_BASE}/settings`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function saveSettings(settings: ApiSettings): Promise<TestResult> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to save settings');
  return res.json();
}

export async function testJiraConnection(settings: ApiSettings): Promise<TestResult> {
  const res = await fetch(`${API_BASE}/settings/test-jira`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  return res.json();
}

export async function testGroqConnection(settings: ApiSettings): Promise<TestResult> {
  const res = await fetch(`${API_BASE}/settings/test-groq`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  return res.json();
}

export async function analyzeAndCreateTicket(payload: AnalyzePayload): Promise<AnalyzeResult> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}
