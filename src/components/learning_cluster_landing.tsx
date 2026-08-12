import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  FileText, 
  Milestone, 
  Layers, 
  Wrench, 
  Code2, 
  Download, 
  FileCheck, 
  GitPullRequest, 
  Bookmark, 
  Building2,
  BookMarked,
  FileCode,
  Image as ImageIcon,
  ExternalLink,
  Flame,
  Clock,
  Eye,
  ThumbsUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ARTICLE_TYPES, MOCK_NOTES_ITEMS } from '../data/mockData';
import { ArticleTypeCategory, AcademicResourceType, FileFormatType, OrganizationalScope } from '../models';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import LoginPromptModal from './ui/LoginPromptModal';

const TRENDING_ARTICLES = [
  {
    id: 'trending-1',
    rank: 1,
    category: 'Standard & Deep Dives',
    readTime: '18 min read',
    title: 'Building High-Throughput Event-Driven Microservices in Go & Kafka',
    description: 'An in-depth architectural guide on designing fault-tolerant consumer groups, dead-letter queues, and idempotency guarantees at scale.',
    author: {
      name: 'Aarav Mehta',
      handle: 'aarav_mehta',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    },
    views: '48,900',
    likes: 4210,
    coverUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800',
    slug: 'event-driven-microservices-go-kafka',
  },
  {
    id: 'trending-2',
    rank: 2,
    category: 'Resources & Tooling',
    readTime: '12 min guide',
    title: 'The Ultimate Rust Memory Model & Lifetime Borrow Checker Handbook',
    description: 'Master ownership semantics, smart pointers (Rc, Arc, RefCell), unsafe blocks, and zero-cost abstractions with interactive visual memory diagrams.',
    author: {
      name: 'Ananya Gupta',
      handle: 'ananya_code',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    },
    views: '35,100',
    likes: 3890,
    coverUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=800',
    slug: 'rust-memory-model-guide',
  },
  {
    id: 'trending-3',
    rank: 3,
    category: 'Learning & Education',
    readTime: '45 min course',
    title: 'Full Course: Distributed Systems & Consensus Protocols',
    description: 'A multi-part comprehensive course exploring Paxos, Raft consensus algorithm, vector clocks, and network partition resilience.',
    author: {
      name: 'Siddharth Nair',
      handle: 'sid_nair',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    },
    views: '22,400',
    likes: 3100,
    coverUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=800',
    slug: 'distributed-systems-consensus-course',
  },
];

export const LearningCluster: React.FC = () => {
  const { user } = useAuth();
  const [learningTab, setLearningTab] = useState<'articles' | 'notes_arena'>('notes_arena');

  // Articles state
  const [selectedArticleCategory, setSelectedArticleCategory] = useState<ArticleTypeCategory | 'all'>('all');

  // Dynamic Trending Articles state from DB
  const [trendingList, setTrendingList] = useState<any[]>(TRENDING_ARTICLES);
  const [trendingIdx, setTrendingIdx] = useState(0);
  const [savedTrending, setSavedTrending] = useState<Record<string, boolean>>({});
  const [likedTrending, setLikedTrending] = useState<Record<string, number>>({});

  useEffect(() => {
    let isMounted = true;

    // Fetch actual trending posts/articles from DB
    api.get('/posts', { params: { sort: 'trending', limit: 6 } })
      .then((res) => {
        if (isMounted && res.data?.posts && res.data.posts.length > 0) {
          const mapped = res.data.posts.map((item: any, idx: number) => {
            const coverImages = [
              'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=800',
              'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800',
              'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800',
            ];
            return {
              id: item.id || `trending-${idx + 1}`,
              rank: idx + 1,
              category: item.category || (item.tags && item.tags[0]) || 'Learning & Education',
              readTime: item.duration ? `${Math.ceil(item.duration / 60)} min read` : '15 min read',
              title: item.title || 'Untitled Technical Article',
              description: item.description || item.summary || 'A multi-part comprehensive guide exploring code architecture, system performance, and network partition resilience.',
              author: {
                name: item.creator_name || item.creator_username || 'CPA Engineer',
                handle: item.creator_username || 'developer',
                avatar: item.creator_avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
              },
              views: typeof item.view_count === 'number' ? item.view_count.toLocaleString() : '12,400',
              likes: typeof item.clap_count === 'number' ? item.clap_count : 1200,
              coverUrl: item.thumbnail_url || coverImages[idx % coverImages.length],
              slug: item.slug || item.id,
            };
          });
          setTrendingList(mapped);
          setTrendingIdx(0);
        }
      })
      .catch((err) => {
        console.warn('Backend trending articles fetch warning:', err.message);
      });

    return () => { isMounted = false; };
  }, []);

  const currentTrending = trendingList[trendingIdx] || TRENDING_ARTICLES[0];
  const nextTrending = () => setTrendingIdx(prev => (prev + 1) % trendingList.length);
  const prevTrending = () => setTrendingIdx(prev => (prev - 1 + trendingList.length) % trendingList.length);

  // Notes Arena state
  const [selectedScope, setSelectedScope] = useState<OrganizationalScope>('college');
  const [selectedCollege, setSelectedCollege] = useState('Autonomous Tech University');
  const [selectedSemester, setSelectedSemester] = useState('Semester 5');
  const [selectedResourceType, setSelectedResourceType] = useState<AcademicResourceType | 'all'>('all');
  const [selectedFileFormat] = useState<FileFormatType | 'all'>('all');

  // Real backend notes state & Auth modal state
  const [publishedNotes, setPublishedNotes] = useState<any[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingNote, setPendingNote] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    api.get('/notes/recent', { params: { limit: 10 } })
      .then((res) => {
        if (isMounted && res.data?.notes && res.data.notes.length > 0) {
          setPublishedNotes(res.data.notes.slice(0, 10));
        }
      })
      .catch((err) => {
        console.warn('Backend recent notes lookup:', err.message);
      });
    return () => { isMounted = false; };
  }, []);

  const mapBackendNoteToLandingItem = (n: any) => {
    const rawType = (n.type || 'notes').toLowerCase();
    const typeLabelMap: Record<string, string> = {
      notes: 'Lecture Notes',
      question_paper: 'Previous Year Paper (PYQ)',
      lab_manual: 'Lab Manual',
      book: 'Reference Book',
      assignment: 'Assignment File',
      cheatsheet: 'Cheat Sheet',
      roadmap: 'Roadmap & Syllabus',
      other: 'Other References'
    };

    const rawFileFormat = (n.file_type || 'pdf').toLowerCase();
    let format: 'pdf' | 'image' | 'link' = 'pdf';
    if (rawFileFormat.includes('image') || rawFileFormat.includes('png') || rawFileFormat.includes('jpg') || rawFileFormat.includes('jpeg')) {
      format = 'image';
    } else if (rawFileFormat.includes('link') || rawFileFormat.includes('drive') || rawFileFormat.includes('url')) {
      format = 'link';
    }

    return {
      id: n.id || n.slug,
      title: n.title || 'Untitled Note',
      resourceType: rawType as AcademicResourceType,
      resourceTypeLabel: typeLabelMap[rawType] || 'Lecture Notes',
      fileFormat: format as FileFormatType,
      scope: (n.scope || 'college') as OrganizationalScope,
      institution: n.college_name || selectedCollege,
      course: 'B.Tech Computer Science & Engineering',
      semester: n.semester ? `Semester ${n.semester}` : 'Semester 5',
      subject: n.subject_name || n.subject || 'Computer Science & Core Eng',
      contributor: {
        name: n.uploader_name || n.contributor_name || 'CPA Contributor',
        role: 'Class Representative & CPA Contributor',
      },
      downloadsCount: n.downloads || n.download_count || 4210,
      rating: 4.9,
      isVerifiedPR: true,
      fileSize: format === 'pdf' ? '14.2 MB PDF' : format === 'image' ? '4.1 MB PNG' : 'Direct Link',
      slug: n.slug,
      fileUrl: n.file_url,
    };
  };

  const filteredArticles = ARTICLE_TYPES.filter(type => {
    if (selectedArticleCategory !== 'all' && type.category !== selectedArticleCategory) return false;
    return true;
  });

  const rawDisplayList = publishedNotes.length > 0
    ? publishedNotes.map(mapBackendNoteToLandingItem)
    : MOCK_NOTES_ITEMS;

  const filteredNotes = rawDisplayList.filter(item => {
    if (item.scope && item.scope !== selectedScope) {
      return false;
    }
    if (selectedResourceType !== 'all' && item.resourceType !== selectedResourceType) return false;
    if (selectedFileFormat !== 'all' && item.fileFormat !== selectedFileFormat) return false;
    return true;
  }).slice(0, 7);

  const handleDownloadClick = (note: any) => {
    if (!user) {
      setPendingNote(note);
      setShowLoginModal(true);
      return;
    }
    executeDownload(note);
  };

  const executeDownload = (note: any) => {
    if (note.fileUrl) {
      window.open(note.fileUrl, '_blank');
    } else if (note.slug) {
      window.location.href = `/notes/resource/${note.slug}`;
    } else {
      window.location.href = '/notes';
    }
  };

  return (
    <section className="py-16 bg-white/20 dark:bg-slate-950/40 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-slate-200 dark:border-slate-800/80">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-800 dark:text-indigo-300 font-medium mb-3">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Group B: Learning & Development Cluster</span>
              <span className="font-mono text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">📄 learning_cluster_landing.tsx</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              11 Native Article Types & Structured Notes Arena
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm max-w-2xl">
              Native long-form technical publishing with code syntax support, plus a collaborative academic notes library covering 8 resource types across college & field scopes.
            </p>
          </div>

          {/* Sub-Tab Selector */}
          <div className="mt-4 md:mt-0 flex items-center space-x-1 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <button
              onClick={() => setLearningTab('notes_arena')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                learningTab === 'notes_arena'
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              1. Notes Arena Library
            </button>
            <button
              onClick={() => setLearningTab('articles')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                learningTab === 'articles'
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              2. Articles (11 Types)
            </button>
          </div>
        </div>

        {/* TAB 1: NOTES ARENA LIBRARY */}
        {learningTab === 'notes_arena' && (
          <div className="space-y-8">
            
            {/* Scope Classification Switcher */}
            <div className="bg-slate-50 dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <span className="text-xs font-mono text-cyan-700 dark:text-cyan-400 uppercase tracking-wider block font-bold">Organizational Scope</span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Structured College & Field Hierarchy</h3>
                </div>

                <div className="flex space-x-2 bg-white dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setSelectedScope('college')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                      selectedScope === 'college'
                        ? 'bg-cyan-500 text-white dark:text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>College Scope (University → Semester)</span>
                  </button>

                  <button
                    onClick={() => setSelectedScope('department')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                      selectedScope === 'department'
                        ? 'bg-cyan-500 text-white dark:text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <BookMarked className="w-4 h-4" />
                    <span>Department / Field Scope</span>
                  </button>
                </div>
              </div>

              {/* Scope Dropdown Filters */}
              {selectedScope === 'college' ? (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono block mb-1">University / College</label>
                    <select 
                      value={selectedCollege}
                      onChange={(e) => setSelectedCollege(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-cyan-500"
                    >
                      <option>Autonomous Tech University</option>
                      <option>VTU / Autonomous Colleges</option>
                      <option>Anna University / JNTU</option>
                      <option>Mumbai University / SPPU</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono block mb-1">Degree / Course</label>
                    <select className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-cyan-500">
                      <option>B.Tech Computer Science & Eng</option>
                      <option>B.Tech Information Technology</option>
                      <option>B.Tech AI & Data Science</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono block mb-1">Semester</label>
                    <select 
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-cyan-500"
                    >
                      <option>Semester 4</option>
                      <option>Semester 5</option>
                      <option>Semester 6</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono block mb-1">Subject</label>
                    <select className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-cyan-500">
                      <option>Operating Systems (CS402)</option>
                      <option>Design & Analysis of Algorithms</option>
                      <option>Computer Networks Lab</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono block mb-1">Department / Field</label>
                    <select className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white font-medium">
                      <option>Computer Science & Engineering</option>
                      <option>Artificial Intelligence & Machine Learning</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono block mb-1">Topic</label>
                    <select className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white font-medium">
                      <option>Data Structures & Algorithms</option>
                      <option>Database Management Systems</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* 8 Academic Resource Types Overview */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-mono text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block font-bold mb-2">8 Academic Resource Types</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  { id: 'notes', label: '1. Lecture Notes', icon: FileText, desc: 'Class summaries & study materials' },
                  { id: 'question_paper', label: '2. PYQs / Solved Papers', icon: FileCheck, desc: 'Past exam papers & solutions' },
                  { id: 'book', label: '3. Reference Books', icon: BookOpen, desc: 'Academic textbooks & manuals' },
                  { id: 'assignment', label: '4. Assignment Files', icon: Layers, desc: 'Homework & problem sets' },
                  { id: 'cheatsheet', label: '5. Cheat Sheets', icon: Code2, desc: 'Revision sheets & formulas' },
                  { id: 'lab_manual', label: '6. Lab Manuals', icon: Wrench, desc: 'Practical lab guides & codes' },
                  { id: 'roadmap', label: '7. Roadmaps & Syllabi', icon: Milestone, desc: 'Subject syllabi & pathways' },
                  { id: 'other', label: '8. Other References', icon: Bookmark, desc: 'Misc links & drive folders' }
                ].map((type) => {
                  const IconComp = type.icon;
                  return (
                    <div 
                      key={type.id}
                      onClick={() => setSelectedResourceType(type.id as any)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        selectedResourceType === type.id
                          ? 'bg-indigo-100 dark:bg-indigo-950/80 border-indigo-400 dark:border-indigo-500 text-slate-900 dark:text-white'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2 font-bold mb-1">
                        <IconComp className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                        <span className="truncate">{type.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">{type.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes List with 3 File Formats (PDF, Image, Link) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium px-2">
                <span>Showing items for <strong className="text-slate-900 dark:text-white font-semibold">{selectedScope === 'college' ? selectedCollege : 'Department Scope'}</strong></span>
                <span className="font-mono text-cyan-600 dark:text-cyan-400">Community Pull Request Verified</span>
              </div>

              {filteredNotes.map(note => (
                <div key={note.id} className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-start space-x-4">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                      note.fileFormat === 'pdf' ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60' :
                      note.fileFormat === 'image' ? 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/60' :
                      'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60'
                    }`}>
                      {note.fileFormat === 'pdf' ? <FileCode className="w-5 h-5" /> :
                       note.fileFormat === 'image' ? <ImageIcon className="w-5 h-5" /> :
                       <ExternalLink className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold">
                          {note.resourceTypeLabel}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                          {note.fileFormat} format
                        </span>
                        {note.isVerifiedPR && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold flex items-center gap-1">
                            <GitPullRequest className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> PR Verified
                          </span>
                        )}
                      </div>

                      <a
                        href={note.slug ? `/notes/resource/${note.slug}` : '/notes'}
                        className="text-sm font-bold text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-300 cursor-pointer transition-colors no-underline block"
                      >
                        {note.title}
                      </a>

                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {note.subject} • Contributed by <strong className="text-slate-800 dark:text-slate-200">{note.contributor.name}</strong> ({note.contributor.role})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 pt-3 md:pt-0 border-t md:border-0 border-slate-200 dark:border-slate-800">
                    <div className="text-right text-xs">
                      <span className="text-slate-800 dark:text-slate-300 font-bold block">{note.downloadsCount.toLocaleString()} downloads</span>
                      <span className="text-slate-500 dark:text-slate-400 text-[10px] font-mono">{note.fileSize}</span>
                    </div>

                    <button
                      onClick={() => handleDownloadClick(note)}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white dark:text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Note</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* Login Prompt Modal for Auth-Gated Action */}
        <LoginPromptModal
          isOpen={showLoginModal}
          onClose={() => {
            setShowLoginModal(false);
            setPendingNote(null);
          }}
          actionType="download"
          onLoginSuccess={() => {
            if (pendingNote) {
              executeDownload(pendingNote);
            }
            setPendingNote(null);
          }}
        />

        {/* TAB 2: ARTICLES (11 Formats Across 4 Categories) */}
        {learningTab === 'articles' && (
          <div className="space-y-8">

            {/* Trending Article Hero Carousel */}
            <div className="relative mb-12 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 text-white shadow-xl dark:shadow-2xl">
              <div className="relative min-h-[340px] md:min-h-[380px] flex flex-col justify-end p-6 md:p-10">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-all duration-700 opacity-25"
                  style={{ backgroundImage: `url("${currentTrending.coverUrl}")` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
                
                <div className="relative z-10">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      TRENDING ARTICLE #{currentTrending.rank}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800/80 text-cyan-300 font-medium border border-slate-700">
                      {currentTrending.category}
                    </span>
                    <span className="text-xs text-slate-300 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      {currentTrending.readTime}
                    </span>
                  </div>

                  <a
                    href={`/articles/${currentTrending.slug}`}
                    className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight max-w-3xl leading-snug hover:text-cyan-300 transition-colors block no-underline"
                  >
                    {currentTrending.title}
                  </a>

                  <p className="mt-3 text-slate-300 text-xs sm:text-sm max-w-2xl line-clamp-2">
                    {currentTrending.description}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
                    <div className="flex items-center space-x-3">
                      <img
                        alt={currentTrending.author.name}
                        className="w-9 h-9 rounded-full border border-slate-700 object-cover"
                        src={currentTrending.author.avatar}
                      />
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold text-white">{currentTrending.author.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">@{currentTrending.author.handle}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Eye className="w-4 h-4 text-slate-400" />
                        {currentTrending.views} views
                      </span>

                      <button
                        onClick={() => setLikedTrending(prev => ({ ...prev, [currentTrending.id]: (prev[currentTrending.id] || currentTrending.likes) + 1 }))}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-200 font-medium border border-slate-700 transition-colors cursor-pointer"
                      >
                        <ThumbsUp className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{likedTrending[currentTrending.id] || currentTrending.likes}</span>
                      </button>

                      <button
                        onClick={() => setSavedTrending(prev => ({ ...prev, [currentTrending.id]: !prev[currentTrending.id] }))}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-700 transition-colors cursor-pointer ${
                          savedTrending[currentTrending.id] ? 'bg-purple-900/50 text-purple-200 border-purple-500' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${savedTrending[currentTrending.id] ? 'fill-purple-400 text-purple-400' : 'text-purple-400'}`} />
                        <span>{savedTrending[currentTrending.id] ? 'Saved to Notes' : 'Save to Notes'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Prev / Next controls */}
                <div className="absolute top-6 right-6 flex items-center space-x-2 z-20">
                  <button
                    onClick={prevTrending}
                    className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex space-x-1.5 px-2">
                    {TRENDING_ARTICLES.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setTrendingIdx(idx)}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
                          idx === trendingIdx ? 'w-6 bg-cyan-400' : 'w-2 bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={nextTrending}
                    className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Category Switcher */}
            <div className="bg-slate-50 dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-mono text-purple-700 dark:text-purple-400 uppercase tracking-wider block font-bold mb-2">11 Article Types across 4 Categories</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All 11 Types' },
                  { id: 'standard', label: '1. Standard & Deep Dives (4)' },
                  { id: 'learning', label: '2. Learning & Education (2)' },
                  { id: 'projects', label: '3. Projects & Repositories (2)' },
                  { id: 'resources', label: '4. Resources & Tooling (3)' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedArticleCategory(cat.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                      selectedArticleCategory === cat.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 11 Article Types Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map(type => (
                <div key={type.id} className="bg-white dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-semibold">
                        {type.categoryLabel}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">type: {type.id}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 flex items-center justify-between">
                      <span>{type.title}</span>
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                      {type.description}
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80">
                    <span className="text-[10px] font-mono text-slate-500 block mb-1">Example Title:</span>
                    <span className="text-xs font-medium text-cyan-700 dark:text-cyan-300 line-clamp-1">"{type.exampleTitle}"</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>
    </section>
  );
};
