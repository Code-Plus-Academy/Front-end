'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, 
  GraduationCap, 
  School, 
  ChevronRight, 
  X,
  FileQuestion,
  Sparkles,
  ArrowRight,
  FileText
} from 'lucide-react';

function slugify(name = '') {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export default function UniversityPYQClient({
  uniName,
  uniSlug,
  initialNotes = [],
  colleges = [],
  courses = [],
  departments = [],
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Aggregate notes into Courses directory with metadata
  const courseDirectory = useMemo(() => {
    const map = new Map();

    for (const note of initialNotes) {
      const cId = note.course_id || note.custom_course_name || 'general';
      const cName = note.course_name || note.custom_course_name || 'University-Wide / General';
      const cSlug = note.course_slug || slugify(cName);
      const deptName = note.department_name || null;

      if (!map.has(cId)) {
        map.set(cId, {
          id: cId,
          name: cName,
          slug: cSlug,
          department: deptName,
          totalPapers: 0,
          semesters: new Set(),
        });
      }

      const entry = map.get(cId);
      entry.totalPapers += 1;
      if (note.semester != null) {
        entry.semesters.add(Number(note.semester));
      }
    }

    // Convert to array and format semesters
    return Array.from(map.values()).map((c) => ({
      ...c,
      semesterList: Array.from(c.semesters).sort((a, b) => a - b),
    })).sort((a, b) => b.totalPapers - a.totalPapers);
  }, [initialNotes]);

  // Filtered courses for search
  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return courseDirectory;

    return courseDirectory.filter((crs) => {
      const nameMatch = crs.name.toLowerCase().includes(q);
      const deptMatch = (crs.department || '').toLowerCase().includes(q);
      return nameMatch || deptMatch;
    });
  }, [courseDirectory, searchQuery]);

  return (
    <div className="uni-pyq-container">
      {/* ── Breadcrumbs ── */}
      <nav className="pyq-breadcrumbs" aria-label="Breadcrumb">
        <Link href="/notes">Notes Arena</Link>
        <ChevronRight size={14} className="bc-sep" />
        <Link href="/notes/university">Universities</Link>
        <ChevronRight size={14} className="bc-sep" />
        <span className="bc-current">{uniName}</span>
      </nav>

      {/* University Hero Header */}
      <header className="pyq-hero">
        <div className="pyq-hero-main">
          <div className="pyq-uni-icon-box">
            <School size={32} />
          </div>
          <div className="pyq-hero-text">
            <div className="pyq-verified-tag">
              <Sparkles size={12} />
              <span>University Examination Papers</span>
            </div>
            <h1 className="pyq-main-title">{uniName} – Question Papers</h1>
            <p className="pyq-subtitle">
              Select your Degree Program or Course to access all semester-wise Previous Year Question Papers (PYQs), pattern solutions, and model question papers.
            </p>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="pyq-stats-strip">
          <div className="stat-pill">
            <GraduationCap size={15} className="stat-icon" />
            <span className="stat-val">{courseDirectory.length}</span>
            <span className="stat-lbl">Degree Courses</span>
          </div>
          <div className="stat-pill">
            <FileQuestion size={15} className="stat-icon" />
            <span className="stat-val">{initialNotes.length}</span>
            <span className="stat-lbl">Question Papers</span>
          </div>
          {colleges.length > 0 && (
            <div className="stat-pill">
              <School size={15} className="stat-icon" />
              <span className="stat-val">{colleges.length}</span>
              <span className="stat-lbl">Affiliated Colleges</span>
            </div>
          )}
        </div>
      </header>

      {/* Courses Search Toolbar */}
      <section className="courses-search-bar">
        <div className="search-input-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search courses (e.g. B.Sc Computer Science, Mathematics, B.A., B.Com)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button 
              type="button" 
              onClick={() => setSearchQuery('')} 
              className="search-clear-btn"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </section>

      {/* Courses Grid Directory */}
      <main className="courses-directory-section">
        <div className="section-title-row">
          <h2 className="section-title">Select Your Course / Program</h2>
          <span className="section-counter">{filteredCourses.length} {filteredCourses.length === 1 ? 'Course' : 'Courses'} Available</span>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="pyq-empty-state">
            <FileQuestion size={40} className="empty-icon" />
            <h3 className="empty-title">No matching courses found</h3>
            <p className="empty-desc">
              {searchQuery ? `No degree programs matched "${searchQuery}".` : `No courses are currently registered for ${uniName}.`}
            </p>
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="empty-cta-btn">
                View all courses
              </button>
            )}
          </div>
        ) : (
          <div className="courses-cards-grid">
            {filteredCourses.map((crs) => {
              const courseUrl = `/notes/university/${uniSlug}/pyq/${crs.slug || slugify(crs.name)}`;
              return (
                <Link
                  key={crs.id}
                  href={courseUrl}
                  className="course-portal-card group"
                >
                  <div className="course-card-top">
                    <div className="course-card-badge-row">
                      <span className="course-dept-tag">
                        {crs.department || 'Degree Program'}
                      </span>
                      <span className="course-paper-badge">
                        <FileText size={12} />
                        <span>{crs.totalPapers} {crs.totalPapers === 1 ? 'PYQ' : 'PYQs'}</span>
                      </span>
                    </div>
                    <h3 className="course-card-title">{crs.name}</h3>
                  </div>

                  <div className="course-card-bottom">
                    {crs.semesterList.length > 0 ? (
                      <div className="course-sem-pills">
                        <span className="sem-pills-label">Semesters:</span>
                        <div className="pills-list">
                          {crs.semesterList.map((sem) => (
                            <span key={sem} className="sem-micro-pill">Sem {sem}</span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="sem-pills-label">All Semester Papers</span>
                    )}

                    <div className="course-view-cta">
                      <span>Browse PYQs</span>
                      <ArrowRight size={14} className="cta-arrow" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Component Styles ── */}
      <style jsx>{`
        .uni-pyq-container {
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
          margin-bottom: 24px;
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

        .pyq-hero {
          background: var(--surface, #111827);
          border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
          border-radius: 20px;
          padding: clamp(20px, 4vw, 36px);
          margin-bottom: 28px;
          position: relative;
          overflow: hidden;
        }
        .pyq-hero::before {
          content: '';
          position: absolute;
          top: -60px;
          right: -60px;
          width: 240px;
          height: 240px;
          background: radial-gradient(circle, rgba(0, 209, 255, 0.15) 0%, rgba(0,0,0,0) 70%);
          pointer-events: none;
        }
        .pyq-hero-main {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 24px;
        }
        .pyq-uni-icon-box {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: rgba(0, 209, 255, 0.12);
          border: 1px solid rgba(0, 209, 255, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #00D1FF;
          flex-shrink: 0;
        }
        .pyq-hero-text {
          flex: 1;
        }
        .pyq-verified-tag {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #00D1FF;
          background: rgba(0, 209, 255, 0.1);
          border: 1px solid rgba(0, 209, 255, 0.25);
          padding: 3px 10px;
          border-radius: 20px;
          margin-bottom: 10px;
        }
        .pyq-main-title {
          font-family: var(--font-display, inherit);
          font-size: clamp(1.4rem, 3.8vw, 2.3rem);
          font-weight: 800;
          color: var(--text, #F8FAFC);
          line-height: 1.25;
          margin: 0 0 10px;
          letter-spacing: -0.015em;
        }
        .pyq-subtitle {
          font-size: clamp(0.88rem, 2vw, 0.98rem);
          color: var(--sub, #94A3B8);
          line-height: 1.55;
          margin: 0;
          max-width: 820px;
        }

        .pyq-stats-strip {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          padding-top: 18px;
          border-top: 1px solid var(--border, rgba(255, 255, 255, 0.08));
        }
        .stat-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: var(--bg, #0B0F17);
          border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
          border-radius: 12px;
          font-size: 13px;
        }
        :global(.stat-icon) {
          color: #00D1FF;
        }
        .stat-val {
          font-weight: 800;
          color: var(--text, #F8FAFC);
        }
        .stat-lbl {
          color: var(--sub, #94A3B8);
          font-size: 12px;
        }

        .courses-search-bar {
          margin-bottom: 28px;
        }
        .search-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }
        :global(.search-icon) {
          position: absolute;
          left: 14px;
          color: var(--sub, #94A3B8);
          pointer-events: none;
        }
        .search-input {
          width: 100%;
          padding: 14px 42px 14px 42px;
          border-radius: 14px;
          border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
          background: var(--surface, #111827);
          color: var(--text, #F8FAFC);
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }
        .search-input:focus {
          border-color: #00D1FF;
          box-shadow: 0 0 0 3px rgba(0, 209, 255, 0.15);
        }
        .search-clear-btn {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          color: var(--sub, #94A3B8);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .courses-directory-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .section-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .section-title {
          font-family: var(--font-display, inherit);
          font-size: clamp(1.1rem, 2.5vw, 1.35rem);
          font-weight: 700;
          color: var(--text, #F8FAFC);
          margin: 0;
        }
        .section-counter {
          font-size: 12px;
          font-weight: 600;
          color: var(--sub, #94A3B8);
          background: var(--surface, #111827);
          padding: 4px 12px;
          border-radius: 20px;
          border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
        }

        .courses-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 18px;
        }
        .course-portal-card {
          background: var(--surface, #111827);
          border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
          border-radius: 18px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 20px;
          text-decoration: none;
          transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
          color: inherit;
        }
        .course-portal-card:hover {
          border-color: #00D1FF;
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(0, 209, 255, 0.1);
        }
        .course-card-top {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .course-card-badge-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .course-dept-tag {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #00D1FF;
          background: rgba(0, 209, 255, 0.1);
          border: 1px solid rgba(0, 209, 255, 0.2);
          padding: 3px 8px;
          border-radius: 6px;
        }
        .course-paper-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          color: #10B981;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          padding: 3px 8px;
          border-radius: 6px;
        }
        .course-card-title {
          font-family: var(--font-display, inherit);
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text, #F8FAFC);
          margin: 0;
          line-height: 1.35;
        }
        .course-card-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-top: 14px;
          border-top: 1px solid var(--border, rgba(255, 255, 255, 0.06));
        }
        .course-sem-pills {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sem-pills-label {
          font-size: 11px;
          color: var(--sub, #94A3B8);
          font-weight: 500;
        }
        .pills-list {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }
        .sem-micro-pill {
          font-size: 10px;
          font-weight: 700;
          color: var(--sub, #94A3B8);
          background: var(--bg, #0B0F17);
          border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
          padding: 1px 6px;
          border-radius: 4px;
        }
        .course-view-cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          color: #00D1FF;
          flex-shrink: 0;
        }
        :global(.cta-arrow) {
          transition: transform 0.2s;
        }
        .course-portal-card:hover :global(.cta-arrow) {
          transform: translateX(4px);
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
          .uni-pyq-container {
            padding: 16px 12px 60px;
          }
          .pyq-hero-main {
            flex-direction: column;
            gap: 14px;
          }
          .courses-cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
