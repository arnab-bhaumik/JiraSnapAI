import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'JiraSnap AI',
  description: 'Capture screenshots and auto-generate bug reports in Jira',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
