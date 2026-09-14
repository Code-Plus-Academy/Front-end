'use client';

import React from 'react';
import {
  X,
  UserCircle2,
  ArrowRight,
  Home,
  BookOpen,
  Bookmark,
  Compass,
  MessageCircle,
  Sparkles,
  Settings,
  Moon,
  LogOut,
  ChevronRight,
  Shield,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function UserMenuDropdown({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  if (!isOpen || !user) return null;

  const isNotesPage = typeof window !== 'undefined' ? window.location.pathname.startsWith('/notes') : false;

  const handleSignOut = () => {
    onClose();
    logout();
  };

  const handleNavigate = (path) => {
    onClose();
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  };

  return (
    <>
      <style>{`
        .cpa-user-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          width: 360px;
          max-width: calc(100vw - 18px);
          max-height: calc(100vh - 74px);
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch;
          background: ${
            isDark
              ? 'linear-gradient(180deg, #131625 0%, #0F111E 100%)'
              : 'linear-gradient(180deg, #FAF8FF 0%, #FFFFFF 28%, #FAF9FF 100%)'
          };
          border: 1px solid ${isDark ? 'rgba(139, 92, 246, 0.2)' : '#E9E4F8'};
          border-radius: 24px;
          padding: 12px 12px 8px;
          box-shadow: ${
            isDark
              ? '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(124, 58, 237, 0.15)'
              : '0 16px 50px -10px rgba(99, 102, 241, 0.16), 0 4px 16px rgba(0,0,0,0.04)'
          };
          animation: cpaDropdownFadeIn 0.16s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 1000;
          font-family: 'Geist', 'Inter', -apple-system, sans-serif;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }

        .cpa-user-dropdown::-webkit-scrollbar {
          display: none;
        }

        @keyframes cpaDropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 480px) {
          .cpa-user-dropdown {
            right: -6px;
            width: calc(100vw - 16px);
            max-height: calc(100vh - 68px);
            padding: 10px 10px 6px;
            border-radius: 20px;
          }
        }
      `}</style>

      <div role="menu" className="cpa-user-dropdown">
        {/* ── TOP HEADER (CLOSE BUTTON) ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 2 }}>
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#EDE9FE'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isDark ? '#F1F5F9' : '#1E1B4B',
              transition: 'all 0.15s ease',
              boxShadow: isDark ? 'none' : '0 2px 5px rgba(0,0,0,0.03)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.12)' : '#F5F3FF';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF';
            }}
          >
            <X size={14} strokeWidth={2.4} />
          </button>
        </div>

        {/* ── USER PROFILE SECTION ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 4px 12px' }}>
          {/* Avatar with Gradient Ring */}
          <div
            style={{
              position: 'relative',
              width: 68,
              height: 68,
              flexShrink: 0,
              borderRadius: '50%',
              padding: 2.5,
              background: 'linear-gradient(135deg, #00D1FF 0%, #8B5CF6 50%, #EC4899 100%)',
              boxShadow: '0 4px 16px rgba(139, 92, 246, 0.25)'
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: isDark ? '#131625' : '#FFFFFF',
                padding: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                alt={user.name || user.username}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            </div>
          </div>

          {/* User Details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  letterSpacing: '-0.02em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {user.name || user.username}
              </span>
              {/* Verified Badge */}
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <path
                  d="M10.5858 1.58579C11.3668 0.804738 12.6332 0.804738 13.4142 1.58579L14.8284 3C15.2034 3.375 15.702 3.58579 16.2322 3.58579H18.2C19.3046 3.58579 20.2 4.48122 20.2 5.58579V7.55355C20.2 8.08379 20.4108 8.58238 20.7858 8.95736L22.2 10.3716C22.981 11.1526 22.981 12.419 22.2 13.2L20.7858 14.6142C20.4108 14.9892 20.2 15.4878 20.2 16.018V17.9858C20.2 19.0904 19.3046 19.9858 18.2 19.9858H16.2322C15.702 19.9858 15.2034 20.1966 14.8284 20.5716L13.4142 21.9858C12.6332 22.7668 11.3668 22.7668 10.5858 21.9858L9.17157 20.5716C8.79659 20.1966 8.29801 19.9858 7.76777 19.9858H5.8C4.69543 19.9858 3.8 19.0904 3.8 17.9858V16.018C3.8 15.4878 3.58921 14.9892 3.21423 14.6142L1.8 13.2C1.01895 12.419 1.01895 11.1526 1.8 10.3716L3.21423 8.95736C3.58921 8.58238 3.8 8.08379 3.8 7.55355V5.58579C3.8 4.48122 4.69543 3.58579 5.8 3.58579H7.76777C8.29801 3.58579 8.79659 3.375 9.17157 3L10.5858 1.58579Z"
                  fill="#6366F1"
                />
                <path
                  d="M9 12L11 14L15 10"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div
              style={{
                fontSize: 12,
                color: isDark ? '#94A3B8' : '#64748B',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginBottom: 6
              }}
            >
              {user.email || `@${user.username}`}
            </div>

            {/* Manage Profile Button */}
            <a
              href={`/u/${user.username}`}
              onClick={(e) => {
                e.preventDefault();
                handleNavigate(`/u/${user.username}`);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3.5px 11px',
                borderRadius: 999,
                border: `1.5px solid ${isDark ? '#6366F1' : '#DDD6FE'}`,
                background: isDark ? 'rgba(99, 102, 241, 0.15)' : '#FFFFFF',
                color: isDark ? '#C7D2FE' : '#6366F1',
                fontSize: 11,
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                boxShadow: isDark ? 'none' : '0 2px 5px rgba(99, 102, 241, 0.06)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#6366F1';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = isDark ? 'rgba(99, 102, 241, 0.15)' : '#FFFFFF';
                e.currentTarget.style.color = isDark ? '#C7D2FE' : '#6366F1';
              }}
            >
              <UserCircle2 size={12} />
              <span>Manage your profile</span>
              <ArrowRight size={11} />
            </a>
          </div>
        </div>

        {/* ── NAVIGATION CONTENT ── */}
        {isNotesPage ? (
          /* When on /notes: 6 direct cards (Feed, Explore, Message, Saved, Career, Studio) */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
            {[
              { to: '/feed', icon: Home, title: 'Feed', subtitle: "See what's new" },
              { to: '/explore', icon: Compass, title: 'Explore', subtitle: 'Discover resources' },
              { to: '/network', icon: MessageCircle, title: 'Message', subtitle: 'Chat with your connections' },
              { to: '/saved', icon: Bookmark, title: 'Saved', subtitle: 'Your saved resources' },
              { to: '/career', icon: Compass, title: 'Career', subtitle: 'Explore opportunities' },
              { to: '/creator/dashboard', icon: Sparkles, title: 'Studio', subtitle: 'Create and collaborate' },
            ].map((item) => {
              const IconComp = item.icon;
              return (
                <a
                  key={item.to}
                  href={item.to}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate(item.to);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 12px',
                    background: isDark ? '#171B2B' : '#FAF8FF',
                    border: `1px solid ${isDark ? '#262D42' : '#EDE8FC'}`,
                    borderRadius: 16,
                    textDecoration: 'none',
                    transition: 'all 0.18s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.borderColor = '#8B5CF6';
                    e.currentTarget.style.background = isDark ? '#1D2237' : '#F4F0FF';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = isDark ? '#262D42' : '#EDE8FC';
                    e.currentTarget.style.background = isDark ? '#171B2B' : '#FAF8FF';
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 11,
                      background: isDark ? 'rgba(139, 92, 246, 0.18)' : '#EDE9FE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isDark ? '#C084FC' : '#7C3AED',
                      flexShrink: 0
                    }}
                  >
                    <IconComp size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: isDark ? '#FFFFFF' : '#0F172A', marginBottom: 1 }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B' }}>
                      {item.subtitle}
                    </div>
                  </div>
                  <ChevronRight size={17} color={isDark ? '#94A3B8' : '#475569'} style={{ flexShrink: 0 }} />
                </a>
              );
            })}
          </div>
        ) : (
          /* When on other pages: Notes Arena card, Saved card, EXPLORE group */
          <>
            {/* Primary Cards (Notes Arena & Saved) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 10 }}>
              {/* Notes Arena Card */}
              <a
                href="/notes"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigate('/notes');
                }}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '9px 12px 9px 14px',
                  background: isDark ? '#171B2B' : '#FAF8FF',
                  border: `1px solid ${isDark ? '#262D42' : '#EDE8FC'}`,
                  borderRadius: 16,
                  textDecoration: 'none',
                  overflow: 'hidden',
                  transition: 'all 0.18s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.borderColor = '#8B5CF6';
                  e.currentTarget.style.background = isDark ? '#1D2237' : '#F4F0FF';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = isDark ? '#262D42' : '#EDE8FC';
                  e.currentTarget.style.background = isDark ? '#171B2B' : '#FAF8FF';
                }}
              >
                {/* Left Accent Strip */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 8,
                    bottom: 8,
                    width: 3.5,
                    borderRadius: '0 4px 4px 0',
                    background: '#6366F1'
                  }}
                />
                {/* Purple Icon Box */}
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    flexShrink: 0,
                    boxShadow: '0 3px 10px rgba(99, 102, 241, 0.25)'
                  }}
                >
                  <BookOpen size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: isDark ? '#FFFFFF' : '#0F172A', marginBottom: 1 }}>
                    Notes Arena
                  </div>
                  <div style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B' }}>
                    Study and share notes
                  </div>
                </div>
                <ChevronRight size={17} color="#6366F1" style={{ flexShrink: 0 }} />
              </a>

              {/* Saved Resources Card */}
              <a
                href="/saved"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigate('/saved');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '9px 12px',
                  background: isDark ? '#171B2B' : '#FAF8FF',
                  border: `1px solid ${isDark ? '#262D42' : '#EDE8FC'}`,
                  borderRadius: 16,
                  textDecoration: 'none',
                  transition: 'all 0.18s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.borderColor = '#8B5CF6';
                  e.currentTarget.style.background = isDark ? '#1D2237' : '#F4F0FF';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = isDark ? '#262D42' : '#EDE8FC';
                  e.currentTarget.style.background = isDark ? '#171B2B' : '#FAF8FF';
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    background: isDark ? 'rgba(139, 92, 246, 0.18)' : '#EDE9FE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDark ? '#A78BFA' : '#7C3AED',
                    flexShrink: 0
                  }}
                >
                  <Bookmark size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: isDark ? '#FFFFFF' : '#0F172A', marginBottom: 1 }}>
                    Saved
                  </div>
                  <div style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B' }}>
                    Your saved resources
                  </div>
                </div>
                <ChevronRight size={17} color={isDark ? '#94A3B8' : '#475569'} style={{ flexShrink: 0 }} />
              </a>
            </div>

            {/* EXPLORE Group */}
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '0 4px 4px',
                  fontSize: 10.5,
                  fontWeight: 800,
                  color: '#6366F1',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase'
                }}
              >
                <Sparkles size={12} fill="#6366F1" />
                <span>EXPLORE</span>
              </div>

              {/* Grouped Explore Card */}
              <div
                style={{
                  background: isDark ? '#171B2B' : '#FAF8FF',
                  border: `1px solid ${isDark ? '#262D42' : '#EDE8FC'}`,
                  borderRadius: 16,
                  padding: '3px 5px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Career */}
                <a
                  href="/career"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate('/career');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    padding: '7.5px 9px',
                    borderRadius: 12,
                    textDecoration: 'none',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#21263B' : '#F1EDFD')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: isDark ? 'rgba(99, 102, 241, 0.16)' : '#EDE9FE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isDark ? '#A78BFA' : '#6366F1',
                      flexShrink: 0
                    }}
                  >
                    <Compass size={17} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                      Career
                    </div>
                    <div style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B' }}>
                      Explore opportunities
                    </div>
                  </div>
                  <ChevronRight size={16} color={isDark ? '#94A3B8' : '#475569'} style={{ flexShrink: 0 }} />
                </a>

                <div style={{ height: 1, background: isDark ? '#262D42' : '#F1EDFC', margin: '2px 8px' }} />

                {/* Studio */}
                <a
                  href="/creator/dashboard"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate('/creator/dashboard');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    padding: '7.5px 9px',
                    borderRadius: 12,
                    textDecoration: 'none',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#21263B' : '#F1EDFD')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: isDark ? 'rgba(139, 92, 246, 0.16)' : '#EDE9FE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isDark ? '#C084FC' : '#7C3AED',
                      flexShrink: 0
                    }}
                  >
                    <Sparkles size={17} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                      Studio
                    </div>
                    <div style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B' }}>
                      Create and collaborate
                    </div>
                  </div>
                  <ChevronRight size={16} color={isDark ? '#94A3B8' : '#475569'} style={{ flexShrink: 0 }} />
                </a>
              </div>
            </div>
          </>
        )}

        {/* ── SECTION: PREFERENCES ── */}
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '0 4px 4px',
              fontSize: 10.5,
              fontWeight: 800,
              color: '#6366F1',
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}
          >
            <Settings size={12} color="#6366F1" />
            <span>PREFERENCES</span>
          </div>

          {/* Grouped Preferences Card */}
          <div
            style={{
              background: isDark ? '#171B2B' : '#FAF8FF',
              border: `1px solid ${isDark ? '#262D42' : '#EDE8FC'}`,
              borderRadius: 16,
              padding: '3px 5px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Settings */}
            <a
              href="/settings"
              onClick={(e) => {
                e.preventDefault();
                handleNavigate('/settings');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '7.5px 9px',
                borderRadius: 12,
                textDecoration: 'none',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#21263B' : '#F1EDFD')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: isDark ? 'rgba(99, 102, 241, 0.16)' : '#EDE9FE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isDark ? '#A78BFA' : '#6366F1',
                  flexShrink: 0
                }}
              >
                <Settings size={17} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                  Settings
                </div>
                <div style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B' }}>
                  Account and app settings
                </div>
              </div>
              <ChevronRight size={16} color={isDark ? '#94A3B8' : '#475569'} style={{ flexShrink: 0 }} />
            </a>

            <div style={{ height: 1, background: isDark ? '#262D42' : '#F1EDFC', margin: '2px 8px' }} />

            {/* Dark Mode Toggle */}
            <div
              onClick={toggleTheme}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '7.5px 9px',
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#21263B' : '#F1EDFD')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: isDark ? 'rgba(99, 102, 241, 0.16)' : '#EDE9FE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isDark ? '#A78BFA' : '#6366F1',
                  flexShrink: 0
                }}
              >
                <Moon size={17} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                  Dark Mode
                </div>
                <div style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B' }}>
                  Switch appearance
                </div>
              </div>

              {/* Toggle Switch */}
              <div
                style={{
                  width: 42,
                  height: 23,
                  borderRadius: 999,
                  background: isDark ? '#6366F1' : '#E2E8F0',
                  padding: 2,
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0
                }}
              >
                <div
                  style={{
                    width: 19,
                    height: 19,
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    transform: isDark ? 'translateX(19px)' : 'translateX(0px)',
                    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.22)'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION: SIGN OUT CARD ── */}
        <div
          onClick={handleSignOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '9px 12px',
            background: isDark ? 'rgba(239, 68, 68, 0.08)' : '#FFF1F2',
            border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.2)' : '#FFE4E6'}`,
            borderRadius: 16,
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            marginBottom: 4
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.15)' : '#FFE4E6';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.08)' : '#FFF1F2';
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: isDark ? 'rgba(239, 68, 68, 0.16)' : '#FFE4E6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EF4444',
              flexShrink: 0
            }}
          >
            <LogOut size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#EF4444' }}>
              Sign out
            </div>
            <div style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B' }}>
              Logout from your account
            </div>
          </div>
          <ChevronRight size={17} color="#EF4444" style={{ flexShrink: 0 }} />
        </div>

        {/* ── SECTION: SCENIC MOUNTAIN FOOTER & COMPLIANCE LINKS ── */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            minHeight: 66,
            marginTop: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingBottom: 2,
            overflow: 'hidden'
          }}
        >
          {/* Scenic Mountain Background Illustration */}
          <svg
            viewBox="0 0 400 120"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              opacity: isDark ? 0.35 : 0.75
            }}
          >
            <defs>
              <linearGradient id="mtnGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="mtnGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#DDD6FE" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="mtnGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.95" />
              </linearGradient>
            </defs>

            {/* Background Mountain Peaks */}
            <path d="M0,120 L40,85 L90,105 L160,65 L220,110 L280,75 L340,100 L400,70 L400,120 Z" fill="url(#mtnGrad1)" />

            {/* Middle Mountain Peaks */}
            <path d="M0,120 L70,80 L130,100 L200,50 L270,95 L330,60 L400,90 L400,120 Z" fill="url(#mtnGrad2)" />

            {/* Foreground Mountain with Flag */}
            <path d="M30,120 L100,60 L140,88 L200,38 L250,85 L320,55 L380,120 Z" fill="url(#mtnGrad3)" />

            {/* Summit Flag */}
            <line x1="200" y1="38" x2="200" y2="28" stroke="#6366F1" strokeWidth="1.5" />
            <polygon points="200,28 208,31 200,34" fill="#6366F1" />

            {/* Subtle Pine Trees on Mountain Flanks */}
            <path d="M40,115 L43,105 L46,115 Z M48,118 L51,108 L54,118 Z M350,115 L353,105 L356,115 Z M360,118 L363,108 L366,118 Z M370,114 L373,104 L376,114 Z" fill="#7C3AED" opacity="0.6" />

            {/* Birds in Distance */}
            <path d="M120,40 Q124,36 128,40 Q132,36 136,40" stroke="#8B5CF6" strokeWidth="1" fill="none" opacity="0.5" />
            <path d="M280,35 Q283,32 286,35 Q289,32 292,35" stroke="#8B5CF6" strokeWidth="0.9" fill="none" opacity="0.5" />
          </svg>

          {/* Compliance Footer Links */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              fontSize: 11,
              fontWeight: 600,
              padding: '4px 0 2px'
            }}
          >
            <a
              href="/privacy"
              onClick={(e) => {
                e.preventDefault();
                handleNavigate('/privacy');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                color: isDark ? '#C7D2FE' : '#475569',
                textDecoration: 'none',
                transition: 'color 0.15s'
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#6366F1')}
              onMouseLeave={e => (e.currentTarget.style.color = isDark ? '#C7D2FE' : '#475569')}
            >
              <Shield size={11} color="#6366F1" />
              <span>Privacy policy</span>
            </a>

            <span style={{ color: isDark ? '#475569' : '#CBD5E1', fontSize: 11 }}>|</span>

            <a
              href="/terms"
              onClick={(e) => {
                e.preventDefault();
                handleNavigate('/terms');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                color: isDark ? '#C7D2FE' : '#475569',
                textDecoration: 'none',
                transition: 'color 0.15s'
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#6366F1')}
              onMouseLeave={e => (e.currentTarget.style.color = isDark ? '#C7D2FE' : '#475569')}
            >
              <FileText size={11} color="#6366F1" />
              <span>Terms of Service</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
