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

function getCleanHandle(slug, shortName) {
  if (shortName) {
    return '@' + shortName.toLowerCase().replace(/[^a-z0-9_]/g, '');
  }
  if (!slug) return '@university';
  let clean = slug.replace(/-[a-f0-9]{4,8}$/i, '').replace(/-\d{4,6}$/, '');
  const parts = clean.split('-').filter(Boolean);
  if (parts.length > 4) {
    clean = parts.slice(0, 4).join('-');
  }
  return '@' + clean;
}

export default function UniversityHubClient({
  university = {},
  colleges = [],
  courses = [],
  notes = [],
  initialTab = 'colleges',
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'colleges' | 'notes'
  const cleanUniHandle = getCleanHandle(university.slug, university.short_name);
  const [collegeSearch, setCollegeSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState('a-z');

  // Notes filters
  const [notesSearch, setNotesSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSem, setSelectedSem] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('All Courses');
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

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

  // Derived Course Options
  const courseOptions = useMemo(() => {
    const set = new Set([
      'Bachelor of Computer Applications (BCA)',
      'Bachelor Of Computer Science (NEP)',
      'Bachelor of Science (Computer Science)',
    ]);
    safeCourses.forEach((c) => {
      const name = typeof c === 'string' ? c : c?.name || c?.short_name || c?.title;
      if (name && name.trim()) set.add(name.trim());
    });
    safeNotes.forEach((n) => {
      const cName = n?.course_name || n?.custom_course_name || n?.course;
      if (cName && typeof cName === 'string' && cName.trim()) set.add(cName.trim());
    });
    return ['All Courses', ...Array.from(set)];
  }, [safeCourses, safeNotes]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCourse !== 'All Courses') count++;
    if (selectedYear !== 'All Years') count++;
    if (selectedSubject !== 'All Subjects') count++;
    if (selectedSem !== 'all') count++;
    if (selectedType !== 'all') count++;
    return count;
  }, [selectedCourse, selectedYear, selectedSubject, selectedSem, selectedType]);

  const clearNotesFilters = () => {
    setSelectedCourse('All Courses');
    setSelectedYear('All Years');
    setSelectedSubject('All Subjects');
    setSelectedSem('all');
    setSelectedType('all');
    setNotesSearch('');
  };

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

      if (notesSearch.trim()) {
        const q = notesSearch.toLowerCase().trim();
        const titleMatch = n.title && n.title.toLowerCase().includes(q);
        const colMatch = n._collegeName && n._collegeName.toLowerCase().includes(q);
        const subMatch = n.subject_name && n.subject_name.toLowerCase().includes(q);
        if (!titleMatch && !colMatch && !subMatch) return false;
      }
      return true;
    });
  }, [
    safeNotes,
    selectedType,
    selectedSem,
    selectedCourse,
    selectedYear,
    selectedSubject,
    notesSearch,
  ]);

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
          max-width: 1200px;
          margin: 0 auto;
          box-sizing: border-box;
        }

        /* Top Breadcrumb & Actions */
        .uni-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          gap: 12px;
        }
        .uni-crumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--sub);
          font-weight: 500;
          flex-wrap: wrap;
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
          flex-shrink: 0;
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
          font-size: clamp(20px, 3.2vw, 32px);
          font-weight: 800;
          color: var(--text);
          margin: 0 0 10px;
          line-height: 1.25;
          word-break: break-word;
        }
        .uni-badge-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          flex-wrap: wrap;
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
          width: 280px;
          height: 170px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.9;
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
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
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
          white-space: nowrap;
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
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text);
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.2s ease;
          height: 44px;
          white-space: nowrap;
        }
        .uni-filter-btn:hover {
          background: var(--s2);
          border-color: rgba(0, 180, 216, 0.4);
        }
        .uni-filter-btn.active {
          background: rgba(0, 180, 216, 0.12);
          border-color: rgba(0, 180, 216, 0.4);
          color: var(--green, #00b4d8);
        }
        .uni-filter-count-badge {
          background: var(--green, #00b4d8);
          color: #fff;
          font-size: 11px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 10px;
          line-height: 1;
        }

        /* Active Filter Chips Bar */
        .uni-active-chips-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          padding: 2px 0;
        }
        .uni-active-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          background: rgba(0, 180, 216, 0.1);
          color: var(--green, #00b4d8);
          border: 1px solid rgba(0, 180, 216, 0.25);
          padding: 5px 12px;
          border-radius: 20px;
        }
        .uni-active-chip-remove {
          cursor: pointer;
          font-size: 14px;
          opacity: 0.7;
          display: inline-flex;
          align-items: center;
        }
        .uni-active-chip-remove:hover {
          opacity: 1;
        }

        /* Filter Popup Modal Styles */
        .uni-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(6px);
          z-index: 999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeInModal 0.2s ease-out;
        }

        .uni-modal-card {
          background: var(--surface, #121824);
          border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
          border-radius: 24px;
          width: 100%;
          max-width: 620px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
          overflow: hidden;
          animation: slideUpModal 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .uni-modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .uni-modal-title {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 800;
          color: var(--text);
          margin: 0;
        }
        .uni-modal-subtitle {
          font-size: 12px;
          color: var(--sub);
          margin: 2px 0 0;
        }
        .uni-modal-close-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--sub);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .uni-modal-close-btn:hover {
          background: var(--s2);
          color: var(--text);
        }

        .uni-modal-body {
          padding: 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 22px;
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
          -webkit-overflow-scrolling: touch;
          max-width: 100%;
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
          flex-shrink: 0;
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
          word-break: break-word;
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
          border: 1px solid var(--border);
          border-radius: 16px;
          color: var(--sub);
        }

        /* 🎬 YouTube Channel Page Header Mobile Layout */
        .yt-mobile-header {
          display: none;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          overflow: hidden;
          margin-bottom: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        }

        .yt-mob-banner-box {
          width: 100%;
          height: 110px;
          background: linear-gradient(135deg, #0ea5e9 0%, #312e81 50%, #4338ca 100%);
          position: relative;
        }
        .yt-mob-banner-gradient {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 80% 20%, rgba(56, 189, 248, 0.35) 0%, transparent 60%);
        }

        .yt-mob-content {
          padding: 0 16px 20px;
        }
        .yt-mob-avatar-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: -36px;
          margin-bottom: 12px;
        }
        .yt-mob-avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: #0f172a;
          border: 3.5px solid var(--surface);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        }

        .yt-mob-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .yt-mob-title {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 800;
          color: var(--text);
          margin: 0;
          line-height: 1.25;
          word-break: break-word;
        }
        .yt-mob-handle {
          font-size: 13px;
          font-weight: 500;
          color: var(--sub);
        }
        .yt-mob-stats {
          font-size: 12.5px;
          color: var(--sub);
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .yt-dot {
          color: var(--border-bright, #475569);
          font-weight: bold;
        }
        .yt-mob-desc {
          font-size: 13px;
          color: var(--sub);
          line-height: 1.45;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .yt-more-btn {
          background: none;
          border: none;
          color: var(--text);
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          font-size: 13px;
        }
        .yt-mob-links {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          margin-top: 2px;
        }
        .yt-link-text {
          color: #38bdf8;
          font-weight: 600;
          text-decoration: none;
        }

        .yt-mob-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 14px;
        }
        .yt-mob-sub-btn {
          width: 100%;
          padding: 11px 0;
          border-radius: 24px;
          background: #f8fafc;
          color: #0f172a;
          border: none;
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .yt-mob-secondary-actions {
          display: flex;
          gap: 8px;
        }
        .yt-mob-outline-btn {
          flex: 1;
          padding: 9px 0;
          border-radius: 20px;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text);
          font-size: 12.5px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
        }

        /* 📱 RESPONSIVE BREAKPOINTS (Mobile & Tablet) */
        @media (max-width: 768px) {
          .uni-hero-card {
            display: none !important;
          }
          .yt-mobile-header {
            display: block !important;
          }
          .uni-hero-graphic {
            display: none !important;
          }
          .uni-action-btns {
            width: 100%;
            flex-direction: column;
          }
          .uni-btn-primary, .uni-btn-ghost {
            width: 100%;
            justify-content: center;
          }
          .uni-stats-grid {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .uni-stat-card {
            padding: 12px 14px;
            gap: 10px;
          }
          .uni-stat-icon {
            width: 38px;
            height: 38px;
            font-size: 18px;
          }
          .uni-stat-val {
            font-size: 16px;
          }
          .uni-stat-label {
            font-size: 11px;
          }
          .uni-chips-row {
            flex-direction: column;
            align-items: stretch;
          }
          .uni-sort-select {
            width: 100%;
          }
          .uni-college-item {
            padding: 14px 16px;
          }
          .uni-col-icon {
            width: 42px;
            height: 42px;
            font-size: 20px;
          }
          .uni-col-title {
            font-size: 14px;
          }
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

      {/* 📱 Mobile YouTube Channel Page Header */}
      <div className="yt-mobile-header">
        <div className="yt-mob-banner-box">
          <div className="yt-mob-banner-gradient" />
        </div>

        <div className="yt-mob-content">
          <div className="yt-mob-avatar-row">
            <div className="yt-mob-avatar">
              <span className="material-symbols-rounded" style={{ fontSize: 36, color: '#38bdf8' }}>
                domain
              </span>
            </div>
          </div>

          <div className="yt-mob-info">
            <h1 className="yt-mob-title">{university.name}</h1>
            <div className="yt-mob-handle">{cleanUniHandle}</div>

            <div className="yt-mob-stats">
              <span>{safeColleges.length} colleges</span>
              <span className="yt-dot">•</span>
              <span>{pyqCount} pyqs</span>
              <span className="yt-dot">•</span>
              <span>{notesCount} notes</span>
            </div>

            <div className="yt-mob-desc">
              <span>About Us – {university.name}</span>
              <button
                onClick={() => setActiveTab('about')}
                className="yt-more-btn"
              >
                ...more
              </button>
            </div>

            {university.website_url && (
              <div className="yt-mob-links">
                <span className="material-symbols-rounded" style={{ fontSize: 15, color: '#38bdf8' }}>
                  link
                </span>
                <a href={university.website_url} target="_blank" rel="noopener noreferrer" className="yt-link-text">
                  {university.website_url.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}

            <div className="yt-mob-actions">
              {university.website_url ? (
                <a
                  href={university.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="yt-mob-sub-btn"
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                    open_in_new
                  </span>
                  Visit Official Website
                </a>
              ) : (
                <button className="yt-mob-sub-btn" onClick={copyLink}>
                  <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                    share
                  </span>
                  Share University Page
                </button>
              )}

              <div className="yt-mob-secondary-actions">
                <button className="yt-mob-outline-btn" onClick={copyLink}>
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
                    content_copy
                  </span>
                  Copy Link
                </button>

                <button className="yt-mob-outline-btn" onClick={copyLink}>
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
                    share
                  </span>
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 💻 Desktop YouTube Channel Page Header */}
      <div className="uni-hero-card">
        <div className="yt-desk-banner">
          <div className="yt-desk-banner-overlay" />
        </div>

        <div className="yt-desk-content">
          <div className="yt-desk-avatar-container">
            <div className="yt-desk-avatar">
              <span className="material-symbols-rounded" style={{ fontSize: 64, color: '#38bdf8' }}>
                domain
              </span>
            </div>
          </div>

          <div className="yt-desk-headline-info">
            <h1 className="yt-desk-title">{university.name}</h1>

            <div className="yt-desk-meta-row">
              <span className="yt-desk-handle">{cleanUniHandle}</span>
              <span className="yt-dot">•</span>
              <span>{safeColleges.length} affiliated colleges</span>
              <span className="yt-dot">•</span>
              <span>{pyqCount} pyqs</span>
              <span className="yt-dot">•</span>
              <span>{notesCount} class notes</span>
            </div>

            <div className="yt-desk-desc-row">
              <span>About Us – {university.name}. Official University Hub for Previous Year Question Papers, Notes, Courses and Colleges.</span>
              <button
                onClick={() => setActiveTab('about')}
                className="yt-more-btn"
              >
                ...more
              </button>
            </div>

            {university.website_url && (
              <div className="yt-desk-attribution-row">
                <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#38bdf8' }}>
                  link
                </span>
                <a href={university.website_url} target="_blank" rel="noopener noreferrer" className="yt-link-text">
                  {university.website_url.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}

            <div className="yt-desk-actions-row">
              {university.website_url ? (
                <a
                  href={university.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="yt-desk-sub-btn"
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                    open_in_new
                  </span>
                  Visit Official Website
                </a>
              ) : (
                <button className="yt-desk-sub-btn" onClick={copyLink}>
                  <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                    share
                  </span>
                  Share University Page
                </button>
              )}

              <button className="yt-desk-pill-btn" onClick={copyLink}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                  content_copy
                </span>
                Copy Link
              </button>

              <button className="yt-desk-pill-btn" onClick={copyLink}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                  share
                </span>
                Share Page
              </button>
            </div>
          </div>
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

      {/* 🎬 YouTube Channel Page Header Tab Group Bar */}
      <div className="single-column-browse-results-tabs yt-tab-group-bar" role="tablist">
        <div className="yt-tab-list" role="tablist">
          <button
            className={`yt-tab-item ${activeTab === 'colleges' ? 'active' : ''}`}
            onClick={() => setActiveTab('colleges')}
            role="tab"
            aria-selected={activeTab === 'colleges'}
          >
            <span>Affiliated Colleges</span>
            {safeColleges.length > 0 && <span className="yt-tab-badge">{safeColleges.length}</span>}
            {activeTab === 'colleges' && <div className="yt-tab-underline" />}
          </button>

          <button
            className={`yt-tab-item ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveTab('notes')}
            role="tab"
            aria-selected={activeTab === 'notes'}
          >
            <span>Study Materials</span>
            {notesCount > 0 && <span className="yt-tab-badge">{notesCount}</span>}
            {activeTab === 'notes' && <div className="yt-tab-underline" />}
          </button>
        </div>
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

              <button
                className={`uni-filter-btn ${activeFilterCount > 0 ? 'active' : ''}`}
                onClick={() => setIsFilterModalOpen(true)}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>
                  tune
                </span>
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className="uni-filter-count-badge">{activeFilterCount}</span>
                )}
              </button>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearNotesFilters}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--green, #00b4d8)',
                    background: 'rgba(0, 180, 216, 0.1)',
                    border: '1px solid rgba(0, 180, 216, 0.2)',
                    padding: '8px 14px',
                    borderRadius: 20,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    height: 44,
                  }}
                >
                  Reset Filters ✕
                </button>
              )}
            </div>

            {/* Quick Type Chips */}
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

            {/* Active Filter Chips Bar */}
            {activeFilterCount > 0 && (
              <div className="uni-active-chips-bar">
                {selectedCourse !== 'All Courses' && (
                  <span className="uni-active-chip">
                    Course: {selectedCourse}
                    <span
                      className="uni-active-chip-remove"
                      onClick={() => setSelectedCourse('All Courses')}
                    >
                      ✕
                    </span>
                  </span>
                )}
                {selectedYear !== 'All Years' && (
                  <span className="uni-active-chip">
                    Year: {selectedYear}
                    <span
                      className="uni-active-chip-remove"
                      onClick={() => setSelectedYear('All Years')}
                    >
                      ✕
                    </span>
                  </span>
                )}
                {selectedSubject !== 'All Subjects' && (
                  <span className="uni-active-chip">
                    Subject: {selectedSubject}
                    <span
                      className="uni-active-chip-remove"
                      onClick={() => setSelectedSubject('All Subjects')}
                    >
                      ✕
                    </span>
                  </span>
                )}
                {selectedSem !== 'all' && (
                  <span className="uni-active-chip">
                    Sem: Sem {selectedSem}
                    <span
                      className="uni-active-chip-remove"
                      onClick={() => setSelectedSem('all')}
                    >
                      ✕
                    </span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Filter Popup Modal */}
          {isFilterModalOpen && (
            <div className="uni-modal-overlay" onClick={() => setIsFilterModalOpen(false)}>
              <div className="uni-modal-card" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="uni-modal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      className="material-symbols-rounded"
                      style={{ color: 'var(--green, #00b4d8)', fontSize: 24 }}
                    >
                      tune
                    </span>
                    <div>
                      <h3 className="uni-modal-title">Filter Study Materials</h3>
                      <p className="uni-modal-subtitle">
                        {activeFilterCount > 0
                          ? `${activeFilterCount} active filter(s) applied`
                          : 'Select filter options below'}
                      </p>
                    </div>
                  </div>
                  <button
                    className="uni-modal-close-btn"
                    onClick={() => setIsFilterModalOpen(false)}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                      close
                    </span>
                  </button>
                </div>

                {/* Modal Body */}
                <div className="uni-modal-body">
                  {/* Filter by Course */}
                  <div className="modal-filter-group">
                    <label className="modal-filter-label">Filter by Course</label>
                    <div className="modal-chips-flex">
                      {courseOptions.map((crs) => (
                        <button
                          key={crs}
                          className={`modal-chip ${selectedCourse === crs ? 'active' : ''}`}
                          onClick={() => setSelectedCourse(crs)}
                        >
                          {crs}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filter by Academic Year */}
                  <div className="modal-filter-group">
                    <label className="modal-filter-label">Filter by Academic Year</label>
                    <div className="modal-chips-flex">
                      {YEAR_FILTERS.map((yr) => (
                        <button
                          key={yr}
                          className={`modal-chip ${selectedYear === yr ? 'active' : ''}`}
                          onClick={() => setSelectedYear(yr)}
                        >
                          {yr}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filter by Subject */}
                  <div className="modal-filter-group">
                    <label className="modal-filter-label">Filter by Subject</label>
                    <div className="modal-chips-flex">
                      {SUBJECT_FILTERS.map((sb) => (
                        <button
                          key={sb}
                          className={`modal-chip ${selectedSubject === sb ? 'active' : ''}`}
                          onClick={() => setSelectedSubject(sb)}
                        >
                          {sb}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filter by Semester */}
                  <div className="modal-filter-group">
                    <label className="modal-filter-label">Filter by Semester</label>
                    <div className="modal-chips-flex">
                      {SEMESTER_FILTERS.map((sf) => (
                        <button
                          key={sf.value}
                          className={`modal-chip ${selectedSem === sf.value ? 'active' : ''}`}
                          onClick={() => setSelectedSem(sf.value)}
                        >
                          {sf.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="col-modal-footer">
                  <button className="col-modal-btn-reset" onClick={clearNotesFilters}>
                    Clear All
                  </button>
                  <button
                    className="col-modal-btn-apply"
                    onClick={() => setIsFilterModalOpen(false)}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}

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
