'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

const TYPE_FILTERS = [
  { label: 'All Types', value: 'all', icon: 'apps' },
  { label: 'PYQs / Exam Papers', value: 'question_paper', icon: 'quiz' },
  { label: 'Class Notes', value: 'notes', icon: 'description' },
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

export default function UniversityHubClient({ university, colleges, courses, notes, initialTab = 'colleges' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSem, setSelectedSem] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [collegeSearch, setCollegeSearch] = useState('');

  // Filtered Colleges
  const filteredColleges = useMemo(() => {
    if (!collegeSearch.trim()) return colleges;
    const q = collegeSearch.toLowerCase().trim();
    return colleges.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.location && c.location.toLowerCase().includes(q))
    );
  }, [colleges, collegeSearch]);

  // Filtered Notes/Resources
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      // Type filter
      if (selectedType !== 'all' && n.type !== selectedType) {
        return false;
      }
      // Semester filter
      if (selectedSem !== 'all' && String(n.semester) !== selectedSem) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = n.title && n.title.toLowerCase().includes(q);
        const colMatch = n._collegeName && n._collegeName.toLowerCase().includes(q);
        if (!titleMatch && !colMatch) return false;
      }
      return true;
    });
  }, [notes, selectedType, selectedSem, searchQuery]);

  // Count PYQs vs Notes
  const pyqCount = useMemo(() => notes.filter((n) => n.type === 'question_paper').length, [notes]);
  const notesCount = useMemo(() => notes.filter((n) => n.type === 'notes').length, [notes]);
  const booksCount = useMemo(() => notes.filter((n) => n.type === 'book').length, [notes]);

  return (
    <div className="uni-hub-container">
      <style>{`
        .uni-hub-container {
          width: 100%;
        }
        .uni-breadcrumb {
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
        .uni-breadcrumb a { color: var(--sub); text-decoration: none; }
        .uni-breadcrumb a:hover { color: var(--green); }

        /* Header Hero */
        .uni-hero {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-lg, 16px);
          padding: 28px;
          margin-bottom: 28px;
          box-shadow: var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.04));
        }
        .uni-hero-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .uni-hero-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .uni-hero-icon {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
          color: var(--green);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          flex-shrink: 0;
        }
        .uni-hero-title {
          font-family: var(--font-display);
          font-size: clamp(22px, 3.5vw, 32px);
          font-weight: 700;
          color: var(--text);
          margin: 0 0 4px;
          line-height: 1.25;
        }
        .uni-hero-badge {
          display: inline-flex;
          align-items: center;
          font-size: 11px;
          font-weight: 700;
          background: var(--bg);
          color: var(--green);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 20px;
          padding: 2px 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-left: 8px;
        }
        .uni-hero-stats {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 14px;
        }
        .uni-stat-pill {
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
        .uni-stat-pill .material-symbols-rounded {
          font-size: 16px;
          color: var(--green);
        }

        /* Tabs Bar */
        .uni-tabs-bar {
          display: flex;
          gap: 8px;
          border-bottom: 2px solid var(--border);
          margin-bottom: 24px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .uni-tabs-bar::-webkit-scrollbar { display: none; }
        .uni-tab-btn {
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
        .uni-tab-btn:hover {
          color: var(--text);
        }
        .uni-tab-btn.active {
          color: var(--green);
          border-bottom-color: var(--green);
        }
        .uni-tab-badge {
          font-size: 11px;
          font-weight: 700;
          background: rgba(16, 185, 129, 0.1);
          color: var(--green);
          border-radius: 12px;
          padding: 1px 8px;
        }

        /* Filters Section */
        .uni-filters-section {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md, 12px);
          padding: 18px;
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .uni-search-input {
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
        .uni-search-input:focus {
          border-color: var(--green);
        }
        .uni-search-wrapper {
          position: relative;
        }
        .uni-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 18px;
          color: var(--sub);
        }

        /* Chip Bars */
        .chip-group-label {
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
        .chip-btn:hover {
          border-color: var(--green);
          color: var(--text);
        }
        .chip-btn.active {
          background: rgba(16, 185, 129, 0.12);
          border-color: var(--green);
          color: var(--green);
          font-weight: 700;
        }
        .chip-btn .material-symbols-rounded {
          font-size: 15px;
        }

        /* Grids */
        .college-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
        }
        .college-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md, 12px);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .college-card:hover {
          border-color: var(--green);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.08);
        }
        .college-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
        }
        .college-card-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
          line-height: 1.4;
          flex: 1;
        }
        .college-verified {
          font-size: 16px;
          color: var(--green);
          flex-shrink: 0;
        }
        .college-location {
          font-size: 12px;
          color: var(--sub);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .college-actions {
          display: flex;
          gap: 8px;
          margin-top: 6px;
          flex-wrap: wrap;
        }
        .college-btn-notes {
          font-size: 12px;
          font-weight: 600;
          color: var(--green);
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .college-btn-pyq {
          font-size: 11px;
          font-weight: 600;
          color: var(--sub);
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 2px 8px;
          text-decoration: none;
          transition: all 0.15s;
        }
        .college-btn-pyq:hover {
          border-color: var(--green);
          color: var(--green);
        }

        /* Material Notes Grid */
        .material-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
          gap: 16px;
        }
        .material-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md, 12px);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .material-card:hover {
          border-color: var(--green);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.08);
        }
        .material-card-thumb {
          width: 100%;
          height: 135px;
          object-fit: cover;
          display: block;
          background: var(--bg);
          border-bottom: 1px solid var(--border);
        }
        .material-card-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }
        .material-badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          align-items: center;
        }
        .mat-type-badge {
          font-size: 10px;
          font-weight: 700;
          background: rgba(16, 185, 129, 0.1);
          color: var(--green);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: 20px;
          padding: 2px 8px;
          text-transform: uppercase;
        }
        .mat-sem-badge {
          font-size: 10px;
          font-weight: 700;
          background: var(--bg);
          color: var(--sub);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 2px 8px;
        }
        .material-title {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--text);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .material-college {
          font-size: 11.5px;
          color: var(--sub);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .material-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          border-top: 1px solid var(--border);
          background: var(--bg);
        }
        .mat-action-link {
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
        .mat-download-btn:hover {
          border-color: var(--green);
          color: var(--green);
        }

        /* Courses List */
        .courses-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
        }
        .course-card:hover {
          border-color: var(--green);
        }
        .course-card-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text);
        }
        .course-card-meta {
          font-size: 12px;
          color: var(--sub);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* Empty State */
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
          .uni-hero { padding: 20px; }
          .college-grid, .material-grid, .courses-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Breadcrumb */}
      <nav className="uni-breadcrumb" aria-label="Breadcrumb">
        <Link href="/notes">Notes</Link>
        <span>/</span>
        <Link href="/notes/university">Universities</Link>
        <span>/</span>
        <span style={{ color: 'var(--text)' }}>{university.name}</span>
      </nav>

      {/* University Hero Header */}
      <header className="uni-hero">
        <div className="uni-hero-header">
          <div className="uni-hero-left">
            <div className="uni-hero-icon">
              <span className="material-symbols-rounded">account_balance</span>
            </div>
            <div>
              <h1 className="uni-hero-title">
                {university.name}
                {university.short_name && <span className="uni-hero-badge">{university.short_name}</span>}
              </h1>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--sub)' }}>
                Official University Portal — Affiliated Colleges, PYQs, Courses & Study Resources
              </p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="uni-hero-stats">
          <span className="uni-stat-pill">
            <span className="material-symbols-rounded">school</span>
            {colleges.length} {colleges.length === 1 ? 'College' : 'Colleges'}
          </span>
          <span className="uni-stat-pill">
            <span className="material-symbols-rounded">quiz</span>
            {pyqCount} Question Papers (PYQs)
          </span>
          <span className="uni-stat-pill">
            <span className="material-symbols-rounded">description</span>
            {notesCount} Class Notes
          </span>
          <span className="uni-stat-pill">
            <span className="material-symbols-rounded">menu_book</span>
            {courses.length > 0 ? `${courses.length} Courses` : `${booksCount} Books`}
          </span>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="uni-tabs-bar">
        <button
          type="button"
          className={`uni-tab-btn ${activeTab === 'colleges' ? 'active' : ''}`}
          onClick={() => setActiveTab('colleges')}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>school</span>
          Affiliated Colleges
          <span className="uni-tab-badge">{colleges.length}</span>
        </button>

        <button
          type="button"
          className={`uni-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>folder</span>
          Study Material & PYQs
          <span className="uni-tab-badge">{notes.length}</span>
        </button>

        <button
          type="button"
          className={`uni-tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>auto_stories</span>
          University Courses & Syllabus
          {courses.length > 0 && <span className="uni-tab-badge">{courses.length}</span>}
        </button>
      </div>

      {/* TAB 1: Affiliated Colleges */}
      {activeTab === 'colleges' && (
        <div>
          {colleges.length > 5 && (
            <div className="uni-search-wrapper" style={{ marginBottom: 18 }}>
              <span className="material-symbols-rounded uni-search-icon">search</span>
              <input
                type="text"
                className="uni-search-input"
                placeholder="Search college by name or location..."
                value={collegeSearch}
                onChange={(e) => setCollegeSearch(e.target.value)}
              />
            </div>
          )}

          {filteredColleges.length === 0 ? (
            <div className="empty-box">
              <span className="material-symbols-rounded" style={{ fontSize: 44 }}>school</span>
              <div className="empty-box-title">No Colleges Found</div>
              <p style={{ fontSize: 13, margin: 0 }}>
                {collegeSearch ? `No colleges matching "${collegeSearch}"` : `No colleges indexed under ${university.name} yet.`}
              </p>
            </div>
          ) : (
            <div className="college-grid">
              {filteredColleges.map((college) => (
                <Link
                  key={college.id}
                  href={`/notes/colleges/${college.slug}`}
                  className="college-card"
                >
                  <div className="college-card-header">
                    <div className="college-card-name">{college.name}</div>
                    {college.verified && (
                      <span className="material-symbols-rounded college-verified" title="Verified College">
                        verified
                      </span>
                    )}
                  </div>
                  {college.location && (
                    <div className="college-location">
                      <span className="material-symbols-rounded" style={{ fontSize: 13 }}>location_on</span>
                      {college.location}
                    </div>
                  )}
                  <div className="college-actions">
                    <span className="college-btn-notes">
                      Browse Notes
                      <span className="material-symbols-rounded" style={{ fontSize: 15 }}>chevron_right</span>
                    </span>
                    <Link
                      href={`/notes/university/${university.slug}/pyq`}
                      className="college-btn-pyq"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View PYQs
                    </Link>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Study Material & PYQs */}
      {activeTab === 'notes' && (
        <div>
          {/* Filters Bar */}
          <div className="uni-filters-section">
            <div className="uni-search-wrapper">
              <span className="material-symbols-rounded uni-search-icon">search</span>
              <input
                type="text"
                className="uni-search-input"
                placeholder="Search question papers, notes, books, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Type Chips */}
            <div>
              <div className="chip-group-label">Filter by Resource Type</div>
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

            {/* Semester Chips */}
            <div>
              <div className="chip-group-label">Filter by Semester</div>
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

          {/* Results Display */}
          {filteredNotes.length === 0 ? (
            <div className="empty-box">
              <span className="material-symbols-rounded" style={{ fontSize: 44 }}>folder_open</span>
              <div className="empty-box-title">No Material Found</div>
              <p style={{ fontSize: 13, margin: 0 }}>
                No resources match your selected filters. Try clearing type/semester filters.
              </p>
            </div>
          ) : (
            <div className="material-grid">
              {filteredNotes.map((note) => (
                <article key={note.id} className="material-card">
                  {isImage(note.file_type || '') && note.file_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={note.file_url}
                      alt={note.title}
                      className="material-card-thumb"
                      loading="lazy"
                    />
                  )}

                  <div className="material-card-body">
                    <div className="material-badges">
                      <span className="mat-type-badge">
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
                      {note.semester != null && <span className="mat-sem-badge">Sem {note.semester}</span>}
                      {note.file_type && <span className="mat-sem-badge">{note.file_type.toUpperCase()}</span>}
                    </div>

                    <Link href={`/notes/resource/${note.slug}`} className="material-title" style={{ textDecoration: 'none' }}>
                      {note.title}
                    </Link>

                    {note._collegeName && (
                      <div className="material-college">
                        <span className="material-symbols-rounded" style={{ fontSize: 13 }}>school</span>
                        {note._collegeName}
                      </div>
                    )}
                  </div>

                  <div className="material-footer">
                    <Link href={`/notes/resource/${note.slug}`} className="mat-action-link" style={{ textDecoration: 'none' }}>
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

      {/* TAB 3: University Courses & Syllabus */}
      {activeTab === 'courses' && (
        <div>
          {courses.length === 0 ? (
            <div className="empty-box">
              <span className="material-symbols-rounded" style={{ fontSize: 44 }}>auto_stories</span>
              <div className="empty-box-title">University Syllabus Index</div>
              <p style={{ fontSize: 13, margin: 0 }}>
                Explore official degree programs for {university.name}.
              </p>
              <Link
                href="/notes/pyq"
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  color: 'var(--green)',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Browse All Course Question Papers →
              </Link>
            </div>
          ) : (
            <div className="courses-grid">
              {courses.map((course) => (
                <div key={course.id} className="course-card">
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
                  <div style={{ marginTop: 4 }}>
                    <Link
                      href={`/notes/university/${university.slug}/pyq`}
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--green)',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      View Question Papers & Syllabus →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
