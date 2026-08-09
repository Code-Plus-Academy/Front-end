import React, { useState } from 'react';
import { 
  Sparkles, 
  Users, 
  GraduationCap, 
  Video, 
  Compass, 
  ArrowRight,
  ExternalLink,
  Sun,
  Moon,
  Menu,
  X,
  LogIn
} from 'lucide-react';
import { TabType } from '../models';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { CpaLogo } from './cpa_logo_landing';
import LoginPromptModal from './ui/LoginPromptModal';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenDemo }) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleNavClick = (tab: TabType) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handleCtaClick = () => {
    if (user) {
      window.location.href = '/explore';
    } else {
      setShowLoginModal(true);
    }
  };

  const navItems: { id: TabType; label: string; shortLabel: string; icon: React.ElementType; color: string; href: string; isExternal?: boolean }[] = [
    { id: 'social', label: 'Developer Feed', shortLabel: 'Social', icon: Users, color: 'text-cyan-500 dark:text-cyan-400', href: '/feed' },
    { id: 'learning', label: 'Learning & Notes', shortLabel: 'Notes', icon: GraduationCap, color: 'text-indigo-500 dark:text-indigo-400', href: '/notes' },
    { id: 'studio', label: 'Creator Studio', shortLabel: 'Studio', icon: Video, color: 'text-purple-500 dark:text-purple-400', href: 'https://studio.codeplusacademy.in', isExternal: true },
    { id: 'demo', label: 'Live Explore', shortLabel: 'Explore', icon: Sparkles, color: 'text-emerald-500 dark:text-emerald-400', href: '/explore' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-950/90 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200">
      {/* Decorative top accent gradient line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Identity */}
        <a 
          href="/feed"
          className="flex items-center space-x-3 cursor-pointer group flex-shrink-0 no-underline" 
        >
          <div className="relative flex items-center justify-center transition-all duration-300 group-hover:scale-105">
            <CpaLogo size={42} />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-full w-full bg-cyan-400"></span>
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight leading-none bg-gradient-to-r from-cyan-600 via-indigo-600 via-purple-600 to-pink-600 dark:from-cyan-400 dark:via-indigo-300 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent animate-premium-gradient transition-transform duration-300 group-hover:scale-[1.02] drop-shadow-sm">
                Code Plus Academy
              </span>
              <span className="hidden sm:inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-bold">
                navbar_landing.tsx
              </span>
            </div>
          </div>
        </a>

        {/* Center Nav Items (Desktop / Tablet) */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-100/80 dark:bg-slate-900/80 p-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                target={item.isExternal ? '_blank' : '_self'}
                rel={item.isExternal ? 'noopener noreferrer' : undefined}
                className={`relative flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 no-underline ${
                  isActive
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700/80'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? item.color : 'text-slate-400'}`} />
                <span className="hidden lg:inline">{item.label}</span>
                <span className="lg:hidden">{item.shortLabel}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-cyan-500 rounded-full" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Right CTA Actions & Theme Switcher */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all shadow-sm"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* Website & Studio Links */}
          <div className="hidden xl:flex items-center space-x-2">
            <a
              href="https://codeplusacademy.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 font-medium px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/50 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all"
            >
              <span>codeplusacademy.in</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            <a
              href="https://studio.codeplusacademy.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 text-xs text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-200 font-bold px-2.5 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-all"
            >
              <span>studio.codeplusacademy.in</span>
              <ExternalLink className="w-3 h-3 text-purple-400" />
            </a>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={handleCtaClick}
            className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:opacity-95 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {user ? (
              <>
                <Compass className="w-3.5 h-3.5" />
                <span>Explore Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          {/* Mobile Drawer Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top-2 duration-200 shadow-xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                target={item.isExternal ? '_blank' : '_self'}
                rel={item.isExternal ? 'noopener noreferrer' : undefined}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition-all no-underline ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-slate-800 shadow-md'
                    : 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${item.color}`} />
                  <span>{item.label}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-60" />
              </a>
            );
          })}

          <div className="pt-3 flex flex-col space-y-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <a
                href="https://codeplusacademy.in"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center space-x-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900"
              >
                <span>codeplusacademy.in</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href="https://studio.codeplusacademy.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center space-x-1.5 text-xs text-purple-700 dark:text-purple-300 font-bold py-2 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/50"
              >
                <span>studio.codeplusacademy.in</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleCtaClick();
              }}
              className="flex-1 flex items-center justify-center space-x-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-bold py-2.5 rounded-xl shadow-md"
            >
              {user ? (
                <>
                  <Compass className="w-4 h-4" />
                  <span>Explore Hub</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Auth Modal for unauthenticated users */}
      <LoginPromptModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        actionType="general"
        onLoginSuccess={() => {
          setShowLoginModal(false);
          window.location.href = '/explore';
        }}
      />
    </header>
  );
};
