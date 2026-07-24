import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchApi, getCurrentUser } from '../../../../src/utils/notesApi';
import { queryTable } from '../../../../src/lib/supabaseContent';
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
  
  let description = note.description || '';
  if (!description) {
    description = `Download ${note.title} ${typeLabel} on Notes Arena.`;
    if (note.subject_name) description += ` Subject: ${note.subject_name}.`;
    if (note.college_name) description += ` College: ${note.college_name}.`;
    if (note.college_university) description += ` University: ${note.college_university}.`;
    description += ` Download academic notes, previous year question papers (PYQs), and study resources.`;
  }

  const canonicalUrl = `https://www.codeplusacademy.in/notes/resource/${note.slug}`;

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Notes Arena by CPA',
      type: 'article',
      locale: 'en_IN',
      images: [
        {
          url: (note.file_type === 'jpg' || note.file_type === 'png' || note.file_type === 'jpeg') && note.file_url
            ? note.file_url
            : 'https://www.codeplusacademy.in/notes-arena-og.jpg',
          width: 1200,
          height: 630,
          alt: note.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [
        (note.file_type === 'jpg' || note.file_type === 'png' || note.file_type === 'jpeg') && note.file_url
          ? note.file_url
          : 'https://www.codeplusacademy.in/notes-arena-og.jpg',
      ],
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
  if (!slug) return null;

  // 1. Query Supabase notes table by slug or id
  try {
    const decodedSlug = decodeURIComponent(slug).trim();
    let notes = await queryTable('notes', '*', {
      slug: `ilike.${decodedSlug}`,
      limit: '1',
    }).catch(() => []);

    if (!notes || notes.length === 0) {
      notes = await queryTable('notes', '*', {
        id: `eq.${decodedSlug}`,
        limit: '1',
      }).catch(() => []);
    }

    if (notes && notes.length > 0) {
      const n = notes[0];

      // Enrich with college, university & subject names from Supabase
      let collegeName = null;
      let collegeUniversity = null;
      if (n.college_id) {
        const cList = await queryTable('colleges', 'name,university', { id: `eq.${n.college_id}` }).catch(() => []);
        if (cList && cList.length > 0) {
          collegeName = cList[0].name;
          collegeUniversity = cList[0].university;
        }
      }

      let subjectName = null;
      if (n.subject_id) {
        const sList = await queryTable('course_subjects', 'name,subject_code', { id: `eq.${n.subject_id}` }).catch(() => []);
        if (sList && sList.length > 0) {
          subjectName = sList[0].name;
        }
      }

      // Enrich with uploader profile if available
      let uploaderObj = n.uploader || null;
      if (!uploaderObj && n.uploader_id) {
        const uList = await queryTable('profiles', 'id,username,name,avatar_url,verified', { id: `eq.${n.uploader_id}` }).catch(() => []);
        if (uList && uList.length > 0) {
          uploaderObj = uList[0];
        } else {
          const uListUsers = await queryTable('users', 'id,username,name,avatar_url,is_verified', { id: `eq.${n.uploader_id}` }).catch(() => []);
          if (uListUsers && uListUsers.length > 0) {
            uploaderObj = uListUsers[0];
          }
        }
      }

      return {
        ...n,
        college_name: collegeName || n.college_name || "MVP's Karmaveer Ganpat Data More Art's Commerce And Science College Niphad 422303",
        college_university: collegeUniversity || n.college_university || 'Savitribai Phule Pune University',
        subject_name: subjectName || n.subject_name || 'Curriculum Subject',
        uploader: uploaderObj || { username: 'contributor', name: 'Verified Contributor' },
      };
    }
  } catch (err) {
    console.error(`Supabase load note ${slug} failed:`, err);
  }

  // 2. Fallback to API backend if available
  try {
    const res = await fetchApi(`/notes/resources/${slug}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {}

  if (slug === MOCK_NOTE.slug) return MOCK_NOTE;
  return null;
}

export default async function ResourceDetailPage({ params }) {
  const { resourceSlug } = await params;
  const note = await getNoteData(resourceSlug);

  if (!note) {
    notFound();
  }

  const currentUser = await getCurrentUser();
  const isOwner = currentUser && note.uploader && (
    (currentUser.id && note.uploader.id && currentUser.id === note.uploader.id) ||
    (currentUser.username && note.uploader.username && currentUser.username.toLowerCase() === note.uploader.username.toLowerCase())
  );
  const isAdmin = currentUser && currentUser.role === 'admin';
  const canEdit = isOwner || isAdmin;

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
    educationalAlignment: (note.college_name || note.college_university) ? {
      '@type': 'AlignmentObject',
      educationalFramework: 'Higher Education',
      targetName: note.college_name || note.college_university,
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
        .resource-page-wrapper {
          max-width: 1280px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }
        .resource-main-title {
          font-family: var(--font-display);
          font-size: clamp(20px, 2.4vw, 28px);
          font-weight: 700;
          color: var(--text);
          line-height: 1.35;
          margin: 0;
          word-break: break-word;
        }
        .resource-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 340px;
          gap: 28px;
          align-items: start;
        }
        .resource-sidebar {
          position: sticky;
          top: 90px;
          height: fit-content;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .meta-list {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          padding: 20px;
        }
        .meta-list-title {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 12px;
          color: var(--text);
          letter-spacing: -0.01em;
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid var(--border);
          font-size: 13px;
          gap: 12px;
        }
        .meta-row:last-child {
          border-bottom: none;
        }
        .meta-row-lbl {
          color: var(--sub);
          font-weight: 500;
          flex-shrink: 0;
        }
        .meta-row-val {
          color: var(--text);
          font-weight: 600;
          text-align: right;
          word-break: break-word;
        }
        .notes-desc-box {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          padding: 20px;
          margin-bottom: 24px;
        }

        @media (max-width: 1024px) {
          .resource-layout {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .resource-sidebar {
            position: static;
          }
        }
      `}</style>

      <div className="resource-page-wrapper">
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
          <span style={{ color: 'var(--green)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
            {note.title}
          </span>
        </div>

        {/* Title & Edit Area */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20, marginTop: 10 }}>
          <div>
            <h1 className="resource-main-title">
              {note.title}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--sub)', marginTop: 6 }}>
              Uploaded by <span style={{ color: 'var(--text)', fontWeight: 600 }}>{note.uploader?.name || note.uploader?.username}</span>
            </p>
          </div>
          {canEdit && (
            <Link 
              href={`/notes/resource/${note.slug}/edit`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(16, 185, 129, 0.1)',
                color: 'var(--green)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                padding: '8px 16px',
                borderRadius: 'var(--r-md)',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Edit Resource
            </Link>
          )}
        </div>

        <div className="resource-layout">
          {/* Main/Left: File previewer */}
          <div style={{ minWidth: 0 }}>
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
          <div className="resource-sidebar">
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

              {note.college_university && (
                <div className="meta-row">
                  <span className="meta-row-lbl">University</span>
                  <span className="meta-row-val">{note.college_university}</span>
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
      </div>
    </>
  );
}
