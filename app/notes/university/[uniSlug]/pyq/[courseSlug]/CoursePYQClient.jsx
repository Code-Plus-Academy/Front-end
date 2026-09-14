'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, 
  GraduationCap, 
  ChevronRight, 
  Calendar, 
  X,
  FileQuestion,
  ArrowLeft
} from 'lucide-react';
import NoteCard from '../../../../../../src/components/notes/NoteCard';

export default function CoursePYQClient({
  uniName,
  uniSlug,
  course,
  notes = [],
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('ALL');

  // Extract available semesters for this course
  const semesterList = useMemo(() => {
    const semSet = new Set();
    for (const note of notes) {
      if (note.semester != null) {
        semSet.add(Number(note.semester));
      }
    }
    return Array.from(semSet).sort((a, b) => a - b);
  }, [notes]);

  // Filter notes by active semester and search query
  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return notes.filter((note) => {
      // Semester filter
      if (selectedSemester !== 'ALL' && String(note.semester) !== String(selectedSemester)) {
        return false;
      }

      // Search keyword filter
      if (q) {
        const titleMatch = (note.title || '').toLowerCase().includes(q);
        const subjectMatch = (note.subject_name || note.custom_subject_name || '').toLowerCase().includes(q);
        const collegeMatch = (note._collegeName || note.college_name || '').toLowerCase().includes(q);
        const semMatch = `sem ${note.semester || ''}`.includes(q) || `semester ${note.semester || ''}`.includes(q);
        if (!titleMatch && !subjectMatch && !collegeMatch && !semMatch) {
          return false;
        }
      }

      return true;
    });
  }, [notes, selectedSemester, searchQuery]);

  // Group notes by semester
  const notesBySemester = useMemo(() => {
    const grouped = {};
    for (const note of filteredNotes) {
      const semKey = note.semester != null ? String(note.semester) : 'Other';
      if (!grouped[semKey]) grouped[semKey] = [];
      grouped[semKey].push(note);
    }
    return grouped;
  }, [filteredNotes]);

  // Sorted semester keys
  const sortedSemesters = useMemo(() => {
    return Object.keys(notesBySemester).sort((a, b) => {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      if (!isNaN(na)) return -1;
      if (!isNaN(nb)) return 1;
      return 0;
    });
  }, [notesBySemester]);

  const courseTitle = course?.name || 'Degree Program';
  const deptTitle = course?.department_name || course?.department || 'Department';

  return (
    <div className="course-pyq-page-container">
      {/* ── Breadcrumbs ── */}
      <nav className="pyq-breadcrumbs" aria-label="Breadcrumb">
        <Link href="/notes">Notes Arena</Link>
        <ChevronRight size={14} className="bc-sep" />
        <Link href="/notes/university">Universities</Link>
        <ChevronRight size={14} className="bc-sep" />
        <Link href={`/notes/university/${uniSlug}/pyq`}>{uniName} PYQs</Link>
        <ChevronRight size={14} className="bc-sep" />
        <span className="bc-current">{courseTitle}</span>
      </nav>

      {/* Back to University Courses Link */}
      <div className="back-link-row">
        <Link href={`/notes/university/${uniSlug}/pyq`} className="back-courses-btn">
          <ArrowLeft size={16} />
          <span>← Back to all {uniName} Courses</span>
        </Link>
      </div>

      {/* Course Hero Banner */}
      <header className="selected-course-banner">
        <div className="banner-icon-box">
          <GraduationCap size={34} />
        </div>
        <div className="banner-info">
          <div className="banner-tags">
            {deptTitle && <span className="banner-dept-tag">{deptTitle}</span>}
            <span className="banner-uni-tag">{uniName}</span>
          </div>
          <h1 className="banner-course-title">{courseTitle} – Previous Year Question Papers</h1>
          <p className="banner-course-subtitle">
            All semester-wise question papers, model examination papers, and pattern solutions for {courseTitle} affiliated under {uniName}.
          </p>
        </div>
        <div className="banner-stats-pill">
          <span className="banner-stat-num">{notes.length}</span>
          <span className="banner-stat-lbl">Question Papers</span>
        </div>
      </header>

      {/* Interactive Filter Bar */}
      <section className="course-filters-bar">
        <div className="filters-search-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder={`Search subject name or paper code in ${courseTitle}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="filters-search-input"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="search-clear-btn" aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Semester Filter Chips */}
        {semesterList.length > 1 && (
          <div className="sem-chips-scroll">
            <button
              type="button"
              className={`sem-filter-btn ${selectedSemester === 'ALL' ? 'sem-btn-active' : ''}`}
              onClick={() => setSelectedSemester('ALL')}
            >
              All Semesters ({notes.length})
            </button>

            {semesterList.map((sem) => {
              const countInSem = notes.filter((n) => String(n.semester) === String(sem)).length;
              return (
                <button
                  key={sem}
                  type="button"
                  className={`sem-filter-btn ${selectedSemester === String(sem) ? 'sem-btn-active' : ''}`}
                  onClick={() => setSelectedSemester(String(sem))}
                >
                  <Calendar size={13} />
                  <span>Semester {sem}</span>
                  <span className="sem-count-tag">{countInSem}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Question Papers List */}
      <main className="course-pyqs-content">
        {sortedSemesters.length === 0 ? (
          <div className="pyq-empty-state">
            <FileQuestion size={44} className="empty-icon" />
            <h3 className="empty-title">No question papers found</h3>
            <p className="empty-desc">
              {selectedSemester !== 'ALL' || searchQuery
                ? 'No PYQs matched your selected semester or search keywords.'
                : `We have not uploaded question papers for ${courseTitle} yet.`}
            </p>
            {(selectedSemester !== 'ALL' || searchQuery) ? (
              <button 
                type="button" 
                onClick={() => { setSelectedSemester('ALL'); setSearchQuery(''); }} 
                className="empty-cta-btn"
              >
                Reset filters
              </button>
            ) : (
              <Link href="/notes/upload" className="empty-cta-btn">
                Upload Question Paper
              </Link>
            )}
          </div>
        ) : (
          sortedSemesters.map((semKey) => {
            const semNotes = notesBySemester[semKey];
            const semTitle = semKey === 'Other' ? 'General / Other Semester Papers' : `Semester ${semKey}`;

            return (
              <section key={semKey} className="sem-pyq-block">
                <div className="sem-block-header">
                  <div className="sem-block-title-group">
                    <span className="sem-header-badge">{semTitle}</span>
                    <span className="sem-header-count">{semNotes.length} {semNotes.length === 1 ? 'Paper' : 'Papers'}</span>
                  </div>
                  <div className="sem-header-divider" />
                </div>

                <div className="pyq-cards-grid">
                  {semNotes.map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </main>

      {/* ── Component Styles ── */}
      <style jsx>{`
        .course-pyq-page-container {
          width: 100%;
          max-width: 1320px;
          margin: 0 auto;
          padding: 24px 16px 80px;
          box-sizing: border-box;
        }

        .pyq-breadcrumbs {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: var(--sub, #94A3B8);
          margin-bottom: 18px;
          flex-wrap: wrap;
        }
        .pyq-breadcrumbs a {
          color: var(--sub, #94A3B8);
          text-decoration: none;
          transition: color 0.15s;
        }
        .pyq-breadcrumbs a:hover {
          color: #00D1FF;
        }
        :global(.bc-sep) {
          opacity: 0.5;
        }
        .bc-current {
          color: var(--text, #F8FAFC);
          font-weight: 700;
        }

        .back-link-row {
          margin-bottom: 20px;
        }
        .back-courses-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--surface, #111827);
          border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
          color: var(--sub, #94A3B8);
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.15s;
        }
        .back-courses-btn:hover {
          color: #00D1FF;
          border-color: rgba(0, 209, 255, 0.3);
        }

        .selected-course-banner {
          background: var(--surface, #111827);
          border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
          border-radius: 20px;
          padding: clamp(20px, 3.5vw, 32px);
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }
        .banner-icon-box {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          background: rgba(0, 209, 255, 0.12);
          border: 1px solid rgba(0, 209, 255, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #00D1FF;
          flex-shrink: 0;
        }
        .banner-info {
          flex: 1;
          min-width: 260px;
        }
        .banner-tags {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }
        .banner-dept-tag {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #00D1FF;
          background: rgba(0, 209, 255, 0.1);
          border: 1px solid rgba(0, 209, 255, 0.2);
          padding: 2px 8px;
          border-radius: 4px;
        }
        .banner-uni-tag {
          font-size: 10px;
          font-weight: 700;
          color: var(--sub, #94A3B8);
          background: var(--bg, #0B0F17);
          border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
          padding: 2px 8px;
          border-radius: 4px;
        }
        .banner-course-title {
          font-family: var(--font-display, inherit);
          font-size: clamp(1.3rem, 3vw, 1.85rem);
          font-weight: 800;
          color: var(--text, #F8FAFC);
          margin: 0 0 6px;
          line-height: 1.3;
        }
        .banner-course-subtitle {
          font-size: 13px;
          color: var(--sub, #94A3B8);
          margin: 0;
          line-height: 1.5;
        }
        .banner-stats-pill {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 12px 20px;
          background: var(--bg, #0B0F17);
          border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
          border-radius: 14px;
        }
        .banner-stat-num {
          font-size: 22px;
          font-weight: 800;
          color: #00D1FF;
        }
        .banner-stat-lbl {
          font-size: 11px;
          color: var(--sub, #94A3B8);
          font-weight: 600;
          text-transform: uppercase;
        }

        .course-filters-bar {
          background: var(--surface, #111827);
          border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
          border-radius: 16px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 28px;
        }
        .filters-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }
        :global(.search-icon) {
          position: absolute;
          left: 12px;
          color: var(--sub, #94A3B8);
          pointer-events: none;
        }
        .filters-search-input {
          width: 100%;
          padding: 10px 36px 10px 38px;
          border-radius: 10px;
          border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
          background: var(--bg, #0B0F17);
          color: var(--text, #F8FAFC);
          font-size: 13px;
          outline: none;
        }
        .filters-search-input:focus {
          border-color: #00D1FF;
        }
        .search-clear-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: var(--sub, #94A3B8);
          cursor: pointer;
        }

        .sem-chips-scroll {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          padding: 2px 0;
        }
        .sem-chips-scroll::-webkit-scrollbar {
          display: none;
        }
        .sem-filter-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          background: var(--bg, #0B0F17);
          border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
          color: var(--sub, #94A3B8);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
        }
        .sem-filter-btn:hover {
          color: var(--text, #F8FAFC);
          border-color: rgba(16, 185, 129, 0.4);
        }
        .sem-btn-active {
          background: rgba(16, 185, 129, 0.15) !important;
          border-color: #10B981 !important;
          color: #10B981 !important;
        }
        .sem-count-tag {
          font-size: 10px;
          padding: 1px 5px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.08);
        }

        .course-pyqs-content {
          display: flex;
          flex-direction: column;
          gap: 36px;
        }
        .sem-pyq-block {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .sem-block-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sem-block-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sem-header-badge {
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #10B981;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.25);
          padding: 4px 10px;
          border-radius: 6px;
          white-space: nowrap;
        }
        .sem-header-count {
          font-size: 12px;
          color: var(--sub, #94A3B8);
          font-weight: 600;
          white-space: nowrap;
        }
        .sem-header-divider {
          flex: 1;
          height: 1px;
          background: var(--border, rgba(255, 255, 255, 0.08));
        }

        .pyq-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
          width: 100%;
        }

        .pyq-empty-state {
          text-align: center;
          padding: 60px 20px;
          background: var(--surface, #111827);
          border: 1px dashed var(--border, rgba(255, 255, 255, 0.12));
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        :global(.empty-icon) {
          color: #00D1FF;
          opacity: 0.8;
          margin-bottom: 6px;
        }
        .empty-title {
          font-size: 17px;
          font-weight: 700;
          color: var(--text, #F8FAFC);
          margin: 0;
        }
        .empty-desc {
          font-size: 13px;
          color: var(--sub, #94A3B8);
          max-width: 440px;
          margin: 0;
          line-height: 1.5;
        }
        .empty-cta-btn {
          margin-top: 10px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          background: #00D1FF;
          color: #0F172A;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          border: none;
          cursor: pointer;
        }

        @media (max-width: 640px) {
          .course-pyq-page-container {
            padding: 16px 12px 60px;
          }
          .selected-course-banner {
            flex-direction: column;
            align-items: flex-start;
            gap: 14px;
          }
          .pyq-cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
