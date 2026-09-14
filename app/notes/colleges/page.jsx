import React from 'react';
import Link from 'next/link';
import { searchColleges } from '../../../src/lib/supabaseContent';

export const metadata = {
  title: 'Colleges & Universities Directory | Notes Arena',
  description: 'Find study materials, previous year papers, and syllabus notes for Savitribai Phule Pune University, Delhi University, IITs, and more.',
  robots: {
    index: true,
    follow: true,
  },
};

// Incremental Static Regeneration (1-hour edge cache with on-demand revalidation)
export const revalidate = 3600;

async function getColleges() {
  try {
    const colleges = await searchColleges('');
    return colleges || [];
  } catch (err) {
    console.error('Failed fetching colleges from Supabase:', err.message);
    return [];
  }
}

export default async function CollegesPage() {
  const colleges = await getColleges();

  return (
    <>
      <style>{`
        .colleges-header {
          margin-bottom: 32px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 24px;
        }
        .colleges-title {
          font-family: var(--font-display);
          font-size: 32px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 8px;
        }
        .colleges-subtitle {
          color: var(--sub);
          font-size: 15px;
        }
        .directory-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        .directory-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          padding: 24px;
          height: 160px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .directory-card:hover {
          border-color: var(--green);
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(0, 180, 216, 0.08);
        }
        .card-college-name {
          font-size: 16px;
          font-weight: 700;
          line-height: 1.4;
          color: var(--text);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      <header className="colleges-header">
        <h1 className="colleges-title">Colleges Directory</h1>
        <p className="colleges-subtitle">Select your college or university to access curriculum-aligned previous papers and study materials.</p>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-start' }}>
          <Link href="/notes/colleges/add" className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>add</span>
            Can't find your college? Request Addition
          </Link>
        </div>
      </header>

      <div className="directory-grid">
        {colleges.map((c) => (
          <Link key={c.id} href={`/notes/colleges/${c.slug}`} style={{ textDecoration: 'none' }}>
            <div className="directory-card">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--sub)', fontWeight: 600 }}>{c.location || 'India'}</span>
                  {c.verified && (
                    <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--green)' }} title="Verified College">
                      verified
                    </span>
                  )}
                </div>
                <h3 className="card-college-name">{c.name}</h3>
              </div>
              <div style={{ fontSize: 12, color: 'var(--sub)', fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{c.university || 'Affiliated'}</span>
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--green)' }}>arrow_right_alt</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
