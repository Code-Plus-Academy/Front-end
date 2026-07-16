import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchApi } from '../../../../src/utils/notesApi';
import PublisherCard from '../../../../src/components/notes/PublisherCard';
import NoteActionButtons from '../../../../src/components/notes/NoteActionButtons';
import RelatedNotes from '../../../../src/components/notes/RelatedNotes';

import PdfViewer from '../../../../src/components/notes/PdfViewer';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { resourceSlug } = await params;
  const note = await getNoteData(resourceSlug);

  if (!note) {
    return {
      title: 'Resource Not Found | Notes Arena',
    };
  }

  const typeLabels = {
    question_paper: 'PYQ',
    notes: 'Notes',
    book: 'Book',
    assignment: 'Assignment',
    cheatsheet: 'Cheatsheet',
    video_link: 'Video',
    project_report: 'Project',
    lab_manual: 'Lab Manual',
    roadmap: 'Roadmap',
    other: 'Resource',
  };

  const typeLabel = typeLabels[note.type] || 'Resource';
  const title = `${note.title} — ${note.subject_name || note.topic_name || ''} ${typeLabel} | Notes Arena`;
  const description = note.description || `Download ${note.title} study resources, cheatsheets, and question papers on Notes Arena by Code Plus Academy.`;
  const canonicalUrl = `https://www.codeplusacademy.in/notes/resource/${note.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'article',
      images: ['/og-default-notes.png'],
    },
  };
}

// Fallback high-quality mock note
const MOCK_NOTE = {
  id: 'n5',
  title: 'DBMS Complete SQL Queries & Relational Algebra Cheat Sheet',
  slug: 'dbms-sql-cheat-sheet',
  description: 'Download the complete cheatsheet containing all vital SQL commands, relational algebra equations, and query examples for university examinations.',
  file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  file_type: 'pdf',
  type: 'cheatsheet',
  subject_id: 's3',
  subject_name: 'Database Management Systems',
  college_name: 'Savitribai Phule Pune University',
  semester: 2,
  downloads: 218,
  views: 1205,
  upvote_count: 55,
  created_at: new Date().toISOString(),
  uploader: {
    username: 'atharva',
    name: 'Atharva Kapse',
    verified_contributor: true,
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&auto=format&fit=crop&q=80',
  }
};

async function getNoteData(slug) {
  try {
    const res = await fetchApi(`/notes/resources/${slug}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error(`Error loading note ${slug}:`, err);
  }
  if (slug === MOCK_NOTE.slug) return MOCK_NOTE;
  return null;
}

export default async function ResourceDetailPage({ params }) {
  const { resourceSlug } = await params;
  const note = await getNoteData(resourceSlug);

  if (!note) {
    notFound();
  }

  const formattedDate = new Date(note.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const canonicalUrl = `https://www.codeplusacademy.in/notes/resource/${note.slug}`;

  // Structured Data (JSON-LD) for LearningResource
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: note.title,
    description: note.description || note.title,
    datePublished: note.created_at,
    isAccessibleForFree: true,
    learningResourceType: note.type,
    author: {
      '@type': 'Person',
      name: note.uploader?.name || note.uploader?.username || 'Contributor',
    },
    educationalLevel: note.semester ? `Semester ${note.semester}` : undefined,
    about: note.subject_name ? {
      '@type': 'Thing',
      name: note.subject_name,
    } : undefined,
  };

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <style>{`
        .resource-layout {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 24px;
        }
        .meta-list {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          padding: 20px;
          margin-bottom: 20px;
        }
        .meta-list-title {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 12px;
          color: var(--text);
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid var(--border);
          font-size: 13px;
        }
        .meta-row:last-child {
          border-bottom: none;
        }
        .meta-row-lbl {
          color: var(--sub);
          font-weight: 500;
        }
        .meta-row-val {
          color: var(--text);
          font-weight: 600;
          text-align: right;
        }
        .notes-desc-box {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          padding: 20px;
          margin-bottom: 24px;
        }

        @media (max-width: 900px) {
          .resource-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Breadcrumbs mapping */}
      <div style={{ display: 'flex', gap: 6, fontSize: 12, color: 'var(--sub)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 20 }}>
        <Link href="/notes">Notes</Link>
        <span>/</span>
        {note.college_name ? (
          <>
            <span className="notes-hide-mobile">Colleges /</span>
            <span className="notes-hide-mobile">{note.college_name} /</span>
          </>
        ) : (
          <>
            <span className="notes-hide-mobile">Departments /</span>
            <span className="notes-hide-mobile">{note.field_name} /</span>
          </>
        )}
        <span style={{ color: 'var(--green)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
          {note.title}
        </span>
      </div>

      <div className="resource-layout">
        {/* Main/Left: File previewer */}
        <div>
          <PdfViewer 
            fileUrl={note.file_url} 
            fileType={note.file_type} 
            title={note.title} 
            downloadsCount={note.downloads}
            noteId={note.id}
          />

          {/* Description */}
          {note.description && (
            <div className="notes-desc-box">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Description</h3>
              <p style={{ color: 'var(--sub)', fontSize: 14, lineHeight: 1.6 }}>{note.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar/Right */}
        <div>
          {/* Action buttons (Upvote/Save) */}
          <NoteActionButtons 
            noteId={note.id} 
            initialUpvoted={note.is_upvoted} 
            initialBookmarked={note.is_bookmarked} 
            initialUpvotes={note.upvote_count} 
          />

          {/* Publisher Card */}
          <PublisherCard uploader={note.uploader} />

          {/* Metadata Block */}
          <div className="meta-list">
            <h3 className="meta-list-title">Resource Metadata</h3>
            
            {note.subject_name && (
              <div className="meta-row">
                <span className="meta-row-lbl">Subject</span>
                <span className="meta-row-val">{note.subject_name}</span>
              </div>
            )}

            {note.college_name && (
              <div className="meta-row">
                <span className="meta-row-lbl">College</span>
                <span className="meta-row-val">{note.college_name}</span>
              </div>
            )}

            {note.semester && (
              <div className="meta-row">
                <span className="meta-row-lbl">Semester</span>
                <span className="meta-row-val">Semester {note.semester}</span>
              </div>
            )}

            <div className="meta-row">
              <span className="meta-row-lbl">File Type</span>
              <span className="meta-row-val" style={{ textTransform: 'uppercase' }}>{note.file_type || 'PDF'}</span>
            </div>

            <div className="meta-row">
              <span className="meta-row-lbl">Uploaded</span>
              <span className="meta-row-val">{formattedDate}</span>
            </div>

            <div className="meta-row">
              <span className="meta-row-lbl">Views</span>
              <span className="meta-row-val">{note.views || 0}</span>
            </div>
          </div>

          {/* Related Notes */}
          <RelatedNotes noteId={note.id} subjectId={note.subject_id} topicId={note.topic_id} />
        </div>
      </div>
    </>
  );
}
