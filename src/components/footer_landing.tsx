import React from 'react';
import { 
  ShieldCheck, 
  ExternalLink, 
  GraduationCap, 
  Users, 
  Video, 
  Heart,
  Briefcase,
  Globe,
  HelpCircle,
  FileText,
  Lock
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
              The unified developer platform combining social activity feeds, structured academic study notes, career portal, native technical writing, and creator tools.
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

          {/* Product & Platform */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-4 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Product & Platform</span>
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="/feed" className="hover:text-cyan-400 transition-colors">
                  Developer Feed
                </a>
              </li>
              <li>
                <a href="/career" className="hover:text-amber-400 transition-colors font-semibold text-amber-300 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-amber-400" />
                  <span>Careers & Internships</span>
                </a>
              </li>
              <li>
                <a href="/notes" className="hover:text-indigo-400 transition-colors">
                  Notes Arena & Study Materials
                </a>
              </li>
              <li>
                <a href="https://studio.codeplusacademy.in/" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors flex items-center gap-1">
                  <span>Creator Studio</span>
                  <ExternalLink className="w-3 h-3 text-purple-400" />
                </a>
              </li>
              <li>
                <a href="/explore" className="hover:text-emerald-400 transition-colors">
                  Live Explore Hub
                </a>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-4 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Community</span>
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="https://discord.gg/J3bRCDTBc" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">
                  Discord
                </a>
              </li>
              <li>
                <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">
                  GitHub
                </a>
              </li>
              <li>
                <a href="https://x.com/C_Plus_Academy" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">
                  Twitter/X
                </a>
              </li>
              <li>
                <a href="/support#" className="hover:text-indigo-400 transition-colors">
                  Newsletter
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-4 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Company</span>
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="/about" className="hover:text-purple-400 transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="/contributors" className="hover:text-purple-400 transition-colors">
                  Contributors
                </a>
              </li>
              <li>
                <a href="/partners" className="hover:text-purple-400 transition-colors">
                  Partners Program
                </a>
              </li>
              <li>
                <a href="/support" className="hover:text-purple-400 transition-colors">
                  Support & Compliance
                </a>
              </li>
              <li>
                <a href="/legal/grievance-officer" className="hover:text-purple-400 transition-colors">
                  Grievance Officer
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-purple-400 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-purple-400 transition-colors">
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a href="/cookie-policy" className="hover:text-purple-400 transition-colors">
                  Cookie Policy
                </a>
              </li>
              <li>
                <a href="/faq" className="hover:text-purple-400 transition-colors">
                  Help / FAQ
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Social Links Row & Copyright Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 dark:text-slate-500">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-slate-400 dark:text-slate-400">
            <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
            <span>·</span>
            <a href="https://x.com/C_Plus_Academy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Twitter</a>
            <span>·</span>
            <a href="https://linkedin.com/company/code-plus-academy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">LinkedIn</a>
            <span>·</span>
            <a href="https://instagram.com/code_plus_academy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a>
            <span>·</span>
            <a href="https://youtube.com/@code_plus_academy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">YouTube</a>
          </div>

          <div className="flex items-center space-x-2">
            <span>© 2026 Code Plus Academy · Kalki Technology Pvt. Ltd.</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
