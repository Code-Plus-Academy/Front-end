import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '../../../../src/utils/notesApi';
import { requestNewCollege } from '../../actions';

export const metadata = {
  title: 'Request College Addition | Notes Arena',
  description: 'Submit a request to add your university or college to Notes Arena directory.',
  robots: {
    index: true,
    follow: true,
  },
};

export const dynamic = 'force-dynamic';

// Simple helper component to handle client-side form status and feedback
import AddCollegeForm from './AddCollegeForm';

export default async function AddCollegePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?next=/notes/colleges/add');
  }

  return (
    <>
      <style>{`
        .add-college-container {
          max-width: 580px;
          margin: 0 auto;
          background: var(--surface);
          border: 1px solid var(--border-bright);
          border-radius: var(--r-lg);
          padding: 32px;
          box-shadow: var(--shadow-modal);
        }
        .form-header {
          margin-bottom: 24px;
        }
        .form-title {
          font-family: var(--font-display);
          font-size: 24px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 6px;
        }
      `}</style>

      <div style={{ display: 'flex', gap: 6, fontSize: 12, color: 'var(--sub)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 20 }}>
        <Link href="/notes">Notes</Link>
        <span>/</span>
        <Link href="/notes/colleges">Colleges</Link>
        <span>/</span>
        <span style={{ color: 'var(--green)' }}>Request College</span>
      </div>

      <div className="add-college-container">
        <header className="form-header">
          <h1 className="form-title">Request College Addition</h1>
          <p style={{ color: 'var(--sub)', fontSize: 14 }}>
            Provide details of the college or university you want to index. Our moderators will review and approve the taxonomy soon.
          </p>
        </header>

        <AddCollegeForm action={requestNewCollege} />
      </div>
    </>
  );
}
