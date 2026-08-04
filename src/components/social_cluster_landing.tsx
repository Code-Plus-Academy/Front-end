'use client';

import React, { useState } from 'react';
import { 
  Users, 
  MessageSquare, 
  ThumbsUp, 
  Share2, 
  Filter, 
  Code2, 
  Briefcase, 
  UserPlus, 
  UserCheck, 
  Sparkles, 
  CheckCircle2, 
  Award, 
  MapPin, 
  ChevronRight,
  Terminal,
  Send,
  Plus
} from 'lucide-react';
import { MOCK_POSTS, MOCK_STORIES, MOCK_DEVELOPERS } from '../data/mockData';
import { PostType, DifficultyLevel, DeveloperProfile } from '../models';
import { LivingProfile } from './living_profile_landing';

export const SocialCluster: React.FC = () => {
  const [socialTab, setSocialTab] = useState<'feed' | 'network' | 'profile'>('feed');
  const [selectedType, setSelectedType] = useState<PostType | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  
  // Developer network filters
  const [stackFilter, setStackFilter] = useState<string>('All');
  const [developers, setDevelopers] = useState<DeveloperProfile[]>(MOCK_DEVELOPERS);
  const [activeProfile, setActiveProfile] = useState<DeveloperProfile>(MOCK_DEVELOPERS[0]);

  // Handle follow toggle
  const toggleFollow = (id: string) => {
    setDevelopers(prev => prev.map(dev => {
      if (dev.id === id) {
        return { ...dev, isFollowing: !dev.isFollowing };
      }
      return dev;
    }));
  };

  const filteredPosts = MOCK_POSTS.filter(post => {
    if (selectedType !== 'all' && post.type !== selectedType) return false;
    if (selectedDifficulty !== 'all' && post.difficulty !== selectedDifficulty) return false;
    if (selectedLanguage !== 'all' && !post.languageTags.includes(selectedLanguage)) return false;
    return true;
  });

  const filteredDevelopers = developers.filter(dev => {
    if (stackFilter !== 'All' && !dev.primaryStack.includes(stackFilter)) return false;
    return true;
  });

  return (
    <section className="py-16 bg-slate-50/20 dark:bg-slate-950/40 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-slate-200 dark:border-slate-800/80">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-800/60 text-xs text-cyan-800 dark:text-cyan-300 font-medium mb-3">
              <Users className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Group A: Social Platform Layer</span>
              <span className="font-mono text-[10px] font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">📄 social_cluster_landing.tsx</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Developer Community, Tech-Stack Graph & Living Resumes
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm max-w-2xl">
              Feed for code updates & snippets, Network filtered by stack rather than follower counts, and living Profiles driven by real activity.
            </p>
          </div>

          {/* Sub-Tab Selector */}
          <div className="mt-4 md:mt-0 flex items-center space-x-1 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <button
              onClick={() => setSocialTab('feed')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                socialTab === 'feed'
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              1. Feed (/feed)
            </button>
            <button
              onClick={() => setSocialTab('network')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                socialTab === 'network'
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              2. Network (Stack-Based)
            </button>
            <button
              onClick={() => setSocialTab('profile')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                socialTab === 'profile'
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              3. Living Profile
            </button>
          </div>
        </div>

        {/* TAB 1: FEED SHOWCASE */}
        {socialTab === 'feed' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Feed Column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Story Bar */}
              <div className="bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-300 mb-3 flex items-center justify-between">
                  <span>Community Creator Stories</span>
                  <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">Short-form updates</span>
                </div>
                <div className="flex items-center space-x-4 overflow-x-auto pb-2 scrollbar-none">
                  <div className="flex flex-col items-center space-y-1.5 shrink-0 cursor-pointer group">
                    <div className="w-14 h-14 rounded-full border-2 border-dashed border-cyan-500 flex items-center justify-center bg-slate-100 dark:bg-slate-950 text-cyan-600 dark:text-cyan-400 group-hover:scale-105 transition-transform">
                      <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Add Story</span>
                  </div>

                  {MOCK_STORIES.map(story => (
                    <div key={story.id} className="flex flex-col items-center space-y-1.5 shrink-0 cursor-pointer group">
                      <div className={`p-0.5 rounded-full ${story.hasUnseen ? 'bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-500' : 'bg-slate-200 dark:bg-slate-800'}`}>
                        <img 
                          src={story.avatar} 
                          alt={story.authorName} 
                          className="w-13 h-13 rounded-full object-cover border-2 border-white dark:border-slate-950 group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-[70px]">{story.authorName}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Post Filters Bar */}
              <div className="bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-3 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5"><Filter className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Post Filters</span>
                  <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">Continuous Scroll Stream</span>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  {/* Type Filter */}
                  <select 
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as any)}
                    className="bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="all">All Post Types</option>
                    <option value="snippet">Code Snippet</option>
                    <option value="discussion">Discussion</option>
                    <option value="project_update">Project Update</option>
                  </select>

                  {/* Difficulty Filter */}
                  <select 
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                    className="bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="all">All Difficulty Levels</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>

                  {/* Language Chips */}
                  {['all', 'TypeScript', 'C++', 'Go', 'PostgreSQL'].map(lang => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                        selectedLanguage === lang
                          ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-400 dark:border-cyan-500/40'
                          : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {lang === 'all' ? 'All Languages' : lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feed Posts List */}
              <div className="space-y-4">
                {filteredPosts.map(post => (
                  <div key={post.id} className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm">
                    {/* Post Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <img src={post.author.avatar} alt={post.author.name} className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{post.author.name}</span>
                            {post.author.verified && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 fill-cyan-400/20" />}
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">@{post.author.handle}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{post.author.role} • {post.timeAgo}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          post.difficulty === 'Advanced' ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800' :
                          post.difficulty === 'Intermediate' ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800' :
                          'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        }`}>
                          {post.difficulty}
                        </span>
                      </div>
                    </div>

                    {/* Post Content */}
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed mb-3">
                      {post.content}
                    </p>

                    {/* Code Snippet Box (if present) */}
                    {post.codeSnippet && (
                      <div className="mb-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 font-mono text-[11px] text-white">
                        <div className="bg-slate-900 px-3 py-1.5 flex items-center justify-between border-b border-slate-800 text-slate-400">
                          <span className="flex items-center gap-1"><Terminal className="w-3.5 h-3.5 text-cyan-400" /> {post.codeSnippet.language}</span>
                          <span>CPA Syntax Highlight</span>
                        </div>
                        <pre className="p-3 text-cyan-300 overflow-x-auto">
                          <code>{post.codeSnippet.code}</code>
                        </pre>
                      </div>
                    )}

                    {/* Language Tags & Footer Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800/80">
                      <div className="flex flex-wrap gap-1.5">
                        {post.languageTags.map((tag, idx) => (
                          <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
                        <button className="flex items-center space-x-1 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                          <ThumbsUp className={`w-3.5 h-3.5 ${post.isUpvoted ? 'text-cyan-600 dark:text-cyan-400 fill-cyan-400' : ''}`} />
                          <span>{post.upvotes}</span>
                        </button>
                        <button className="flex items-center space-x-1 hover:text-slate-900 dark:hover:text-white transition-colors">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{post.commentsCount}</span>
                        </button>
                        <button className="hover:text-slate-900 dark:hover:text-white transition-colors">
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>

            </div>

            {/* Sidebar: Recommended Builders */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span>Recommended Builders</span>
                  </h3>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Based on stack</span>
                </div>

                <div className="space-y-4">
                  {developers.map(dev => (
                    <div key={dev.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center space-x-2.5">
                        <img src={dev.avatar} alt={dev.name} className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white block">{dev.name}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">@{dev.handle}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => toggleFollow(dev.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                          dev.isFollowing 
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700' 
                            : 'bg-cyan-500 hover:bg-cyan-400 text-white dark:text-slate-950 font-bold'
                        }`}
                      >
                        {dev.isFollowing ? (
                          <>
                            <UserCheck className="w-3 h-3" />
                            <span>Following</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3" />
                            <span>Follow</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feed Pitch Card */}
              <div className="bg-gradient-to-br from-cyan-50 to-indigo-50 dark:from-cyan-950/60 dark:to-indigo-950/60 p-5 rounded-2xl border border-cyan-200 dark:border-cyan-800/40 text-xs">
                <span className="text-cyan-700 dark:text-cyan-400 font-mono font-bold block mb-1">CPA Feed vs Explore</span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  While <strong>Explore</strong> is the public search hub for long-form articles & videos, <strong>Feed</strong> is community activity central for posts, code snippets, stories, and builder discussions.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: NETWORK SHOWCASE (Stack-Based Filtering) */}
        {socialTab === 'network' && (
          <div className="space-y-6">
            
            <div className="bg-white dark:bg-slate-900/90 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span>Tech Stack Social Graph</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Find and connect with engineers filtered by actual technologies used, rather than follower vanity metrics.
                  </p>
                </div>

                {/* Stack Filter Selector */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Filter Stack:</span>
                  <div className="flex space-x-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                    {['All', 'Go', 'React', 'Rust', 'Python'].map(tech => (
                      <button
                        key={tech}
                        onClick={() => setStackFilter(tech)}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
                          stackFilter === tech
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        {tech}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Developer Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredDevelopers.map(dev => (
                <div key={dev.id} className="bg-white dark:bg-slate-900/90 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <img src={dev.avatar} alt={dev.name} className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{dev.name}</h4>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">@{dev.handle}</span>
                        </div>
                      </div>

                      {dev.openToWork && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold flex items-center gap-1">
                          <Briefcase className="w-3 h-3" /> Open To Work
                        </span>
                      )}
                      {dev.isHiring && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-semibold">
                          Hiring
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                      {dev.bio}
                    </p>

                    <div className="mb-4">
                      <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block mb-1.5">Tech Stack</span>
                      <div className="flex flex-wrap gap-1.5">
                        {dev.primaryStack.map((tech, i) => (
                          <span key={i} className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" /> {dev.location}
                    </span>

                    <button 
                      onClick={() => {
                        setActiveProfile(dev);
                        setSocialTab('profile');
                      }}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
                    >
                      <span>View Living Resume</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 3: PROFILE SHOWCASE (Activity-Derived Living Resume) */}
        {socialTab === 'profile' && (
          <LivingProfile />
        )}

      </div>
    </section>
  );
};
