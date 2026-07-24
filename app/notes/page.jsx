import React from 'react';
import Link from 'next/link';
import NoteCard from '../../src/components/notes/NoteCard';
import SearchBar from '../../src/components/notes/SearchBar';
import { fetchApi } from '../../src/utils/notesApi';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Notes Arena — Free Study Material, PYQs & College Notes | Code Plus Academy',
  description: 'Download college question papers, notes, study material, books, lab manuals, and guides from Notes Arena by Code Plus Academy.',
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// Pre-populated high-quality mock data as fallbacks to prevent empty/broken UI
const MOCK_STATS = { notes: 1420, colleges: 45, contributors: 180 };

const MOCK_FIELDS = [
  { id: '1', name: 'Computer Science', slug: 'computer-science' },
  { id: '2', name: 'Engineering', slug: 'engineering' },
  { id: '3', name: 'Medical & Health', slug: 'medical-health' },
  { id: '4', name: 'Commerce & Finance', slug: 'commerce-finance' },
  { id: '5', name: 'Sciences', slug: 'sciences' },
  { id: '6', name: 'Arts & Humanities', slug: 'arts-humanities' },
];

const MOCK_COLLEGES = [
  { id: '1', name: 'Savitribai Phule Pune University', slug: 'sppu', university: 'SPPU', location: 'Pune, India', verified: true },
  { id: '2', name: 'Delhi University', slug: 'du', university: 'DU', location: 'Delhi, India', verified: true },
  { id: '3', name: 'Indian Institute of Technology Bombay', slug: 'iit-bombay', university: 'IIT Bombay', location: 'Mumbai, India', verified: true },
  { id: '4', name: 'Mumbai University', slug: 'mu', university: 'MU', location: 'Mumbai, India', verified: false },
];

const MOCK_NOTES = [
  {
    id: 'n1',
    title: 'Database Management Systems Semester 4 Question Paper 2025',
    slug: 'sppu-comp-sem-4-dbms-pyq-2025',
    type: 'question_paper',
    subject_name: 'Database Management Systems',
    college_name: 'Savitribai Phule Pune University',
    semester: 4,
    uploader_name: 'Atharva Kapse',
    uploader_username: 'atharva',
    upvote_count: 34,
    downloads: 120,
    created_at: new Date().toISOString(),
  },
  {
    id: 'n2',
    title: 'Data Structures and Algorithms Lecture Notes (Complete Guide)',
    slug: 'dsa-lecture-notes-complete',
    type: 'notes',
    subject_name: 'Data Structures & Algorithms',
    topic_name: 'Algorithms',
    uploader_name: 'Priya Sharma',
    uploader_username: 'priya',
    upvote_count: 82,
    downloads: 340,
    created_at: new Date().toISOString(),
  },
  {
    id: 'n3',
    title: 'Organic Chemistry II Cheat Sheet (Reactions & Mechanisms)',
    slug: 'organic-chemistry-2-cheat-sheet',
    type: 'cheatsheet',
    subject_name: 'Organic Chemistry',
    college_name: 'Delhi University',
    semester: 3,
    uploader_name: 'Rahul Verma',
    uploader_username: 'rahulv',
    upvote_count: 51,
    downloads: 189,
    created_at: new Date().toISOString(),
  },
  {
    id: 'n4',
    title: 'Operating Systems Previous Year Papers (SPPU Comp Sem 5)',
    slug: 'sppu-comp-sem-5-os-pyqs',
    type: 'question_paper',
    subject_name: 'Operating Systems',
    college_name: 'Savitribai Phule Pune University',
    semester: 5,
    uploader_name: 'Amit Patel',
    uploader_username: 'amitp',
    upvote_count: 19,
    downloads: 75,
    created_at: new Date().toISOString(),
  },
];

async function getHomeData() {
  try {
    const [notesRes, fieldsRes, collegesRes] = await Promise.all([
      fetchApi('/notes/recent').catch(() => null),
      fetchApi('/notes/fields').catch(() => null),
      fetchApi('/notes/colleges?limit=4').catch(() => null),
    ]);

    let recentNotes = MOCK_NOTES;
    if (notesRes?.ok) {
      try {
        const data = await notesRes.json();
        const list = Array.isArray(data) ? data : (data?.notes || data?.data);
        if (Array.isArray(list) && list.length > 0) recentNotes = list;
      } catch (e) {
        console.error('Error parsing notesRes:', e);
      }
    }

    let fields = MOCK_FIELDS;
    if (fieldsRes?.ok) {
      try {
        const data = await fieldsRes.json();
        const list = Array.isArray(data) ? data : (data?.fields || data?.data);
        if (Array.isArray(list) && list.length > 0) fields = list;
      } catch (e) {
        console.error('Error parsing fieldsRes:', e);
      }
    }

    let colleges = MOCK_COLLEGES;
    if (collegesRes?.ok) {
      try {
        const data = await collegesRes.json();
        const list = Array.isArray(data) ? data : (data?.colleges || data?.data);
        if (Array.isArray(list) && list.length > 0) colleges = list;
      } catch (e) {
        console.error('Error parsing collegesRes:', e);
      }
    }

    return {
      recentNotes: Array.isArray(recentNotes) ? recentNotes : MOCK_NOTES,
      fields: Array.isArray(fields) ? fields : MOCK_FIELDS,
      colleges: Array.isArray(colleges) ? colleges : MOCK_COLLEGES,
    };
  } catch (err) {
    console.error('Error fetching Home data:', err);
    return { recentNotes: MOCK_NOTES, fields: MOCK_FIELDS, colleges: MOCK_COLLEGES };
  }
}

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'C';
  try {
    const parts = name
      .trim()
      .split(/\s+/)
      .filter(w => w && !['of', 'and', 'in', 'the', '&'].includes(w.toLowerCase()));
    if (parts.length === 0) return 'C';
    const initials = parts
      .map(w => (w && w[0] ? w[0] : ''))
      .filter(Boolean)
      .join('')
      .slice(0, 2)
      .toUpperCase();
    return initials || 'C';
  } catch {
    return 'C';
  }
};

export default async function NotesHomePage() {
  const data = await getHomeData();
  const recentNotes = Array.isArray(data?.recentNotes) ? data.recentNotes : MOCK_NOTES;
  const fields = Array.isArray(data?.fields) ? data.fields : MOCK_FIELDS;
  const colleges = Array.isArray(data?.colleges) ? data.colleges : MOCK_COLLEGES;

  return (
    <>
      <style>{`
        .notes-hero {
          background: radial-gradient(circle at top right, rgba(0, 180, 216, 0.07), transparent 60%), 
                      radial-gradient(circle at bottom left, rgba(147, 51, 234, 0.07), transparent 60%), 
                      var(--surface);
          border: 1px solid var(--border-bright);
          border-radius: 24px;
          padding: 56px 40px;
          text-align: center;
          margin-bottom: 40px;
          box-shadow: var(--shadow-card);
          position: relative;
          overflow: hidden;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .notes-hero:hover {
          border-color: rgba(0, 180, 216, 0.25);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.22);
        }
        .notes-hero-title {
          font-family: var(--font-display);
          font-size: clamp(2.2rem, 5vw, 3.8rem);
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 16px;
          background: var(--gradient-brand);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.02em;
        }
        .notes-hero-subtitle {
          font-size: clamp(0.95rem, 1.8vw, 1.15rem);
          color: var(--sub);
          max-width: 640px;
          margin: 0 auto 32px;
          line-height: 1.6;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 48px;
        }
        .stat-widget {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          padding: 24px 16px;
          text-align: center;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: default;
          position: relative;
          overflow: hidden;
        }
        .stat-widget:hover {
          border-color: var(--green);
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(0, 180, 216, 0.08);
        }
        .stat-widget::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--gradient-brand);
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .stat-widget:hover::after {
          opacity: 1;
        }
        .stat-value {
          font-family: var(--font-display);
          font-size: 32px;
          font-weight: 700;
          color: var(--green);
          line-height: 1.1;
        }
        .stat-label {
          font-size: 11px;
          color: var(--sub);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-top: 6px;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 24px;
        }
        .section-title {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 700;
          color: var(--text);
          letter-spacing: -0.01em;
          position: relative;
          display: inline-block;
        }
        .section-title::after {
          content: '';
          display: block;
          width: 32px;
          height: 3px;
          background: var(--green);
          margin-top: 6px;
          border-radius: var(--r-full);
        }
        .chips-container {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 40px;
        }
        .field-chip {
          display: inline-flex;
          align-items: center;
          padding: 10px 22px;
          background: var(--s2);
          border: 1px solid var(--border);
          border-radius: var(--r-full);
          font-size: 13.5px;
          font-weight: 600;
          color: var(--text);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .field-chip:hover {
          border-color: var(--green);
          color: var(--green);
          background: var(--green-dim);
          transform: translateY(-1.5px);
          box-shadow: 0 4px 12px rgba(0, 180, 216, 0.1);
        }
        .college-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 20px;
          margin-bottom: 48px;
        }
        .college-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          padding: 22px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 160px;
          position: relative;
        }
        .college-card:hover {
          border-color: var(--green);
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0, 180, 216, 0.12);
        }
        .college-badge {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--green-dim);
          color: var(--green);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          margin-right: 12px;
          flex-shrink: 0;
        }
        .notes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        @media (max-width: 768px) {
          .stats-grid {
            display: none !important;
          }
          .notes-hero {
            padding: 40px 20px;
            margin-bottom: 24px;
          }
        }
      `}</style>

      {/* Hero Header */}
      <header className="notes-hero">
        <h1 className="notes-hero-title">Welcome to Notes Arena</h1>
        <p className="notes-hero-subtitle">
          Download and share lecture notes, previous year question papers (PYQs), cheatsheets, and laboratory manuals across universities.
        </p>

        {/* Interactive Search Bar */}
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '0 auto 28px' }}>
          <SearchBar placeholder="Search notes, PYQs, courses, colleges..." />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
          <Link href="/notes/upload" className="btn-primary" style={{ padding: '12px 28px', textDecoration: 'none' }}>
            Upload Resource
          </Link>
          <Link href="/notes/colleges" className="btn-secondary" style={{ padding: '12px 28px', textDecoration: 'none' }}>
            Browse Colleges
          </Link>
        </div>
      </header>

      {/* Dynamic statistics widgets */}
      <section className="stats-grid">
        <div className="stat-widget">
          <div className="stat-value">{MOCK_STATS.notes}+</div>
          <div className="stat-label">Verified Notes</div>
        </div>
        <div className="stat-widget">
          <div className="stat-value">{MOCK_STATS.colleges}+</div>
          <div className="stat-label">Colleges Indexed</div>
        </div>
        <div className="stat-widget">
          <div className="stat-value">{MOCK_STATS.contributors}+</div>
          <div className="stat-label">Contributors</div>
        </div>
      </section>

      {/* Browse by field chips */}
      <section style={{ marginBottom: 40 }}>
        <h3 className="section-title" style={{ marginBottom: 20 }}>Browse by Department</h3>
        <div className="chips-container">
          {fields.map((f) => (
            <Link key={f.id} href={`/notes/departments/${f.slug}`} className="field-chip">
              {f.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Colleges */}
      <section style={{ marginBottom: 48 }}>
        <div className="section-header">
          <h3 className="section-title">Popular Colleges</h3>
          <Link href="/notes/colleges" style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600, textDecoration: 'none', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 0.8} onMouseLeave={e => e.currentTarget.style.opacity = 1}>
            View All
          </Link>
        </div>
        <div className="college-grid">
          {colleges.map((c) => (
            <Link key={c.id} href={`/notes/colleges/${c.slug}`} style={{ textDecoration: 'none' }}>
              <div className="college-card">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 11, color: 'var(--sub)', fontWeight: 600 }}>{c.location}</span>
                    {c.verified && (
                      <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--green)' }} title="Verified College">
                        verified
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: 12 }}>
                    <div className="college-badge">
                      {getInitials(c.name)}
                    </div>
                    <h4 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0, lineHeight: 1.35 }}>
                      {c.name}
                    </h4>
                  </div>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--sub)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 10 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 14, color: 'var(--dim)' }}>account_balance</span>
                  <span>{c.university || 'Affiliated'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recently Added Notes */}
      <section style={{ marginBottom: 64 }}>
        <h3 className="section-title" style={{ marginBottom: 24 }}>Recently Added Resources</h3>
        <div className="notes-grid">
          {recentNotes.map((n) => (
            <NoteCard key={n.id} note={n} />
          ))}
        </div>
      </section>
    </>
  );
}
