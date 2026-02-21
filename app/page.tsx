'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DragDropZone from '@/components/DragDropZone';
import { analyzeAndCreateTicket, AnalyzeResult } from '@/lib/client/api';

export default function MainPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState('image/png');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(initialTheme);
    document.body.setAttribute('data-theme', initialTheme);
  }, []);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const handleImageSelected = (base64: string, mimeType: string) => {
    setImageBase64(base64);
    setImageMimeType(mimeType);
    setImagePreview(`data:${mimeType};base64,${base64}`);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!imageBase64) {
      setError('Please drop a screenshot first.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await analyzeAndCreateTicket({ image: imageBase64, mimeType: imageMimeType, notes });
      if (response.success) setResult(response);
      else setError(response.message);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-card">
      <header className="card-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1 className="header-title" style={{ color: 'var(--text-heading)', marginBottom: '2px' }}>JiraSnap AI</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Capture screenshots and auto-generate bug reports in Jira</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">{theme === 'light' ? 'Moon' : 'Sun'}</button>
          <button className="icon-btn" onClick={() => router.push('/settings')} title="Settings">Settings</button>
        </div>
      </header>

      <div className="card-body">
        {error && <div className="toast toast-error">{error}</div>}

        <DragDropZone
          onImageSelected={handleImageSelected}
          imagePreview={imagePreview}
          onRemoveImage={() => {
            setImageBase64(null);
            setImagePreview(null);
            setResult(null);
          }}
        />

        <div className="field-group">
          <label className="label-title">Description</label>
          <textarea
            className="app-textarea"
            placeholder="Describe the bug you encountered..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="card-footer">
        <button className="btn-submit" onClick={handleSubmit} disabled={loading || !imageBase64}>
          {loading ? <><span className="spinner" /> Creating Ticket...</> : 'Create Jira Ticket'}
        </button>

        {result?.success && (
          <div className="result-success">
            <strong>Ticket Created: {result.ticketKey}</strong>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Analyze complete. Ticket has been pushed to Jira.</p>
          </div>
        )}
      </div>
    </div>
  );
}
