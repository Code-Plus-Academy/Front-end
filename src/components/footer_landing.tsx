import React from 'react';
import { 
  ShieldCheck, 
  ExternalLink, 
  GraduationCap, 
  Users, 
  Video, 
  Heart
} from 'lucide-react';
import { TabType } from '../models';
import { CpaLogo } from './cpa_logo_landing';

interface FooterProps {
  onSelectTab: (tab: TabType) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 dark:bg-slate-950 dark:text-slate-400 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand & Corporate Column */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center space-x-3">
              <CpaLogo size={38} variant="dark" />
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-300 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-premium-gradient">Code Plus Academy</span>
                <span className="text-[10px] text-cyan-400 font-mono">CPA Ecosystem</span>
              </div>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed">
              The unified developer platform combining social activity feeds, structured academic study notes, video/content discovery, native technical writing, and creator tools.
            </p>

            <div className="p-3 rounded-xl bg-slate-800/80 dark:bg-slate-900 border border-slate-700 dark:border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Corporate Entity
              </span>
              <p className="text-[11px] text-slate-200 dark:text-slate-300 font-medium">
                Kalki Technology Pvt. Ltd.
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                A subsidiary of Neeta Holdings Pvt. Ltd.
              </p>
            </div>
          </div>

          {/* Group A: Social Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-4 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Group A: Social</span>
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button onClick={() => onSelectTab('social')} className="hover:text-cyan-400 transition-colors text-left">
                  Developer Feed (/feed)
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('social')} className="hover:text-cyan-400 transition-colors text-left">
                  Stack-Based Network
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('social')} className="hover:text-cyan-400 transition-colors text-left">
                  Activity-Derived Living Resumes
                </button>
              </li>
              <li>
                <span className="text-slate-400 dark:text-slate-500 text-[11px]">Community Story Bars</span>
              </li>
              <li>
                <span className="text-slate-400 dark:text-slate-500 text-[11px]">Open To Work & Hiring Badges</span>
              </li>
            </ul>
          </div>

          {/* Group B: Learning & Development Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-4 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Group B: Learning</span>
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button onClick={() => onSelectTab('learning')} className="hover:text-indigo-400 transition-colors text-left">
                  Notes Arena (8 Academic Types)
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('learning')} className="hover:text-indigo-400 transition-colors text-left">
                  11 Native Technical Article Formats
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('learning')} className="hover:text-indigo-400 transition-colors text-left">
                  Explore Content Discovery Hub
                </button>
              </li>
              <li>
                <span className="text-slate-400 dark:text-slate-500 text-[11px]">Solved PYQs & Lab Manuals</span>
              </li>
              <li>
                <span className="text-slate-400 dark:text-slate-500 text-[11px]">College & Department Scope</span>
              </li>
            </ul>
          </div>

          {/* Creator & Platform Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-4 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-purple-400" />
              <span>Creator & Live Hub</span>
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button onClick={() => onSelectTab('studio')} className="hover:text-purple-400 transition-colors text-left">
                  CPA Creator Studio
                </button>
              </li>
              <li>
                <a 
                  href="https://studio.codeplusacademy.in/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-purple-400 font-bold hover:underline flex items-center gap-1"
                >
                  <span>studio.codeplusacademy.in ↗</span>
                </a>
              </li>
              <li>
                <button onClick={() => onSelectTab('demo')} className="hover:text-emerald-400 transition-colors text-left">
                  Interactive Platform Explore
                </button>
              </li>
              <li>
                <a 
                  href="https://codeplusacademy.in" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-cyan-400 font-bold hover:underline flex items-center gap-1"
                >
                  <span>codeplusacademy.in</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <span className="text-slate-400 dark:text-slate-500 text-[11px]">No Forced Login Model</span>
              </li>
              <li>
                <span className="text-slate-400 dark:text-slate-500 text-[11px]">Community PR Review</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 dark:text-slate-500">
          <div>
            © {new Date().getFullYear()} Code Plus Academy (CPA) • Kalki Technology Pvt. Ltd. (subsidiary of Neeta Holdings Pvt. Ltd.). All rights reserved.
          </div>

          <div className="flex items-center space-x-4">
            <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">📄 footer_landing.tsx</span>
            <span className="flex items-center gap-1">
              Crafted with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> for Developers
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};
