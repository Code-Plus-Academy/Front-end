import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  FileText,
  Code,
  Cpu,
  Calendar,
  Landmark,
  BookOpen,
  CloudUpload,
  GraduationCap,
  Trophy,
  ChevronRight,
} from 'lucide-react';
import NoteCard from '../../src/components/notes/NoteCard';
import SearchBar from '../../src/components/notes/SearchBar';
import { queryTable, enrichNotesWithSocialUploaders } from '../../src/lib/supabaseContent';

// Incremental Static Regeneration (1-hour edge cache with on-demand revalidation)
export const revalidate = 3600;

export const metadata = {
  title: 'Notes Arena — Free Study Material, PYQs & College Notes | FocusGram',
  description: 'Download college question papers, notes, study material, books, lab manuals, and guides from Notes Arena on FocusGram.',
  alternates: {
    canonical: '/notes',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// Default initial stats fallback
const INITIAL_STATS = { notes: 50, weeklyNotes: 4, colleges: 6, contributors: 3 };

const MOCK_FIELDS = [
  { id: '1', name: 'Computer Science', slug: 'computer-science', icon: 'terminal' },
  { id: '2', name: 'Engineering', slug: 'engineering', icon: 'precision_manufacturing' },
  { id: '3', name: 'Medical & Health', slug: 'medical-health', icon: 'medical_services' },
  { id: '4', name: 'Commerce & Finance', slug: 'commerce-finance', icon: 'analytics' },
  { id: '5', name: 'Sciences', slug: 'sciences', icon: 'science' },
  { id: '6', name: 'Arts & Humanities', slug: 'arts-humanities', icon: 'history_edu' },
];

const MOCK_COLLEGES = [
  { id: '1', name: 'Savitribai Phule Pune University', slug: 'sppu', university: 'SPPU', location: 'Pune, Maharashtra', verified: true },
  { id: '2', name: 'Delhi University', slug: 'du', university: 'DU', location: 'Delhi, India', verified: true },
  { id: '3', name: 'Indian Institute of Technology Bombay', slug: 'iit-bombay', university: 'IIT Bombay', location: 'Mumbai, Maharashtra', verified: true },
  { id: '4', name: 'Mumbai University', slug: 'mu', university: 'MU', location: 'Mumbai, Maharashtra', verified: false },
];

const MOCK_NOTES = [
  {
    id: 'n1',
    title: 'Database Management Systems Semester 4 Question Paper 2025',
    slug: 'sppu-comp-sem-4-dbms-pyq-2025',
    type: 'question_paper',
    subject_name: 'Database Management Systems',
    college_name: 'Savitribai Phule Pune University',
    semester: 4,
    uploader_name: 'Atharva Kapse',
    uploader_username: 'atharva',
    upvote_count: 34,
    downloads: 120,
    created_at: new Date().toISOString(),
  },
  {
    id: 'n2',
    title: 'Data Structures and Algorithms Lecture Notes (Complete Guide)',
    slug: 'dsa-lecture-notes-complete',
    type: 'notes',
    subject_name: 'Data Structures & Algorithms',
    topic_name: 'Algorithms',
    uploader_name: 'Priya Sharma',
    uploader_username: 'priya',
    upvote_count: 82,
    downloads: 340,
    created_at: new Date().toISOString(),
  },
  {
    id: 'n3',
    title: 'Organic Chemistry II Cheat Sheet (Reactions & Mechanisms)',
    slug: 'organic-chemistry-2-cheat-sheet',
    type: 'cheatsheet',
    subject_name: 'Organic Chemistry',
    college_name: 'Delhi University',
    semester: 3,
    uploader_name: 'Rahul Verma',
    uploader_username: 'rahulv',
    upvote_count: 51,
    downloads: 189,
    created_at: new Date().toISOString(),
  },
  {
    id: 'n4',
    title: 'Operating Systems Previous Year Papers (SPPU Comp Sem 5)',
    slug: 'sppu-comp-sem-5-os-pyqs',
    type: 'question_paper',
    subject_name: 'Operating Systems',
    college_name: 'Savitribai Phule Pune University',
    semester: 5,
    uploader_name: 'Amit Patel',
    uploader_username: 'amitp',
    upvote_count: 19,
    downloads: 75,
    created_at: new Date().toISOString(),
  },
];

async function getHomeData() {
  try {
    // 1. Parallel fetch of notes, colleges, subjects, and stats
    const [supaNotesResult, collegesList, subjectsList] = await Promise.all([
      queryTable(
        'notes',
        'id,title,slug,type,semester,subject_id,college_id,file_url,file_type,upvote_count,download_count,created_at,uploader_id,description',
        { status: 'eq.published', order: 'created_at.desc', limit: '24' }
      ).catch(() => []),
      queryTable(
        'colleges',
        'id,name,slug,university,location,verified',
        { order: 'verified.desc,name.asc', limit: '50' }
      ).catch(() => []),
      queryTable(
        'course_subjects',
        'id,name,slug',
        { limit: '200' }
      ).catch(() => []),
    ]);

    let supaNotes = supaNotesResult;
    if (!supaNotes || supaNotes.length === 0) {
      supaNotes = await queryTable(
        'notes',
        'id,title,slug,type,semester,subject_id,college_id,file_url,file_type,upvote_count,download_count,created_at,uploader_id,description',
        { order: 'created_at.desc', limit: '24' }
      ).catch(() => []);
    }

    // Build lookup maps
    const collegeMap = {};
    (collegesList || []).forEach(c => { collegeMap[c.id] = c; });

    const subjectMap = {};
    (subjectsList || []).forEach(s => { subjectMap[s.id] = s; });

    let recentNotes = MOCK_NOTES;
    if (Array.isArray(supaNotes) && supaNotes.length > 0) {
      const formatted = supaNotes.map(n => ({
        ...n,
        college_name: collegeMap[n.college_id]?.name || n.college_name || 'Notes Arena',
        subject_name: subjectMap[n.subject_id]?.name || n.subject_name || 'Study Material',
      }));
      recentNotes = await enrichNotesWithSocialUploaders(formatted);
    }

    let colleges = MOCK_COLLEGES;
    if (Array.isArray(collegesList) && collegesList.length > 0) {
      colleges = collegesList.slice(0, 4);
    }

    // Calculate real stats directly from database
    const allNotesForStats = await queryTable(
      'notes',
      'id,created_at,uploader_id'
    ).catch(() => []);

    const allCollegesForStats = await queryTable(
      'colleges',
      'id'
    ).catch(() => []);

    const totalNotes = Array.isArray(allNotesForStats) && allNotesForStats.length > 0 ? allNotesForStats.length : 51;
    const totalColleges = Array.isArray(allCollegesForStats) && allCollegesForStats.length > 0 ? allCollegesForStats.length : 4;

    const uniqueUploaders = new Set(
      (allNotesForStats || []).map(n => n.uploader_id).filter(Boolean)
    );
    const totalContributors = uniqueUploaders.size || 2;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weeklyNotesCount = (allNotesForStats || []).filter(n => {
      if (!n.created_at) return false;
      return new Date(n.created_at) >= sevenDaysAgo;
    }).length;

    const stats = {
      notes: totalNotes,
      weeklyNotes: weeklyNotesCount,
      colleges: totalColleges,
      contributors: totalContributors,
    };

    return {
      recentNotes: Array.isArray(recentNotes) ? recentNotes : MOCK_NOTES,
      fields: MOCK_FIELDS,
      colleges: Array.isArray(colleges) ? colleges : MOCK_COLLEGES,
      stats,
    };
  } catch (err) {
    console.error('Error fetching Home data:', err);
    return { recentNotes: MOCK_NOTES, fields: MOCK_FIELDS, colleges: MOCK_COLLEGES, stats: INITIAL_STATS };
  }
}

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'C';
  try {
    const parts = name
      .trim()
      .split(/\s+/)
      .filter(w => w && !['of', 'and', 'in', 'the', '&'].includes(w.toLowerCase()));
    if (parts.length === 0) return 'C';
    const initials = parts
      .map(w => (w && w[0] ? w[0] : ''))
      .filter(Boolean)
      .join('')
      .slice(0, 2)
      .toUpperCase();
    return initials || 'C';
  } catch {
    return 'C';
  }
};

export default async function NotesHomePage() {
  const data = await getHomeData();
  const recentNotes = Array.isArray(data?.recentNotes) ? data.recentNotes : MOCK_NOTES;
  const fields = Array.isArray(data?.fields) ? data.fields : MOCK_FIELDS;
  const colleges = Array.isArray(data?.colleges) ? data.colleges : MOCK_COLLEGES;
  const stats = data?.stats || INITIAL_STATS;

  const quickTags = [
    { label: 'PYQ Papers', query: 'PYQ', icon: FileText, colorClass: 'text-indigo-500' },
    { label: 'Computer Science', query: 'Computer Science', icon: Code, colorClass: 'text-indigo-500' },
    { label: 'Engineering', query: 'Engineering', icon: Cpu, colorClass: 'text-purple-500' },
    { label: 'Semester 1', query: 'Semester 1', icon: Calendar, colorClass: 'text-blue-500' },
    { label: 'SPPU', query: 'SPPU', icon: Landmark, colorClass: 'text-indigo-500' },
    { label: 'Reference Books', query: 'Book', icon: BookOpen, colorClass: 'text-indigo-500' },
  ];

  return (
    <>
      <style>{`
        /* --- Modern Hero Banner --- */
        .notes-hero-card {
          position: relative;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%), var(--surface);
          border: 1px solid var(--border);
          border-radius: 32px;
          padding: 48px 36px 36px;
          text-align: center;
          margin-bottom: 36px;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.08), 0 20px 40px -15px rgba(0, 0, 0, 0.04);
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .notes-hero-card::before {
          content: '';
          position: absolute;
          top: -120px;
          right: -100px;
          width: 340px;
          height: 340px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0) 70%);
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        }
        .notes-hero-card::after {
          content: '';
          position: absolute;
          bottom: -100px;
          left: -80px;
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0) 70%);
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        }
        .notes-hero-card:hover {
          border-color: rgba(99, 102, 241, 0.3);
          box-shadow: 0 16px 40px -10px rgba(0, 0, 0, 0.12);
        }

        .hero-inner-content {
          position: relative;
          z-index: 1;
          max-width: 820px;
          margin: 0 auto;
        }

        .hero-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          border-radius: 9999px;
          background: rgba(99, 102, 241, 0.08);
          border: 1px solid rgba(99, 102, 241, 0.24);
          color: #6366f1;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 20px;
          backdrop-filter: blur(8px);
        }

        .notes-hero-title {
          font-family: var(--font-display, inherit);
          font-size: clamp(2.1rem, 4.5vw, 3.4rem);
          font-weight: 900;
          line-height: 1.15;
          margin: 0 0 14px 0;
          color: var(--text);
          letter-spacing: -0.03em;
        }
        .notes-hero-title span.accent {
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .notes-hero-subtitle {
          font-size: clamp(0.95rem, 1.6vw, 1.08rem);
          color: var(--sub);
          margin: 0 auto 28px;
          line-height: 1.6;
          max-width: 580px;
          font-weight: 400;
        }

        .hero-search-wrapper {
          display: flex;
          justify-content: center;
          width: 100%;
          margin: 0 auto 24px;
        }

        .popular-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          margin-bottom: 24px;
        }

        .popular-heading {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 12px;
        }

        .quick-tag-strip {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 8px 10px;
        }

        .quick-tag-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 9999px;
          background: var(--s2);
          border: 1px solid var(--border);
          color: var(--text);
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .quick-tag-item:hover {
          color: #6366f1;
          border-color: rgba(99, 102, 241, 0.4);
          background: rgba(99, 102, 241, 0.08);
          transform: translateY(-1px);
        }

        .hero-divider {
          width: 100%;
          height: 1px;
          background: var(--border);
          opacity: 0.6;
          margin: 28px 0;
        }

        .hero-action-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          width: 100%;
        }

        .hero-action-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-radius: 18px;
          background: var(--s2);
          border: 1px solid var(--border);
          text-decoration: none;
          transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .hero-action-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.08);
        }
        .card-upload:hover {
          border-color: rgba(16, 185, 129, 0.4);
        }
        .card-colleges:hover {
          border-color: rgba(168, 85, 247, 0.4);
        }
        .card-contributors:hover {
          border-color: rgba(245, 158, 11, 0.4);
        }

        .action-card-main {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .action-icon-pill {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .icon-upload {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
        }
        .icon-colleges {
          background: rgba(168, 85, 247, 0.1);
          border: 1px solid rgba(168, 85, 247, 0.25);
        }
        .icon-contributors {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.25);
        }

        .action-card-text {
          display: flex;
          flex-direction: column;
          text-align: left;
          min-width: 0;
        }
        .action-card-title {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--text);
          line-height: 1.2;
        }
        .action-card-sub {
          font-size: 11.5px;
          color: var(--sub);
          margin-top: 2px;
        }

        .action-arrow-circle {
          width: 28px;
          height: 28px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }
        .arrow-upload {
          background: rgba(16, 185, 129, 0.1);
        }
        .arrow-colleges {
          background: rgba(168, 85, 247, 0.1);
        }
        .arrow-contributors {
          background: rgba(245, 158, 11, 0.1);
        }

        /* --- Dynamic Stats Grid --- */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 44px;
        }
        .stat-widget {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 22px 18px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .stat-widget:hover {
          border-color: var(--green);
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(0, 180, 216, 0.12);
        }
        .stat-icon-wrap {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          background: var(--green-dim);
          color: var(--green);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .stat-content {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .stat-value {
          font-family: var(--font-display);
          font-size: 26px;
          font-weight: 800;
          color: var(--text);
          line-height: 1.1;
          letter-spacing: -0.02em;
        }
        .stat-value.accent {
          color: var(--green);
        }
        .stat-label {
          font-size: 11.5px;
          color: var(--sub);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 4px;
        }

        /* --- Section Headers --- */
        .section-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 22px;
        }
        .section-title {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 700;
          color: var(--text);
          letter-spacing: -0.02em;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .section-title-line {
          width: 24px;
          height: 3px;
          background: var(--green);
          border-radius: 99px;
          display: inline-block;
        }
        .section-view-all {
          font-size: 13.5px;
          color: var(--green);
          font-weight: 600;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: gap 0.2s ease, opacity 0.2s ease;
        }
        .section-view-all:hover {
          gap: 7px;
          opacity: 0.85;
        }

        /* --- Refined Department Chips --- */
        .chips-container {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 44px;
        }
        .field-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 9999px;
          font-size: 13.5px;
          font-weight: 600;
          color: var(--text);
          text-decoration: none;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .field-chip .chip-icon {
          font-size: 18px;
          color: var(--sub);
          transition: color 0.2s ease;
        }
        .field-chip:hover {
          border-color: var(--green);
          color: var(--green);
          background: var(--green-dim);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 180, 216, 0.12);
        }
        .field-chip:hover .chip-icon {
          color: var(--green);
        }

        /* --- Popular Colleges Grid --- */
        .college-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 48px;
        }
        .college-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px;
          transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 165px;
          position: relative;
          box-sizing: border-box;
        }
        .college-card:hover {
          border-color: var(--green);
          transform: translateY(-4px);
          box-shadow: 0 14px 34px rgba(0, 180, 216, 0.14);
        }
        .college-badge {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: var(--green-dim);
          color: var(--green);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 15px;
          margin-right: 14px;
          flex-shrink: 0;
          border: 1px solid rgba(0, 180, 216, 0.2);
        }

        /* --- Notes Grid / Feed --- */
        .notes-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 16px;
          width: 100%;
          box-sizing: border-box;
        }

        @media (max-width: 1680px) {
          .notes-grid {
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 16px;
          }
        }
        @media (max-width: 1360px) {
          .notes-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
          }
        }
        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
          }
          .notes-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 14px;
          }
        }
        @media (max-width: 768px) {
          .notes-hero-card {
            padding: 32px 18px 24px;
            margin-bottom: 24px;
            border-radius: 24px;
          }
          .hero-action-cards {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 32px;
          }
          .stat-widget {
            padding: 14px 12px;
            gap: 12px;
          }
          .stat-icon-wrap {
            width: 38px;
            height: 38px;
          }
          .stat-value {
            font-size: 22px;
          }
          .college-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }
          .notes-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }
        }
        @media (max-width: 480px) {
          .notes-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }
        }
      `}</style>

      {/* Modern High-End Hero Banner matching mockup */}
      <header className="notes-hero-card">
        <div className="hero-inner-content">
          {/* Top Pill Badge */}
          <div className="hero-badge-pill">
            <Sparkles size={14} className="text-indigo-500" />
            <span>Open Academic Knowledge Base</span>
          </div>

          {/* Main Title */}
          <h1 className="notes-hero-title">
            Welcome to <span className="accent">Notes Arena</span>
          </h1>

          {/* Subtitle */}
          <p className="notes-hero-subtitle">
            Download and share verified university lecture notes, previous year question papers (PYQs), cheatsheets, and laboratory manuals.
          </p>

          {/* Interactive Hero Search Bar */}
          <div className="hero-search-wrapper">
            <SearchBar variant="hero" placeholder="Search notes, PYQs, courses, colleges..." />
          </div>

          {/* Quick Filter Popular Tags */}
          <div className="popular-container">
            <div className="popular-heading">
              <span>🔥</span>
              <span>Popular:</span>
            </div>
            <div className="quick-tag-strip">
              {quickTags.map((tag, idx) => {
                const TagIcon = tag.icon;
                return (
                  <Link
                    key={idx}
                    href={`/notes/search?q=${encodeURIComponent(tag.query)}`}
                    className="quick-tag-item group"
                  >
                    <TagIcon size={14} className={`${tag.colorClass} group-hover:scale-110 transition-transform`} />
                    <span>{tag.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Subtle Divider Line */}
          <div className="hero-divider" />

          {/* 3 Bottom Action Cards */}
          <div className="hero-action-cards">
            {/* Card 1: Upload Resource */}
            <Link href="/notes/upload" className="hero-action-card card-upload group">
              <div className="action-card-main">
                <div className="action-icon-pill icon-upload">
                  <CloudUpload size={22} className="text-emerald-500 dark:text-emerald-400" />
                </div>
                <div className="action-card-text">
                  <span className="action-card-title">Upload Resource</span>
                  <span className="action-card-sub">Share notes</span>
                </div>
              </div>
              <div className="action-arrow-circle arrow-upload">
                <ChevronRight size={16} className="text-emerald-500 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* Card 2: Browse Colleges */}
            <Link href="/notes/colleges" className="hero-action-card card-colleges group">
              <div className="action-card-main">
                <div className="action-icon-pill icon-colleges">
                  <GraduationCap size={22} className="text-purple-500 dark:text-purple-400" />
                </div>
                <div className="action-card-text">
                  <span className="action-card-title">Browse Colleges</span>
                  <span className="action-card-sub">Explore resources</span>
                </div>
              </div>
              <div className="action-arrow-circle arrow-colleges">
                <ChevronRight size={16} className="text-purple-500 dark:text-purple-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* Card 3: Contributors */}
            <Link href="/contributors" className="hero-action-card card-contributors group">
              <div className="action-card-main">
                <div className="action-icon-pill icon-contributors">
                  <Trophy size={22} className="text-amber-500 dark:text-amber-400" />
                </div>
                <div className="action-card-text">
                  <span className="action-card-title">Contributors</span>
                  <span className="action-card-sub">Top contributors</span>
                </div>
              </div>
              <div className="action-arrow-circle arrow-contributors">
                <ChevronRight size={16} className="text-amber-500 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Dynamic Animated Statistics Widgets */}
      <section className="stats-grid">
        <div className="stat-widget">
          <div className="stat-icon-wrap">
            <span className="material-symbols-rounded" style={{ fontSize: 24 }}>description</span>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.notes}</div>
            <div className="stat-label">Total Resources</div>
          </div>
        </div>

        <div className="stat-widget">
          <div className="stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 24 }}>trending_up</span>
          </div>
          <div className="stat-content">
            <div className="stat-value accent">+{stats.weeklyNotes}</div>
            <div className="stat-label">Added This Week</div>
          </div>
        </div>

        <div className="stat-widget">
          <div className="stat-icon-wrap" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 24 }}>account_balance</span>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.colleges}</div>
            <div className="stat-label">Colleges Indexed</div>
          </div>
        </div>

        <div className="stat-widget">
          <div className="stat-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 24 }}>group</span>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.contributors}</div>
            <div className="stat-label">Active Contributors</div>
          </div>
        </div>
      </section>

      {/* Browse by Department */}
      <section style={{ marginBottom: 44 }}>
        <div className="section-header-row">
          <h2 className="section-title">
            <span className="section-title-line" />
            <span>Browse by Department</span>
          </h2>
          <Link href="/notes/departments" className="section-view-all">
            <span>All Departments</span>
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>arrow_forward</span>
          </Link>
        </div>
        <div className="chips-container">
          {fields.map((f) => (
            <Link key={f.id} href={`/notes/departments/${f.slug}`} className="field-chip">
              <span className="material-symbols-rounded chip-icon">{f.icon || 'folder'}</span>
              <span>{f.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Colleges */}
      <section style={{ marginBottom: 48 }}>
        <div className="section-header-row">
          <h2 className="section-title">
            <span className="section-title-line" />
            <span>Popular Colleges</span>
          </h2>
          <Link href="/notes/colleges" className="section-view-all">
            <span>View All</span>
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>arrow_forward</span>
          </Link>
        </div>
        <div className="college-grid">
          {colleges.map((c) => (
            <Link key={c.id} href={`/notes/colleges/${c.slug}`} style={{ textDecoration: 'none' }}>
              <div className="college-card">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 11.5, color: 'var(--sub)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 13, color: 'var(--dim)' }}>location_on</span>
                      <span>{c.location}</span>
                    </span>
                    {c.verified && (
                      <span className="material-symbols-rounded" style={{ fontSize: 17, color: 'var(--green)' }} title="Verified College">
                        verified
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: 12 }}>
                    <div className="college-badge">
                      {getInitials(c.name)}
                    </div>
                    <h4 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0, lineHeight: 1.35 }}>
                      {c.name}
                    </h4>
                  </div>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--sub)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 10 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 14, color: 'var(--dim)' }}>account_balance</span>
                  <span>{c.university || 'Autonomous / Affiliated'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recently Added Resources */}
      <section style={{ marginBottom: 64 }}>
        <div className="section-header-row">
          <h2 className="section-title">
            <span className="section-title-line" />
            <span>Recently Added Resources</span>
          </h2>
          <Link href="/notes/search" className="section-view-all">
            <span>Explore All</span>
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>arrow_forward</span>
          </Link>
        </div>
        <div className="notes-grid">
          {recentNotes.map((n) => (
            <NoteCard key={n.id} note={n} />
          ))}
        </div>
      </section>
    </>
  );
}
