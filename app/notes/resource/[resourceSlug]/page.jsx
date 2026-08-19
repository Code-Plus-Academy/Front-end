import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchApi, getCurrentUser } from '../../../../src/utils/notesApi';
import { queryTable, getSocialUsers } from '../../../../src/lib/supabaseContent';
import PublisherCard from '../../../../src/components/notes/PublisherCard';
import NoteActionButtons from '../../../../src/components/notes/NoteActionButtons';
import ContentActionMenu from '../../../../src/components/ui/ContentActionMenu';
import ResourceDescription from '../../../../src/components/notes/ResourceDescription';
import RelatedNotes, { BottomRelatedNotesGrid } from '../../../../src/components/notes/RelatedNotes';
import RemovedContentPage from '../../../../src/components/ui/RemovedContentPage';

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

async function getNoteData(slug) {
  if (!slug) return null;

  const decodedSlug = decodeURIComponent(slug).trim();

  // 1. Query Supabase notes table by slug or id
  try {
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

    // Keyword fallback search if specific dummy slug is requested (e.g. dbms, os)
    if (!notes || notes.length === 0) {
      if (decodedSlug.includes('dbms')) {
        notes = await queryTable('notes', '*', {
          title: 'ilike.%dbms%',
          limit: '1',
        }).catch(() => []);
      } else if (decodedSlug.includes('os') || decodedSlug.includes('operating')) {
        notes = await queryTable('notes', '*', {
          title: 'ilike.%operating%',
          limit: '1',
        }).catch(() => []);
      }
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

      let fieldName = null;
      if (n.field_id) {
        const fList = await queryTable('notes_fields', 'name', { id: `eq.${n.field_id}` }).catch(() => []);
        if (fList && fList.length > 0) {
          fieldName = fList[0].name;
        }
      }

      // Enrich with uploader profile from CPA Social DB
      let uploaderObj = n.uploader || null;
      if (!uploaderObj && n.uploader_id) {
        const uMap = await getSocialUsers([n.uploader_id]).catch(() => ({}));
        uploaderObj = uMap[n.uploader_id] || null;
      }

      if (!uploaderObj) {
        uploaderObj = {
          id: n.uploader_id || null,
          username: null,
          name: 'CPA Contributor',
          avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${n.uploader_id || 'contributor'}`,
          verified: false,
        };
      }

      return {
        ...n,
        college_name: collegeName || n.college_name,
        college_university: collegeUniversity || n.college_university || 'Savitribai Phule Pune University',
        subject_name: subjectName || n.subject_name,
        field_name: fieldName || n.field_name || 'Computer Science',
        uploader: uploaderObj,
      };
    }
  } catch (err) {
    console.error(`Supabase load note ${slug} failed:`, err);
  }

  // 2. Fallback to API backend if available
  try {
    const res = await fetchApi(`/notes/resources/${decodedSlug}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {}

  // 3. Predefined fallback note for sppu-comp-sem-5-os-pyqs and legacy mock resource URLs
  if (decodedSlug === 'sppu-comp-sem-5-os-pyqs' || decodedSlug.includes('os-pyqs')) {
    return {
      id: 'n4',
      title: 'Operating Systems Previous Year Papers (SPPU Comp Sem 5)',
      slug: 'sppu-comp-sem-5-os-pyqs',
      type: 'question_paper',
      subject_name: 'Operating Systems',
      college_name: 'Savitribai Phule Pune University',
      college_university: 'SPPU',
      field_name: 'Computer Science',
      semester: 5,
      upvote_count: 19,
      download_count: 75,
      created_at: new Date().toISOString(),
      uploader: {
        id: '11111111-1111-1111-1111-111111111111',
        username: 'amitp',
        name: 'Amit Patel',
        avatar_url: 'https://res.cloudinary.com/dw5aqjqur/image/upload/v1779995620/cpa/avatars/hyonbsm8ojekkds5fk9l.png',
        verified: true,
      },
      description: 'Download Operating Systems Previous Year Question Papers (PYQs) for SPPU Computer Science Semester 5.',
    };
  }

  return null;
}

export default async function ResourceDetailPage({ params }) {
  const { resourceSlug } = await params;
  const note = await getNoteData(resourceSlug);

  if (!note || ['removed', 'temporarily_removed', 'taken_down', 'suspended'].includes((note.moderation_status || '').toLowerCase()) || note.status === 'archived') {
    return (
      <RemovedContentPage
        title="Resource Removed"
        message="This study resource was taken down or removed for violating community guidelines or copyright policies."
        backUrl="/notes"
      />
    );
  }

  const currentUser = await getCurrentUser();
  const targetOwnerId = note.uploader_id || note.uploader?.id;
  const targetCreatorUsername = note.uploader_username || note.uploader?.username;
  const isOwner = Boolean(
    currentUser && (
      (currentUser.id && targetOwnerId && String(currentUser.id) === String(targetOwnerId)) ||
      (currentUser.user_id && targetOwnerId && String(currentUser.user_id) === String(targetOwnerId)) ||
      (currentUser.username && targetCreatorUsername && String(currentUser.username).toLowerCase() === String(targetCreatorUsername).toLowerCase())
    )
  );
  const isAdmin = Boolean(currentUser && currentUser.role === 'admin');
  const canEdit = Boolean(isOwner || isAdmin);

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
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="resource-main-title">
              {note.title}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--sub)', marginTop: 6 }}>
              Uploaded by <span style={{ color: 'var(--text)', fontWeight: 600 }}>{note.uploader?.name || note.uploader?.username}</span>
            </p>
          </div>
          <div style={{ flexShrink: 0 }}>
            <ContentActionMenu
              contentId={note.id}
              contentType="resource"
              editHref={`/notes/resource/${note.slug}/edit`}
              contentAuthorId={targetOwnerId}
              creatorUsername={targetCreatorUsername}
              contentUrl={canonicalUrl}
            />
          </div>
        </div>

        <div className="resource-layout">
          {/* Main/Left: File previewer, Action Strip & Description */}
          <div style={{ minWidth: 0 }}>
            <PdfViewer 
              fileUrl={note.file_url} 
              fileType={note.file_type} 
              title={note.title} 
              downloadsCount={note.download_count ?? note.downloads ?? 0}
              noteId={note.id}
            />

            {/* Action buttons (Upvote, Save, Share, Report) placed between Viewer and Description */}
            <NoteActionButtons 
              noteId={note.id} 
              initialUpvoted={note.is_upvoted} 
              initialBookmarked={note.is_bookmarked} 
              initialUpvotes={note.upvote_count} 
              ownerId={targetOwnerId}
              creatorUsername={targetCreatorUsername}
            />

            {/* Description & Integrated Legal Disclaimer (Clamped with Show More) */}
            <ResourceDescription 
              description={note.description} 
              showLegalNotice={true} 
            />
          </div>

          {/* Sidebar/Right */}
          <div className="resource-sidebar">
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
                <span className="meta-row-lbl">Downloads</span>
                <span className="meta-row-val">{note.download_count || 0}</span>
              </div>
            </div>

            {/* Related Notes (Sidebar) */}
            <RelatedNotes
              noteId={note.id}
              subjectId={note.subject_id}
              topicId={note.topic_id}
              fieldId={note.field_id}
              collegeId={note.college_id}
              semester={note.semester}
            />
          </div>
        </div>

        {/* Bottom Related & Recommended Notes Grid */}
        <BottomRelatedNotesGrid
          currentNoteId={note.id}
          subjectId={note.subject_id}
          topicId={note.topic_id}
          fieldId={note.field_id}
          collegeId={note.college_id}
          semester={note.semester}
        />
      </div>
    </>
  );
}
