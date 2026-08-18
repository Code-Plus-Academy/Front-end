'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import api from '../../../../src/api/axios';
import NoteCard from '../../../../src/components/notes/NoteCard';

const YEAR_FILTERS = ['All Years', '2026', '2025', '2024', '2023', '2022', '2021'];

const SUBJECT_FILTERS = [
  'All Subjects',
  'Computer Science',
  'Environment Education',
  'Mathematics',
  'Electronics',
  'English',
  'Physics',
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

function getCleanHandle(slug, shortName) {
  if (shortName) {
    return '@' + shortName.toLowerCase().replace(/[^a-z0-9_]/g, '');
  }
  if (!slug) return '@college';
  let clean = slug.replace(/-[a-f0-9]{4,8}$/i, '').replace(/-\d{4,6}$/, '');
  const parts = clean.split('-').filter(Boolean);
  if (parts.length > 4) {
    clean = parts.slice(0, 4).join('-');
  }
  return '@' + clean;
}

export default function CollegeHubClient({
  college = {},
  university = null,
  courses = [],
  notes = [],
  initialTab = 'all',
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'all'); // 'all' | 'pyqs' | 'notes' | 'books' | 'about'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('All Courses');
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [selectedSem, setSelectedSem] = useState('all');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  const cleanCollegeHandle = getCleanHandle(college.slug, college.short_name);

  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimForm, setClaimForm] = useState({
    applicant_name: '',
    work_email: '',
    designation: '',
    proof_url: '',
    notes: ''
  });
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimError, setClaimError] = useState('');

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    setClaiming(true);
    setClaimError('');
    try {
      await api.post(`/institutions/${college.id || college.slug}/claim`, claimForm);
      setClaimSuccess(true);
    } catch (err) {
      setClaimError(err.response?.data?.message || 'Failed to submit claim. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  const safeNotes = Array.isArray(notes) ? notes : [];
  const safeCourses = Array.isArray(courses) ? courses : [];

  // Categorize resource types
  const isBookItem = (n) =>
    n?.type === 'book' ||
    n?.type === 'books' ||
    n?.type === 'textbook' ||
    n?.type === 'reference_book' ||
    (n?.title && n.title.toLowerCase().includes('book'));

  const isPyqItem = (n) =>
    n?.type === 'question_paper' ||
    n?.type === 'pyq' ||
    (n?.title && (n.title.toLowerCase().includes('pyq') || n.title.toLowerCase().includes('question paper') || n.title.toLowerCase().includes('exam paper')));

  const isNoteItem = (n) =>
    n?.type === 'notes' ||
    n?.type === 'note' ||
    n?.type === 'study_material' ||
    (!isBookItem(n) && !isPyqItem(n));

  // Counts
  const pyqCount = useMemo(
    () => safeNotes.filter((n) => isPyqItem(n)).length,
    [safeNotes]
  );
  const booksCount = useMemo(
    () => safeNotes.filter((n) => isBookItem(n)).length,
    [safeNotes]
  );
  const notesCount = useMemo(
    () => safeNotes.filter((n) => isNoteItem(n)).length,
    [safeNotes]
  );

  // Derived Course Options
  const courseOptions = useMemo(() => {
    const set = new Set();
    safeCourses.forEach((c) => {
      const name = typeof c === 'string' ? c : c?.name || c?.short_name || c?.title;
      if (name && name.trim()) set.add(name.trim());
    });
    safeNotes.forEach((n) => {
      const cName = n?.course_name || n?.custom_course_name || n?.course;
      if (cName && typeof cName === 'string' && cName.trim()) set.add(cName.trim());
    });
    if (set.size === 0) {
      set.add('Bachelor of Computer Applications (BCA)');
      set.add('Bachelor of Science (Computer Science)');
    }
    return ['All Courses', ...Array.from(set)];
  }, [safeCourses, safeNotes]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCourse !== 'All Courses') count++;
    if (selectedYear !== 'All Years') count++;
    if (selectedSubject !== 'All Subjects') count++;
    if (selectedSem !== 'all') count++;
    return count;
  }, [selectedCourse, selectedYear, selectedSubject, selectedSem]);

  // Filtered Notes list
  const filteredNotes = useMemo(() => {
    return safeNotes.filter((n) => {
      // Tab filter
      if (activeTab === 'notes' && !isNoteItem(n)) return false;
      if (activeTab === 'books' && !isBookItem(n)) return false;
      if (activeTab === 'pyqs' && !isPyqItem(n)) return false;

      // Filter by Course
      if (selectedCourse !== 'All Courses') {
        const qC = selectedCourse.toLowerCase();
        const cName = (n?.course_name || n?.custom_course_name || n?.course || '').toLowerCase();
        const subName = (n?.subject_name || '').toLowerCase();
        const title = (n?.title || '').toLowerCase();
        if (!cName.includes(qC) && !subName.includes(qC) && !title.includes(qC)) {
          return false;
        }
      }

      // Filter by Semester
      if (selectedSem !== 'all' && String(n.semester) !== selectedSem) return false;

      // Filter by Year
      if (selectedYear !== 'All Years') {
        const createdYear = n.created_at ? new Date(n.created_at).getFullYear().toString() : '';
        if (createdYear !== selectedYear && !n.title?.includes(selectedYear)) {
          return false;
        }
      }

      // Filter by Subject
      if (selectedSubject !== 'All Subjects') {
        const sub = (n.subject_name || '').toLowerCase();
        if (!sub.includes(selectedSubject.toLowerCase())) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = n.title && n.title.toLowerCase().includes(q);
        const subMatch = n.subject_name && n.subject_name.toLowerCase().includes(q);
        const descMatch = n.description && n.description.toLowerCase().includes(q);
        if (!titleMatch && !subMatch && !descMatch) return false;
      }
      return true;
    });
  }, [
    safeNotes,
    activeTab,
    selectedCourse,
    selectedSem,
    selectedYear,
    selectedSubject,
    searchQuery,
  ]);

  const hasActiveFilters =
    selectedCourse !== 'All Courses' ||
    selectedYear !== 'All Years' ||
    selectedSubject !== 'All Subjects' ||
    selectedSem !== 'all' ||
    searchQuery.trim() !== '';

  const clearFilters = () => {
    setSelectedCourse('All Courses');
    setSelectedYear('All Years');
    setSelectedSubject('All Subjects');
    setSelectedSem('all');
    setSearchQuery('');
  };

  const copyLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  const uniName = college.university || university?.name || 'Savitribai Phule Pune University (SPPU)';
  const collegeInitial = college.name ? college.name.trim().charAt(0).toUpperCase() : 'C';

  return (
    <div className="col-page-root">
      <style>{`
        .col-page-root {
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
          box-sizing: border-box;
          color: var(--text);
          font-family: var(--font-body, Inter, system-ui, sans-serif);
        }

        /* ─── Breadcrumbs & Actions ────────────────────────────── */
        .col-top-nav-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 12px;
        }
        .col-breadcrumbs {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          color: var(--sub);
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .col-breadcrumbs a {
          color: var(--sub);
          text-decoration: none;
          transition: color 0.15s;
        }
        .col-breadcrumbs a:hover {
          color: var(--green, #00b4d8);
        }

        /* ─── Unified Hero Card ────────────────────────────────── */
        .col-hero-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 24px;
          overflow: hidden;
          margin-bottom: 28px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.04);
          position: relative;
        }
        .col-hero-banner {
          height: 140px;
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 40%, #1e1b4b 100%);
          position: relative;
        }
        .col-hero-banner-pattern {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px);
          background-size: 16px 16px;
          opacity: 0.6;
        }

        .col-hero-main {
          padding: 0 28px 26px;
          position: relative;
        }
        .col-avatar-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-top: -46px;
          margin-bottom: 16px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .col-avatar-badge {
          width: 92px;
          height: 92px;
          border-radius: 24px;
          background: var(--surface);
          border: 4px solid var(--surface);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--green, #00b4d8);
          font-family: var(--font-display);
          font-size: 38px;
          font-weight: 800;
          flex-shrink: 0;
        }
        .col-hero-actions-top {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .col-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 12px;
          background: var(--green, #00b4d8);
          color: #fff;
          font-size: 13.5px;
          font-weight: 700;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 14px rgba(0, 180, 216, 0.28);
        }
        .col-btn-primary:hover {
          opacity: 0.92;
          transform: translateY(-1px);
        }

        .col-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 10px 16px;
          border-radius: 12px;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text);
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .col-btn-secondary:hover {
          background: var(--s2, rgba(255, 255, 255, 0.04));
          border-color: var(--border-bright);
        }

        .col-identity-content {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .col-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .col-main-title {
          font-family: var(--font-display);
          font-size: clamp(20px, 2.6vw, 28px);
          font-weight: 800;
          color: var(--text);
          margin: 0;
          line-height: 1.28;
          word-break: break-word;
        }
        .col-verified-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(0, 180, 216, 0.12);
          color: var(--green, #00b4d8);
          border: 1px solid rgba(0, 180, 216, 0.25);
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11.5px;
          font-weight: 700;
        }

        .col-meta-chips-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--sub);
          flex-wrap: wrap;
        }
        .col-handle-tag {
          font-weight: 600;
          color: var(--green, #00b4d8);
        }
        .col-meta-divider {
          color: var(--border-bright, #475569);
        }

        .col-affiliation-box {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--sub);
          margin-top: 2px;
        }
        .col-uni-link {
          color: var(--green, #00b4d8);
          text-decoration: none;
          font-weight: 600;
        }
        .col-uni-link:hover {
          text-decoration: underline;
        }

        /* ─── Institutional Stats Bar ──────────────────────────── */
        .col-stats-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-top: 20px;
          padding-top: 18px;
          border-top: 1px solid var(--border);
        }
        .col-stat-pill {
          background: var(--s2, rgba(255, 255, 255, 0.02));
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .col-stat-icon-wrap {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }
        .stat-mint { background: rgba(0, 180, 216, 0.12); color: #00b4d8; }
        .stat-purple { background: rgba(168, 85, 247, 0.12); color: #c084fc; }
        .stat-red { background: rgba(239, 68, 68, 0.12); color: #f87171; }
        .stat-amber { background: rgba(245, 158, 11, 0.12); color: #fbbf24; }

        .col-stat-num {
          font-family: var(--font-display);
          font-size: 17px;
          font-weight: 800;
          color: var(--text);
          line-height: 1;
        }
        .col-stat-lbl {
          font-size: 11px;
          color: var(--sub);
          font-weight: 500;
          margin-top: 3px;
        }

        /* ─── Modern Tabs Bar ──────────────────────────────────── */
        .col-tab-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 24px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .col-tab-bar::-webkit-scrollbar {
          display: none;
        }
        .col-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 18px;
          font-size: 14px;
          font-weight: 600;
          color: var(--sub);
          background: none;
          border: none;
          border-bottom: 2.5px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          outline: none;
          position: relative;
          bottom: -1px;
        }
        .col-tab-btn:hover {
          color: var(--text);
        }
        .col-tab-btn.active {
          color: var(--green, #00b4d8);
          border-bottom-color: var(--green, #00b4d8);
          font-weight: 700;
        }
        .col-tab-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 10px;
          background: rgba(0, 180, 216, 0.12);
          color: var(--green, #00b4d8);
        }

        /* ─── Controls, Search & Quick Semester Pills ──────────── */
        .col-controls-section {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 28px;
        }
        .col-search-bar-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .col-search-box {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 11px 16px;
          transition: border-color 0.2s;
        }
        .col-search-box:focus-within {
          border-color: var(--green, #00b4d8);
        }
        .col-search-box input {
          width: 100%;
          background: none;
          border: none;
          outline: none;
          color: var(--text);
          font-size: 14px;
        }

        .col-filter-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 18px;
          border-radius: 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text);
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          height: 46px;
          box-sizing: border-box;
        }
        .col-filter-btn:hover {
          background: var(--s2);
          border-color: rgba(0, 180, 216, 0.4);
        }
        .col-filter-btn.active {
          background: rgba(0, 180, 216, 0.12);
          border-color: rgba(0, 180, 216, 0.4);
          color: var(--green, #00b4d8);
        }
        .col-filter-count {
          background: var(--green, #00b4d8);
          color: #fff;
          font-size: 11px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 10px;
          line-height: 1;
        }

        /* Semester Pills Quick Strip */
        .col-semester-pills-row {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          padding: 2px 0;
        }
        .col-semester-pills-row::-webkit-scrollbar {
          display: none;
        }
        .col-sem-pill {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--sub);
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .col-sem-pill:hover {
          color: var(--text);
          border-color: var(--border-bright);
        }
        .col-sem-pill.active {
          background: var(--green, #00b4d8);
          color: #fff;
          border-color: var(--green, #00b4d8);
          box-shadow: 0 2px 8px rgba(0, 180, 216, 0.3);
        }

        /* ─── 3:4 Notes Grid ───────────────────────────────────── */
        .col-resources-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 22px;
        }

        /* ─── About Institution Card ───────────────────────────── */
        .col-about-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 32px;
        }
        .col-about-title {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 800;
          color: var(--text);
          margin: 0 0 14px;
        }
        .col-about-desc {
          color: var(--sub);
          font-size: 14.5px;
          line-height: 1.65;
          margin-bottom: 24px;
        }
        .col-about-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          padding-top: 20px;
          border-top: 1px solid var(--border);
        }
        .col-info-box-lbl {
          font-size: 12px;
          color: var(--sub);
          font-weight: 500;
          margin-bottom: 4px;
        }
        .col-info-box-val {
          font-size: 14.5px;
          color: var(--text);
          font-weight: 700;
        }

        /* ─── Responsive Breakpoints ───────────────────────────── */
        @media (max-width: 900px) {
          .col-stats-strip {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .col-hero-banner {
            height: 100px;
          }
          .col-avatar-badge {
            width: 72px;
            height: 72px;
            font-size: 28px;
            margin-top: -36px;
            border-radius: 18px;
          }
          .col-hero-main {
            padding: 0 16px 20px;
          }
          .col-hero-actions-top {
            width: 100%;
          }
          .col-btn-primary, .col-btn-secondary {
            flex: 1;
            justify-content: center;
          }
          .col-stats-strip {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          .col-stat-pill {
            padding: 10px 12px;
          }
          .col-resources-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }
      `}</style>

      {/* Top Breadcrumb & Share */}
      <div className="col-top-nav-bar">
        <div className="col-breadcrumbs">
          <Link href="/notes">Notes Arena</Link>
          <span>›</span>
          <Link href="/notes/colleges">Colleges</Link>
          <span>›</span>
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>
            {college.name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="col-btn-secondary"
            onClick={copyLink}
            style={{ padding: '7px 12px', fontSize: 12 }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
              {copiedToast ? 'check' : 'share'}
            </span>
            <span>{copiedToast ? 'Link Copied!' : 'Share Page'}</span>
          </button>
        </div>
      </div>

      {/* Modern Unified College Hero Banner */}
      <div className="col-hero-card">
        <div className="col-hero-banner">
          <div className="col-hero-banner-pattern" />
        </div>

        <div className="col-hero-main">
          <div className="col-avatar-row">
            <div className="col-avatar-badge">
              {collegeInitial}
            </div>

            <div className="col-hero-actions-top">
              <Link
                href={`/notes/upload?college_id=${college.id || ''}`}
                className="col-btn-primary"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                  upload_file
                </span>
                Upload Material
              </Link>

              <button
                className="col-btn-secondary"
                onClick={() => setIsClaimModalOpen(true)}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 17, color: 'var(--green, #00b4d8)' }}>
                  verified_user
                </span>
                Claim Page
              </button>

              {college.location && (
                <button
                  className="col-btn-secondary"
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
                  <span className="material-symbols-rounded" style={{ fontSize: 17 }}>
                    location_on
                  </span>
                  Map
                </button>
              )}
            </div>
          </div>

          {/* Identity Info */}
          <div className="col-identity-content">
            <div className="col-title-wrap">
              <h1 className="col-main-title">{college.name}</h1>
              {college.verified && (
                <span className="col-verified-badge">
                  <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
                    verified
                  </span>
                  Verified Institution
                </span>
              )}
            </div>

            <div className="col-meta-chips-row">
              <span className="col-handle-tag">{cleanCollegeHandle}</span>
              <span className="col-meta-divider">•</span>
              <span>{college.location || 'Maharashtra, India'}</span>
              <span className="col-meta-divider">•</span>
              <span>{safeCourses.length || courseOptions.length - 1} Courses Catalogued</span>
            </div>

            <div className="col-affiliation-box">
              <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--green, #00b4d8)' }}>
                account_balance
              </span>
              <span>Affiliated with </span>
              <Link
                href={university?.slug ? `/notes/university/${university.slug}` : '/notes/university'}
                className="col-uni-link"
              >
                {uniName}
              </Link>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="col-stats-strip">
            <div className="col-stat-pill">
              <div className="col-stat-icon-wrap stat-mint">
                <span className="material-symbols-rounded">menu_book</span>
              </div>
              <div>
                <div className="col-stat-num">{safeNotes.length}</div>
                <div className="col-stat-lbl">All Materials</div>
              </div>
            </div>

            <div className="col-stat-pill">
              <div className="col-stat-icon-wrap stat-red">
                <span className="material-symbols-rounded">quiz</span>
              </div>
              <div>
                <div className="col-stat-num">{pyqCount}</div>
                <div className="col-stat-lbl">Question Papers</div>
              </div>
            </div>

            <div className="col-stat-pill">
              <div className="col-stat-icon-wrap stat-purple">
                <span className="material-symbols-rounded">description</span>
              </div>
              <div>
                <div className="col-stat-num">{notesCount}</div>
                <div className="col-stat-lbl">Class Notes</div>
              </div>
            </div>

            <div className="col-stat-pill">
              <div className="col-stat-icon-wrap stat-amber">
                <span className="material-symbols-rounded">school</span>
              </div>
              <div>
                <div className="col-stat-num">{safeCourses.length || courseOptions.length - 1}</div>
                <div className="col-stat-lbl">Academic Courses</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="col-tab-bar" role="tablist">
        <button
          className={`col-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
          role="tab"
          aria-selected={activeTab === 'all'}
        >
          <span>All Materials</span>
          {safeNotes.length > 0 && <span className="col-tab-badge">{safeNotes.length}</span>}
        </button>

        <button
          className={`col-tab-btn ${activeTab === 'pyqs' ? 'active' : ''}`}
          onClick={() => setActiveTab('pyqs')}
          role="tab"
          aria-selected={activeTab === 'pyqs'}
        >
          <span>Question Papers (PYQs)</span>
          {pyqCount > 0 && <span className="col-tab-badge">{pyqCount}</span>}
        </button>

        <button
          className={`col-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
          role="tab"
          aria-selected={activeTab === 'notes'}
        >
          <span>Class Notes</span>
          {notesCount > 0 && <span className="col-tab-badge">{notesCount}</span>}
        </button>

        <button
          className={`col-tab-btn ${activeTab === 'books' ? 'active' : ''}`}
          onClick={() => setActiveTab('books')}
          role="tab"
          aria-selected={activeTab === 'books'}
        >
          <span>Books</span>
          {booksCount > 0 && <span className="col-tab-badge">{booksCount}</span>}
        </button>

        <button
          className={`col-tab-btn ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
          role="tab"
          aria-selected={activeTab === 'about'}
        >
          <span>About College</span>
        </button>
      </div>

      {/* Study Materials Tab Content */}
      {activeTab !== 'about' && (
        <div>
          {/* Controls: Search, Filter Modal Trigger & Quick Semesters */}
          <div className="col-controls-section">
            <div className="col-search-bar-row">
              <div className="col-search-box">
                <span
                  className="material-symbols-rounded"
                  style={{ color: 'var(--sub)', fontSize: 20 }}
                >
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search resources by title, subject, code or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{ background: 'none', border: 'none', color: 'var(--sub)', cursor: 'pointer', display: 'flex' }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 18 }}>close</span>
                  </button>
                )}
              </div>

              <button
                className={`col-filter-btn ${activeFilterCount > 0 ? 'active' : ''}`}
                onClick={() => setIsFilterModalOpen(true)}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                  tune
                </span>
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="col-filter-count">{activeFilterCount}</span>
                )}
              </button>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: 'var(--green, #00b4d8)',
                    background: 'rgba(0, 180, 216, 0.1)',
                    border: '1px solid rgba(0, 180, 216, 0.25)',
                    padding: '8px 14px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    height: 46,
                  }}
                >
                  Reset ✕
                </button>
              )}
            </div>

            {/* Quick Semester Selection Strip */}
            <div className="col-semester-pills-row">
              {SEMESTER_FILTERS.map((sem) => (
                <button
                  key={sem.value}
                  className={`col-sem-pill ${selectedSem === sem.value ? 'active' : ''}`}
                  onClick={() => setSelectedSem(sem.value)}
                >
                  {sem.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Modal */}
          {isFilterModalOpen && (
            <div
              style={{
                position: 'fixed', inset: 0, zIndex: 999,
                background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
              }}
              onClick={() => setIsFilterModalOpen(false)}
            >
              <div
                style={{
                  background: 'var(--surface, #121824)',
                  border: '1px solid var(--border)',
                  borderRadius: 24, width: '100%', maxWidth: 580,
                  maxHeight: '85vh', display: 'flex', flexDirection: 'column',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)', overflow: 'hidden'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                    Filter College Materials
                  </h3>
                  <button
                    onClick={() => setIsFilterModalOpen(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--sub)', cursor: 'pointer', display: 'flex' }}
                  >
                    <span className="material-symbols-rounded">close</span>
                  </button>
                </div>

                <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Course Filter */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>Course</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {courseOptions.map((crs) => (
                        <button
                          key={crs}
                          onClick={() => setSelectedCourse(crs)}
                          style={{
                            padding: '7px 14px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                            background: selectedCourse === crs ? 'var(--green, #00b4d8)' : 'var(--surface)',
                            color: selectedCourse === crs ? '#fff' : 'var(--sub)',
                            border: `1px solid ${selectedCourse === crs ? 'var(--green, #00b4d8)' : 'var(--border)'}`,
                            cursor: 'pointer'
                          }}
                        >
                          {crs}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Year Filter */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>Academic Year</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {YEAR_FILTERS.map((yr) => (
                        <button
                          key={yr}
                          onClick={() => setSelectedYear(yr)}
                          style={{
                            padding: '7px 14px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                            background: selectedYear === yr ? 'var(--green, #00b4d8)' : 'var(--surface)',
                            color: selectedYear === yr ? '#fff' : 'var(--sub)',
                            border: `1px solid ${selectedYear === yr ? 'var(--green, #00b4d8)' : 'var(--border)'}`,
                            cursor: 'pointer'
                          }}
                        >
                          {yr}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subject Filter */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>Subject</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {SUBJECT_FILTERS.map((sb) => (
                        <button
                          key={sb}
                          onClick={() => setSelectedSubject(sb)}
                          style={{
                            padding: '7px 14px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                            background: selectedSubject === sb ? 'var(--green, #00b4d8)' : 'var(--surface)',
                            color: selectedSubject === sb ? '#fff' : 'var(--sub)',
                            border: `1px solid ${selectedSubject === sb ? 'var(--green, #00b4d8)' : 'var(--border)'}`,
                            cursor: 'pointer'
                          }}
                        >
                          {sb}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    onClick={clearFilters}
                    style={{ padding: '9px 18px', borderRadius: 10, background: 'transparent', border: '1px solid var(--border)', color: 'var(--sub)', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setIsFilterModalOpen(false)}
                    style={{ padding: '9px 22px', borderRadius: 10, background: 'var(--green, #00b4d8)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3:4 NoteCard Grid */}
          {filteredNotes.length > 0 ? (
            <div className="col-resources-grid">
              {filteredNotes.map((n) => (
                <NoteCard key={n.id || n.slug} note={n} />
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                color: 'var(--sub)',
              }}
            >
              <span
                className="material-symbols-rounded"
                style={{ fontSize: 48, marginBottom: 12, color: 'var(--sub)', opacity: 0.6 }}
              >
                {activeTab === 'books'
                  ? 'auto_stories'
                  : activeTab === 'pyqs'
                  ? 'quiz'
                  : 'description'}
              </span>
              <h3 style={{ color: 'var(--text)', margin: '0 0 6px', fontSize: 18 }}>
                {activeTab === 'books'
                  ? 'No books catalogued'
                  : activeTab === 'notes'
                  ? 'No class notes found'
                  : activeTab === 'pyqs'
                  ? 'No question papers found'
                  : 'No study materials found'}
              </h3>
              <p style={{ fontSize: 13, maxWidth: 360, margin: '0 auto 18px' }}>
                No materials match your active search or filters. Try adjusting your query or upload a new resource for this college.
              </p>
              <Link
                href={`/notes/upload?college_id=${college.id || ''}`}
                className="col-btn-primary"
                style={{ display: 'inline-flex' }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                  add
                </span>
                Upload First Material
              </Link>
            </div>
          )}
        </div>
      )}

      {/* About College Tab Content */}
      {activeTab === 'about' && (
        <div className="col-about-card">
          <h2 className="col-about-title">About {college.name}</h2>
          <p className="col-about-desc">
            {college.description ||
              `${college.name} is an esteemed higher education institution located in ${
                college.location || 'Maharashtra, India'
              }, affiliated with ${uniName}. The institution offers accredited degree programs and collaborative academic curricula. Browse student-uploaded lecture notes, verified PYQs, reference books, and syllabus resources.`}
          </p>

          <div className="col-about-info-grid">
            <div>
              <div className="col-info-box-lbl">Campus Location</div>
              <div className="col-info-box-val">{college.location || 'Maharashtra, India'}</div>
            </div>

            <div>
              <div className="col-info-box-lbl">Affiliated University</div>
              <div className="col-info-box-val">{uniName}</div>
            </div>

            <div>
              <div className="col-info-box-lbl">Verification Status</div>
              <div className="col-info-box-val" style={{ color: college.verified ? 'var(--green, #00b4d8)' : 'var(--text)' }}>
                {college.verified ? 'Verified Institution' : 'Community Maintained'}
              </div>
            </div>

            {college.website && (
              <div>
                <div className="col-info-box-lbl">Official Website</div>
                <a
                  href={college.website}
                  target="_blank"
                  rel="noreferrer"
                  className="col-info-box-val"
                  style={{ color: 'var(--green, #00b4d8)', textDecoration: 'none' }}
                >
                  Visit Portal ↗
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Institutional Claim Modal */}
      {isClaimModalOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
          }}
          onClick={() => setIsClaimModalOpen(false)}
        >
          <div
            style={{
              background: 'var(--surface, #1e293b)', border: '1px solid var(--border, #334155)', borderRadius: 20,
              width: '100%', maxWidth: 500, padding: 24, color: 'var(--text, #fff)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)', position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-rounded" style={{ color: 'var(--green, #38bdf8)' }}>verified_user</span>
                Claim {college.name || 'Institution'} Page
              </h3>
              <button
                onClick={() => setIsClaimModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--sub, #94a3b8)', cursor: 'pointer', fontSize: 20 }}
              >
                ✕
              </button>
            </div>

            {claimSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 48, color: '#34d399', marginBottom: 12 }}>
                  check_circle
                </span>
                <h4 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>Claim Submitted</h4>
                <p style={{ color: 'var(--sub, #cbd5e1)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  Your official claim request has been logged. Our moderation team will verify your credentials and reach out to <strong>{claimForm.work_email}</strong>.
                </p>
                <button
                  onClick={() => {
                    setIsClaimModalOpen(false);
                    setClaimSuccess(false);
                    setClaimForm({ applicant_name: '', work_email: '', designation: '', proof_url: '', notes: '' });
                  }}
                  className="col-btn-primary"
                  style={{ marginTop: 16 }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit}>
                <p style={{ fontSize: '0.85rem', color: 'var(--sub, #94a3b8)', marginBottom: 16 }}>
                  Are you an authorized administrator or faculty representative of this college? Submit verification details below.
                </p>

                {claimError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: 10, borderRadius: 8, fontSize: '0.85rem', marginBottom: 12 }}>
                    {claimError}
                  </div>
                )}

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--sub, #cbd5e1)', marginBottom: 4 }}>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={claimForm.applicant_name}
                    onChange={e => setClaimForm({ ...claimForm, applicant_name: e.target.value })}
                    placeholder="e.g. Dr. Ramesh Sharma"
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--s2, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: 10, color: 'var(--text, #fff)', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--sub, #cbd5e1)', marginBottom: 4 }}>Institutional Work Email *</label>
                  <input
                    type="email"
                    required
                    value={claimForm.work_email}
                    onChange={e => setClaimForm({ ...claimForm, work_email: e.target.value })}
                    placeholder="e.g. ramesh@college.edu.in"
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--s2, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: 10, color: 'var(--text, #fff)', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--sub, #cbd5e1)', marginBottom: 4 }}>Designation / Role *</label>
                  <input
                    type="text"
                    required
                    value={claimForm.designation}
                    onChange={e => setClaimForm({ ...claimForm, designation: e.target.value })}
                    placeholder="e.g. Head of Department / Academic Coordinator"
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--s2, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: 10, color: 'var(--text, #fff)', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--sub, #cbd5e1)', marginBottom: 4 }}>Faculty Profile Link or ID Proof URL *</label>
                  <input
                    type="url"
                    required
                    value={claimForm.proof_url}
                    onChange={e => setClaimForm({ ...claimForm, proof_url: e.target.value })}
                    placeholder="https://college.edu.in/faculty/profile or ID URL"
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--s2, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: 10, color: 'var(--text, #fff)', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--sub, #cbd5e1)', marginBottom: 4 }}>Additional Verification Notes</label>
                  <textarea
                    rows={2}
                    value={claimForm.notes}
                    onChange={e => setClaimForm({ ...claimForm, notes: e.target.value })}
                    placeholder="Provide any additional verification notes..."
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--s2, #0f172a)', border: '1px solid var(--border, #334155)', borderRadius: 10, color: 'var(--text, #fff)', fontSize: '0.9rem', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setIsClaimModalOpen(false)}
                    style={{ padding: '10px 16px', background: 'transparent', border: '1px solid var(--border, #475569)', color: 'var(--sub, #cbd5e1)', borderRadius: 10, cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={claiming}
                    className="col-btn-primary"
                    style={{ padding: '10px 20px', fontSize: '0.85rem' }}
                  >
                    {claiming ? 'Submitting...' : 'Submit Claim'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
