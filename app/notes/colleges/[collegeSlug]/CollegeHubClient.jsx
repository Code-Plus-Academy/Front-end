'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import api from '../../../../src/api/axios';

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
  const [activeTab, setActiveTab] = useState(initialTab || 'all'); // 'all' | 'notes' | 'books' | 'pyqs' | 'about'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('All Courses');
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [selectedSem, setSelectedSem] = useState('all');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

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
    (n?.title && n.title.toLowerCase().includes('pyq'));

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
    return count;
  }, [selectedCourse, selectedYear, selectedSubject, selectedSem]);

  // Filtered Notes list
  const filteredNotes = useMemo(() => {
    return safeNotes.filter((n) => {
      // Tab / Section filter
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
        if (!titleMatch && !subMatch) return false;
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
          max-width: 1200px;
          margin: 0 auto;
          box-sizing: border-box;
        }

        /* Top Header Nav & Icons */
        .col-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          gap: 12px;
        }
        .col-crumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--sub);
          font-weight: 500;
          flex-wrap: wrap;
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
          flex-shrink: 0;
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
          font-size: clamp(18px, 2.8vw, 26px);
          font-weight: 800;
          color: var(--text);
          margin: 0 0 10px;
          line-height: 1.3;
          word-break: break-word;
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
          max-width: 100%;
          line-height: 1.4;
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
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
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
          white-space: nowrap;
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

        /* Search & Filter Controls */
        .col-filter-wrapper {
          display: flex;
          flex-direction: column;
          gap: 12px;
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

        .col-filter-trigger-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 12px;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text);
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          height: 44px;
        }
        .col-filter-trigger-btn:hover {
          background: var(--s2);
          border-color: rgba(0, 180, 216, 0.4);
        }
        .col-filter-trigger-btn.active {
          background: rgba(0, 180, 216, 0.12);
          border-color: rgba(0, 180, 216, 0.4);
          color: var(--green, #00b4d8);
        }
        .col-filter-count-badge {
          background: var(--green, #00b4d8);
          color: #fff;
          font-size: 11px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 10px;
          line-height: 1;
        }

        /* Active Filters Tags Bar */
        .active-chips-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          padding: 2px 0;
        }
        .active-tag-chip {
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
        .active-tag-remove {
          cursor: pointer;
          font-size: 14px;
          opacity: 0.7;
          display: inline-flex;
          align-items: center;
        }
        .active-tag-remove:hover {
          opacity: 1;
        }

        /* Filter Popup Modal Styles */
        .col-modal-overlay {
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

        @keyframes fadeInModal {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .col-modal-card {
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

        @keyframes slideUpModal {
          from { transform: translateY(20px) scale(0.97); }
          to { transform: translateY(0) scale(1); }
        }

        .col-modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .col-modal-title {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 800;
          color: var(--text);
          margin: 0;
        }
        .col-modal-subtitle {
          font-size: 12px;
          color: var(--sub);
          margin: 2px 0 0;
        }
        .col-modal-close-btn {
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
        .col-modal-close-btn:hover {
          background: var(--s2);
          color: var(--text);
        }

        .col-modal-body {
          padding: 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .modal-filter-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .modal-filter-label {
          font-size: 13px;
          font-weight: 700;
          color: var(--text);
          letter-spacing: 0.01em;
        }
        .modal-chips-flex {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .modal-chip {
          padding: 7px 15px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--sub);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .modal-chip:hover {
          color: var(--text);
          border-color: var(--border-bright);
        }
        .modal-chip.active {
          background: rgba(0, 180, 216, 0.15);
          color: var(--green, #00b4d8);
          border-color: rgba(0, 180, 216, 0.4);
          font-weight: 700;
        }

        .col-modal-footer {
          padding: 16px 24px;
          border-top: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--surface);
        }
        .col-modal-btn-reset {
          padding: 10px 18px;
          border-radius: 10px;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--sub);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .col-modal-btn-reset:hover {
          background: var(--s2);
          color: var(--text);
        }
        .col-modal-btn-apply {
          padding: 10px 24px;
          border-radius: 10px;
          background: var(--green, #00b4d8);
          border: none;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(0, 180, 216, 0.25);
        }
        .col-modal-btn-apply:hover {
          opacity: 0.92;
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
          word-break: break-word;
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
          .col-hero-card {
            display: none !important;
          }
          .yt-mobile-header {
            display: block !important;
          }
          .col-stats-grid {
            width: 100%;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .col-stat-box {
            padding: 12px 14px;
            gap: 10px;
          }
          .col-stat-icon {
            width: 36px;
            height: 36px;
            font-size: 18px;
          }
          .col-stat-num {
            font-size: 16px;
          }
          .col-stat-lbl {
            font-size: 11px;
          }
          .col-action-row {
            width: 100%;
            flex-direction: column;
          }
          .col-btn-teal, .col-btn-outline {
            width: 100%;
            justify-content: center;
          }
          .col-resource-item {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            padding: 14px 16px;
          }
          .res-left {
            align-items: flex-start;
            gap: 12px;
          }
          .res-dl-btn {
            width: 100%;
            justify-content: center;
          }
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

      {/* 📱 Mobile YouTube Channel Page Header */}
      <div className="yt-mobile-header">
        <div className="yt-mob-banner-box">
          <div className="yt-mob-banner-gradient" />
        </div>

        <div className="yt-mob-content">
          <div className="yt-mob-avatar-row">
            <div className="yt-mob-avatar">
              <span className="material-symbols-rounded" style={{ fontSize: 36, color: '#00b4d8' }}>
                school
              </span>
            </div>
          </div>

          <div className="yt-mob-info">
            <h1 className="yt-mob-title">{college.name}</h1>
            <div className="yt-mob-handle">{cleanCollegeHandle}</div>

            <div className="yt-mob-stats">
              <span>{safeCourses.length || courseOptions.length - 1} courses</span>
              <span className="yt-dot">•</span>
              <span>{notesCount} notes</span>
              <span className="yt-dot">•</span>
              <span>{pyqCount} pyqs</span>
              <span className="yt-dot">•</span>
              <span>{booksCount} books</span>
            </div>

            <div className="yt-mob-desc">
              <span>About Us – {college.name}</span>
              <button
                onClick={() => setActiveTab('about')}
                className="yt-more-btn"
              >
                ...more
              </button>
            </div>

            <div className="yt-mob-links">
              <span className="material-symbols-rounded" style={{ fontSize: 15, color: '#00b4d8' }}>
                link
              </span>
              <Link href={university?.slug ? `/notes/university/${university.slug}` : '/notes/university'} className="yt-link-text">
                Affiliated to {uniName}
              </Link>
            </div>

            <div className="yt-mob-actions">
              <button
                className="yt-mob-sub-btn"
                onClick={() => setIsClaimModalOpen(true)}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                  verified_user
                </span>
                Claim this page
              </button>

              <div className="yt-mob-secondary-actions">
                <button
                  className="yt-mob-outline-btn"
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
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
                    map
                  </span>
                  View on Map
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
      <div className="col-hero-card">
        <div className="yt-desk-banner">
          <div className="yt-desk-banner-overlay" />
        </div>

        <div className="yt-desk-content">
          <div className="yt-desk-avatar-container">
            <div className="yt-desk-avatar">
              <span className="material-symbols-rounded" style={{ fontSize: 64, color: '#00b4d8' }}>
                school
              </span>
            </div>
          </div>

          <div className="yt-desk-headline-info">
            <h1 className="yt-desk-title">{college.name}</h1>

            <div className="yt-desk-meta-row">
              <span className="yt-desk-handle">{cleanCollegeHandle}</span>
              <span className="yt-dot">•</span>
              <span>{safeCourses.length || courseOptions.length - 1} courses</span>
              <span className="yt-dot">•</span>
              <span>{notesCount} class notes</span>
              <span className="yt-dot">•</span>
              <span>{pyqCount} pyqs</span>
              <span className="yt-dot">•</span>
              <span>{booksCount} books</span>
            </div>

            <div className="yt-desk-desc-row">
              <span>About Us – {college.name} ({college.location || 'Maharashtra, India'}).</span>
              <button
                onClick={() => setActiveTab('about')}
                className="yt-more-btn"
              >
                ...more
              </button>
            </div>

            <div className="yt-desk-attribution-row">
              <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#00b4d8' }}>
                link
              </span>
              <Link href={university?.slug ? `/notes/university/${university.slug}` : '/notes/university'} className="yt-link-text">
                Affiliated to {uniName}
              </Link>
            </div>

            <div className="yt-desk-actions-row col-action-row">
              <button
                className="yt-desk-sub-btn"
                onClick={() => setIsClaimModalOpen(true)}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                  verified_user
                </span>
                Claim this page
              </button>

              <button
                className="yt-desk-pill-btn"
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

      {/* 🎬 YouTube Channel Page Header Tab Group Bar */}
      <div className="single-column-browse-results-tabs yt-tab-group-bar" role="tablist">
        <div className="yt-tab-list" role="tablist">
          <button
            className={`yt-tab-item ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
            role="tab"
            aria-selected={activeTab === 'all'}
          >
            <span>All Materials</span>
            {safeNotes.length > 0 && <span className="yt-tab-badge">{safeNotes.length}</span>}
            {activeTab === 'all' && <div className="yt-tab-underline" />}
          </button>

          <button
            className={`yt-tab-item ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveTab('notes')}
            role="tab"
            aria-selected={activeTab === 'notes'}
          >
            <span>Class Notes</span>
            {notesCount > 0 && <span className="yt-tab-badge">{notesCount}</span>}
            {activeTab === 'notes' && <div className="yt-tab-underline" />}
          </button>

          <button
            className={`yt-tab-item ${activeTab === 'books' ? 'active' : ''}`}
            onClick={() => setActiveTab('books')}
            role="tab"
            aria-selected={activeTab === 'books'}
          >
            <span>Books</span>
            {booksCount > 0 && <span className="yt-tab-badge">{booksCount}</span>}
            {activeTab === 'books' && <div className="yt-tab-underline" />}
          </button>

          <button
            className={`yt-tab-item ${activeTab === 'pyqs' ? 'active' : ''}`}
            onClick={() => setActiveTab('pyqs')}
            role="tab"
            aria-selected={activeTab === 'pyqs'}
          >
            <span>Question Papers</span>
            {pyqCount > 0 && <span className="yt-tab-badge">{pyqCount}</span>}
            {activeTab === 'pyqs' && <div className="yt-tab-underline" />}
          </button>

          <button
            className={`yt-tab-item ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
            role="tab"
            aria-selected={activeTab === 'about'}
          >
            <span>About College</span>
            {activeTab === 'about' && <div className="yt-tab-underline" />}
          </button>
        </div>
      </div>

      {/* STUDY MATERIALS / NOTES / BOOKS / PYQS CONTENT */}
      {activeTab !== 'about' && (
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
                  placeholder="Search notes, books, subjects, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <button
                className={`col-filter-trigger-btn ${activeFilterCount > 0 ? 'active' : ''}`}
                onClick={() => setIsFilterModalOpen(true)}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>
                  tune
                </span>
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className="col-filter-count-badge">{activeFilterCount}</span>
                )}
              </button>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
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

            {/* Active Filter Chips Bar */}
            {activeFilterCount > 0 && (
              <div className="active-chips-bar">
                {selectedCourse !== 'All Courses' && (
                  <span className="active-tag-chip">
                    Course: {selectedCourse}
                    <span
                      className="active-tag-remove"
                      onClick={() => setSelectedCourse('All Courses')}
                    >
                      ✕
                    </span>
                  </span>
                )}
                {selectedYear !== 'All Years' && (
                  <span className="active-tag-chip">
                    Year: {selectedYear}
                    <span
                      className="active-tag-remove"
                      onClick={() => setSelectedYear('All Years')}
                    >
                      ✕
                    </span>
                  </span>
                )}
                {selectedSubject !== 'All Subjects' && (
                  <span className="active-tag-chip">
                    Subject: {selectedSubject}
                    <span
                      className="active-tag-remove"
                      onClick={() => setSelectedSubject('All Subjects')}
                    >
                      ✕
                    </span>
                  </span>
                )}
                {selectedSem !== 'all' && (
                  <span className="active-tag-chip">
                    Sem: Sem {selectedSem}
                    <span
                      className="active-tag-remove"
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
            <div className="col-modal-overlay" onClick={() => setIsFilterModalOpen(false)}>
              <div className="col-modal-card" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="col-modal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      className="material-symbols-rounded"
                      style={{ color: 'var(--green, #00b4d8)', fontSize: 24 }}
                    >
                      tune
                    </span>
                    <div>
                      <h3 className="col-modal-title">Filter Resources</h3>
                      <p className="col-modal-subtitle">
                        {activeFilterCount > 0
                          ? `${activeFilterCount} active filter(s) applied`
                          : 'Select filter options below'}
                      </p>
                    </div>
                  </div>
                  <button
                    className="col-modal-close-btn"
                    onClick={() => setIsFilterModalOpen(false)}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                      close
                    </span>
                  </button>
                </div>

                {/* Modal Body */}
                <div className="col-modal-body">
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
                  <button className="col-modal-btn-reset" onClick={clearFilters}>
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
                        {isBookItem(n)
                          ? 'auto_stories'
                          : isPyqItem(n)
                          ? 'quiz'
                          : 'description'}
                      </span>
                      <span className="res-pdf-lbl">
                        {isBookItem(n)
                          ? 'BOOK'
                          : isPyqItem(n)
                          ? 'PYQ'
                          : 'PDF'}
                      </span>
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
                        {(n.course_name || n.custom_course_name) && (
                          <span
                            className="res-badge-year"
                            style={{
                              background: 'rgba(0, 180, 216, 0.1)',
                              color: 'var(--green, #00b4d8)',
                            }}
                          >
                            {n.course_name || n.custom_course_name}
                          </span>
                        )}
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
                {activeTab === 'books'
                  ? 'auto_stories'
                  : activeTab === 'pyqs'
                  ? 'quiz'
                  : 'description'}
              </span>
              <h3>
                {activeTab === 'books'
                  ? 'No books found'
                  : activeTab === 'notes'
                  ? 'No class notes found'
                  : activeTab === 'pyqs'
                  ? 'No question papers found'
                  : 'No study materials found'}
              </h3>
              <p style={{ fontSize: 13, marginTop: 4 }}>
                Try adjusting your search query, course, or filter chips above.
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

      {/* Institutional Claim Modal */}
      {isClaimModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }} onClick={() => setIsClaimModalOpen(false)}>
          <div style={{
            background: '#1e293b', border: '1px solid #334155', borderRadius: 16,
            width: '100%', maxWidth: 500, padding: 24, color: '#fff',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)', position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-rounded" style={{ color: '#38bdf8' }}>verified_user</span>
                Claim {college.name || 'Institution'} Page
              </h3>
              <button
                onClick={() => setIsClaimModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}
              >
                ✕
              </button>
            </div>

            {claimSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 48, color: '#34d399', marginBottom: 12 }}>
                  check_circle
                </span>
                <h4 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>Claim Submitted Successfully</h4>
                <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  Your official institutional claim has been logged and is pending compliance review. Our verification team will contact you at <strong>{claimForm.work_email}</strong>.
                </p>
                <button
                  onClick={() => {
                    setIsClaimModalOpen(false);
                    setClaimSuccess(false);
                    setClaimForm({ applicant_name: '', work_email: '', designation: '', proof_url: '', notes: '' });
                  }}
                  style={{
                    marginTop: 16, padding: '8px 20px', background: '#38bdf8', color: '#0f172a',
                    border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit}>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 16 }}>
                  Are you an authorized representative of this institution? Submit your details to claim management access.
                </p>

                {claimError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: 10, borderRadius: 8, fontSize: '0.85rem', marginBottom: 12 }}>
                    {claimError}
                  </div>
                )}

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: 4 }}>Applicant Full Name *</label>
                  <input
                    type="text"
                    required
                    value={claimForm.applicant_name}
                    onChange={e => setClaimForm({ ...claimForm, applicant_name: e.target.value })}
                    placeholder="e.g. Dr. Ramesh Sharma"
                    style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: 4 }}>Official Work Email *</label>
                  <input
                    type="email"
                    required
                    value={claimForm.work_email}
                    onChange={e => setClaimForm({ ...claimForm, work_email: e.target.value })}
                    placeholder="e.g. ramesh@college.edu.in"
                    style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: 4 }}>Designation / Title *</label>
                  <input
                    type="text"
                    required
                    value={claimForm.designation}
                    onChange={e => setClaimForm({ ...claimForm, designation: e.target.value })}
                    placeholder="e.g. Dean of Academic Affairs / Registrar"
                    style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: 4 }}>Proof Document / ID Link *</label>
                  <input
                    type="url"
                    required
                    value={claimForm.proof_url}
                    onChange={e => setClaimForm({ ...claimForm, proof_url: e.target.value })}
                    placeholder="https://college.edu.in/staff-profile or ID card URL"
                    style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: 4 }}>Additional Verification Notes</label>
                  <textarea
                    rows={3}
                    value={claimForm.notes}
                    onChange={e => setClaimForm({ ...claimForm, notes: e.target.value })}
                    placeholder="Provide any additional context or authorization details..."
                    style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: '0.9rem', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setIsClaimModalOpen(false)}
                    style={{ padding: '10px 18px', background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', borderRadius: 8, cursor: 'pointer', fontSize: '0.9rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={claiming}
                    style={{ padding: '10px 20px', background: '#38bdf8', border: 'none', color: '#0f172a', borderRadius: 8, fontWeight: 700, cursor: claiming ? 'default' : 'pointer', opacity: claiming ? 0.7 : 1, fontSize: '0.9rem' }}
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
