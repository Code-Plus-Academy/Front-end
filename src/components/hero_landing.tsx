'use client';

import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  Users, 
  Video, 
  Compass
} from 'lucide-react';
import { motion } from 'framer-motion';
import { TabType } from '../models';
import { useRouter } from 'next/navigation';

interface HeroProps {
  onExploreClick?: () => void;
  onSelectTab?: (tab: any) => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreClick, onSelectTab }) => {
  const router = useRouter();
  return (
    <section className="relative pt-12 pb-20 overflow-hidden bg-slate-50/20 dark:bg-slate-950/40 border-b border-slate-200/80 dark:border-slate-800/60 transition-colors">
      {/* Dynamic Background Glow & Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
      
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-500/10 via-indigo-500/10 to-purple-500/10 rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main Value Proposition Headline */}
        <div className="text-center max-w-4xl mx-auto">
          <div className="p-6 sm:p-8 rounded-3xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 shadow-[0_0_30px_-5px_rgba(99,102,241,0.12)] ring-1 ring-slate-900/5 dark:ring-white/10 transition-all">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[10px] font-mono font-bold mb-4">
              <span>📄 hero_landing.tsx</span>
            </div>
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]"
            >
              One ecosystem.{' '}
              <span className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 dark:from-cyan-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                Every tool you need to learn, build, and grow — together.
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 text-lg sm:text-xl text-slate-700 dark:text-slate-300 font-medium leading-relaxed max-w-3xl mx-auto"
            >
              Feed. Notes Arena. Explore. Articles. Studio. Five tools, one seamless developer ecosystem.
            </motion.p>
          </div>



          {/* CTA Button Row */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => {
                if (onExploreClick) onExploreClick();
                else router.push('/explore');
              }}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:opacity-95 text-white font-bold text-sm px-7 py-3.5 rounded-2xl shadow-xl shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Public Hub (No Login)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onSelectTab?.('demo')}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm px-6 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-800 transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Try Live Interactive Platform Demo</span>
            </button>
          </motion.div>
        </div>

        {/* Live Feature Group Quick Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {/* Card 1: Social Group */}
          <div 
            onClick={() => onSelectTab('social')}
            className="group relative bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer shadow-md dark:shadow-lg hover:shadow-cyan-500/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-800/50 flex items-center justify-center text-cyan-700 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 font-medium">GROUP A</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors flex items-center justify-between">
              <span>Developer Social Layer</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-600 dark:text-cyan-400" />
            </h3>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Feed with story bars, code snippet cards, difficulty filters, tech-stack network connections, and activity-derived living resumes.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Feed</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Network</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Living Resume</span>
            </div>
          </div>

          {/* Card 2: Learning Group */}
          <div 
            onClick={() => onSelectTab('learning')}
            className="group relative bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer shadow-md dark:shadow-lg hover:shadow-indigo-500/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-300 dark:border-indigo-800/50 flex items-center justify-center text-indigo-700 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 font-medium">GROUP B</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors flex items-center justify-between">
              <span>Learning & Notes Hub</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600 dark:text-indigo-400" />
            </h3>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Notes Arena with 8 academic formats, College/Department scope hierarchies, 11 native article types, and video discovery on Explore.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Explore</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Notes Arena</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">11 Article Formats</span>
            </div>
          </div>

          {/* Card 3: Creator Studio */}
          <div 
            onClick={() => onSelectTab('studio')}
            className="group relative bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 transition-all cursor-pointer shadow-md dark:shadow-lg hover:shadow-purple-500/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 border border-purple-300 dark:border-purple-800/50 flex items-center justify-center text-purple-700 dark:text-purple-400 group-hover:scale-110 transition-transform">
                <Video className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 font-medium">CREATOR TOOL</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors flex items-center justify-between">
              <span>CPA Creator Studio</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-purple-600 dark:text-purple-400" />
            </h3>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              YouTube Studio-style control center to upload videos, manage long-form technical articles, and track notes PR contributions.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Video Uploads</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Article Publishing</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">PR Analytics</span>
            </div>
          </div>
        </motion.div>

        {/* Live Metrics Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-4xl mx-auto shadow-sm"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-cyan-600 dark:text-cyan-400">100,000+</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Academic Notes & PYQs</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">45,000+</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Active Community Devs</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">11 Formats</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Native Technical Articles</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">8 Resource Types</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Structured Notes Arena</div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
