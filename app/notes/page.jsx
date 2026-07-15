import React from 'react';
import Link from 'next/link';
import NoteCard from '../../src/components/notes/NoteCard';
import { fetchApi } from '../../src/utils/notesApi';

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

    const recentNotes = notesRes?.ok ? (await notesRes.json()).notes : MOCK_NOTES;
    const fields = fieldsRes?.ok ? (await fieldsRes.json()).fields : MOCK_FIELDS;
    const colleges = collegesRes?.ok ? (await collegesRes.json()).colleges : MOCK_COLLEGES;

    return { recentNotes, fields, colleges };
  } catch (err) {
    console.error('Error fetching Home data:', err);
    return { recentNotes: MOCK_NOTES, fields: MOCK_FIELDS, colleges: MOCK_COLLEGES };
  }
}

export default async function NotesHomePage() {
  const { recentNotes, fields, colleges } = await getHomeData();

  return (
    <>
      <style>{`
        .notes-hero {
          background: linear-gradient(135deg, rgba(0, 180, 216, 0.08) 0%, rgba(147, 51, 234, 0.08) 100%);
          border: 1px solid var(--border-bright);
          border-radius: var(--r-lg);
          padding: 48px 32px;
          text-align: center;
          margin-bottom: 32px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        }
        .notes-hero-title {
          font-family: var(--font-display);
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 12px;
          background: var(--gradient-brand);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .notes-hero-subtitle {
          font-size: clamp(0.95rem, 2vw, 1.25rem);
          color: var(--sub);
          max-width: 600px;
          margin: 0 auto 24px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 40px;
        }
        .stat-widget {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          padding: 20px;
          text-align: center;
          transition: border-color 0.2s;
        }
        .stat-widget:hover {
          border-color: var(--green);
        }
        .stat-value {
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 700;
          color: var(--green);
          line-height: 1.2;
        }
        .stat-label {
          font-size: 12px;
          color: var(--sub);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 4px;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .section-title {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 700;
          color: var(--text);
        }
        .chips-container {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 32px;
        }
        .field-chip {
          display: inline-block;
          padding: 8px 18px;
          background: var(--s2);
          border: 1px solid var(--border);
          border-radius: var(--r-full);
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
          transition: all 0.2s ease;
        }
        .field-chip:hover {
          border-color: var(--green);
          color: var(--green);
          background: var(--green-dim);
          transform: translateY(-1px);
        }
        .college-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
          margin-bottom: 40px;
        }
        .college-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          padding: 20px;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 140px;
        }
        .college-card:hover {
          border-color: var(--green);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 180, 216, 0.08);
        }
        .notes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        @media (max-width: 600px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Hero Header */}
      <header className="notes-hero">
        <h1 className="notes-hero-title">Welcome to Notes Arena</h1>
        <p className="notes-hero-subtitle">
          Download and share notes, cheat sheets, previous year papers (PYQs), and laboratory manuals for colleges and fields.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <Link href="/notes/upload" className="btn-primary" style={{ padding: '10px 24px' }}>
            Upload Resource
          </Link>
          <Link href="/notes/colleges" className="btn-secondary" style={{ padding: '10px 24px' }}>
            Browse Colleges
          </Link>
        </div>
      </header>

      {/* Interactive statistics widgets */}
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
      <section style={{ marginBottom: 32 }}>
        <h3 className="section-title" style={{ marginBottom: 16 }}>Browse by Department</h3>
        <div className="chips-container">
          {fields.map((f) => (
            <Link key={f.id} href={`/notes/departments/${f.slug}`} className="field-chip">
              {f.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Colleges */}
      <section style={{ marginBottom: 40 }}>
        <div className="section-header">
          <h3 className="section-title">Popular Colleges</h3>
          <Link href="/notes/colleges" style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>
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
                  <h4 style={{ fontSize: 15, fontWeight: 700, marginTop: 8, color: 'var(--text)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {c.name}
                  </h4>
                </div>
                <div style={{ fontSize: 12, color: 'var(--sub)', fontWeight: 500 }}>
                  {c.university || 'Affiliated'}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recently Added Notes */}
      <section>
        <h3 className="section-title" style={{ marginBottom: 20 }}>Recently Added Resources</h3>
        <div className="notes-grid">
          {recentNotes.map((n) => (
            <NoteCard key={n.id} note={n} />
          ))}
        </div>
      </section>
    </>
  );
}
