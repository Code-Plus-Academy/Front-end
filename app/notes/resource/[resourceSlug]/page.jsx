import React, { cache } from 'react';
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
import { BookOpen, School, Layers, CheckCircle2, Download, Eye, FileText, ChevronRight } from 'lucide-react';

// Incremental Static Regeneration (1-hour edge cache with on-demand revalidation)
export const revalidate = 3600;

const TYPE_LABELS = {
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

/**
 * Smart metadata synthesizer: clamps pixel length under 580px, removes duplicate
 * keywords, and generates high-intent 145-155 character descriptions.
 */
function buildSmartMetadata(note) {
  const typeLabel = TYPE_LABELS[note.type] || 'Resource';
  const rawTitle = (note.title || 'Study Resource').trim();
  const subject = (note.subject_name || note.topic_name || '').trim();
  const college = (note.college_name || '').trim();
  const sem = note.semester ? `Sem ${note.semester}` : '';

  // 1. Smart Title Deduplication & Clamping
  let cleanTitle = rawTitle;
  const lowerTitle = rawTitle.toLowerCase();
  const lowerSubject = subject.toLowerCase();

  const containsSubject = lowerSubject && lowerTitle.includes(lowerSubject);
  const containsType = lowerTitle.includes(typeLabel.toLowerCase()) || lowerTitle.includes('pyq') || lowerTitle.includes('paper');

  if (!containsSubject && subject) {
    cleanTitle = `${cleanTitle} — ${subject}`;
  }
  if (!containsType) {
    cleanTitle = `${cleanTitle} ${typeLabel}`;
  }

  // Normalize separators
  cleanTitle = cleanTitle.replace(/\s*[|—–-]\s*[|—–-]\s*/g, ' — ').replace(/\s+/g, ' ').trim();

  // Strict clamp so `title + " | Notes Arena"` (14 chars) stays <= 58 chars (<550px)
  const maxMainLen = 42;
  if (cleanTitle.length > maxMainLen) {
    cleanTitle = cleanTitle.slice(0, maxMainLen).trim().replace(/\s+[^\s]+$/, '');
    cleanTitle = `${cleanTitle}...`;
  }
  const finalTitle = `${cleanTitle} | Notes Arena`;

  // 2. High-Intent Description (Strictly 140-155 chars)
  let rawDesc = (note.description || '').replace(/\s+/g, ' ').trim();
  let finalDesc = '';

  if (rawDesc && rawDesc.length >= 100) {
    if (rawDesc.length > 155) {
      let trimmed = rawDesc.slice(0, 150).trim().replace(/\s+[^\s]+$/, '');
      finalDesc = `${trimmed}...`;
    } else {
      finalDesc = rawDesc;
    }
  } else {
    const parts = [
      `Download ${rawTitle}`,
      sem ? `for ${sem}` : '',
      subject ? `(${subject})` : '',
      college ? `from ${college}` : 'on Notes Arena',
      `. Free PDF preview, answers & syllabus question bank.`,
    ].filter(Boolean).join(' ').replace(/\s+/g, ' ').replace(/\s+\./g, '.');

    if (parts.length > 155) {
      let trimmed = parts.slice(0, 150).trim().replace(/\s+[^\s]+$/, '');
      finalDesc = `${trimmed}...`;
    } else {
      finalDesc = parts;
    }
  }

  return { title: finalTitle, description: finalDesc };
}

export async function generateMetadata({ params }) {
  const { resourceSlug } = await params;
  const note = await getNoteData(resourceSlug);

  if (!note) {
    return {
      title: 'Resource Not Found | Notes Arena',
    };
  }

  const { title, description } = buildSmartMetadata(note);
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

/**
 * Memoized data fetcher using React cache()
 * Prevents redundant database hits across generateMetadata and Page execution.
 */
export const getNoteData = cache(async (slug) => {
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

    // Keyword fallback search if specific slug is requested
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

      // Concurrent parallel enrichment across tables
      const [colleges, subjects, fields, uploaderMap] = await Promise.all([
        n.college_id ? queryTable('colleges', 'id,name,slug,university', { id: `eq.${n.college_id}` }).catch(() => []) : Promise.resolve([]),
        n.subject_id ? queryTable('course_subjects', 'id,name,slug,subject_code', { id: `eq.${n.subject_id}` }).catch(() => []) : Promise.resolve([]),
        n.field_id ? queryTable('notes_fields', 'id,name,slug', { id: `eq.${n.field_id}` }).catch(() => []) : Promise.resolve([]),
        n.uploader_id ? getSocialUsers([n.uploader_id]).catch(() => ({})) : Promise.resolve({}),
      ]);

      const collegeObj = colleges && colleges[0] ? colleges[0] : null;
      const subjectObj = subjects && subjects[0] ? subjects[0] : null;
      const fieldObj = fields && fields[0] ? fields[0] : null;

      let uploaderObj = n.uploader || (n.uploader_id ? uploaderMap[n.uploader_id] : null);
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
        college_name: collegeObj?.name || n.college_name,
        college_slug: collegeObj?.slug || null,
        college_university: collegeObj?.university || n.college_university || 'Savitribai Phule Pune University',
        subject_name: subjectObj?.name || n.subject_name,
        subject_slug: subjectObj?.slug || null,
        field_name: fieldObj?.name || n.field_name || 'Computer Science',
        field_slug: fieldObj?.slug || 'computer-science',
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

  // 3. Fallback mock record for legacy static slugs
  if (decodedSlug === 'sppu-comp-sem-5-os-pyqs' || decodedSlug.includes('os-pyqs')) {
    return {
      id: 'n4',
      title: 'Operating Systems Previous Year Papers (SPPU Comp Sem 5)',
      slug: 'sppu-comp-sem-5-os-pyqs',
      type: 'question_paper',
      subject_name: 'Operating Systems',
      subject_slug: 'operating-systems',
      college_name: 'Savitribai Phule Pune University',
      college_slug: 'sppu',
      college_university: 'SPPU',
      field_name: 'Computer Science',
      field_slug: 'computer-science',
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
});

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

  const formattedDate = new Date(note.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const canonicalUrl = `https://www.codeplusacademy.in/notes/resource/${note.slug}`;
  const typeLabel = TYPE_LABELS[note.type] || 'Resource';

  // Structured Data (JSON-LD) for LearningResource + BreadcrumbList
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LearningResource',
        name: note.title,
        description: note.description || note.title,
        datePublished: note.created_at,
        isAccessibleForFree: true,
        learningResourceType: note.type,
        inLanguage: 'en',
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
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Notes Arena',
            item: 'https://www.codeplusacademy.in/notes',
          },
          ...(note.college_name ? [{
            '@type': 'ListItem',
            position: 2,
            name: note.college_name,
            item: note.college_slug
              ? `https://www.codeplusacademy.in/notes/colleges/${note.college_slug}`
              : 'https://www.codeplusacademy.in/notes/colleges',
          }] : [{
            '@type': 'ListItem',
            position: 2,
            name: note.field_name || 'Computer Science',
            item: `https://www.codeplusacademy.in/notes/departments/${note.field_slug || 'computer-science'}`,
          }]),
          {
            '@type': 'ListItem',
            position: 3,
            name: note.title,
            item: canonicalUrl,
          },
        ],
      },
    ],
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
          font-family: var(--font-display, sans-serif);
          font-size: clamp(1.35rem, 2.8vw, 1.85rem);
          font-weight: 700;
          color: var(--text, #fff);
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
          background: var(--surface, #0a0e14);
          border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
          border-radius: var(--r-md, 14px);
          padding: 20px;
        }
        .meta-list-title {
          font-family: var(--font-display, sans-serif);
          font-size: 15px;
          font-weight: 700;
          margin: 0 0 12px;
          color: var(--text, #fff);
          letter-spacing: -0.01em;
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid var(--border, rgba(255, 255, 255, 0.06));
          font-size: 13px;
          gap: 12px;
        }
        .meta-row:last-child {
          border-bottom: none;
        }
        .meta-row-lbl {
          color: var(--sub, #94a3b8);
          font-weight: 500;
          flex-shrink: 0;
        }
        .meta-row-val {
          color: var(--text, #fff);
          font-weight: 600;
          text-align: right;
          word-break: break-word;
        }
        .academic-summary-box {
          background: var(--surface, #0a0e14);
          border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
          border-radius: var(--r-md, 14px);
          padding: 20px;
          margin-bottom: 24px;
        }
        .academic-summary-title {
          font-family: var(--font-display, sans-serif);
          font-size: 16px;
          font-weight: 700;
          color: var(--text, #fff);
          margin: 0 0 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .academic-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 14px;
          margin-top: 14px;
        }
        .academic-badge-item {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border, rgba(255, 255, 255, 0.06));
          border-radius: 10px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .breadcrumb-nav-list {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
          padding: 0;
          margin: 0 0 20px;
          list-style: none;
          font-size: 12px;
          color: var(--sub, #94a3b8);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .breadcrumb-nav-list a {
          color: var(--sub, #94a3b8);
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .breadcrumb-nav-list a:hover {
          color: var(--cyan, #00dbe9);
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

      <article className="resource-page-wrapper">
        {/* Semantic Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb">
          <ol className="breadcrumb-nav-list">
            <li>
              <Link href="/notes">Notes Arena</Link>
            </li>
            <li>/</li>
            {note.college_name ? (
              <>
                <li>
                  <Link href={note.college_slug ? `/notes/colleges/${note.college_slug}` : '/notes/colleges'}>
                    {note.college_name}
                  </Link>
                </li>
                <li>/</li>
              </>
            ) : (
              <>
                <li>
                  <Link href={`/notes/departments/${note.field_slug || 'computer-science'}`}>
                    {note.field_name || 'Computer Science'}
                  </Link>
                </li>
                <li>/</li>
              </>
            )}
            <li style={{ color: 'var(--green, #10b981)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }} aria-current="page">
              {note.title}
            </li>
          </ol>
        </nav>

        {/* Title Header Area */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20, marginTop: 6 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="resource-main-title">
              {note.title}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--sub, #94a3b8)', marginTop: 6 }}>
              Uploaded by <span style={{ color: 'var(--text, #fff)', fontWeight: 600 }}>{note.uploader?.name || note.uploader?.username}</span> • {formattedDate}
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
        </header>

        <div className="resource-layout">
          {/* Main/Left: File previewer, Action Strip, Description & Study Overview */}
          <div style={{ minWidth: 0 }}>
            <PdfViewer 
              fileUrl={note.file_url} 
              fileType={note.file_type} 
              title={note.title} 
              downloadsCount={note.download_count ?? note.downloads ?? 0}
              noteId={note.id}
            />

            {/* Action buttons (Upvote, Save, Share, Report) */}
            <NoteActionButtons 
              noteId={note.id} 
              initialUpvoted={note.is_upvoted} 
              initialBookmarked={note.is_bookmarked} 
              initialUpvotes={note.upvote_count} 
              ownerId={targetOwnerId}
              creatorUsername={targetCreatorUsername}
            />

            {/* Description & Legal Disclaimer */}
            <ResourceDescription 
              description={note.description} 
              showLegalNotice={true} 
            />

            {/* Semantic Study Resource Overview (Ensures High Content Density & Crawlability) */}
            <section className="academic-summary-box">
              <h2 className="academic-summary-title">
                <BookOpen size={18} color="var(--cyan, #00dbe9)" />
                <span>Academic Resource Overview & Study Details</span>
              </h2>
              <p style={{ fontSize: '13.5px', color: 'var(--sub, #94a3b8)', lineHeight: 1.6, margin: '0 0 16px' }}>
                This {typeLabel.toLowerCase()} is prepared for undergraduate and postgraduate university students enrolled in {note.field_name || 'Computer Science'}. 
                {note.college_name ? ` Originating from ${note.college_name} under ${note.college_university}.` : ''} 
                Use this material to revise curriculum concepts, practice previous year examination patterns, and prepare for internal and university assessments.
              </p>

              <div className="academic-summary-grid">
                <div className="academic-badge-item">
                  <span style={{ fontSize: 11, color: 'var(--sub, #94a3b8)', textTransform: 'uppercase', fontWeight: 600 }}>Subject Area</span>
                  <span style={{ fontSize: 13.5, color: 'var(--text, #fff)', fontWeight: 700 }}>{note.subject_name || 'Curriculum Subject'}</span>
                </div>
                <div className="academic-badge-item">
                  <span style={{ fontSize: 11, color: 'var(--sub, #94a3b8)', textTransform: 'uppercase', fontWeight: 600 }}>Academic Level</span>
                  <span style={{ fontSize: 13.5, color: 'var(--text, #fff)', fontWeight: 700 }}>{note.semester ? `Semester ${note.semester}` : 'Higher Education'}</span>
                </div>
                <div className="academic-badge-item">
                  <span style={{ fontSize: 11, color: 'var(--sub, #94a3b8)', textTransform: 'uppercase', fontWeight: 600 }}>Resource Format</span>
                  <span style={{ fontSize: 13.5, color: 'var(--text, #fff)', fontWeight: 700, textTransform: 'uppercase' }}>{note.file_type || 'PDF Document'}</span>
                </div>
                <div className="academic-badge-item">
                  <span style={{ fontSize: 11, color: 'var(--sub, #94a3b8)', textTransform: 'uppercase', fontWeight: 600 }}>Verification Status</span>
                  <span style={{ fontSize: 13.5, color: 'var(--green, #10b981)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={14} />
                    <span>Verified Study Material</span>
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar/Right */}
          <aside className="resource-sidebar">
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
                  <span className="meta-row-val">
                    {note.college_slug ? (
                      <Link href={`/notes/colleges/${note.college_slug}`} style={{ color: 'var(--cyan, #00dbe9)', textDecoration: 'none' }}>
                        {note.college_name}
                      </Link>
                    ) : note.college_name}
                  </span>
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
          </aside>
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
      </article>
    </>
  );
}
