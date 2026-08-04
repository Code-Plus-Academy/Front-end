import React, { useState } from 'react';
import { 
  Video, 
  FileText, 
  Upload, 
  GitPullRequest, 
  BarChart3, 
  Sparkles, 
  Edit3, 
  Layers,
  ExternalLink
} from 'lucide-react';

export const StudioSpotlight: React.FC = () => {
  const [studioTab, setStudioTab] = useState<'overview' | 'videos' | 'articles' | 'notes_prs'>('overview');

  return (
    <section className="py-16 bg-white/20 dark:bg-slate-950/40 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Creator Studio Banner Header */}
        <div className="bg-gradient-to-r from-purple-900 via-slate-900 to-indigo-900 dark:from-purple-950/80 dark:via-slate-900 dark:to-indigo-950/80 p-8 rounded-3xl border border-purple-700/40 dark:border-purple-800/40 shadow-xl dark:shadow-2xl relative overflow-hidden mb-10 text-white">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-800/60 dark:bg-purple-900/60 border border-purple-600/60 dark:border-purple-700/60 text-xs text-purple-200 font-bold mb-3">
                <Video className="w-3.5 h-3.5 text-purple-300 dark:text-purple-400" />
                <span>Dedicated Creator Tool • studio.codeplusacademy.in</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                CPA Creator Studio Command Center
              </h2>
              <p className="mt-2 text-slate-200 dark:text-slate-300 text-sm max-w-2xl">
                Functioning like YouTube Studio for everything you create on Code Plus Academy: upload videos & Shorts, write technical articles across 11 formats, and manage academic note contributions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a 
                href="https://studio.codeplusacademy.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-600 to-cyan-500 hover:opacity-95 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02]"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Launch studio.codeplusacademy.in ↗</span>
              </a>
              <button className="px-4 py-2.5 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-purple-200 font-bold text-xs border border-purple-700/60 flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Upload Video / Short</span>
              </button>
            </div>
          </div>
        </div>

        {/* Studio Sub-Navigation */}
        <div className="flex space-x-2 overflow-x-auto pb-4 mb-8 border-b border-slate-200 dark:border-slate-800">
          {[
            { id: 'overview', label: 'Dashboard Overview', icon: BarChart3 },
            { id: 'videos', label: 'Video Manager (Long & Shorts)', icon: Video },
            { id: 'articles', label: 'Published Articles (11 Types)', icon: FileText },
            { id: 'notes_prs', label: 'Notes Arena PR Contributions', icon: GitPullRequest }
          ].map((tab) => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setStudioTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
                  studioTab === tab.id
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                }`}
              >
                <IconComp className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Studio Content View */}
        <div className="space-y-6">
          
          {/* Main Analytics / Management Area */}
          <div className="space-y-6">
            
            {/* Analytics Summary Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block mb-1">Total Reach</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">184,200</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1">+14.2% this month</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block mb-1">Article Claps</span>
                <span className="text-2xl font-black text-purple-600 dark:text-purple-400">12,890</span>
                <span className="text-[10px] text-purple-700 dark:text-purple-300 block mt-1">Across 15 posts</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block mb-1">Video Views</span>
                <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400">89,400</span>
                <span className="text-[10px] text-cyan-700 dark:text-cyan-300 block mt-1">Long & Shorts</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block mb-1">Notes Downloads</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">24,100</span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block mt-1">PR Verified</span>
              </div>
            </div>

            {/* Published Content Table Simulation */}
            <div className="bg-slate-50 dark:bg-slate-900/90 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Recent Creator Content Pipeline</span>
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Filter by status</span>
              </div>

              <div className="space-y-3">
                {[
                  { title: 'Understanding Database Indexing: From B-Trees to LSM-Trees', type: 'Tech Deep-Dive', views: '14.2k', status: 'Published', date: '2 days ago' },
                  { title: 'Building a Full-Stack Social App with React 19 & Go', type: 'Video Tutorial', views: '48.0k', status: 'Published', date: '1 week ago' },
                  { title: 'Design & Analysis of Algorithms Solved PYQs 2024', type: 'Academic Note PR', views: '8.9k', status: 'PR Merged', date: '2 weeks ago' }
                ].map((item, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shadow-sm">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          {item.type}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 text-[10px]">{item.date}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{item.title}</h4>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">{item.views} views</span>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
