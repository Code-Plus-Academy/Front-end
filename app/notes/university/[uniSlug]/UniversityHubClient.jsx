'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

const COLLEGE_CATEGORIES = ['All', 'Engineering', 'Science', 'Commerce', 'Arts'];

const TYPE_FILTERS = [
  { label: 'All Types', value: 'all' },
  { label: 'PYQs (Question Papers)', value: 'question_paper' },
  { label: 'Class Notes', value: 'notes' },
  { label: 'Reference Books', value: 'book' },
  { label: 'Lab Manuals', value: 'lab_manual' },
  { label: 'Cheatsheets', value: 'cheatsheet' },
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

export default function UniversityHubClient({
  university,
  colleges = [],
  courses = [],
  notes = [],
  initialTab = 'colleges',
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'colleges' | 'notes'
  const [collegeSearch, setCollegeSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState('a-z');

  // Notes filters
  const [notesSearch, setNotesSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSem, setSelectedSem] = useState('all');

  const safeColleges = Array.isArray(colleges) ? colleges : [];
  const safeCourses = Array.isArray(courses) ? courses : [];
  const safeNotes = Array.isArray(notes) ? notes : [];

  // Metrics
  const pyqCount = useMemo(
    () => safeNotes.filter((n) => n?.type === 'question_paper').length,
    [safeNotes]
  );
  const notesCount = useMemo(
    () => safeNotes.filter((n) => n?.type === 'notes').length,
    [safeNotes]
  );

  // Filtered Colleges
  const filteredColleges = useMemo(() => {
    let result = [...safeColleges];

    if (collegeSearch.trim()) {
      const q = collegeSearch.toLowerCase().trim();
      result = result.filter(
        (c) =>
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.location && c.location.toLowerCase().includes(q))
      );
    }

    if (sortOrder === 'a-z') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortOrder === 'z-a') {
      result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    }

    return result;
  }, [safeColleges, collegeSearch, sortOrder]);

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return safeNotes.filter((n) => {
      if (selectedType !== 'all' && n.type !== selectedType) return false;
      if (selectedSem !== 'all' && String(n.semester) !== selectedSem) return false;
      if (notesSearch.trim()) {
        const q = notesSearch.toLowerCase().trim();
        const titleMatch = n.title && n.title.toLowerCase().includes(q);
        const colMatch = n._collegeName && n._collegeName.toLowerCase().includes(q);
        if (!titleMatch && !colMatch) return false;
      }
      return true;
    });
  }, [safeNotes, selectedType, selectedSem, notesSearch]);

  const copyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="uni-redesign-container">
      <style>{`
        .uni-redesign-container {
          width: 100%;
          font-family: var(--font-body, Inter, system-ui, sans-serif);
          color: var(--text);
        }

        /* Top Breadcrumb & Actions */
        .uni-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .uni-crumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--sub);
          font-weight: 500;
        }
        .uni-crumb a {
          color: var(--sub);
          text-decoration: none;
        }
        .uni-crumb a:hover {
          color: var(--green);
        }
        .uni-top-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .uni-icon-btn {
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
        .uni-icon-btn:hover {
          background: var(--s2);
          border-color: var(--border-bright);
        }

        /* Hero Banner Card */
        .uni-hero-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 28px 32px;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }
        .uni-hero-info {
          flex: 1;
          min-width: 0;
          z-index: 2;
        }
        .uni-logo-box {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          background: rgba(0, 180, 216, 0.1);
          border: 1px solid rgba(0, 180, 216, 0.2);
          color: var(--green, #00b4d8);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        .uni-hero-title {
          font-family: var(--font-display);
          font-size: clamp(22px, 3.2vw, 32px);
          font-weight: 800;
          color: var(--text);
          margin: 0 0 10px;
          line-height: 1.2;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .uni-badge-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .uni-code-badge {
          font-size: 11px;
          font-weight: 700;
          background: rgba(0, 180, 216, 0.12);
          color: var(--green, #00b4d8);
          padding: 4px 10px;
          border-radius: 20px;
          text-transform: uppercase;
        }
        .uni-verified-badge {
          font-size: 11px;
          font-weight: 700;
          background: rgba(14, 165, 233, 0.12);
          color: #0ea5e9;
          padding: 4px 10px;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .uni-hero-sub {
          font-size: 14px;
          color: var(--sub);
          margin-bottom: 10px;
          line-height: 1.5;
        }
        .uni-hero-meta {
          font-size: 12px;
          color: var(--sub);
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 20px;
        }
        .uni-action-btns {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .uni-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 10px;
          background: rgba(0, 180, 216, 0.1);
          border: 1px solid rgba(0, 180, 216, 0.3);
          color: var(--green, #00b4d8);
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .uni-btn-primary:hover {
          background: rgba(0, 180, 216, 0.2);
        }
        .uni-btn-ghost {
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
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .uni-btn-ghost:hover {
          background: var(--s2);
        }

        /* Hero Graphic Illustration */
        .uni-hero-graphic {
          width: 320px;
          height: 190px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.9;
        }
        @media (max-width: 860px) {
          .uni-hero-graphic {
            display: none;
          }
        }

        /* 4 Stat Cards Row */
        .uni-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }
        .uni-stat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .uni-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.04);
        }
        .uni-stat-icon {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }
        .stat-icon-mint { background: rgba(0, 180, 216, 0.12); color: #00b4d8; }
        .stat-icon-purple { background: rgba(168, 85, 247, 0.12); color: #a855f7; }
        .stat-icon-blue { background: rgba(14, 165, 233, 0.12); color: #0ea5e9; }
        .stat-icon-orange { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }

        .uni-stat-val {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 800;
          color: var(--text);
          line-height: 1;
        }
        .uni-stat-label {
          font-size: 12px;
          color: var(--sub);
          font-weight: 500;
          margin-top: 4px;
        }

        /* Tabs Navigation */
        .uni-tabs-bar {
          display: flex;
          align-items: center;
          gap: 28px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 24px;
        }
        .uni-tab-btn {
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
        .uni-tab-btn:hover {
          color: var(--text);
        }
        .uni-tab-btn.active {
          color: var(--green, #00b4d8);
          border-bottom-color: var(--green, #00b4d8);
        }
        .uni-tab-badge {
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 12px;
          background: var(--s2);
          color: var(--sub);
        }
        .uni-tab-btn.active .uni-tab-badge {
          background: rgba(0, 180, 216, 0.15);
          color: var(--green, #00b4d8);
        }

        /* Search & Filter Toolbar */
        .uni-toolbar {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }
        .uni-search-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .uni-search-box {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 10px 16px;
        }
        .uni-search-box input {
          width: 100%;
          background: none;
          border: none;
          outline: none;
          color: var(--text);
          font-size: 14px;
        }
        .uni-filter-btn {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--sub);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        /* Category Chips & Sort */
        .uni-chips-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .uni-chips-group {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
        }
        .uni-chip {
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--sub);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        .uni-chip:hover {
          color: var(--text);
          border-color: var(--border-bright);
        }
        .uni-chip.active {
          background: var(--green, #00b4d8);
          color: #fff;
          border-color: var(--green, #00b4d8);
        }

        .uni-sort-select {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 13px;
          color: var(--sub);
          outline: none;
          cursor: pointer;
        }

        /* Affiliated College Cards List */
        .uni-colleges-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .uni-college-item {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 18px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .uni-college-item:hover {
          border-color: rgba(0, 180, 216, 0.4);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
        }
        .uni-col-left {
          display: flex;
          align-items: center;
          gap: 18px;
          min-width: 0;
        }
        .uni-col-icon {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          background: rgba(0, 180, 216, 0.08);
          color: var(--green, #00b4d8);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
        }
        .uni-col-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }
        .uni-col-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text);
          margin: 0;
          line-height: 1.3;
        }
        .uni-col-loc {
          font-size: 12px;
          color: var(--sub);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .uni-browse-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          color: var(--green, #00b4d8);
          margin-top: 4px;
        }
        .uni-col-arrow {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(0, 180, 216, 0.08);
          color: var(--green, #00b4d8);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* Note Cards Grid */
        .uni-notes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .uni-note-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 12px;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .uni-note-card:hover {
          border-color: rgba(0, 180, 216, 0.4);
          transform: translateY(-2px);
        }

        .empty-state-box {
          text-align: center;
          padding: 48px 20px;
          background: var(--surface);
          border: 1px border var(--border);
          border-radius: 16px;
          color: var(--sub);
        }
      `}</style>

      {/* Top Navigation & Share */}
      <div className="uni-header-top">
        <div className="uni-crumb">
          <Link href="/notes">Notes</Link>
          <span>›</span>
          <Link href="/notes/university">Universities</Link>
          <span>›</span>
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>
            {university.name}
          </span>
        </div>
        <div className="uni-top-actions">
          <button className="uni-icon-btn" title="Share" onClick={copyLink}>
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
              share
            </span>
          </button>
          <button className="uni-icon-btn" title="Bookmark">
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
              bookmark
            </span>
          </button>
        </div>
      </div>

      {/* Hero Banner Card */}
      <div className="uni-hero-card">
        <div className="uni-hero-info">
          <div className="uni-logo-box">
            <span className="material-symbols-rounded" style={{ fontSize: 32 }}>
              domain
            </span>
          </div>

          <h1 className="uni-hero-title">
            {university.name}
            {university.claimed && (
              <span className="uni-verified-badge">
                <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
                  verified
                </span>
                Verified
              </span>
            )}
          </h1>

          <div className="uni-badge-row">
            {university.short_name && (
              <span className="uni-code-badge">{university.short_name}</span>
            )}
            <span className="uni-verified-badge">
              <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
                verified
              </span>
              Verified
            </span>
          </div>

          <p className="uni-hero-sub">
            Official University Hub for Previous Year Papers, Notes, Courses and
            Colleges.
          </p>

          <div className="uni-hero-meta">
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
              calendar_today
            </span>
            <span>Last updated: 20 May 2025</span>
          </div>

          <div className="uni-action-btns">
            {university.website_url ? (
              <a
                href={university.website_url}
                target="_blank"
                rel="noreferrer"
                className="uni-btn-primary"
              >
                <span
                  className="material-symbols-rounded"
                  style={{ fontSize: 18 }}
                >
                  language
                </span>
                Visit Official Website ↗
              </a>
            ) : (
              <button className="uni-btn-primary" onClick={copyLink}>
                <span
                  className="material-symbols-rounded"
                  style={{ fontSize: 18 }}
                >
                  language
                </span>
                Visit Official Website ↗
              </button>
            )}

            <button className="uni-btn-ghost" onClick={copyLink}>
              <span
                className="material-symbols-rounded"
                style={{ fontSize: 18 }}
              >
                link
              </span>
              Copy Link
            </button>
          </div>
        </div>

        {/* Clean University Building Vector Graphic */}
        <div className="uni-hero-graphic">
          <svg
            width="280"
            height="180"
            viewBox="0 0 280 180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="280" height="180" rx="16" fill="rgba(0,180,216,0.03)" />
            {/* Dome */}
            <path
              d="M140 30 C110 30 100 60 100 70 L180 70 C180 60 170 30 140 30 Z"
              fill="rgba(0,180,216,0.25)"
            />
            <path
              d="M138 18 L142 18 L142 30 L138 30 Z"
              fill="rgba(0,180,216,0.5)"
            />
            {/* Triangular Pediment */}
            <polygon
              points="70,75 140,45 210,75"
              fill="rgba(0,180,216,0.18)"
              stroke="rgba(0,180,216,0.3)"
              strokeWidth="2"
            />
            {/* Main Arch & Pillars */}
            <rect
              x="75"
              y="75"
              width="130"
              height="75"
              rx="4"
              fill="rgba(0,180,216,0.08)"
              stroke="rgba(0,180,216,0.25)"
              strokeWidth="2"
            />
            <rect x="90" y="85" width="10" height="65" rx="2" fill="rgba(0,180,216,0.3)" />
            <rect x="115" y="85" width="10" height="65" rx="2" fill="rgba(0,180,216,0.3)" />
            <rect x="155" y="85" width="10" height="65" rx="2" fill="rgba(0,180,216,0.3)" />
            <rect x="180" y="85" width="10" height="65" rx="2" fill="rgba(0,180,216,0.3)" />
            {/* Central Entrance Doorway */}
            <path
              d="M130 150 L130 115 A10 10 0 0 1 150 115 L150 150 Z"
              fill="rgba(0,180,216,0.4)"
            />
            {/* Base Steps */}
            <rect x="60" y="150" width="160" height="6" rx="2" fill="rgba(0,180,216,0.3)" />
            <rect x="50" y="156" width="180" height="6" rx="2" fill="rgba(0,180,216,0.2)" />
          </svg>
        </div>
      </div>

      {/* 4 Stat Cards Row */}
      <div className="uni-stats-grid">
        <div className="uni-stat-card">
          <div className="uni-stat-icon stat-icon-mint">
            <span className="material-symbols-rounded">domain</span>
          </div>
          <div>
            <div className="uni-stat-val">{safeColleges.length}</div>
            <div className="uni-stat-label">Affiliated Colleges</div>
          </div>
        </div>

        <div className="uni-stat-card">
          <div className="uni-stat-icon stat-icon-purple">
            <span className="material-symbols-rounded">description</span>
          </div>
          <div>
            <div className="uni-stat-val">{pyqCount}</div>
            <div className="uni-stat-label">Question Paper (PYQs)</div>
          </div>
        </div>

        <div className="uni-stat-card">
          <div className="uni-stat-icon stat-icon-blue">
            <span className="material-symbols-rounded">menu_book</span>
          </div>
          <div>
            <div className="uni-stat-val">{notesCount}</div>
            <div className="uni-stat-label">Class Notes</div>
          </div>
        </div>

        <div className="uni-stat-card">
          <div className="uni-stat-icon stat-icon-orange">
            <span className="material-symbols-rounded">school</span>
          </div>
          <div>
            <div className="uni-stat-val">{safeCourses.length || 2}</div>
            <div className="uni-stat-label">Courses Offered</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="uni-tabs-bar">
        <button
          className={`uni-tab-btn ${activeTab === 'colleges' ? 'active' : ''}`}
          onClick={() => setActiveTab('colleges')}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>
            domain
          </span>
          <span>Affiliated Colleges</span>
          <span className="uni-tab-badge">{safeColleges.length}</span>
        </button>

        <button
          className={`uni-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>
            menu_book
          </span>
          <span>Study Materials</span>
        </button>
      </div>

      {/* TAB 1: AFFILIATED COLLEGES */}
      {activeTab === 'colleges' && (
        <div>
          {/* Search & Chips Toolbar */}
          <div className="uni-toolbar">
            <div className="uni-search-row">
              <div className="uni-search-box">
                <span
                  className="material-symbols-rounded"
                  style={{ color: 'var(--sub)', fontSize: 20 }}
                >
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search affiliated colleges..."
                  value={collegeSearch}
                  onChange={(e) => setCollegeSearch(e.target.value)}
                />
              </div>
              <button className="uni-filter-btn" title="Filter">
                <span
                  className="material-symbols-rounded"
                  style={{ fontSize: 20 }}
                >
                  tune
                </span>
              </button>
            </div>

            <div className="uni-chips-row">
              <div className="uni-chips-group">
                {COLLEGE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    className={`uni-chip ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <select
                className="uni-sort-select"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="a-z">Sort: A - Z</option>
                <option value="z-a">Sort: Z - A</option>
              </select>
            </div>
          </div>

          {/* College Cards List */}
          {filteredColleges.length > 0 ? (
            <div className="uni-colleges-list">
              {filteredColleges.map((col) => (
                <Link
                  key={col.id || col.slug}
                  href={`/notes/colleges/${col.slug}`}
                  className="uni-college-item"
                >
                  <div className="uni-col-left">
                    <div className="uni-col-icon">
                      <span className="material-symbols-rounded">domain</span>
                    </div>
                    <div className="uni-col-info">
                      <h3 className="uni-col-title">{col.name}</h3>
                      <div className="uni-col-loc">
                        <span
                          className="material-symbols-rounded"
                          style={{ fontSize: 14 }}
                        >
                          location_on
                        </span>
                        <span>{col.location || 'Maharashtra'}</span>
                      </div>
                      <div className="uni-browse-pill">Browse Notes ›</div>
                    </div>
                  </div>

                  <div className="uni-col-arrow">
                    <span
                      className="material-symbols-rounded"
                      style={{ fontSize: 20 }}
                    >
                      chevron_right
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state-box">
              <span
                className="material-symbols-rounded"
                style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}
              >
                search_off
              </span>
              <h3>No affiliated colleges found</h3>
              <p style={{ fontSize: 13, marginTop: 4 }}>
                Try clearing your search query to see all indexed colleges.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STUDY MATERIALS */}
      {activeTab === 'notes' && (
        <div>
          <div className="uni-toolbar">
            <div className="uni-search-row">
              <div className="uni-search-box">
                <span
                  className="material-symbols-rounded"
                  style={{ color: 'var(--sub)', fontSize: 20 }}
                >
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search notes, PYQs or subjects..."
                  value={notesSearch}
                  onChange={(e) => setNotesSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="uni-chips-row">
              <div className="uni-chips-group">
                {TYPE_FILTERS.map((tf) => (
                  <button
                    key={tf.value}
                    className={`uni-chip ${selectedType === tf.value ? 'active' : ''}`}
                    onClick={() => setSelectedType(tf.value)}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredNotes.length > 0 ? (
            <div className="uni-notes-grid">
              {filteredNotes.map((n) => (
                <Link
                  key={n.id || n.slug}
                  href={`/notes/resource/${n.slug}`}
                  className="uni-note-card"
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 8,
                      }}
                    >
                      {n.semester && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            background: 'rgba(0,180,216,0.1)',
                            color: 'var(--green,#00b4d8)',
                            padding: '2px 8px',
                            borderRadius: 12,
                          }}
                        >
                          Sem {n.semester}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          background: 'var(--s2)',
                          color: 'var(--sub)',
                          padding: '2px 8px',
                          borderRadius: 12,
                        }}
                      >
                        {n.type === 'question_paper' ? 'PYQ' : n.type || 'Note'}
                      </span>
                    </div>

                    <h4
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--text)',
                        margin: 0,
                        lineHeight: 1.35,
                      }}
                    >
                      {n.title}
                    </h4>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      fontSize: 12,
                      color: 'var(--sub)',
                      marginTop: 8,
                    }}
                  >
                    <span>View Details ›</span>
                    {n.file_url && (
                      <span
                        style={{
                          color: 'var(--green,#00b4d8)',
                          fontWeight: 600,
                        }}
                      >
                        ↓ Download
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state-box">
              <span
                className="material-symbols-rounded"
                style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}
              >
                description
              </span>
              <h3>No study materials uploaded yet</h3>
              <p style={{ fontSize: 13, marginTop: 4 }}>
                Be the first to upload previous year question papers or class notes!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
