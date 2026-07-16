import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '../../../src/utils/notesApi';
import UploadForm from '../../../src/components/notes/UploadForm';
import { createNote } from '../actions';

export const metadata = {
  title: 'Upload Study Material | Notes Arena',
  description: 'Contribute lecture notes, previous year question papers, lab manuals or cheatsheets to Notes Arena.',
};

export const dynamic = 'force-dynamic';

export default async function UploadPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?next=/notes/upload');
  }

  return (
    <>
      <style>{`
        .upload-container {
          max-width: 600px;
          margin: 0 auto;
          background: var(--surface);
          border: 1px solid var(--border-bright);
          border-radius: var(--r-lg);
          padding: 32px;
          box-shadow: var(--shadow-modal);
        }
        .upload-header {
          margin-bottom: 24px;
        }
        .upload-title {
          font-family: var(--font-display);
          font-size: 26px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 6px;
        }
      `}</style>

      <div style={{ display: 'flex', gap: 6, fontSize: 12, color: 'var(--sub)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 20 }}>
        <Link href="/notes">Notes</Link>
        <span>/</span>
        <span style={{ color: 'var(--green)' }}>Upload</span>
      </div>

      <div className="upload-container">
        <header className="upload-header">
          <h1 className="upload-title">Contribute Study Material</h1>
          <p style={{ color: 'var(--sub)', fontSize: 14 }}>
            Share your knowledge with fellow developers. You can upload a PDF file or link directly to Google Drive, YouTube, or GitHub.
          </p>
        </header>

        <UploadForm action={createNote} />
      </div>
    </>
  );
}
