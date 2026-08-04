import React, { useState } from 'react';
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
  ShieldCheck
} from 'lucide-react';
import { MOCK_POSTS, MOCK_STORIES, MOCK_DEVELOPERS, MOCK_ARTICLES, MOCK_NOTES_ITEMS, ARTICLE_TYPES } from '../data/mockData';

export const InteractiveAppDemo: React.FC = () => {
  const [activeDemoTab, setActiveDemoTab] = useState<'feed' | 'explore' | 'notes' | 'articles' | 'network' | 'studio'>('notes');
  const [upvotedPosts, setUpvotedPosts] = useState<Record<string, boolean>>({});
  const [downloadedNotes, setDownloadedNotes] = useState<Record<string, boolean>>({});
  const [demoSearchQuery, setDemoSearchQuery] = useState('');
  const [notesScope, setNotesScope] = useState<'college' | 'department'>('college');

  const toggleUpvote = (id: string) => {
    setUpvotedPosts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleDownload = (id: string) => {
    setDownloadedNotes(prev => ({ ...prev, [id]: true }));
  };

  return (
    <section id="interactive-demo" className="py-16 bg-slate-50/20 dark:bg-slate-950/40 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 font-bold mb-3">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Interactive CPA Platform Explore</span>
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
                {activeDemoTab === 'studio' ? 'https://studio.codeplusacademy.in/' : `https://codeplusacademy.in/${activeDemoTab}`}
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

                <div className="space-y-3">
                  {MOCK_NOTES_ITEMS.filter(n => n.scope === notesScope).map(note => (
                    <div key={note.id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold">
                            {note.resourceTypeLabel}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">{note.fileFormat}</span>
                          {note.isVerifiedPR && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">✓ PR Verified</span>}
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{note.title}</h4>
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 block mt-0.5">{note.subject} • {note.institution || note.field}</span>
                      </div>

                      <button 
                        onClick={() => toggleDownload(note.id)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 shrink-0 transition-colors ${
                          downloadedNotes[note.id] 
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                            : 'bg-cyan-500 hover:bg-cyan-400 text-white dark:text-slate-950 shadow-sm'
                        }`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{downloadedNotes[note.id] ? 'Downloaded ✓' : 'Download Note'}</span>
                      </button>
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
                  {MOCK_ARTICLES.map(art => (
                    <div key={art.id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
                      <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 uppercase font-bold block mb-1">{art.categoryLabel}</span>
                      <h4 className="font-bold text-slate-900 dark:text-white mb-2">{art.title}</h4>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block">{art.readTime} • {art.viewCount} views</span>
                    </div>
                  ))}
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
                    href="https://studio.codeplusacademy.in/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold rounded-xl transition-all shadow-md shadow-purple-500/20"
                  >
                    Launch studio.codeplusacademy.in ↗
                  </a>
                  <button className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition-colors">Upload Video</button>
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
    </section>
  );
};
