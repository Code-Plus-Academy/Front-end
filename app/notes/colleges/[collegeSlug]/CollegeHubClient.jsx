'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

const TYPE_FILTERS = [
  { label: 'All Types', value: 'all', icon: 'apps' },
  { label: 'Class Notes', value: 'notes', icon: 'description' },
  { label: 'PYQs / Exam Papers', value: 'question_paper', icon: 'quiz' },
  { label: 'Reference Books', value: 'book', icon: 'menu_book' },
  { label: 'Lab Manuals', value: 'lab_manual', icon: 'science' },
  { label: 'Cheatsheets', value: 'cheatsheet', icon: 'bolt' },
];

const SEMESTER_FILTERS = [
  { label: 'All Semesters', value: 'all' },
  { label: 'Sem 1', value: '1' },
  { label: 'Sem 2', value: '2' },
  { label: 'Sem 3', value: '3' },
  { label: 'Sem 4', value: '4' },
  { label: 'Sem 5', value: '5' },
  { label: 'Sem 6', value: '6' },
  { label: 'Sem 7', value: '7' },
  { label: 'Sem 8', value: '8' },
];

function isImage(fileType = '') {
  return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileType.toLowerCase());
}

export default function CollegeHubClient({ college, university, courses, notes, initialTab = 'notes' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSem, setSelectedSem] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Count metrics
  const pyqNotes = useMemo(() => notes.filter((n) => n.type === 'question_paper'), [notes]);
  const classNotes = useMemo(() => notes.filter((n) => n.type === 'notes'), [notes]);
  const totalUpvotes = useMemo(() => notes.reduce((sum, n) => sum + (n.upvote_count || 0), 0), [notes]);

  // Filtered Notes for Study Material tab
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      // If on PYQ tab, default to question_paper unless overridden
      if (activeTab === 'pyqs' && n.type !== 'question_paper') {
        return false;
      }
      if (activeTab === 'notes' && selectedType !== 'all' && n.type !== selectedType) {
        return false;
      }
      if (selectedSem !== 'all' && String(n.semester) !== selectedSem) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = n.title && n.title.toLowerCase().includes(q);
        if (!titleMatch) return false;
      }
      return true;
    });
  }, [notes, activeTab, selectedType, selectedSem, searchQuery]);

  return (
    <div className="college-hub-container">
      <style>{`
        .college-hub-container {
          width: 100%;
        }
        .ch-breadcrumb {
          display: flex;
          gap: 6px;
          font-size: 12px;
          color: var(--sub);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 20px;
          flex-wrap: wrap;
          align-items: center;
        }
        .ch-breadcrumb a { color: var(--sub); text-decoration: none; }
        .ch-breadcrumb a:hover { color: var(--green); }

        /* YouTube Channel Hero Header */
        .ch-hero {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-lg, 16px);
          padding: 28px;
          margin-bottom: 24px;
          box-shadow: var(--shadow-card, 0 2px 8px rgba(0,0,0,0.04));
        }
        .ch-hero-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .ch-hero-identity {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .ch-avatar {
          width: 72px;
          height: 72px;
          border-radius: 16px;
          object-fit: cover;
          border: 2px solid var(--green);
          background: var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--green);
          font-size: 36px;
          flex-shrink: 0;
        }
        .ch-title {
          font-family: var(--font-display);
          font-size: clamp(20px, 3.5vw, 28px);
          font-weight: 700;
          color: var(--text);
          margin: 0 0 6px;
          line-height: 1.3;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .ch-verified-icon {
          color: var(--green);
          font-size: 22px;
          vertical-align: middle;
        }
        .ch-meta-row {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
          color: var(--sub);
          flex-wrap: wrap;
        }
        .ch-meta-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .ch-uni-link {
          color: var(--green);
          text-decoration: none;
          font-weight: 600;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 20px;
          padding: 2px 10px;
          font-size: 12px;
        }
        .ch-uni-link:hover {
          text-decoration: underline;
        }

        /* Action Buttons */
        .ch-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }
        .ch-btn-upload {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--green);
          color: #000;
          font-size: 13px;
          font-weight: 700;
          padding: 8px 18px;
          border-radius: var(--r-md, 10px);
          text-decoration: none;
          transition: opacity 0.18s;
          white-space: nowrap;
        }
        .ch-btn-upload:hover { opacity: 0.88; }
        .ch-btn-pyq {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--bg);
          color: var(--text);
          border: 1px solid var(--border);
          font-size: 13px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: var(--r-md, 10px);
          text-decoration: none;
          transition: all 0.18s;
          white-space: nowrap;
        }
        .ch-btn-pyq:hover { border-color: var(--green); color: var(--green); }

        /* Stats Strip */
        .ch-stats-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          border-top: 1px solid var(--border);
          padding-top: 16px;
          margin-top: 8px;
        }
        .ch-stat-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 5px 14px;
        }
        .ch-stat-chip .material-symbols-rounded {
          font-size: 16px;
          color: var(--green);
        }

        /* YouTube Channel Tabs */
        .ch-tabs-bar {
          display: flex;
          gap: 8px;
          border-bottom: 2px solid var(--border);
          margin-bottom: 24px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .ch-tabs-bar::-webkit-scrollbar { display: none; }
        .ch-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 18px;
          font-size: 14px;
          font-weight: 700;
          color: var(--sub);
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          margin-bottom: -2px;
          cursor: pointer;
          transition: all 0.18s ease;
          white-space: nowrap;
        }
        .ch-tab-btn:hover { color: var(--text); }
        .ch-tab-btn.active {
          color: var(--green);
          border-bottom-color: var(--green);
        }
        .ch-tab-badge {
          font-size: 11px;
          font-weight: 700;
          background: rgba(16, 185, 129, 0.1);
          color: var(--green);
          border-radius: 12px;
          padding: 1px 8px;
        }

        /* Filter Section */
        .ch-filters-section {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md, 12px);
          padding: 18px;
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .ch-search-wrapper {
          position: relative;
        }
        .ch-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 18px;
          color: var(--sub);
        }
        .ch-search-input {
          width: 100%;
          padding: 10px 14px 10px 38px;
          border-radius: var(--r-md, 10px);
          border: 1px solid var(--border);
          background: var(--bg);
          color: var(--text);
          font-size: 14px;
          outline: none;
          transition: border-color 0.18s;
        }
        .ch-search-input:focus { border-color: var(--green); }

        /* Chips */
        .chip-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--sub);
          margin-bottom: 6px;
        }
        .chip-bar {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }
        .chip-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 20px;
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--sub);
          cursor: pointer;
          transition: all 0.18s ease;
          white-space: nowrap;
        }
        .chip-btn:hover { border-color: var(--green); color: var(--text); }
        .chip-btn.active {
          background: rgba(16, 185, 129, 0.12);
          border-color: var(--green);
          color: var(--green);
          font-weight: 700;
        }
        .chip-btn .material-symbols-rounded { font-size: 15px; }

        /* Material Cards Grid */
        .mat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
          gap: 16px;
        }
        .mat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md, 12px);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .mat-card:hover {
          border-color: var(--green);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.08);
        }
        .mat-card-thumb {
          width: 100%;
          height: 135px;
          object-fit: cover;
          display: block;
          background: var(--bg);
          border-bottom: 1px solid var(--border);
        }
        .mat-card-thumb-placeholder {
          width: 100%;
          height: 135px;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(0, 180, 216, 0.04) 100%);
          border-bottom: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          position: relative;
        }
        .mat-placeholder-icon-box {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: var(--surface);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--green);
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .mat-placeholder-icon-box .material-symbols-rounded {
          font-size: 22px;
        }
        .mat-placeholder-tag {
          font-size: 10px;
          font-weight: 700;
          color: var(--sub);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .mat-card-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }
        .mat-badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          align-items: center;
        }
        .badge-type {
          font-size: 10px;
          font-weight: 700;
          background: rgba(16, 185, 129, 0.1);
          color: var(--green);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: 20px;
          padding: 2px 8px;
          text-transform: uppercase;
        }
        .badge-sem {
          font-size: 10px;
          font-weight: 700;
          background: var(--bg);
          color: var(--sub);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 2px 8px;
        }
        .mat-title {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--text);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .mat-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          border-top: 1px solid var(--border);
          background: var(--bg);
        }
        .mat-view-link {
          font-size: 12px;
          font-weight: 600;
          color: var(--green);
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .mat-download-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text);
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 4px 8px;
          text-decoration: none;
          transition: all 0.15s;
        }
        .mat-download-btn:hover { border-color: var(--green); color: var(--green); }

        /* Courses Grid */
        .courses-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .course-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md, 12px);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .course-card:hover {
          border-color: var(--green);
          transform: translateY(-2px);
        }
        .course-card-title {
          font-size: 15.5px;
          font-weight: 700;
          color: var(--text);
        }
        .course-card-meta {
          font-size: 12px;
          color: var(--sub);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* About Box */
        .about-box {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md, 12px);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .about-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .about-icon {
          font-size: 20px;
          color: var(--green);
          flex-shrink: 0;
          margin-top: 2px;
        }
        .about-content-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--sub);
          margin-bottom: 2px;
        }
        .about-content-val {
          font-size: 14px;
          color: var(--text);
          line-height: 1.5;
        }

        /* Empty State Box */
        .empty-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 64px 20px;
          background: var(--surface);
          border: 1px dashed var(--border);
          border-radius: var(--r-md, 12px);
          color: var(--sub);
          gap: 10px;
        }
        .empty-box-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text);
        }

        @media (max-width: 640px) {
          .ch-hero { padding: 20px; }
          .ch-hero-identity { flex-direction: column; text-align: center; }
          .ch-title { justify-content: center; }
          .ch-meta-row { justify-content: center; }
          .ch-actions { justify-content: center; width: 100%; }
          .mat-grid, .courses-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Breadcrumb */}
      <nav className="ch-breadcrumb" aria-label="Breadcrumb">
        <Link href="/notes">Notes</Link>
        <span>/</span>
        <Link href="/notes/colleges">Colleges</Link>
        <span>/</span>
        <span style={{ color: 'var(--text)' }}>{college.name}</span>
      </nav>

      {/* YouTube Channel Hero Header */}
      <header className="ch-hero">
        <div className="ch-hero-top">
          <div className="ch-hero-identity">
            {college.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={college.logo_url} alt={college.name} className="ch-avatar" />
            ) : (
              <div className="ch-avatar">
                <span className="material-symbols-rounded">school</span>
              </div>
            )}

            <div>
              <h1 className="ch-title">
                <span>{college.name}</span>
                {college.verified && (
                  <span className="material-symbols-rounded ch-verified-icon" title="Verified College">
                    verified
                  </span>
                )}
              </h1>

              <div className="ch-meta-row">
                {college.location && (
                  <span className="ch-meta-tag">
                    <span className="material-symbols-rounded" style={{ fontSize: 15 }}>location_on</span>
                    {college.location}
                  </span>
                )}
                {university && (
                  <Link href={`/notes/university/${university.slug}`} className="ch-uni-link">
                    Affiliated with {university.short_name || university.name}
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="ch-actions">
            <Link href={`/notes/upload?collegeId=${college.id}`} className="ch-btn-upload">
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>upload_file</span>
              Upload Notes
            </Link>
            {university && (
              <Link href={`/notes/university/${university.slug}/pyq`} className="ch-btn-pyq">
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>quiz</span>
                View University PYQs
              </Link>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="ch-stats-row">
          <span className="ch-stat-chip">
            <span className="material-symbols-rounded">auto_stories</span>
            {courses.length} {courses.length === 1 ? 'Course' : 'Courses'} Offered
          </span>
          <span className="ch-stat-chip">
            <span className="material-symbols-rounded">description</span>
            {classNotes.length} Class Notes
          </span>
          <span className="ch-stat-chip">
            <span className="material-symbols-rounded">quiz</span>
            {pyqNotes.length} Question Papers (PYQs)
          </span>
          <span className="ch-stat-chip">
            <span className="material-symbols-rounded">thumb_up</span>
            {totalUpvotes} Upvotes
          </span>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="ch-tabs-bar">
        <button
          type="button"
          className={`ch-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>folder</span>
          Study Material & Class Notes
          <span className="ch-tab-badge">{notes.length}</span>
        </button>

        <button
          type="button"
          className={`ch-tab-btn ${activeTab === 'pyqs' ? 'active' : ''}`}
          onClick={() => setActiveTab('pyqs')}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>quiz</span>
          Question Papers (PYQs)
          <span className="ch-tab-badge">{pyqNotes.length}</span>
        </button>

        <button
          type="button"
          className={`ch-tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>school</span>
          Offered Courses & Syllabus
          <span className="ch-tab-badge">{courses.length}</span>
        </button>

        <button
          type="button"
          className={`ch-tab-btn ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>info</span>
          About & Campus
        </button>
      </div>

      {/* TAB 1 & 2: Study Material & PYQs */}
      {(activeTab === 'notes' || activeTab === 'pyqs') && (
        <div>
          {/* Filters Bar */}
          <div className="ch-filters-section">
            <div className="ch-search-wrapper">
              <span className="material-symbols-rounded ch-search-icon">search</span>
              <input
                type="text"
                className="ch-search-input"
                placeholder="Search class notes, subject, lab manual, or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Type Chips (shown on Study Material tab) */}
            {activeTab === 'notes' && (
              <div>
                <div className="chip-label">Filter by Resource Type</div>
                <div className="chip-bar">
                  {TYPE_FILTERS.map((tf) => (
                    <button
                      key={tf.value}
                      type="button"
                      className={`chip-btn ${selectedType === tf.value ? 'active' : ''}`}
                      onClick={() => setSelectedType(tf.value)}
                    >
                      <span className="material-symbols-rounded">{tf.icon}</span>
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Semester Chips */}
            <div>
              <div className="chip-label">Filter by Semester</div>
              <div className="chip-bar">
                {SEMESTER_FILTERS.map((sf) => (
                  <button
                    key={sf.value}
                    type="button"
                    className={`chip-btn ${selectedSem === sf.value ? 'active' : ''}`}
                    onClick={() => setSelectedSem(sf.value)}
                  >
                    {sf.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content Cards */}
          {filteredNotes.length === 0 ? (
            <div className="empty-box">
              <span className="material-symbols-rounded" style={{ fontSize: 44 }}>folder_open</span>
              <div className="empty-box-title">No Resources Found</div>
              <p style={{ fontSize: 13, margin: 0 }}>
                No study material matches your selected type or semester filters.
              </p>
              <Link href={`/notes/upload?collegeId=${college.id}`} className="ch-btn-upload" style={{ marginTop: 8 }}>
                Be the First to Upload Notes →
              </Link>
            </div>
          ) : (
            <div className="mat-grid">
              {filteredNotes.map((note) => (
                <article key={note.id} className="mat-card">
                  {isImage(note.file_type || '') && note.file_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={note.file_url}
                      alt={note.title}
                      className="mat-card-thumb"
                      loading="lazy"
                    />
                  ) : (
                    <div className="mat-card-thumb-placeholder">
                      <div className="mat-placeholder-icon-box">
                        <span className="material-symbols-rounded">
                          {note.type === 'question_paper'
                            ? 'quiz'
                            : note.type === 'book'
                            ? 'menu_book'
                            : note.type === 'lab_manual'
                            ? 'science'
                            : 'description'}
                        </span>
                      </div>
                      <span className="mat-placeholder-tag">
                        {(note.file_type || 'PDF').toUpperCase()} DOCUMENT
                      </span>
                    </div>
                  )}

                  <div className="mat-card-body">
                    <div className="mat-badges">
                      <span className="badge-type">
                        {note.type === 'question_paper'
                          ? 'PYQ'
                          : note.type === 'lab_manual'
                          ? 'Lab Manual'
                          : note.type === 'book'
                          ? 'Book'
                          : note.type === 'cheatsheet'
                          ? 'Cheatsheet'
                          : 'Notes'}
                      </span>
                      {note.semester != null && <span className="badge-sem">Sem {note.semester}</span>}
                      {note.file_type && <span className="badge-sem">{note.file_type.toUpperCase()}</span>}
                    </div>

                    <Link href={`/notes/resource/${note.slug}`} className="mat-title" style={{ textDecoration: 'none' }}>
                      {note.title}
                    </Link>
                  </div>

                  <div className="mat-card-footer">
                    <Link href={`/notes/resource/${note.slug}`} className="mat-view-link" style={{ textDecoration: 'none' }}>
                      View Resource
                      <span className="material-symbols-rounded" style={{ fontSize: 14 }}>chevron_right</span>
                    </Link>
                    {note.file_url && (
                      <a href={note.file_url} target="_blank" rel="noopener noreferrer" className="mat-download-btn" download>
                        <span className="material-symbols-rounded" style={{ fontSize: 13 }}>download</span>
                        Download
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Offered Courses & Curriculum */}
      {activeTab === 'courses' && (
        <div>
          {courses.length === 0 ? (
            <div className="empty-box">
              <span className="material-symbols-rounded" style={{ fontSize: 44 }}>school</span>
              <div className="empty-box-title">No Courses Indexed</div>
              <p style={{ fontSize: 13, margin: 0 }}>
                No courses are indexed for this college yet.
              </p>
            </div>
          ) : (
            <div className="courses-grid">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/notes/colleges/${college.slug}/${course.slug}`}
                  className="course-card"
                >
                  <div className="course-card-title">{course.name}</div>
                  <div className="course-card-meta">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 15, color: 'var(--green)' }}>schedule</span>
                      {course.duration_years ? `${course.duration_years} Years (${course.duration_years * 2} Semesters)` : '3 Years'}
                    </span>
                  </div>
                  {course.description && (
                    <p style={{ fontSize: 13, color: 'var(--sub)', margin: 0, lineHeight: 1.45 }}>
                      {course.description}
                    </p>
                  )}
                  <div style={{ marginTop: 4, fontSize: 12, fontWeight: 700, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 2 }}>
                    Explore Semesters & Subjects
                    <span className="material-symbols-rounded" style={{ fontSize: 15 }}>chevron_right</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: About & Campus Info */}
      {activeTab === 'about' && (
        <div className="about-box">
          <div className="about-row">
            <span className="material-symbols-rounded about-icon">school</span>
            <div>
              <div className="about-content-label">College Name</div>
              <div className="about-content-val" style={{ fontWeight: 700 }}>
                {college.name}
              </div>
            </div>
          </div>

          {university && (
            <div className="about-row">
              <span className="material-symbols-rounded about-icon">account_balance</span>
              <div>
                <div className="about-content-label">Affiliated University</div>
                <div className="about-content-val">
                  <Link href={`/notes/university/${university.slug}`} style={{ color: 'var(--green)', textDecoration: 'none', fontWeight: 600 }}>
                    {university.name} ({university.short_name || 'University'})
                  </Link>
                </div>
              </div>
            </div>
          )}

          {college.location && (
            <div className="about-row">
              <span className="material-symbols-rounded about-icon">location_on</span>
              <div>
                <div className="about-content-label">Location / City</div>
                <div className="about-content-val">{college.location}</div>
              </div>
            </div>
          )}

          {college.website && (
            <div className="about-row">
              <span className="material-symbols-rounded about-icon">language</span>
              <div>
                <div className="about-content-label">Official Website</div>
                <div className="about-content-val">
                  <a href={college.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green)' }}>
                    {college.website} ↗
                  </a>
                </div>
              </div>
            </div>
          )}

          <div className="about-row">
            <span className="material-symbols-rounded about-icon">verified_user</span>
            <div>
              <div className="about-content-label">Verification Status</div>
              <div className="about-content-val">
                {college.verified ? 'Verified College Partner' : 'Community Indexed College'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
