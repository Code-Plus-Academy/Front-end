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
      if (selectedType !== 'all' && n.type !== selectedType) {
        return false;
      }
      if (selectedSem !== 'all' && String(n.semester) !== selectedSem) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = n.title && n.title.toLowerCase().includes(q);
        const colMatch = n._collegeName && n._collegeName.toLowerCase().includes(q);
        if (!titleMatch && !colMatch) return false;
      }
      return true;
    });
  }, [notes, selectedType, selectedSem, searchQuery]);

  // Metrics
  const pyqCount = useMemo(() => notes.filter((n) => n.type === 'question_paper').length, [notes]);
  const notesCount = useMemo(() => notes.filter((n) => n.type === 'notes').length, [notes]);

  return (
    <div className="uni-portal-wrapper">
      <style>{`
        .uni-portal-wrapper {
          width: 100%;
          font-family: var(--font-body, Inter, sans-serif);
        }
        .uni-nav-crumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--sub);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .uni-nav-crumb a { color: var(--sub); text-decoration: none; }
        .uni-nav-crumb a:hover { color: var(--green); }

        /* Stitch Academic Hero Banner */
        .academic-hero {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-lg, 16px);
          padding: 24px 28px;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
        }
        .academic-hero-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .academic-hero-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .academic-hero-icon {
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
        .academic-hero-title {
          font-family: var(--font-display);
          font-size: clamp(22px, 3.5vw, 30px);
          font-weight: 700;
          color: var(--text);
          margin: 0 0 4px;
          line-height: 1.25;
        }
        .academic-hero-badge {
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
        .academic-hero-stats {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          border-top: 1px solid var(--border);
          padding-top: 14px;
          margin-top: 12px;
        }
        .academic-stat-chip {
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
        .academic-stat-chip .material-symbols-rounded {
          font-size: 16px;
          color: var(--green);
        }

        /* Stitch Tabs Navigation */
        .academic-tabs {
          display: flex;
          gap: 8px;
          border-bottom: 2px solid var(--border);
          margin-bottom: 20px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .academic-tabs::-webkit-scrollbar { display: none; }
        .academic-tab-btn {
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
        .academic-tab-btn:hover { color: var(--text); }
        .academic-tab-btn.active {
          color: var(--green);
          border-bottom-color: var(--green);
        }
        .academic-tab-badge {
          font-size: 11px;
          font-weight: 700;
          background: rgba(16, 185, 129, 0.1);
          color: var(--green);
          border-radius: 12px;
          padding: 1px 8px;
        }

        /* Filter Section */
        .academic-filters {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md, 12px);
          padding: 18px;
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .search-wrapper {
          position: relative;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 18px;
          color: var(--sub);
        }
        .search-input {
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
        .search-input:focus { border-color: var(--green); }

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
        .college-card-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
          line-height: 1.4;
        }
        .college-location {
          font-size: 12px;
          color: var(--sub);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* Material Resource Cards */
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
        .material-card-thumb-placeholder {
          width: 100%;
          height: 135px;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(0, 180, 216, 0.04) 100%);
          border-bottom: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .placeholder-icon-box {
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
        .placeholder-icon-box .material-symbols-rounded { font-size: 22px; }
        .placeholder-tag {
          font-size: 10px;
          font-weight: 700;
          color: var(--sub);
          letter-spacing: 0.06em;
          text-transform: uppercase;
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
        .mat-download-btn:hover { border-color: var(--green); color: var(--green); }

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
          .academic-hero { padding: 18px; }
          .academic-hero-left { flex-direction: column; align-items: flex-start; text-align: left; }
          .college-grid, .material-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Breadcrumb Navigation */}
      <nav className="uni-nav-crumb" aria-label="Breadcrumb">
        <Link href="/notes">Notes</Link>
        <span>/</span>
        <Link href="/notes/university">Universities</Link>
        <span>/</span>
        <span style={{ color: 'var(--text)' }}>{university.name}</span>
      </nav>

      {/* Academic Hero Banner */}
      <header className="academic-hero">
        <div className="academic-hero-header">
          <div className="academic-hero-left">
            <div className="academic-hero-icon">
              <span className="material-symbols-rounded">account_balance</span>
            </div>
            <div>
              <h1 className="academic-hero-title">
                {university.name}
                {university.short_name && <span className="academic-hero-badge">{university.short_name}</span>}
              </h1>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--sub)' }}>
                Official University Hub — Affiliated Colleges, PYQ Papers, Courses & Study Resources
              </p>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="academic-hero-stats">
          <span className="academic-stat-chip">
            <span className="material-symbols-rounded">school</span>
            {colleges.length} {colleges.length === 1 ? 'Affiliated College' : 'Affiliated Colleges'}
          </span>
          <span className="academic-stat-chip">
            <span className="material-symbols-rounded">quiz</span>
            {pyqCount} Question Papers (PYQs)
          </span>
          <span className="academic-stat-chip">
            <span className="material-symbols-rounded">description</span>
            {notesCount} Class Notes
          </span>
          <span className="academic-stat-chip">
            <span className="material-symbols-rounded">menu_book</span>
            {courses.length} Courses Offered
          </span>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="academic-tabs">
        <button
          type="button"
          className={`academic-tab-btn ${activeTab === 'colleges' ? 'active' : ''}`}
          onClick={() => setActiveTab('colleges')}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>school</span>
          Affiliated Colleges
          <span className="academic-tab-badge">{colleges.length}</span>
        </button>

        <button
          type="button"
          className={`academic-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>folder</span>
          Study Material & PYQs
          <span className="academic-tab-badge">{notes.length}</span>
        </button>

        <button
          type="button"
          className={`academic-tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>auto_stories</span>
          Courses & Syllabus
          {courses.length > 0 && <span className="academic-tab-badge">{courses.length}</span>}
        </button>
      </div>

      {/* TAB 1: Affiliated Colleges */}
      {activeTab === 'colleges' && (
        <div>
          {colleges.length > 5 && (
            <div className="search-wrapper" style={{ marginBottom: 16 }}>
              <span className="material-symbols-rounded search-icon">search</span>
              <input
                type="text"
                className="search-input"
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div className="college-card-name">{college.name}</div>
                    {college.verified && (
                      <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--green)', flexShrink: 0 }}>
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
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: wrap }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 2 }}>
                      Browse Notes
                      <span className="material-symbols-rounded" style={{ fontSize: 14 }}>chevron_right</span>
                    </span>
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
          <div className="academic-filters">
            <div className="search-wrapper">
              <span className="material-symbols-rounded search-icon">search</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search question papers, notes, books, or subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

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

          {filteredNotes.length === 0 ? (
            <div className="empty-box">
              <span className="material-symbols-rounded" style={{ fontSize: 44 }}>folder_open</span>
              <div className="empty-box-title">No Resources Found</div>
              <p style={{ fontSize: 13, margin: 0 }}>
                No resources match your selected filters. Try clearing type/semester filters.
              </p>
            </div>
          ) : (
            <div className="material-grid">
              {filteredNotes.map((note) => (
                <article key={note.id} className="material-card">
                  {isImage(note.file_type || '') && note.file_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={note.file_url}
                      alt={note.title}
                      className="material-card-thumb"
                      loading="lazy"
                    />
                  ) : (
                    <div className="material-card-thumb-placeholder">
                      <div className="placeholder-icon-box">
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
                      <span className="placeholder-tag">
                        {(note.file_type || 'PDF').toUpperCase()} DOCUMENT
                      </span>
                    </div>
                  )}

                  <div className="material-card-body">
                    <div className="material-badges">
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

                    <Link href={`/notes/resource/${note.slug}`} className="material-title" style={{ textDecoration: 'none' }}>
                      {note.title}
                    </Link>

                    {note._collegeName && (
                      <div style={{ fontSize: 11.5, color: 'var(--sub)', display: 'flex', alignItems: 'center', gap: 4 }}>
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

      {/* TAB 3: Courses & Syllabus */}
      {activeTab === 'courses' && (
        <div>
          {courses.length === 0 ? (
            <div className="empty-box">
              <span className="material-symbols-rounded" style={{ fontSize: 44 }}>auto_stories</span>
              <div className="empty-box-title">University Syllabus Index</div>
              <p style={{ fontSize: 13, margin: 0 }}>
                Explore official degree programs for {university.name}.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {courses.map((course) => (
                <div key={course.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--text)' }}>{course.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--sub)' }}>
                    Duration: {course.duration_years || 3} Years ({course.duration_years * 2 || 6} Semesters)
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
