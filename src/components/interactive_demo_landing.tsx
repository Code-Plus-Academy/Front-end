import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  MessageSquare, 
  ThumbsUp, 
  Code2, 
  BookOpen, 
  Video, 
  Users, 
  GraduationCap, 
  Download, 
  Edit3, 
  ShieldCheck,
  Play
} from 'lucide-react';
import { MOCK_POSTS, MOCK_STORIES, MOCK_DEVELOPERS, MOCK_ARTICLES, MOCK_NOTES_ITEMS, ARTICLE_TYPES } from '../data/mockData';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import LoginPromptModal from './ui/LoginPromptModal';

export const InteractiveAppDemo: React.FC = () => {
  const { user } = useAuth();
  const [activeDemoTab, setActiveDemoTab] = useState<'feed' | 'explore' | 'notes' | 'articles' | 'network' | 'studio'>('notes');
  const [upvotedPosts, setUpvotedPosts] = useState<Record<string, boolean>>({});
  const [downloadedNotes, setDownloadedNotes] = useState<Record<string, boolean>>({});
  const [demoSearchQuery, setDemoSearchQuery] = useState('');
  const [notesScope, setNotesScope] = useState<'college' | 'department'>('college');

  // Real notes, backend videos & Auth modal state
  const [publishedNotes, setPublishedNotes] = useState<any[]>([]);
  const [publishedVideos, setPublishedVideos] = useState<any[]>([]);
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
        console.warn('Backend recent notes in simulator:', err.message);
      });

    api.get('/videos')
      .then((res) => {
        if (isMounted && res.data?.videos && res.data.videos.length > 0) {
          setPublishedVideos(res.data.videos);
        }
      })
      .catch((err) => {
        console.warn('Backend videos in simulator:', err.message);
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
    let format = 'pdf';
    if (rawFileFormat.includes('image') || rawFileFormat.includes('png') || rawFileFormat.includes('jpg') || rawFileFormat.includes('jpeg')) {
      format = 'image';
    } else if (rawFileFormat.includes('link') || rawFileFormat.includes('drive') || rawFileFormat.includes('url')) {
      format = 'link';
    }

    return {
      id: n.id || n.slug,
      title: n.title || 'Untitled Note',
      resourceTypeLabel: typeLabelMap[rawType] || 'Lecture Notes',
      fileFormat: format,
      scope: n.scope || 'college',
      institution: n.college_name || 'Autonomous Tech University',
      field: n.subject_name || n.field_name || 'Computer Science',
      subject: n.subject_name || n.subject || 'Computer Science Core Eng',
      isVerifiedPR: true,
      slug: n.slug,
      fileUrl: n.file_url,
    };
  };

  const rawDisplayNotes = publishedNotes.length > 0
    ? publishedNotes.map(mapBackendNoteToLandingItem)
    : MOCK_NOTES_ITEMS;

  const filteredSimulatorNotes = rawDisplayNotes.filter((n: any) => 
    !n.scope || n.scope === notesScope || notesScope === 'college'
  ).slice(0, 7);

  const formatViews = (views: number) => {
    if (!views) return '0 views';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
    if (views >= 1000) return `${(views / 1000).toFixed(0)}K views`;
    return `${views} views`;
  };

  const formatDuration = (secs: number) => {
    if (!secs) return '0:58';
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const mappedExploreVideos = publishedVideos.map((v) => ({
    id: v.id,
    type: v.content_type === 'short' ? 'short_video' : 'video',
    title: v.title || 'Untitled Video',
    categoryLabel: v.content_type === 'short' ? 'Short Video' : (v.category || 'Web Dev Video'),
    duration: typeof v.duration === 'number' ? formatDuration(v.duration) : (v.duration || '12:40'),
    views: typeof v.views_count === 'number' ? formatViews(v.views_count) : (v.views || '48K views'),
    thumbnail: v.thumbnail_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600',
  }));

  const mockExploreVideos = [
    {
      id: 'v_long_demo_1',
      type: 'video',
      title: 'Building a Full-Stack Social App with React 19 & Go in 45 Minutes',
      categoryLabel: 'Web Dev Video',
      duration: '42:15',
      views: '48K views',
      thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600',
    },
    {
      id: 'v_short_demo_1',
      type: 'short_video',
      title: 'How Operating Systems Handle Page Faults in 60 Seconds #shorts',
      categoryLabel: 'Short Video',
      duration: '0:58',
      views: '120K views',
      thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=600',
    },
  ];

  const allExploreItems = [
    ...MOCK_ARTICLES.map(a => ({ ...a, type: 'article' })),
    ...(mappedExploreVideos.length > 0 ? mappedExploreVideos : mockExploreVideos)
  ];

  const filteredExploreItems = allExploreItems.filter((item: any) => {
    if (!demoSearchQuery.trim()) return true;
    const query = demoSearchQuery.toLowerCase();
    return (
      (item.title || '').toLowerCase().includes(query) ||
      (item.categoryLabel || '').toLowerCase().includes(query)
    );
  });

  const toggleUpvote = (id: string) => {
    setUpvotedPosts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDownloadClick = (note: any) => {
    if (!user) {
      setPendingNote(note);
      setShowLoginModal(true);
      return;
    }
    executeDownload(note);
  };

  const executeDownload = (note: any) => {
    setDownloadedNotes(prev => ({ ...prev, [note.id]: true }));
    if (note.fileUrl) {
      window.open(note.fileUrl, '_blank');
    } else if (note.slug) {
      window.location.href = `/notes/resource/${note.slug}`;
    } else {
      window.location.href = '/notes';
    }
  };

  return (
    <section id="interactive-demo" className="py-16 bg-slate-50/20 dark:bg-slate-950/40 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 font-bold mb-3">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Interactive CPA Platform Explore</span>
            <span className="font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">📄 interactive_demo_landing.tsx</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Test Drive the Live Code Plus Academy Ecosystem
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm">
            Experience how Feed, Explore, Notes Arena, Articles, Network, and Studio function together in real-time.
          </p>
        </div>

        {/* Live Simulator Window Container */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl overflow-hidden">
          
          {/* Simulator Window Header Bar */}
          <div className="bg-slate-100 dark:bg-slate-950 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 ml-2 hidden sm:inline">
                {`https://codeplusacademy.in/${activeDemoTab === 'studio' ? 'creator' : activeDemoTab}`}
              </span>
            </div>

            {/* App Sub-Tab Navigation Bar */}
            <div className="flex items-center space-x-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-sm">
              {[
                { id: 'notes', label: 'Notes Arena', icon: GraduationCap },
                { id: 'feed', label: 'Feed', icon: Users },
                { id: 'explore', label: 'Explore', icon: BookOpen },
                { id: 'articles', label: 'Articles', icon: Edit3 },
                { id: 'network', label: 'Network', icon: Code2 },
                { id: 'studio', label: 'Studio', icon: Video }
              ].map((tab) => {
                const IconComp = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDemoTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                      activeDemoTab === tab.id
                        ? 'bg-cyan-500 text-white dark:text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Simulator Active Content Body */}
          <div className="p-6 min-h-[500px]">
            
            {/* VIEW 1: NOTES ARENA */}
            {activeDemoTab === 'notes' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 uppercase font-bold">Notes Arena Simulator</span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Academic Notes, PYQs & Lab Manuals</h3>
                  </div>

                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setNotesScope('college')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${notesScope === 'college' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-slate-400'}`}
                    >
                      College Scope
                    </button>
                    <button 
                      onClick={() => setNotesScope('department')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${notesScope === 'department' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-slate-400'}`}
                    >
                      Department Scope
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSimulatorNotes.map((note: any) => (
                    <div
                      key={note.id}
                      className="bg-slate-50 dark:bg-slate-950 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between text-xs shadow-sm hover:border-cyan-500/50 transition-all hover:shadow-md group"
                      style={{ minHeight: 200 }}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-2.5">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold">
                            {note.resourceTypeLabel}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">{note.fileFormat}</span>
                            {note.isVerifiedPR && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">✓ PR</span>}
                          </div>
                        </div>

                        <a
                          href={note.slug ? `/notes/resource/${note.slug}` : '/notes'}
                          className="font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 cursor-pointer transition-colors no-underline block line-clamp-2 leading-snug mb-1.5"
                        >
                          {note.title}
                        </a>
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 block line-clamp-1">{note.subject}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">{note.institution || note.field}</span>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          {note.fileSize || 'PDF'}
                        </span>
                        <button 
                          onClick={() => handleDownloadClick(note)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 shrink-0 transition-colors ${
                            downloadedNotes[note.id] 
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                              : 'bg-cyan-500 hover:bg-cyan-400 text-white dark:text-slate-950 shadow-sm'
                          }`}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{downloadedNotes[note.id] ? 'Downloaded ✓' : 'Download Note'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 2: FEED */}
            {activeDemoTab === 'feed' && (
              <div className="space-y-6">
                {/* Story Bar */}
                <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-none">
                  {MOCK_STORIES.map(s => (
                    <div key={s.id} className="flex flex-col items-center shrink-0">
                      <img src={s.avatar} className="w-11 h-11 rounded-full object-cover border-2 border-cyan-500" />
                      <span className="text-[10px] text-slate-700 dark:text-slate-300 mt-1">{s.authorName}</span>
                    </div>
                  ))}
                </div>

                {/* Feed Posts */}
                {MOCK_POSTS.map(post => (
                  <div key={post.id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
                    <div className="flex items-center space-x-3 mb-2">
                      <img src={post.author.avatar} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700" />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{post.author.name}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">@{post.author.handle} • {post.timeAgo}</span>
                      </div>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 mb-3">{post.content}</p>

                    {post.codeSnippet && (
                      <div className="bg-slate-900 p-3 rounded-xl font-mono text-[11px] text-cyan-300 mb-3 border border-slate-800 overflow-x-auto">
                        <pre><code>{post.codeSnippet.code}</code></pre>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-900">
                      <button 
                        onClick={() => toggleUpvote(post.id)} 
                        className={`flex items-center space-x-1 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors ${upvotedPosts[post.id] ? 'text-cyan-600 dark:text-cyan-400 font-bold' : ''}`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{post.upvotes + (upvotedPosts[post.id] ? 1 : 0)} Upvotes</span>
                      </button>
                      <span className="flex items-center space-x-1"><MessageSquare className="w-3.5 h-3.5" /> {post.commentsCount} Comments</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VIEW 3: EXPLORE */}
            {activeDemoTab === 'explore' && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search public content hub freely (no login)..."
                    value={demoSearchQuery}
                    onChange={(e) => setDemoSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredExploreItems.map((item: any) => {
                    if (item.type === 'video') {
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => window.location.href = `/videos/${item.id}`}
                          className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-sm cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all flex space-x-3"
                        >
                          <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-slate-900 shrink-0">
                            <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-950/30 flex items-center justify-center">
                              <div className="w-6 h-6 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-lg">
                                <Play className="w-3 h-3 ml-0.5 fill-white" />
                              </div>
                            </div>
                            <span className="absolute bottom-1 right-1 text-[8px] font-mono bg-slate-950/90 text-slate-200 px-1 rounded">{item.duration}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 uppercase font-bold block mb-1">{item.categoryLabel}</span>
                            <h4 className="font-bold text-slate-900 dark:text-white line-clamp-2">{item.title}</h4>
                            <span className="text-slate-500 dark:text-slate-400 text-[11px] block mt-1">{item.views}</span>
                          </div>
                        </div>
                      );
                    }

                    if (item.type === 'short_video') {
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => window.location.href = `/shorts?v=${item.id}`}
                          className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-sm cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all flex space-x-3"
                        >
                          <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-slate-900 shrink-0">
                            <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-950/30 flex items-center justify-center">
                              <div className="w-6 h-6 rounded-full bg-cyan-600/90 text-white flex items-center justify-center shadow-lg">
                                <Play className="w-3 h-3 ml-0.5 fill-white" />
                              </div>
                            </div>
                            <span className="absolute top-1 left-1 text-[8px] font-mono bg-cyan-500 text-white px-1 rounded font-bold">SHORT</span>
                            <span className="absolute bottom-1 right-1 text-[8px] font-mono bg-slate-950/90 text-slate-200 px-1 rounded">{item.duration}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 uppercase font-bold block mb-1">{item.categoryLabel}</span>
                            <h4 className="font-bold text-slate-900 dark:text-white line-clamp-2">{item.title}</h4>
                            <span className="text-slate-500 dark:text-slate-400 text-[11px] block mt-1">{item.views}</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={item.id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
                        <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 uppercase font-bold block mb-1">{item.categoryLabel}</span>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-2">{item.title}</h4>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px] block">{item.readTime || '5 min read'} • {item.viewCount || '14.2K'} views</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW 4: ARTICLES */}
            {activeDemoTab === 'articles' && (
              <div className="space-y-4">
                <span className="text-xs font-mono text-purple-700 dark:text-purple-400 block font-bold">Native Publishing Engine — 11 Formats</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ARTICLE_TYPES.slice(0, 6).map(t => (
                    <div key={t.id} className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
                      <span className="text-[10px] text-purple-700 dark:text-purple-300 font-mono font-bold block">{t.categoryLabel}</span>
                      <h4 className="font-bold text-slate-900 dark:text-white mt-1">{t.title}</h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">{t.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 5: NETWORK */}
            {activeDemoTab === 'network' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MOCK_DEVELOPERS.map(dev => (
                  <div key={dev.id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
                    <div className="flex items-center space-x-3 mb-2">
                      <img src={dev.avatar} className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700" />
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{dev.name}</h4>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">@{dev.handle}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {dev.primaryStack.map((s, i) => (
                        <span key={i} className="text-[10px] font-mono bg-slate-200 dark:bg-slate-900 text-cyan-800 dark:text-cyan-300 px-2 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VIEW 6: STUDIO */}
            {activeDemoTab === 'studio' && (
              <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-center space-y-4 shadow-sm">
                <Video className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">CPA Creator Studio Command Center</h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  Manage your videos, long-form articles, and academic note PR submissions with real-time audience analytics.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <a 
                    href="/creator" 
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold rounded-xl transition-all shadow-md shadow-purple-500/20 text-decoration-none"
                  >
                    Open Creator Studio
                  </a>
                  <a href="/new-post" className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition-colors text-decoration-none">
                    Upload Content
                  </a>
                </div>
              </div>
            )}

          </div>

          {/* Explore Footer Banner */}
          <div className="bg-slate-100 dark:bg-slate-950 px-6 py-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Platform Engine</span>
            <a href="https://codeplusacademy.in" target="_blank" rel="noreferrer" className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline">
              Visit Live Platform codeplusacademy.in ↗
            </a>
          </div>

        </div>

      </div>

      {/* Login Prompt Modal for Auth-Gated Download Action */}
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
    </section>
  );
};
