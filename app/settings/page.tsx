'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchSettings,
  saveSettings as saveSettingsApi,
  testJiraConnection,
  testGroqConnection,
  ApiSettings,
} from '@/lib/client/api';

const DEFAULT_SETTINGS: ApiSettings = {
  jira: { projectName: '', email: '', apiToken: '', jiraUrl: '', issueType: 'Bug' },
  groq: { apiKey: '' },
};

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<ApiSettings>(DEFAULT_SETTINGS);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingJira, setTestingJira] = useState(false);
  const [testingGroq, setTestingGroq] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(initialTheme);
    document.body.setAttribute('data-theme', initialTheme);
    void loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await fetchSettings();
      setSettings(data);
    } catch {
      showToast('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.body.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const updateJira = (field: keyof ApiSettings['jira'], value: string) => {
    setSettings((prev) => ({ ...prev, jira: { ...prev.jira, [field]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await saveSettingsApi(settings);
      showToast(result.success ? 'success' : 'error', result.message);
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestJira = async () => {
    setTestingJira(true);
    try {
      const result = await testJiraConnection(settings);
      showToast(result.success ? 'success' : 'error', result.message);
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to test Jira connection');
    } finally {
      setTestingJira(false);
    }
  };

  const handleTestGroq = async () => {
    setTestingGroq(true);
    try {
      const result = await testGroqConnection(settings);
      showToast(result.success ? 'success' : 'error', result.message);
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to test Groq connection');
    } finally {
      setTestingGroq(false);
    }
  };

  if (loading) {
    return (
      <div className="app-card">
        <div className="card-body" style={{ textAlign: 'center', padding: '40px' }}>
          <span className="spinner" style={{ borderTopColor: 'var(--primary)' }} />
          <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-card">
      <header className="card-header" style={{ alignItems: 'flex-start' }}>
        <div className="header-left" style={{ gap: '12px' }}>
          <button className="icon-btn" onClick={() => router.push('/')} title="Back">Back</button>
          <div>
            <h1 className="header-title" style={{ color: 'var(--text-heading)', marginBottom: '2px' }}>Settings</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Configure JiraSnap AI</p>
          </div>
        </div>
        <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">{theme === 'light' ? 'Moon' : 'Sun'}</button>
      </header>

      <div className="card-body">
        {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

        <div className="settings-section">
          <h2 className="settings-group-header">Jira Configuration</h2>

          <div className="field-group" style={{ marginBottom: '12px' }}>
            <label className="label-title">Jira URL</label>
            <input className="app-input" type="url" value={settings.jira.jiraUrl} onChange={(e) => updateJira('jiraUrl', e.target.value)} />
          </div>
          <div className="field-group" style={{ marginBottom: '12px' }}>
            <label className="label-title">Project Key</label>
            <input className="app-input" type="text" value={settings.jira.projectName} onChange={(e) => updateJira('projectName', e.target.value)} />
          </div>
          <div className="field-group" style={{ marginBottom: '12px' }}>
            <label className="label-title">Email</label>
            <input className="app-input" type="email" value={settings.jira.email} onChange={(e) => updateJira('email', e.target.value)} />
          </div>
          <div className="field-group" style={{ marginBottom: '12px' }}>
            <label className="label-title">API Token</label>
            <input className="app-input" type="password" value={settings.jira.apiToken} onChange={(e) => updateJira('apiToken', e.target.value)} />
          </div>
          <div className="field-group" style={{ marginBottom: '16px' }}>
            <label className="label-title">Issue Type</label>
            <select className="app-input" value={settings.jira.issueType} onChange={(e) => updateJira('issueType', e.target.value)}>
              <option value="Bug">Bug</option>
              <option value="Task">Task</option>
              <option value="Story">Story</option>
            </select>
          </div>

          <button className="btn-secondary" onClick={handleTestJira} disabled={testingJira}>
            {testingJira ? <span className="spinner" style={{ borderTopColor: 'var(--primary)', width: '12px', height: '12px' }} /> : 'Test Jira Connection'}
          </button>
        </div>

        <div className="settings-section" style={{ marginTop: '12px' }}>
          <h2 className="settings-group-header">Groq Configuration</h2>
          <div className="field-group" style={{ marginBottom: '16px' }}>
            <label className="label-title">Groq API Key</label>
            <input className="app-input" type="password" value={settings.groq.apiKey} onChange={(e) => setSettings((prev) => ({ ...prev, groq: { apiKey: e.target.value } }))} />
          </div>
          <button className="btn-secondary" onClick={handleTestGroq} disabled={testingGroq}>
            {testingGroq ? <span className="spinner" style={{ borderTopColor: 'var(--primary)', width: '12px', height: '12px' }} /> : 'Test Groq Connection'}
          </button>
        </div>
      </div>

      <div className="card-footer">
        <button className="btn-submit" onClick={handleSave} disabled={saving}>
          {saving ? <span className="spinner" /> : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
