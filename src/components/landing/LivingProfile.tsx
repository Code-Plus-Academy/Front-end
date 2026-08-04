import React, { useState } from 'react';
import { 
  MapPin, 
  Calendar, 
  Briefcase, 
  Check, 
  ExternalLink, 
  ThumbsUp, 
  Eye, 
  FileText, 
  Video, 
  Award, 
  BookOpen, 
  Code, 
  FolderGit2, 
  GraduationCap, 
  Sparkles,
  Share2,
  Edit3,
  ChevronRight
} from 'lucide-react';
import { CpaLogo } from './CpaLogo';

interface LivingProfileProps {
  onEditProfile?: () => void;
}

export const LivingProfile: React.FC<LivingProfileProps> = ({ onEditProfile }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'projects' | 'education' | 'certifications' | 'about'>('home');
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
      
      {/* 1. HERO COVER BANNER */}
      <div className="relative w-full h-48 sm:h-64 bg-gradient-to-r from-purple-100 via-indigo-50 to-cyan-100 dark:from-purple-950/60 dark:via-indigo-950/60 dark:to-cyan-950/60 overflow-hidden border-b border-slate-200/80 dark:border-slate-800">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#818cf8_1px,transparent_1px),linear-gradient(to_bottom,#818cf8_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-15 dark:opacity-20" />

        {/* Decorative Banner Content mimicking CPA Academy Cover */}
        <div className="relative z-10 h-full max-w-7xl mx-auto px-6 py-6 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-indigo-950 dark:text-white uppercase">
                  CODE <span className="text-purple-600 dark:text-purple-400">PLUS</span> ACADEMY
                </span>
              </div>
              <p className="text-[11px] sm:text-xs font-mono font-bold tracking-widest text-indigo-700 dark:text-indigo-300">
                LEARN. BUILD. INNOVATE.
              </p>
            </div>

            {/* Feature Badges in Cover Header */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800/50 shadow-sm flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Goal Focused</span>
              </div>
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-200 dark:border-cyan-800/50 shadow-sm flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Learn & Improve</span>
              </div>
            </div>
          </div>

          <div className="hidden sm:block max-w-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-3 rounded-2xl border border-white/40 dark:border-slate-800/60">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              A Platform Focused on Goals, Growth & Greatness
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5">
              Code Plus Academy is a complete ecosystem to Learn, Connect, Share & Grow. Designed to keep you focused on what truly matters.
            </p>
          </div>
        </div>
      </div>

      {/* 2. PROFILE HEADER AREA (Avatar Overlap + Edit Profile Button) */}
      <div className="px-4 sm:px-8 pb-6 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between -mt-12 sm:-mt-16 mb-4 gap-4">
          
          {/* Avatar Squircle Card with Verified Checkmark */}
          <div className="relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white dark:bg-slate-900 p-2 border-2 border-slate-200 dark:border-slate-700 shadow-xl flex flex-col items-center justify-center text-center">
              <CpaLogo size={48} variant="auto" />
              <div className="mt-1 flex flex-col items-center">
                <span className="text-[9px] font-black tracking-wider text-slate-900 dark:text-white leading-none">STUDIO</span>
                <span className="text-[7px] text-slate-500 dark:text-slate-400 font-mono scale-90">CODE PLUS ACADEMY</span>
              </div>
            </div>

            {/* Purple Verified Badge */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>

          {/* Edit Profile Action Button */}
          <div className="self-end sm:self-auto">
            <button
              onClick={() => {
                setIsEditing(!isEditing);
                if (onEditProfile) onEditProfile();
              }}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-600/30 transition-all duration-200 flex items-center space-x-2"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {/* User Identity Meta */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            CPA Admin
          </h1>
          <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
            @cpa_admin
          </p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 pt-1">
            #Coder
          </p>

          {/* Location / Date / Status Metadata Row */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400 pt-2">
            <div className="flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Planet Earth</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Joined Mar 2026</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Briefcase className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Professional</span>
            </div>
          </div>
        </div>

        {/* 3. STATS ROW */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 my-6">
          <div className="bg-slate-50/80 dark:bg-slate-950/80 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-xs">
            <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">
              50
            </div>
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mt-0.5">
              POSTS
            </div>
          </div>

          <div className="bg-slate-50/80 dark:bg-slate-950/80 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-xs">
            <div className="text-xl sm:text-2xl font-black text-cyan-500 dark:text-cyan-400">
              10
            </div>
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mt-0.5">
              FOLLOWERS
            </div>
          </div>

          <div className="bg-slate-50/80 dark:bg-slate-950/80 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-xs">
            <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">
              4
            </div>
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mt-0.5">
              FOLLOWING
            </div>
          </div>
        </div>

        {/* 4. PROFILE NAVIGATION TABS */}
        <div className="border-b border-slate-200 dark:border-slate-800 mb-6 overflow-x-auto scrollbar-none">
          <div className="flex space-x-6 min-w-max">
            {(['home', 'projects', 'education', 'certifications', 'about'] as const).map((tab) => {
              const isActive = activeTab === tab;
              const labels: Record<string, string> = {
                home: 'Home',
                projects: 'Projects',
                education: 'Education',
                certifications: 'Certifications',
                about: 'About'
              };

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-bold transition-all relative capitalize ${
                    isActive
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {labels[tab]}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. TAB CONTENT PANELS */}
        {activeTab === 'home' && (
          <div className="space-y-8">
            
            {/* Section A: Recent Posts & Articles */}
            <div className="bg-slate-50/50 dark:bg-slate-950/40 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-1 h-5 bg-purple-600 rounded-full" />
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                    Recent Posts & Articles
                  </h3>
                </div>
                <button className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center space-x-0.5">
                  <span>View all</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Article Card matching screenshot */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 hover:border-purple-300 dark:hover:border-purple-800/80 transition-all shadow-xs group cursor-pointer">
                
                {/* Thumbnail */}
                <div className="w-full sm:w-44 h-28 sm:h-24 rounded-xl relative overflow-hidden bg-gradient-to-br from-cyan-100 via-teal-100 to-amber-100 dark:from-cyan-950/50 dark:via-teal-950/50 dark:to-slate-900 flex items-center justify-center flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-white">
                    3 min read
                  </span>
                </div>

                {/* Article Info */}
                <div className="flex-1 flex flex-col justify-between space-y-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider">
                      <span>✏️</span>
                      <span>ARTICLE</span>
                    </div>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                      Digital Marketing – Free Certification Study Guide & Notes
                    </h4>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <div className="flex items-center space-x-1">
                      <span>👏</span>
                      <span>0</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>13</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section B: Videos & Shorts */}
            <div className="bg-slate-50/50 dark:bg-slate-950/40 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-1 h-5 bg-purple-600 rounded-full" />
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                    Videos & Shorts
                  </h3>
                </div>
                <button className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center space-x-0.5">
                  <span>View all</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 block">
                SHORTS
              </span>

              {/* Short Video Card matching screenshot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="w-full max-w-[220px] aspect-[9/14] rounded-2xl relative overflow-hidden bg-slate-950 shadow-md group cursor-pointer border border-slate-800">
                  {/* Motor / Actuator Background Canvas Simulation */}
                  <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/60 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4">
                    <div className="w-28 h-28 rounded-full border-4 border-dashed border-cyan-400/60 flex items-center justify-center relative animate-spin-slow">
                      <div className="w-16 h-16 rounded-full border-2 border-purple-500/80 bg-slate-800 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-cyan-400/80" />
                      </div>
                    </div>
                  </div>

                  {/* Top Badge */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-white flex items-center space-x-1 z-10">
                    <Video className="w-3 h-3 text-purple-400" />
                    <span>SHORT</span>
                  </span>

                  {/* Bottom Text Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent pt-12 text-white z-10">
                    <p className="text-xs font-bold leading-snug line-clamp-3 drop-shadow-sm">
                      What is the difference between inner rotor and outer rotor designs?
                    </p>
                    <p className="text-[10px] text-slate-300 mt-1 font-medium">
                      Video by cubemars_actuator
                    </p>
                    <div className="flex items-center space-x-3 text-[10px] text-slate-300 mt-2">
                      <div className="flex items-center space-x-1">
                        <span>👏</span>
                        <span>1</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>1</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Other Tabs */}
        {activeTab === 'projects' && (
          <div className="py-8 text-center space-y-3">
            <FolderGit2 className="w-10 h-10 text-purple-500 mx-auto" />
            <h4 className="font-bold text-slate-900 dark:text-white">Featured Open Source Projects</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Verified code commits and public repository architecture built by @cpa_admin.
            </p>
          </div>
        )}

        {activeTab === 'education' && (
          <div className="py-8 text-center space-y-3">
            <GraduationCap className="w-10 h-10 text-cyan-500 mx-auto" />
            <h4 className="font-bold text-slate-900 dark:text-white">Academic History & Degrees</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Verified computer science degrees and academic coursework.
            </p>
          </div>
        )}

        {activeTab === 'certifications' && (
          <div className="py-8 text-center space-y-3">
            <Award className="w-10 h-10 text-amber-500 mx-auto" />
            <h4 className="font-bold text-slate-900 dark:text-white">Verified Certifications</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Digital Marketing, Full Stack Engineering, and Cloud Architecture certificates.
            </p>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="py-6 space-y-4">
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">About CPA Admin</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Code Plus Academy Lead Administrator & Platform Architect. Building next-generation developer educational tools, runnable note environments, and interactive learning hubs.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
