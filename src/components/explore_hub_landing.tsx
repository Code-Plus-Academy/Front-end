import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Clock, 
  Eye, 
  ThumbsUp, 
  Bookmark, 
  Lock, 
  Play, 
  Code2, 
  ExternalLink, 
  CheckCircle2, 
  ChevronRight,
  ChevronLeft,
  Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_ARTICLES, MOCK_VIDEOS } from '../data/mockData';
import { ArticleItem } from '../models';
import { CpaLogo } from './cpa_logo_landing';
import api from '../api/axios';

export const ExploreHubSpotlight: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [modalAction, setModalAction] = useState<string>('engage');
  const [realVideos, setRealVideos] = useState<any[]>([]);

  // Auto-rotating trending banner
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % MOCK_ARTICLES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Fetch published videos from backend
  useEffect(() => {
    let isMounted = true;
    api.get('/videos')
      .then((res) => {
        if (isMounted && res.data?.videos && res.data.videos.length > 0) {
          setRealVideos(res.data.videos);
        }
      })
      .catch((err) => {
        console.warn('Backend video discovery lookup:', err.message);
      });
    return () => { isMounted = false; };
  }, []);

  const handleInteractionAttempt = (actionName: string) => {
    setModalAction(actionName);
    setShowLoginModal(true);
  };

  const activeArticle: ArticleItem = MOCK_ARTICLES[currentSlide];

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

  const displayVideos = realVideos.length > 0
    ? realVideos.slice(0, 6).map((v) => ({
        id: v.id,
        title: v.title || 'Untitled Video',
        category: v.category || (v.content_type === 'short' ? 'Shorts' : 'Web Dev'),
        duration: typeof v.duration === 'number' ? formatDuration(v.duration) : (v.duration || '12:40'),
        views: typeof v.views_count === 'number' ? formatViews(v.views_count) : (v.views || '48K views'),
        thumbnail: v.thumbnail_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600',
        contentType: v.content_type || 'long',
      }))
    : MOCK_VIDEOS;

  const handleVideoCardClick = (vid: any) => {
    if (vid.contentType === 'short' || vid.category === 'Shorts') {
      window.location.href = vid.id ? `/shorts?v=${vid.id}` : '/shorts';
    } else if (vid.id) {
      window.location.href = `/videos/${vid.id}`;
    } else {
      handleInteractionAttempt('Playing Video Hub Tutorial');
    }
  };

  return (
    <section className="py-16 bg-white/20 dark:bg-slate-950/40 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-slate-200 dark:border-slate-800/80">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 text-[10px] font-mono font-bold mb-2">
              <span>📄 explore_hub_landing.tsx</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Public Content Discovery
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm max-w-2xl">
              Browse technical deep-dives, video tutorials, and developer notes freely.
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center space-x-3 bg-slate-100 dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <div className="text-xs">
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold block">Browse Freely</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Sign in to clap, bookmark & comment</span>
            </div>
          </div>
        </div>

        {/* 1. Trending Articles Banner */}
        <div className="relative mb-12 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 text-white shadow-xl dark:shadow-2xl">
          <div className="relative min-h-[340px] md:min-h-[380px] flex flex-col justify-end p-6 md:p-10">
            
            {/* Visual Thumbnail Rendering */}
            {activeArticle.coverImage ? (
              <div 
                className="absolute inset-0 bg-cover bg-center transition-all duration-700 opacity-30"
                style={{ backgroundImage: `url(${activeArticle.coverImage})` }}
              />
            ) : activeArticle.inlineImage ? (
              <div 
                className="absolute inset-0 bg-cover bg-center transition-all duration-700 opacity-25"
                style={{ backgroundImage: `url(${activeArticle.inlineImage})` }}
              />
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${activeArticle.gradientBg || 'from-indigo-900 via-slate-900 to-purple-950'} opacity-40`} />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />

            {/* Banner Overlay Controls */}
            <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  TRENDING ARTICLE #{currentSlide + 1}
                </span>

                <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800/80 text-cyan-300 font-medium border border-slate-700">
                  {activeArticle.categoryLabel}
                </span>

                <span className="text-xs text-slate-300 flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  {activeArticle.readTime}
                </span>
              </div>

              <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight max-w-3xl leading-snug">
                {activeArticle.title}
              </h3>

              <p className="mt-3 text-slate-300 text-xs sm:text-sm max-w-2xl line-clamp-2">
                {activeArticle.snippet}
              </p>

              {/* Author Info & Engagement Row */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
                <div className="flex items-center space-x-3">
                  <img 
                    src={activeArticle.author.avatar} 
                    alt={activeArticle.author.name} 
                    className="w-9 h-9 rounded-full border border-slate-700 object-cover"
                  />
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-white">{activeArticle.author.name}</span>
                      {activeArticle.author.verified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">@{activeArticle.author.handle}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Eye className="w-4 h-4 text-slate-400" />
                    {activeArticle.viewCount.toLocaleString()} views
                  </span>

                  <button 
                    onClick={() => handleInteractionAttempt('Clapping / Liking')}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-200 font-medium border border-slate-700 transition-colors"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{activeArticle.clapCount}</span>
                  </button>

                  <button 
                    onClick={() => handleInteractionAttempt('Bookmarking to Notes Arena')}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-200 font-medium border border-slate-700 transition-colors"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-purple-400" />
                    <span>Save to Notes</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Slide Navigation Dots */}
            <div className="absolute top-6 right-6 flex items-center space-x-2 z-20">
              <button 
                onClick={() => setCurrentSlide((prev) => (prev === 0 ? MOCK_ARTICLES.length - 1 : prev - 1))}
                className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex space-x-1.5 px-2">
                {MOCK_ARTICLES.map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-full transition-all ${idx === currentSlide ? 'w-6 bg-cyan-400' : 'w-2 bg-slate-700'}`}
                  />
                ))}
              </div>
              <button 
                onClick={() => setCurrentSlide((prev) => (prev + 1) % MOCK_ARTICLES.length)}
                className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

        {/* Video Discovery */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Play className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Video Discovery</span>
            </h3>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-mono">Long & Shorts</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {displayVideos.map((vid) => (
              <div 
                key={vid.id}
                className="group bg-slate-50 dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex space-x-3 cursor-pointer shadow-sm"
                onClick={() => handleVideoCardClick(vid)}
              >
                <div className="relative w-28 h-20 rounded-xl overflow-hidden bg-slate-900 shrink-0">
                  <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-slate-950/30 flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-lg">
                      <Play className="w-3.5 h-3.5 ml-0.5 fill-white" />
                    </div>
                  </div>
                  <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-slate-950/90 text-slate-200 px-1 rounded">
                    {vid.duration}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-[9px] uppercase font-bold text-purple-600 dark:text-purple-400 tracking-wider block mb-1">
                    {vid.category}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-white line-clamp-2 leading-snug">
                    {vid.title}
                  </h4>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">{vid.views}</span>
                </div>
              </div>
            ))}
          </div>
        </div>



      </div>

      {/* Friction-Free Interaction Sign-In Modal Prompt */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
            >
              <div className="mb-4">
                <CpaLogo size={48} />
              </div>

              <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 border border-slate-200 dark:border-slate-700 font-semibold uppercase">
                Browse freely • Sign in to engage
              </span>

              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-3">
                Sign in to continue with {modalAction}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Code Plus Academy allows anyone to read articles, view videos, and search notes without an account. To {modalAction.toLowerCase()}, bookmark resources, or write reviews, simply log in with your developer account.
              </p>

              <div className="mt-6 space-y-2.5">
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 hover:opacity-95"
                >
                  Continue with GitHub / Google
                </button>

                <button
                  onClick={() => setShowLoginModal(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-slate-700"
                >
                  Keep Browsing Anonymously
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
};
