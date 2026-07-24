'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

const YEAR_FILTERS = ['All Years', '2024', '2023', '2022', '2021'];

const SUBJECT_FILTERS = [
  'All Subjects',
  'Computer Science',
  'Microbiology',
  'Mathematics',
  'Physics',
];

const SEMESTER_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Sem 1', value: '1' },
  { label: 'Sem 2', value: '2' },
  { label: 'Sem 3', value: '3' },
  { label: 'Sem 4', value: '4' },
  { label: 'Sem 5', value: '5' },
  { label: 'Sem 6', value: '6' },
  { label: 'Sem 7', value: '7' },
  { label: 'Sem 8', value: '8' },
];

export default function CollegeHubClient({
  college,
  university,
  courses = [],
  notes = [],
  initialTab = 'notes',
}) {
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'about'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [selectedSem, setSelectedSem] = useState('all');

  const safeNotes = Array.isArray(notes) ? notes : [];
  const safeCourses = Array.isArray(courses) ? courses : [];

  // Counts
  const pyqCount = useMemo(
    () => safeNotes.filter((n) => n?.type === 'question_paper').length,
    [safeNotes]
  );
  const notesCount = useMemo(
    () => safeNotes.filter((n) => n?.type === 'notes').length,
    [safeNotes]
  );

  // Filtered Notes list
  const filteredNotes = useMemo(() => {
    return safeNotes.filter((n) => {
      if (selectedSem !== 'all' && String(n.semester) !== selectedSem) return false;

      if (selectedYear !== 'All Years') {
        const createdYear = n.created_at ? new Date(n.created_at).getFullYear().toString() : '';
        if (createdYear !== selectedYear && !n.title?.includes(selectedYear)) {
          return false;
        }
      }

      if (selectedSubject !== 'All Subjects') {
        const sub = (n.subject_name || '').toLowerCase();
        if (!sub.includes(selectedSubject.toLowerCase())) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = n.title && n.title.toLowerCase().includes(q);
        const subMatch = n.subject_name && n.subject_name.toLowerCase().includes(q);
        if (!titleMatch && !subMatch) return false;
      }
      return true;
    });
  }, [safeNotes, selectedSem, selectedYear, selectedSubject, searchQuery]);

  const copyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const uniName = college.university || university?.name || 'Savitribai Phule Pune University (SPPU)';

  return (
    <div className="col-redesign-container">
      <style>{`
        .col-redesign-container {
          width: 100%;
          font-family: var(--font-body, Inter, system-ui, sans-serif);
          color: var(--text);
        }

        /* Top Header Nav & Icons */
        .col-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .col-crumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--sub);
          font-weight: 500;
        }
        .col-crumb a {
          color: var(--sub);
          text-decoration: none;
        }
        .col-crumb a:hover {
          color: var(--green);
        }

        .col-top-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .col-icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .col-icon-btn:hover {
          background: var(--s2);
          border-color: var(--border-bright);
        }

        /* Main Hero Card */
        .col-hero-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 28px 32px;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 28px;
        }
        @media (max-width: 900px) {
          .col-hero-card {
            flex-direction: column;
          }
        }

        .col-hero-left {
          flex: 1;
          min-width: 0;
        }
        .col-logo-box {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          background: rgba(0, 180, 216, 0.08);
          border: 1px solid rgba(0, 180, 216, 0.2);
          color: var(--green, #00b4d8);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .col-hero-title {
          font-family: var(--font-display);
          font-size: clamp(20px, 2.8vw, 26px);
          font-weight: 800;
          color: var(--text);
          margin: 0 0 10px;
          line-height: 1.3;
        }
        .col-loc-row {
          font-size: 13px;
          color: var(--sub);
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 14px;
        }
        .col-affil-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: var(--green, #00b4d8);
          background: rgba(0, 180, 216, 0.08);
          border: 1px solid rgba(0, 180, 216, 0.2);
          padding: 6px 14px;
          border-radius: 20px;
          margin-bottom: 20px;
        }

        .col-action-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .col-btn-teal {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 10px;
          background: var(--green, #00b4d8);
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .col-btn-teal:hover {
          opacity: 0.9;
        }
        .col-btn-outline {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 10px;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text);
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .col-btn-outline:hover {
          background: var(--s2);
        }

        /* Right Side Stats Grid (2x2) */
        .col-stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          width: 320px;
          flex-shrink: 0;
        }
        @media (max-width: 900px) {
          .col-stats-grid {
            width: 100%;
          }
        }
        .col-stat-box {
          background: var(--s2, rgba(255, 255, 255, 0.03));
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .col-stat-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .st-mint { background: rgba(0, 180, 216, 0.12); color: #00b4d8; }
        .st-purple { background: rgba(168, 85, 247, 0.12); color: #a855f7; }
        .st-blue { background: rgba(14, 165, 233, 0.12); color: #0ea5e9; }
        .st-orange { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }

        .col-stat-num {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 800;
          color: var(--text);
          line-height: 1;
        }
        .col-stat-lbl {
          font-size: 11px;
          color: var(--sub);
          font-weight: 500;
          margin-top: 4px;
        }

        /* Tabs Bar */
        .col-tabs-bar {
          display: flex;
          align-items: center;
          gap: 28px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 24px;
        }
        .col-tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 4px;
          font-size: 15px;
          font-weight: 600;
          color: var(--sub);
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          bottom: -1px;
        }
        .col-tab-btn.active {
          color: var(--green, #00b4d8);
          border-bottom-color: var(--green, #00b4d8);
        }
        .col-tab-count {
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 12px;
          background: rgba(0, 180, 216, 0.12);
          color: var(--green, #00b4d8);
        }

        /* Search & Multi-level Filter Controls */
        .col-filter-wrapper {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 28px;
        }
        .col-search-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .col-search-input-box {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 10px 16px;
        }
        .col-search-input-box input {
          width: 100%;
          background: none;
          border: none;
          outline: none;
          color: var(--text);
          font-size: 14px;
        }

        /* Filter Section Row */
        .filter-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .filter-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--sub);
        }
        .filter-chips-row {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
        }
        .filter-chip {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--sub);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        .filter-chip:hover {
          color: var(--text);
        }
        .filter-chip.active {
          background: rgba(0, 180, 216, 0.12);
          color: var(--green, #00b4d8);
          border-color: rgba(0, 180, 216, 0.3);
          font-weight: 700;
        }

        /* Resource Cards Row Layout */
        .col-resources-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .col-resource-item {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 18px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .col-resource-item:hover {
          border-color: rgba(0, 180, 216, 0.4);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
        }

        .res-left {
          display: flex;
          align-items: center;
          gap: 18px;
          min-width: 0;
        }
        .res-pdf-box {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: rgba(0, 180, 216, 0.08);
          border: 1px solid rgba(0, 180, 216, 0.2);
          color: var(--green, #00b4d8);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          flex-shrink: 0;
        }
        .res-pdf-lbl {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.05em;
        }

        .res-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }
        .res-badges {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .res-badge-sem {
          font-size: 11px;
          font-weight: 700;
          background: rgba(0, 180, 216, 0.12);
          color: var(--green, #00b4d8);
          padding: 2px 8px;
          border-radius: 10px;
        }
        .res-badge-year {
          font-size: 11px;
          font-weight: 600;
          background: var(--s2);
          color: var(--sub);
          padding: 2px 8px;
          border-radius: 10px;
        }

        .res-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
          margin: 0;
          line-height: 1.35;
        }
        .res-link {
          font-size: 12px;
          color: var(--green, #00b4d8);
          font-weight: 600;
          text-decoration: none;
        }

        .res-dl-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 8px;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text);
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .res-dl-btn:hover {
          background: rgba(0, 180, 216, 0.1);
          border-color: rgba(0, 180, 216, 0.3);
          color: var(--green, #00b4d8);
        }

        .about-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 28px;
          line-height: 1.6;
        }
      `}</style>

      {/* Top Breadcrumb & Share */}
      <div className="col-header-top">
        <div className="col-crumb">
          <Link href="/notes">Home</Link>
          <span>›</span>
          <Link href="/notes/colleges">Colleges</Link>
          <span>›</span>
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>
            {college.name}
          </span>
        </div>
        <div className="col-top-actions">
          <button className="col-icon-btn" title="Share" onClick={copyLink}>
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
              share
            </span>
          </button>
          <button className="col-icon-btn" title="Bookmark">
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
              bookmark
            </span>
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="col-hero-card">
        <div className="col-hero-left">
          <div className="col-logo-box">
            <span className="material-symbols-rounded" style={{ fontSize: 32 }}>
              school
            </span>
          </div>

          <h1 className="col-hero-title">{college.name}</h1>

          <div className="col-loc-row">
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
              location_on
            </span>
            <span>{college.location || 'Maharashtra, India'}</span>
          </div>

          <div className="col-affil-pill">
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
              domain
            </span>
            <span>Affiliated to {uniName}</span>
          </div>

          <div className="col-action-row">
            <button
              className="col-btn-teal"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      college.name + ' ' + (college.location || '')
                    )}`,
                    '_blank'
                  );
                }
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                map
              </span>
              View on Map
            </button>

            <Link
              href={
                university?.slug
                  ? `/notes/university/${university.slug}`
                  : '/notes/university'
              }
              className="col-btn-outline"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                domain
              </span>
              View University ({university?.short_name || 'SPPU'})
            </Link>
          </div>
        </div>

        {/* Right Stats Grid (2x2) */}
        <div className="col-stats-grid">
          <div className="col-stat-box">
            <div className="col-stat-icon st-mint">
              <span className="material-symbols-rounded">school</span>
            </div>
            <div>
              <div className="col-stat-num">{safeCourses.length || 2}</div>
              <div className="col-stat-lbl">Courses Offered</div>
            </div>
          </div>

          <div className="col-stat-box">
            <div className="col-stat-icon st-purple">
              <span className="material-symbols-rounded">description</span>
            </div>
            <div>
              <div className="col-stat-num">{pyqCount}</div>
              <div className="col-stat-lbl">Question Papers</div>
            </div>
          </div>

          <div className="col-stat-box">
            <div className="col-stat-icon st-blue">
              <span className="material-symbols-rounded">menu_book</span>
            </div>
            <div>
              <div className="col-stat-num">{notesCount}</div>
              <div className="col-stat-lbl">Class Notes</div>
            </div>
          </div>

          <div className="col-stat-box">
            <div className="col-stat-icon st-orange">
              <span className="material-symbols-rounded">article</span>
            </div>
            <div>
              <div className="col-stat-num">0</div>
              <div className="col-stat-lbl">Syllabus</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="col-tabs-bar">
        <button
          className={`col-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>
            menu_book
          </span>
          <span>Study Materials & Class Notes</span>
          <span className="col-tab-count">{safeNotes.length}</span>
        </button>

        <button
          className={`col-tab-btn ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>
            info
          </span>
          <span>About College</span>
        </button>
      </div>

      {/* TAB 1: STUDY MATERIALS & CLASS NOTES */}
      {activeTab === 'notes' && (
        <div>
          {/* Multi-Level Search & Filter Bar */}
          <div className="col-filter-wrapper">
            <div className="col-search-row">
              <div className="col-search-input-box">
                <span
                  className="material-symbols-rounded"
                  style={{ color: 'var(--sub)', fontSize: 20 }}
                >
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search notes, subjects, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="col-icon-btn" title="Filters">
                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>
                  tune
                </span>
              </button>
            </div>

            {/* Filter by Academic Year */}
            <div className="filter-section">
              <div className="filter-label">Filter by Academic Year</div>
              <div className="filter-chips-row">
                {YEAR_FILTERS.map((yr) => (
                  <button
                    key={yr}
                    className={`filter-chip ${selectedYear === yr ? 'active' : ''}`}
                    onClick={() => setSelectedYear(yr)}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter by Subject */}
            <div className="filter-section">
              <div className="filter-label">Filter by Subject</div>
              <div className="filter-chips-row">
                {SUBJECT_FILTERS.map((sb) => (
                  <button
                    key={sb}
                    className={`filter-chip ${
                      selectedSubject === sb ? 'active' : ''
                    }`}
                    onClick={() => setSelectedSubject(sb)}
                  >
                    {sb}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter by Semester */}
            <div className="filter-section">
              <div className="filter-label">Filter by Semester</div>
              <div className="filter-chips-row">
                {SEMESTER_FILTERS.map((sf) => (
                  <button
                    key={sf.value}
                    className={`filter-chip ${
                      selectedSem === sf.value ? 'active' : ''
                    }`}
                    onClick={() => setSelectedSem(sf.value)}
                  >
                    {sf.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Resources Card Rows List */}
          {filteredNotes.length > 0 ? (
            <div className="col-resources-list">
              {filteredNotes.map((n) => (
                <div key={n.id || n.slug} className="col-resource-item">
                  <div className="res-left">
                    <div className="res-pdf-box">
                      <span
                        className="material-symbols-rounded"
                        style={{ fontSize: 22 }}
                      >
                        description
                      </span>
                      <span className="res-pdf-lbl">PDF</span>
                    </div>

                    <div className="res-info">
                      <div className="res-badges">
                        {n.semester && (
                          <span className="res-badge-sem">
                            Sem {n.semester}
                          </span>
                        )}
                        <span className="res-badge-year">
                          {n.created_at
                            ? new Date(n.created_at).getFullYear()
                            : '2024'}
                        </span>
                      </div>

                      <h4 className="res-title">{n.title}</h4>

                      <Link
                        href={`/notes/resource/${n.slug}`}
                        className="res-link"
                      >
                        View Details ›
                      </Link>
                    </div>
                  </div>

                  <a
                    href={n.file_url || `/notes/resource/${n.slug}`}
                    target={n.file_url ? '_blank' : '_self'}
                    rel="noreferrer"
                    className="res-dl-btn"
                  >
                    <span
                      className="material-symbols-rounded"
                      style={{ fontSize: 18 }}
                    >
                      download
                    </span>
                    Download
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 20px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                color: 'var(--sub)',
              }}
            >
              <span
                className="material-symbols-rounded"
                style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}
              >
                description
              </span>
              <h3>No study materials found</h3>
              <p style={{ fontSize: 13, marginTop: 4 }}>
                Try adjusting your search or filter chips above.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ABOUT COLLEGE */}
      {activeTab === 'about' && (
        <div className="about-card">
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--text)',
              marginBottom: 12,
            }}
          >
            About {college.name}
          </h3>
          <p style={{ color: 'var(--sub)', fontSize: 14, marginBottom: 16 }}>
            {college.description ||
              `${college.name} is an esteemed educational institution located in ${
                college.location || 'India'
              }, affiliated with ${uniName}. It provides comprehensive academic curricula, question papers, and study resources for undergraduate and postgraduate students.`}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              marginTop: 20,
              fontSize: 13,
            }}
          >
            <div>
              <strong style={{ color: 'var(--text)', display: 'block' }}>
                Location:
              </strong>
              <span style={{ color: 'var(--sub)' }}>
                {college.location || 'Niphad, Maharashtra'}
              </span>
            </div>
            <div>
              <strong style={{ color: 'var(--text)', display: 'block' }}>
                Affiliation:
              </strong>
              <span style={{ color: 'var(--sub)' }}>{uniName}</span>
            </div>
            {college.website && (
              <div>
                <strong style={{ color: 'var(--text)', display: 'block' }}>
                  Official Website:
                </strong>
                <a
                  href={college.website}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--green,#00b4d8)' }}
                >
                  {college.website}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
