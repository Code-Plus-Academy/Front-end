/**
 * Explore.jsx — CPA Content Discovery Engine
 *
 * Changes from previous version:
 *  1. YouTube-style auth gate — page is PUBLIC (no login needed to browse).
 *     Login is required ONLY for: clap (like), save (bookmark), comments.
 *     Unauthenticated users see a "Login to like / save / comment" modal prompt
 *     instead of being redirected. Same pattern as YouTube's home page.
 *
 *  2. Rich article cards — thumbnail comes from:
 *       a) article.og_image_url (manually uploaded at publish time, highest priority)
 *       b) First <img> found in article.content_blocks (auto-extracted)
 *       c) Type-specific gradient fallback
 *     Cards now show: thumbnail, title, author avatar (fetched from API),
 *     author name, time ago, view count, clap count — like a YouTube video card.
 *
 *  3. Thumbnail at publish time — the PublishModal (used by Studio) passes a
 *     separate thumbnail upload field. For the Explore page this means we always
 *     prefer og_image_url when available, otherwise auto-extract from blocks.
 *
 *  Integration map unchanged from before — see top of original file.
 */

'use client';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, X, Bookmark, BookOpen, Palette, Cloud, Plug, FileText, Heart, MessageSquare, SearchX } from 'lucide-react';
import ClapIcon from '../components/icons/ClapIcon';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useLocation } from 'react-router-dom';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import LottieSearchLoader from '../components/ui/LottieSearchLoader';

import api from '../api/axios';
import {
  getGraphQLSearch,
  getGraphQLSearchSection,
  getGraphQLSearchCreators,
} from '../api/graphql';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { DARK as DARK_T, LIGHT as LIGHT_T } from '../styles/tokens';
import VideoShortsRow, { ShortCard } from '../components/videos/VideoShortsRow';
import VideoDiscoveryBlock from '../components/videos/VideoDiscoveryBlock';
import { TopProfileCard, PeopleCard } from '../components/people/PeopleCards';

/* ─────────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────────────────────────────────────── */
function useT() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const base = isDark ? DARK_T : LIGHT_T;
  return {
    bg:        isDark ? '#0B0F14'  : '#F8FAFC',
    card:      isDark ? '#111827'  : '#FFFFFF',
    cardHov:   isDark ? '#161f2e'  : '#FAFAFA',
    border:    isDark ? base.cardBorder : 'rgba(0,0,0,0.08)',
    borderHov: isDark ? '#374151'  : '#D1D5DB',
    text:      base.txt,
    sub:       base.txt2,
    muted:     base.txt3,
    tint:      isDark ? 'rgba(122,0,255,0.12)' : '#F3E8FF',
    inputBg:   isDark ? '#1F2937'  : '#F1F5F9',
    navBg:     isDark ? '#0B0F14'  : '#FFFFFF',
    codeBg:    isDark ? '#0d1117'  : '#F8F8FF',
    isDark,
    purple:     base.accent,
    purpleHov:  isDark ? '#6A00E6' : '#6B12DD',
    purpleDark: isDark ? '#9333EA' : '#7c3aed',
    purpleTint: isDark ? 'rgba(122,0,255,0.12)' : '#F3E8FF',
    purpleGlow: 'rgba(122,0,255,0.25)',
    success:    base.green,
    error:      base.red || '#DC2626',
    overlay:    isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.55)',
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────────────────── */
const CHIP_MAP = {
  'All':          null,
  'Trending':     'trending',
  'Notes Arena':  'notes-arena',
  'AI & ML':      'ai-ml',
  'Web Dev':      'web-dev',
  'Courses':      'course',
  'Projects':     'project-showcase',
  'Career':       'career',
  'Resources':    'resource-article',
};
const CHIPS = Object.keys(CHIP_MAP);

const TYPE_META = {
  'standard-article':  { icon: '◆', color: '#4F46E5', mono: 'article'    },
  'course':            { icon: '▣', color: '#7A00FF', mono: 'course'     },
  'project-showcase':  { icon: '◉', color: '#0891B2', mono: 'project'    },
  'tech-deep-dive':    { icon: '⬡', color: '#3B82F6', mono: 'deep-dive'  },
  'learning-path':     { icon: '▷', color: '#E11D48', mono: 'learning'   },
  'resource-article':  { icon: '⬢', color: '#F97316', mono: 'resource'   },
  'repository-article':{ icon: '⬡', color: '#B45309', mono: 'repo'       },
  'document-article':  { icon: '◆', color: '#4F46E5', mono: 'doc'        },
  'toolkit':           { icon: '⬢', color: '#F97316', mono: 'toolkit'    },
  'comparison':        { icon: '◈', color: '#16A34A', mono: 'compare'    },
  'code-playground':   { icon: '▷', color: '#E11D48', mono: 'playground' },
};
const COVER_GRAD = {
  'standard-article':  'linear-gradient(145deg,#1a1060,#0a0830)',
  'course':            'linear-gradient(145deg,#2a0060,#140030)',
  'project-showcase':  'linear-gradient(145deg,#002a38,#001520)',
  'tech-deep-dive':    'linear-gradient(145deg,#0a1a4a,#1a0a4a)',
  'learning-path':     'linear-gradient(145deg,#3a0018,#180008)',
  'resource-article':  'linear-gradient(145deg,#3a0e00,#1a0500)',
  'repository-article':'linear-gradient(145deg,#2a1a00,#140c00)',
  'toolkit':           'linear-gradient(145deg,#3a0e00,#1a0500)',
};
function typeMeta(pageType) {
  return TYPE_META[pageType] || { icon: '◆', color: '#4F46E5', mono: pageType || 'article' };
}
function coverGrad(pageType) {
  return COVER_GRAD[pageType] || COVER_GRAD['standard-article'];
}

/* ─────────────────────────────────────────────────────────────────────────────
   THUMBNAIL EXTRACTOR
   Pulls the first image URL from content_blocks if og_image_url is not set.
   Supports image blocks, hero blocks, and inline <img> in HTML blocks.
───────────────────────────────────────────────────────────────────────────── */
function extractThumbnail(article) {
  // Priority 1: manually set OG image (uploaded at publish time)
  if (article.og_image_url) return article.og_image_url;

  // Priority 2: scan content_blocks for first image
  const blocks = Array.isArray(article.content_blocks)
    ? article.content_blocks
    : (typeof article.content_blocks === 'string'
        ? (() => { try { return JSON.parse(article.content_blocks); } catch { return []; } })()
        : []);

  for (const block of blocks) {
    // image / hero block with direct src
    if (block?.src && typeof block.src === 'string' && block.src.startsWith('http')) {
      return block.src;
    }
    if (block?.url && typeof block.url === 'string' && block.url.startsWith('http')) {
      return block.url;
    }
    // HTML / markdown block — extract first <img src="...">
    if (block?.html || block?.content) {
      const html = block.html || block.content || '';
      const match = html.match(/src=["']([^"']+)["']/);
      if (match && match[1].startsWith('http')) return match[1];
    }
  }

  return '/default-article-og.jpg';
}

/* ─────────────────────────────────────────────────────────────────────────────
   TIME AGO
───────────────────────────────────────────────────────────────────────────── */
function timeAgo(date) {
  if (!date) return '';
  const m = Math.floor((Date.now() - new Date(date)) / 60000);
  if (m < 60)        return `${m}m ago`;
  if (m < 1440)      return `${Math.floor(m / 60)}h ago`;
  if (m < 43200)     return `${Math.floor(m / 1440)}d ago`;
  return `${Math.floor(m / 43200)}mo ago`;
}

function fmtCount(n) {
  if (!n) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

/* ─────────────────────────────────────────────────────────────────────────────
   DEBOUNCE HOOK
───────────────────────────────────────────────────────────────────────────── */
function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ─────────────────────────────────────────────────────────────────────────────
   LOGIN PROMPT MODAL
   Shown when a guest tries to like / save / comment.
   YouTube-style: non-blocking, dismissible, appears in-place.
───────────────────────────────────────────────────────────────────────────── */
function LoginPromptModal({ reason, onClose, t }) {
  const navigate = useNavigate();

  const REASONS = {
    like:    { icon: <Heart size={22} color={t.purple} />, title: 'Like this article?',   sub: 'Sign in to show your appreciation to creators.' },
    save:    { icon: <Bookmark size={22} color={t.purple} />, title: 'Save for later?',      sub: 'Sign in to build your personal reading list.'   },
    comment: { icon: <MessageSquare size={22} color={t.purple} />, title: 'Join the discussion?', sub: 'Sign in to comment and connect with creators.'   },
  };
  const r = REASONS[reason] || REASONS.like;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: t.overlay,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.15s ease',
      }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520,
          background: t.card,
          borderRadius: '20px 20px 0 0',
          padding: '24px 24px 36px',
          border: `1px solid ${t.border}`,
          borderBottom: 'none',
          boxShadow: '0 -8px 48px rgba(0,0,0,0.4)',
          animation: 'slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
        {/* drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: t.border, margin: '0 auto 20px' }} />

        {/* icon */}
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: `${t.purple}18`, border: `2px solid ${t.purple}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, marginBottom: 14, margin: '0 auto 14px',
          color: t.purple,
          fontFamily: "'JetBrains Mono','Fira Mono',monospace",
        }}>{r.icon}</div>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            fontSize: 18, fontWeight: 700, color: t.text,
            fontFamily: "'Manrope',sans-serif", letterSpacing: '-0.025em', marginBottom: 8,
          }}>{r.title}</div>
          <div style={{
            fontSize: 13, color: t.sub, fontFamily: "'Inter',sans-serif",
            lineHeight: 1.65, fontWeight: 400,
          }}>{r.sub}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              width: '100%', padding: '13px', borderRadius: 10,
              background: t.purple, color: '#fff', border: 'none',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              fontFamily: "'Inter',sans-serif", letterSpacing: '-0.02em',
              boxShadow: `0 4px 18px ${t.purple}55`,
            }}>Sign in to Code+ Academy</button>
          <button
            onClick={() => navigate('/signup')}
            style={{
              width: '100%', padding: '13px', borderRadius: 10,
              background: 'none', color: t.purple,
              border: `1.5px solid ${t.purple}40`,
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              fontFamily: "'Inter',sans-serif", letterSpacing: '-0.02em',
            }}>Create a free account</button>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: t.muted, fontSize: 13, fontFamily: "'Inter',sans-serif",
              padding: '6px', marginTop: 2,
            }}>Not now</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PRIMITIVES
───────────────────────────────────────────────────────────────────────────── */
function Mono({ children, color, size = 9, t }) {
  return (
    <span style={{
      fontFamily: "'JetBrains Mono','Fira Mono',monospace",
      fontSize: size, fontWeight: 500,
      color: color || t.muted, letterSpacing: '0.04em', lineHeight: 1.4,
    }}>{children}</span>
  );
}

function Avatar({ src, initials, size = 28, bg }) {
  if (src) {
    return (
      <img src={src} alt={initials}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `1.5px solid ${bg || '#7A00FF'}44` }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg || '#7A00FF',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 600, color: '#fff',
      flexShrink: 0, fontFamily: "'Inter',sans-serif", letterSpacing: '-0.03em',
    }}>{(initials || '?').slice(0, 2).toUpperCase()}</div>
  );
}

function Tag({ label, color, t }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 10, fontWeight: 500, color,
      background: color + '16', borderRadius: 5,
      padding: '2px 7px', border: `1px solid ${color}28`,
      fontFamily: "'JetBrains Mono','Fira Mono',monospace",
      letterSpacing: '0.03em', lineHeight: 1.5,
    }}>{label}</span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   THUMBNAIL — the new card cover
   Uses og_image_url → first image in blocks → gradient fallback
   YouTube-style 16:9 aspect ratio thumbnail
───────────────────────────────────────────────────────────────────────────── */
function Thumbnail({ article, horizontal = false }) {
  const m = typeMeta(article.page_type);
  const thumbnail = extractThumbnail(article);
  const grad = coverGrad(article.page_type);

  const containerStyle = horizontal
    ? { position: 'relative', width: 150, height: 95, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#0a0a0a' }
    : { position: 'relative', paddingTop: '56.25%' /* 16:9 */, borderRadius: '12px 12px 0 0', overflow: 'hidden', flexShrink: 0 };

  const imageStyle = horizontal
    ? { width: '100%', height: '100%', objectFit: 'cover' }
    : { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' };

  if (thumbnail) {
    return (
      <div style={containerStyle}>
        <img
          src={thumbnail} alt=""
          loading="lazy"
          style={imageStyle}
        />
        {/* type badge */}
        {!horizontal && (
          <div style={{
            position: 'absolute', top: 8, left: 8, zIndex: 2,
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: m.color, borderRadius: 6, padding: '3px 8px',
            boxShadow: `0 2px 10px ${m.color}66`,
          }}>
            <span style={{ fontFamily: "'JetBrains Mono','Fira Mono',monospace", fontSize: 9, color: '#fff', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{m.icon} {m.mono}</span>
          </div>
        )}
        {/* duration / read time badge bottom-right */}
        {article.read_time_mins && (
          <div style={{
            position: 'absolute', bottom: 8, right: 8,
            background: 'rgba(0,0,0,0.78)', borderRadius: 5, padding: '2px 7px',
          }}>
            <span style={{ fontFamily: "'JetBrains Mono','Fira Mono',monospace", fontSize: 10, color: '#fff', fontWeight: 500 }}>{article.read_time_mins} min</span>
          </div>
        )}
      </div>
    );
  }

  // Gradient fallback
  return (
    <div style={containerStyle}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 42%, ${m.color}55 0%, transparent 68%)` }} />
      <div style={{ position: 'absolute', inset: 0, opacity: 0.07, backgroundImage: `radial-gradient(circle, ${m.color}cc 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />
      {/* centred icon */}
      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: horizontal ? 24 : 40, filter: `drop-shadow(0 0 18px ${m.color}cc)` }}>{m.icon}</span>
      {/* type badge */}
      {!horizontal && (
        <div style={{
          position: 'absolute', top: 8, left: 8,
          display: 'inline-flex', alignItems: 'center', gap: 4,
          background: m.color, borderRadius: 6, padding: '3px 8px',
          boxShadow: `0 2px 10px ${m.color}66`,
        }}>
          <span style={{ fontFamily: "'JetBrains Mono','Fira Mono',monospace", fontSize: 9, color: '#fff', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{m.icon} {m.mono}</span>
        </div>
      )}
      {article.read_time_mins && (
        <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 5, padding: '2px 7px' }}>
          <span style={{ fontFamily: "'JetBrains Mono','Fira Mono',monospace", fontSize: 10, color: '#fff', fontWeight: 500 }}>{article.read_time_mins} min</span>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ARTICLE CARD — YouTube-style
   Thumbnail (16:9) → Title → Author row → Stats
   Auth actions (like, save) trigger LoginPromptModal for guests.
───────────────────────────────────────────────────────────────────────────── */
function ArticleCard({ article, t, onNavigate, onAuthRequired, horizontal = false }) {
  const { user } = useAuth();
  const [liked,  setLiked]  = useState(article.is_clapped || false);
  const [saved,  setSaved]  = useState(false);
  const [hov,    setHov]    = useState(false);
  const [clapCount, setClapCount] = useState(article.clap_count || 0);

  const m = typeMeta(article.page_type);
  const meta  = article.meta || {};
  const tags  = Array.isArray(meta.tags) ? meta.tags : [];
  const desc  = meta.description || meta.excerpt || '';

  const avatar = article.creator_avatar_url || article.creator_avatar || article.creator?.avatar_url || article.creator?.avatar;
  const name = article.creator_display_name || article.creator_name || article.creator?.display_name || article.creator?.name || article.creator_username;
  const verified = article.creator_verified || article.creator?.verified || article.creator_username === 'cpaadmin';

  const handleClap = async (e) => {
    e.stopPropagation();
    if (!user) { onAuthRequired('like'); return; }
    const was = liked;
    setLiked(!was);
    setClapCount(c => was ? Math.max(0, c - 1) : c + 1);
    try {
      if (was) await api.delete(`/articles/${article.id}/clap`);
      else     await api.post(`/articles/${article.id}/clap`);
    } catch {
      setLiked(was);
      setClapCount(c => was ? c + 1 : Math.max(0, c - 1));
    }
  };

  const handleSave = (e) => {
    e.stopPropagation();
    if (!user) { onAuthRequired('save'); return; }
    setSaved(s => !s);
  };

  if (horizontal) {
    return (
      <div
        onClick={() => onNavigate(article)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: hov ? t.cardHov : t.card,
          borderRadius: 14, border: `1px solid ${hov ? t.borderHov : t.border}`,
          overflow: 'hidden', cursor: 'pointer',
          boxShadow: t.isDark
            ? (hov ? '0 8px 40px rgba(0,0,0,0.5)' : '0 2px 16px rgba(0,0,0,0.35)')
            : (hov ? '0 8px 32px rgba(0,0,0,0.1)' : '0 1px 6px rgba(0,0,0,0.05)'),
          transform: hov ? 'translateY(-2px)' : 'translateY(0)',
          display: 'flex',
          gap: 16,
          padding: 12,
          alignItems: 'center',
          transition: 'all 0.18s ease',
        }}>
        <Thumbnail article={article} horizontal={true} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          <div>
            <div style={{
              fontSize: 10, fontWeight: 700, color: m.color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4, fontFamily: "'JetBrains Mono',monospace"
            }}>{m.mono}</div>
            <div style={{
              fontSize: 14, fontWeight: 700, color: t.text, lineHeight: 1.4,
              fontFamily: "'Manrope',sans-serif", marginBottom: 6,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              letterSpacing: '-0.02em',
            }}>{article.title}</div>
            {desc && (
              <div style={{
                fontSize: 12, color: t.sub, lineHeight: 1.5,
                fontFamily: "'Inter',sans-serif", marginBottom: 8,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>{desc}</div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Avatar src={avatar} initials={article.creator_username} size={20} bg={m.color + 'cc'} />
              <span style={{ fontSize: 11, fontWeight: 600, color: t.sub, fontFamily: "'Inter',sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}>
                @{article.creator_username}
                {verified && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" fill="#3B82F6" />
                    <path d="M8 12.5l2.5 2.5 5.5-5.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span style={{ fontSize: 10, color: t.muted, fontFamily: "'JetBrains Mono',monospace" }}>• {timeAgo(article.published_at)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={handleClap}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: liked ? m.color : t.muted,
                  display: 'flex', alignItems: 'center', gap: 3
                }}>
                <ClapIcon size={25} color="currentColor" filled={liked} />
                <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }}>{fmtCount(clapCount)}</span>
              </button>
              <button
                onClick={handleSave}
                aria-label="Save article"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: saved ? t.purple : t.muted, display: 'flex', alignItems: 'center' }}>
                <Bookmark size={15} fill={saved ? t.purple : 'none'} color={saved ? t.purple : t.muted} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onNavigate(article)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: t.card,
        border: `1px solid ${hov ? m.color + '44' : t.border}`,
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: hov ? 'translateY(-3px)' : 'none',
        boxShadow: hov ? (t.isDark ? '0 4px 20px rgba(0,0,0,0.45)' : '0 2px 12px rgba(0,0,0,0.08)') : 'none',
        display: 'flex',
        flexDirection: 'column',
        marginBottom: 16,
      }}>

      {/* Thumbnail */}
      <div style={{ position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${t.border}` }}>
        <Thumbnail article={article} />
      </div>

      {/* Card Body */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Publisher row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', border: `1.5px solid ${m.color}44`, flexShrink: 0 }}>
            <Avatar
              src={avatar}
              initials={article.creator_username}
              size={28}
              bg={m.color}
            />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: t.purple, fontFamily: "'Inter',sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}>
            @{article.creator_username}
            {verified && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" fill="#3B82F6" />
                <path d="M8 12.5l2.5 2.5 5.5-5.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
        </div>

        {/* Title */}
        <div style={{
          fontSize: 14, fontWeight: 600, color: t.text, lineHeight: 1.35,
          fontFamily: "'Roboto','Inter',sans-serif",
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          marginBottom: 6,
          wordBreak: 'break-word',
        }}>{article.title}</div>

        {/* Views • time ago */}
        <div style={{
          fontSize: 11, color: t.muted, fontFamily: "'JetBrains Mono',monospace",
          marginTop: 'auto',
        }}>
          {article.view_count > 0 ? `${fmtCount(article.view_count)} views` : '0 views'}
          {article.published_at ? ` • ${timeAgo(article.published_at)}` : ''}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ARTICLE CARD SKELETON
───────────────────────────────────────────────────────────────────────────── */
function ArticleCardSkeleton({ t }) {
  const shimmer = {
    background: t.isDark
      ? 'linear-gradient(90deg, #1F2937 25%, #2D3748 50%, #1F2937 75%)'
      : 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  };
  return (
    <div>
      {/* 16:9 thumbnail skeleton */}
      <div style={{ width: '100%', aspectRatio: '16 / 9', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ width: '100%', height: '100%', ...shimmer }} />
      </div>
      {/* Details skeleton — avatar + text */}
      <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, ...shimmer }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 14, borderRadius: 4, marginBottom: 6, ...shimmer }} />
          <div style={{ height: 14, borderRadius: 4, width: '70%', marginBottom: 8, ...shimmer }} />
          <div style={{ height: 11, borderRadius: 4, width: '45%', ...shimmer }} />
        </div>
      </div>
    </div>
  );
}



/* ─────────────────────────────────────────────────────────────────────────────
   TRENDING SECTION
───────────────────────────────────────────────────────────────────────────── */
function TrendingSection({ posts, loading, t, onPostClick }) {
  const colors = ['#7A00FF', '#16A34A', '#DC2626', '#3B82F6', '#F97316', '#0891B2'];
  return (
    <div style={{
      background: t.card, borderRadius: 12, border: `1px solid ${t.border}`,
      overflow: 'hidden', marginBottom: 14,
      boxShadow: t.isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <div style={{ padding: '12px 15px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${t.border}` }}>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 700, color: t.text, letterSpacing: '-0.02em' }}>Trending</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: t.error, animation: 'pulse 1.5s ease-in-out infinite' }} />
          <Mono size={9} color={t.error} t={t}>live</Mono>
        </div>
      </div>

      {loading ? (
        [...Array(3)].map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '11px 15px', borderBottom: i < 2 ? `1px solid ${t.border}` : 'none' }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: t.border, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 10, borderRadius: 4, background: t.border, marginBottom: 6, width: '40%' }} />
              <div style={{ height: 12, borderRadius: 4, background: t.border, width: '85%' }} />
            </div>
          </div>
        ))
      ) : posts.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center' }}>
          <Mono size={11} color={t.muted} t={t}>No trending posts yet</Mono>
        </div>
      ) : posts.map((post, i) => {
        const color = colors[i % colors.length];
        return (
          <div key={post.id}
            onClick={() => onPostClick(post)}
            style={{ display: 'flex', gap: 12, padding: '11px 15px', borderBottom: i < posts.length - 1 ? `1px solid ${t.border}` : 'none', cursor: 'pointer', alignItems: 'flex-start' }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: color + '18', border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Mono size={8} color={color} t={t}>{(post.type || 'post').slice(0, 3)}</Mono>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <Tag label={`@${post.creator_username}`} color={color} t={t} />
                <Mono size={9} color={t.muted} t={t}>{timeAgo(post.created_at)}</Mono>
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: t.text, lineHeight: 1.55, fontFamily: "'Inter',sans-serif", letterSpacing: '-0.01em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {post.title || post.caption || 'Untitled'}
              </div>
              <Mono size={9} color={t.muted} t={t}>{fmtCount(post.view_count)} views · {fmtCount(post.clap_count)} claps</Mono>
            </div>
            <span style={{ color: t.border, fontSize: 14, marginTop: 6, fontFamily: "'JetBrains Mono','Fira Mono',monospace" }}>›</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SHORTS ROW
───────────────────────────────────────────────────────────────────────────── */





/* ─────────────────────────────────────────────────────────────────────────────
   HORIZONTAL TRENDING ARTICLES CAROUSEL (Scaled with fluid units & smooth transitions)
───────────────────────────────────────────────────────────────────────────── */
function TrendingArticlesBanner({ articles = [], t, onNavigate }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const displayList = Array.isArray(articles) && articles.length > 0 ? articles.slice(0, 8) : [];

  // Auto-rotate every 5 seconds if not hovered
  useEffect(() => {
    if (displayList.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % displayList.length);
        setIsFading(false);
      }, 200);
    }, 5000);
    return () => clearInterval(interval);
  }, [displayList.length, isHovered]);

  if (displayList.length === 0) return null;

  const currentArticle = displayList[currentIndex] || displayList[0];
  const m = typeMeta(currentArticle.page_type || 'default');
  const thumbnail = extractThumbnail(currentArticle);

  const handlePrev = (e) => {
    e.stopPropagation();
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex(prev => (prev - 1 + displayList.length) % displayList.length);
      setIsFading(false);
    }, 150);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % displayList.length);
      setIsFading(false);
    }, 150);
  };

  return (
    <div style={{ marginBottom: 'clamp(16px, 2.5vh, 28px)', position: 'relative', width: '100%' }}>
      {/* Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(8px, 1.2vh, 14px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1vw, 10px)' }}>
          <span style={{ fontSize: 'clamp(14px, 1.5vw, 18px)' }}>⚡</span>
          <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 'clamp(0.85rem, 1.2vw, 1.05rem)', fontWeight: 700, color: t.text, letterSpacing: '-0.02em' }}>
            Featured Articles & Stories
          </span>
          <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '0.4rem', padding: '0.15rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '0.4rem', height: '0.4rem', borderRadius: '50%', background: '#EF4444', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'clamp(0.55rem, 0.7vw, 0.65rem)', color: '#EF4444', fontWeight: 700, letterSpacing: '0.06em' }}>TRENDING</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            onClick={handlePrev}
            style={{
              background: t.card, border: `1px solid ${t.border}`, color: t.text, borderRadius: '50%', width: 'clamp(28px, 2.5vw, 36px)', height: 'clamp(28px, 2.5vw, 36px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 'clamp(14px, 1.4vw, 18px)', transition: 'all 0.2s ease'
            }}
          >
            ‹
          </button>
          <button
            onClick={handleNext}
            style={{
              background: t.card, border: `1px solid ${t.border}`, color: t.text, borderRadius: '50%', width: 'clamp(28px, 2.5vw, 36px)', height: 'clamp(28px, 2.5vw, 36px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 'clamp(14px, 1.4vw, 18px)', transition: 'all 0.2s ease'
            }}
          >
            ›
          </button>
        </div>
      </div>

      {/* Main Banner Card using Scalable Units & Fluid Layout */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onNavigate(currentArticle)}
        style={{
          position: 'relative',
          width: '100%',
          height: 'clamp(210px, 24vh, 280px)',
          borderRadius: 'clamp(12px, 1.5vw, 18px)',
          overflow: 'hidden',
          cursor: 'pointer',
          border: `1px solid ${t.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
          boxShadow: isHovered
            ? '0 12px 36px rgba(0, 0, 0, 0.5), 0 0 24px rgba(79, 70, 229, 0.2)'
            : t.isDark ? '0 8px 28px rgba(0, 0, 0, 0.4)' : '0 4px 20px rgba(0, 0, 0, 0.08)',
          background: thumbnail ? '#0B0F14' : (m.color || '#4F46E5') + '22',
          transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        }}
      >
        {/* Article Image Background */}
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: isFading ? 0.3 : 0.8,
              transition: 'opacity 0.25s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: isHovered ? 'scale(1.04)' : 'scale(1)',
            }}
          />
        ) : (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: coverGrad(currentArticle.page_type),
            opacity: isFading ? 0.3 : 0.8,
            transition: 'opacity 0.25s ease'
          }} />
        )}

        {/* Dynamic Gradient Overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 25%, rgba(0, 0, 0, 0.75) 100%)', zIndex: 1 }} />

        {/* Content Container */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          height: '100%',
          padding: 'clamp(16px, 2.2vw, 24px)',
          display: 'flex',
          flexDirection: 'column',
          justify: 'space-between',
          boxSizing: 'border-box',
          opacity: isFading ? 0.2 : 1,
          transition: 'opacity 0.25s ease, transform 0.25s ease',
          transform: isFading ? 'translateY(4px)' : 'translateY(0)'
        }}>
          {/* Top Row Badges */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{
              background: 'rgba(0,0,0,0.55)',
              border: `1px solid ${(m.color || '#4F46E5')}66`,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: '0.5rem',
              padding: '0.25rem 0.65rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              <span style={{ width: '0.4rem', height: '0.4rem', borderRadius: '50%', background: m.color || '#4F46E5' }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'clamp(0.6rem, 0.75vw, 0.7rem)', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {m.mono || 'article'}
              </span>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: '1rem',
              padding: '0.2rem 0.65rem',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 'clamp(0.6rem, 0.75vw, 0.7rem)',
              color: '#FFFFFF',
              fontWeight: 600
            }}>
              {currentIndex + 1} / {displayList.length}
            </div>
          </div>

          {/* Bottom Article Details */}
          <div>
            <h2 style={{
              fontSize: 'clamp(1.1rem, 1.8vw, 1.45rem)',
              fontWeight: 800,
              color: '#FFFFFF',
              lineHeight: 1.25,
              fontFamily: "'Space Grotesk', 'Manrope', sans-serif",
              letterSpacing: '-0.02em',
              marginBottom: '0.5rem',
              textShadow: '0 2px 8px rgba(0,0,0,0.6)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {currentArticle.title}
            </h2>

            {/* Author & Stats bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Avatar src={currentArticle.creator_avatar_url} initials={currentArticle.creator_username} size={28} bg={m.color} />
                <span style={{ fontSize: 'clamp(0.75rem, 0.9vw, 0.85rem)', fontWeight: 600, color: '#FFFFFF', fontFamily: "'Inter', sans-serif" }}>
                  @{currentArticle.creator_username}
                </span>
                <span style={{ fontSize: 'clamp(0.65rem, 0.8vw, 0.75rem)', color: 'rgba(255,255,255,0.7)', fontFamily: "'JetBrains Mono', monospace" }}>
                  • {timeAgo(currentArticle.published_at)}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: 'clamp(0.65rem, 0.8vw, 0.75rem)', color: 'rgba(255,255,255,0.85)', fontFamily: "'JetBrains Mono', monospace", display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span>👁</span> {fmtCount(currentArticle.view_count || 0)} views
                </span>
                <span style={{ fontSize: 'clamp(0.65rem, 0.8vw, 0.75rem)', color: 'rgba(255,255,255,0.85)', fontFamily: "'JetBrains Mono', monospace", display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <ClapIcon size={16} color="#FFFFFF" filled={true} /> {fmtCount(currentArticle.clap_count || 0)}
                </span>
                <span style={{
                  background: 'linear-gradient(135deg, #2563EB, #4F46E5)',
                  color: '#FFFFFF',
                  padding: 'clamp(0.35rem, 0.6vw, 0.5rem) clamp(0.75rem, 1vw, 1rem)',
                  borderRadius: '0.5rem',
                  fontSize: 'clamp(0.7rem, 0.85vw, 0.8rem)',
                  fontWeight: 700,
                  fontFamily: "'Inter', sans-serif",
                  boxShadow: '0 2px 10px rgba(37,99,235,0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  transition: 'all 0.2s ease',
                }}>
                  Read Post →
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Indicators / Dots */}
        <div style={{
          position: 'absolute',
          bottom: '0.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 3,
          display: 'flex',
          gap: '0.35rem'
        }}>
          {displayList.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setIsFading(true);
                setTimeout(() => {
                  setCurrentIndex(idx);
                  setIsFading(false);
                }, 150);
              }}
              style={{
                width: idx === currentIndex ? 'clamp(14px, 1.8vw, 20px)' : 'clamp(5px, 0.6vw, 7px)',
                height: 'clamp(5px, 0.6vw, 7px)',
                borderRadius: '0.2rem',
                background: idx === currentIndex ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   RESOURCE GRID
───────────────────────────────────────────────────────────────────────────── */
function ResourceGrid({ articles, t, onNavigate }) {
  const resources = articles
    .filter(a => ['resource-article', 'toolkit', 'document-article'].includes(a.page_type))
    .slice(0, 4);

  const staticItems = [
    { icon: <Palette size={20} color={t.purple} />, label: 'Free UI Kits',     mono: 'design', sub: '240+ components' },
    { icon: <Cloud size={20} color={t.purple} />, label: 'Hosting Tools',    mono: 'infra',  sub: 'Free tier guide'  },
    { icon: <Plug size={20} color={t.purple} />, label: 'API Directory',    mono: 'api',    sub: 'Public dev APIs'  },
    { icon: <FileText size={20} color={t.purple} />, label: 'Resume Templates', mono: 'career', sub: 'ATS-friendly'    },
  ];

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 10, fontFamily: "'Manrope',sans-serif", letterSpacing: '-0.02em' }}>Curated Resources</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {(resources.length > 0 ? resources : staticItems).map((item, i) => {
          const isReal = !!item.id;
          return (
            <div key={isReal ? item.id : i}
              onClick={() => isReal && onNavigate(item)}
              style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: '12px 13px', cursor: isReal ? 'pointer' : 'default', boxShadow: t.isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.03)' }}>
              {isReal ? (
                <>
                  <div style={{ fontSize: 20, marginBottom: 7, lineHeight: 1 }}>{typeMeta(item.page_type).icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 3, fontFamily: "'Manrope',sans-serif", letterSpacing: '-0.02em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</div>
                  <Mono size={9} color={t.muted} t={t}>@{item.creator_username}</Mono>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 20, marginBottom: 7, lineHeight: 1 }}>{item.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 3, fontFamily: "'Manrope',sans-serif", letterSpacing: '-0.02em' }}>{item.label}</div>
                  <Mono size={9} color={t.muted} t={t}>{item.sub}</Mono>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   BUILD CTA
───────────────────────────────────────────────────────────────────────────── */
function BuildCTA({ t }) {
  return (
    <div style={{ borderRadius: 12, padding: 20, marginBottom: 14, background: `linear-gradient(145deg,${t.purple},${t.purpleHov})`, boxShadow: `0 8px 32px ${t.purple}44`, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)` }} />
      <div style={{ position: 'relative' }}>
        <Mono size={10} color="rgba(200,160,255,0.8)" t={t}>// build-something-today</Mono>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: "'Manrope',sans-serif", lineHeight: 1.25, marginTop: 8, marginBottom: 6, letterSpacing: '-0.025em' }}>
          50+ project starters.<br />Ship in minutes.
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 16, fontFamily: "'Inter',sans-serif", lineHeight: 1.7, fontWeight: 400 }}>
          Boilerplates, starter kits, and blueprints built by the community.
        </div>
        <button style={{ background: '#fff', color: t.purple, border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif", letterSpacing: '-0.02em', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
          Explore build kits →
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────────────────────────────────────── */
function EmptyState({ query, t }) {
  return (
    <div style={{ borderRadius: 14, border: `1px dashed ${t.border}`, padding: 40, textAlign: 'center', color: t.muted }}>
      <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center' }}><SearchX size={32} color={t.muted} /></div>
      <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 6 }}>
        {query ? `No results for "${query}"` : 'No articles published yet'}
      </div>
      <Mono size={11} color={t.muted} t={t}>
        {query ? 'Try a different search or category' : 'Check back soon — creators are publishing'}
      </Mono>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   STICKY SEARCH BAR
───────────────────────────────────────────────────────────────────────────── */
function SearchBar({ value, onChange, t }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 90,
      background: t.isDark ? `${t.navBg}f0` : `${t.navBg}f8`,
      backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
      borderBottom: `1px solid ${t.border}`, padding: '10px 18px',
    }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 8,
          background: focused ? t.card : t.inputBg,
          borderRadius: 9, padding: '8px 12px',
          border: `1.5px solid ${focused ? t.purple : t.border}`,
          boxShadow: focused ? `0 0 0 3px ${t.purple}1a` : 'none',
          transition: 'all 0.15s',
        }}>
          <Search size={14} color={t.muted} />
          <input
            value={value} onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            placeholder="Search articles, courses, projects..."
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: t.text, fontFamily: "'Inter',sans-serif", fontWeight: 400 }}
          />
          {value && (
            <button onClick={() => onChange('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.muted, padding: 0, display: 'flex', alignItems: 'center' }}>
              <X size={13} color={t.muted} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CHIP BAR — YouTube ytd-feed-filter-chip-bar-renderer style
───────────────────────────────────────────────────────────────────────────── */
function ChipBar({ active, setActive, t }) {
  const scrollRef = useRef(null);

  return (
    <>
      <style>{`
        .yt-explore-scroll::-webkit-scrollbar { display: none; }
        .yt-explore-scroll { scrollbar-width: none; }
        .yt-explore-chip {
          flex-shrink: 0;
          padding: 0 12px;
          height: 32px;
          border-radius: 15px;
          border: none;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          white-space: nowrap;
          transition: background 0.15s, color 0.15s;
          outline: none;
        }
        .yt-explore-chip:focus-visible { outline: 2px solid #8A2BFF; }
        .yt-explore-chip-notes {
          border: 1.5px solid transparent !important;
          background-origin: border-box !important;
          background-clip: padding-box, border-box !important;
          font-weight: 600 !important;
          transition: transform 0.18s ease, filter 0.18s ease, box-shadow 0.18s ease !important;
        }
        .yt-explore-chip-notes:hover {
          transform: translateY(-1.5px) scale(1.03);
          box-shadow: 0 0 16px rgba(125, 15, 250, 0.45) !important;
        }
      `}</style>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {/* Scrollable chips */}
        <div
          ref={scrollRef}
          className="yt-explore-scroll"
          role="tablist"
          style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '2px 0 6px', width: '100%' }}
        >
          {CHIPS.map(chip => {
            const isActive = active === chip;
            const isNotesArena = chip === 'Notes Arena';

            if (isNotesArena) {
              return (
                <button
                  key={chip}
                  role="tab"
                  aria-selected={false}
                  className="yt-explore-chip yt-explore-chip-notes"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = '/notes';
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundImage: t.isDark
                      ? 'linear-gradient(#0f0f0f, #0f0f0f), linear-gradient(135deg, #7D0FFA, #F6190E, #FB8804, #1EECFA)'
                      : 'linear-gradient(#ffffff, #ffffff), linear-gradient(135deg, #7D0FFA, #F6190E, #FB8804, #1EECFA)',
                    color: t.isDark ? '#FFFFFF' : '#0F0F0F',
                    boxShadow: t.isDark ? '0 0 10px rgba(125, 15, 250, 0.35)' : '0 0 10px rgba(125, 15, 250, 0.2)',
                  }}
                >
                  <BookOpen size={14} color={t.isDark ? "#FFFFFF" : "#7D0FFA"} style={{ flexShrink: 0 }} />
                  <span>Notes Arena</span>
                </button>
              );
            }

            return (
              <button
                key={chip}
                role="tab"
                aria-selected={isActive}
                className="yt-explore-chip"
                onClick={() => setActive(chip)}
                style={{
                  background: isActive
                    ? (t.isDark ? '#fff' : '#0f0f0f')
                    : (t.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'),
                  color: isActive
                    ? (t.isDark ? '#0f0f0f' : '#fff')
                    : (t.isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.8)'),
                }}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   LOAD MORE TRIGGER (Intersection Observer)
───────────────────────────────────────────────────────────────────────────── */
function LoadMoreTrigger({ onVisible, loading }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loading) onVisible();
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [onVisible, loading]);
  return <div ref={ref} style={{ height: 40 }} />;
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN EXPLORE PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function Explore() {
  const navigate  = useNavigate();
  const { user }  = useAuth();   // null for guests — page still works
  const t         = useT();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Auth prompt modal state ──
  // reason: null | 'like' | 'save' | 'comment'
  const [authPrompt, setAuthPrompt] = useState(null);

  // ── Search & filter state ──
  const [query,      setQuery]     = useState('');
  const [activeChip, setActiveChip] = useState('All');
  const debouncedQuery = useDebounce(query, 350);

  // ── URL Query Sync ──
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const urlQuery = searchParams.get('q') || '';

  useEffect(() => {
    if (urlQuery !== query) {
      setQuery(urlQuery);
    }
  }, [urlQuery]);

  useEffect(() => {
    const currentParams = new URLSearchParams(location.search);
    if (debouncedQuery.length >= 2) {
      if (currentParams.get('q') !== debouncedQuery) {
        navigate(`${location.pathname}?q=${encodeURIComponent(debouncedQuery)}`, { replace: true });
      }
    } else {
      if (currentParams.has('q')) {
        navigate(location.pathname, { replace: true });
      }
    }
  }, [debouncedQuery, location.pathname, navigate]);

  // ── Elasticsearch Search State ──
  const [searchResults, setSearchResults] = useState({ topProfileCard: null, sections: [] });
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchTab, setSearchTab] = useState('All');
  const [searchSectionItems, setSearchSectionItems] = useState([]);
  const [searchSectionOffset, setSearchSectionOffset] = useState(0);
  const [searchSectionHasMore, setSearchSectionHasMore] = useState(false);
  const [searchSectionLoading, setSearchSectionLoading] = useState(false);
  const searchReqIdRef = useRef(0);

  const fetchSearchSection = useCallback(async (tabName, offsetVal = 0) => {
    if (offsetVal === 0) {
      setSearchSectionLoading(true);
      setSearchSectionItems([]);
    }
    try {
      const type = tabName.toLowerCase();
      let items = [];
      let hasMoreVal = false;

      try {
        const secRes = await getGraphQLSearchSection({
          query: debouncedQuery,
          type,
          offset: offsetVal,
          limit: 12,
        });
        items = secRes?.items || [];
        hasMoreVal = secRes?.hasMore || false;
      } catch (gqlErr) {
        console.warn('[Search Section GraphQL] Falling back to REST:', gqlErr?.message);
        const res = await api.get('/search/section', {
          params: { q: debouncedQuery, type, offset: offsetVal, limit: 12 },
        });
        items = res.data.items || [];
        hasMoreVal = res.data.hasMore || false;
      }
      
      if (offsetVal === 0) {
        setSearchSectionItems(items);
      } else {
        setSearchSectionItems(prev => [...prev, ...items]);
      }
      setSearchSectionOffset(offsetVal);
      setSearchSectionHasMore(hasMoreVal);
    } catch (err) {
      console.error('[Search Section Fetch] failed:', err);
    } finally {
      setSearchSectionLoading(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      const reqId = ++searchReqIdRef.current;
      const fetchAll = async () => {
        setLoadingSearch(true);
        try {
          let data;
          try {
            data = await getGraphQLSearch({ query: debouncedQuery, limit: 12 });
          } catch (gqlErr) {
            console.warn('[Explore Search GraphQL] Falling back to REST:', gqlErr?.message);
            const res = await api.get('/search', { params: { q: debouncedQuery, limit: 12 } });
            data = res.data;
          }
          if (searchReqIdRef.current === reqId) {
            setSearchResults(data || { topProfileCard: null, sections: [] });
          }
        } catch (err) {
          if (searchReqIdRef.current === reqId) {
            console.error('[Search Fetch All] failed:', err);
          }
        } finally {
          if (searchReqIdRef.current === reqId) {
            setLoadingSearch(false);
          }
        }
      };
      fetchAll();

      if (searchTab !== 'All') {
        fetchSearchSection(searchTab, 0);
      }
    } else {
      searchReqIdRef.current++;
      setSearchResults({ topProfileCard: null, sections: [] });
    }
  }, [debouncedQuery, searchTab, fetchSearchSection]);

  // ── Articles state ──
  const [articles,    setArticles]    = useState([]);
  const [loadingA,    setLoadingA]    = useState(true);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // ── Trending posts ──
  const [trending,    setTrending]    = useState([]);
  const [loadingT,    setLoadingT]    = useState(true);

  // ── Top developers cache ──
  const [topDevs,     setTopDevs]     = useState([]);

  // Navigate helpers
  const goArticle = (a) => navigate(`/articles/${a.slug}`);
  const goPost    = (p) => navigate(`/posts/${p.id}`);

  // Called by cards when a guest tries to interact
  const handleAuthRequired = useCallback((reason) => {
    setAuthPrompt(reason);
  }, []);

  /* ── Fetch articles (Optimized single-query GraphQL + graceful REST fallback) ── */
  const fetchArticles = useCallback(async (pageNum = 1, reset = false) => {
    if (pageNum === 1) setLoadingA(true);
    else setLoadingMore(true);

    try {
      let merged = [];
      let creators = topDevs;

      // 1. Fetch creators if not in cache (Single GraphQL Query)
      if (creators.length === 0) {
        try {
          creators = await getGraphQLSearchCreators({ limit: 12 });
          setTopDevs(creators);
        } catch (e) {
          try {
            const uRes = await api.get('/users/search', { params: { limit: 12 } });
            creators = uRes.data.users || [];
            setTopDevs(creators);
          } catch (restErr) {
            creators = [];
          }
        }
      }

      // 2. Fetch published articles in ONE operation (Eliminates 12+ separate HTTP requests)
      try {
        const secRes = await getGraphQLSearchSection({
          query: debouncedQuery || '',
          type: 'articles',
          limit: 50,
          offset: 0,
        });
        const rawArticles = secRes?.items || [];
        if (rawArticles.length > 0) {
          merged = rawArticles.map(a => {
            const creator = creators.find(u => u.username === (a.creator_username || a.creatorUsername));
            return {
              ...a,
              creator_avatar_url: a.creator_avatar_url || a.creator_avatar || creator?.avatar_url || creator?.avatar,
              creator_display_name: a.creator_display_name || a.creator_name || creator?.display_name || creator?.name || a.creator_username,
              creator_verified: a.creator_verified !== undefined ? a.creator_verified : (creator?.verified || a.creator_username === 'cpaadmin'),
            };
          });
        }
      } catch (gqlSecErr) {
        console.warn('[Explore Articles GraphQL] Falling back to REST waterfall:', gqlSecErr?.message);
        if (creators.length > 0) {
          const perCreator = await Promise.allSettled(
            creators.slice(0, 12).map(u => api.get(`/articles/by/${u.username}`))
          );
          perCreator.forEach(r => {
            if (r.status === 'fulfilled') {
              const list = r.value.data.articles || [];
              const enriched = list.map(a => {
                const creator = creators.find(u => u.username === a.creator_username);
                return {
                  ...a,
                  creator_avatar_url: a.creator_avatar_url || creator?.avatar_url || creator?.avatar,
                  creator_display_name: a.creator_display_name || creator?.display_name || creator?.name || a.creator_username,
                  creator_verified: a.creator_verified !== undefined ? a.creator_verified : (creator?.verified || a.creator_username === 'cpaadmin'),
                };
              });
              merged = merged.concat(enriched);
            }
          });
        }
      }

      // Fallback to creator-by-creator REST if GraphQL returned empty
      if (merged.length === 0 && creators.length > 0) {
        const perCreator = await Promise.allSettled(
          creators.slice(0, 12).map(u => api.get(`/articles/by/${u.username}`))
        );
        perCreator.forEach(r => {
          if (r.status === 'fulfilled') {
            const list = r.value.data.articles || [];
            const enriched = list.map(a => {
              const creator = creators.find(u => u.username === a.creator_username);
              return {
                ...a,
                creator_avatar_url: a.creator_avatar_url || creator?.avatar_url || creator?.avatar,
                creator_display_name: a.creator_display_name || creator?.display_name || creator?.name || a.creator_username,
                creator_verified: a.creator_verified !== undefined ? a.creator_verified : (creator?.verified || a.creator_username === 'cpaadmin'),
              };
            });
            merged = merged.concat(enriched);
          }
        });
      }

      // Deduplicate
      const seen = new Set();
      merged = merged.filter(a => {
        const key = a.id || a.slug;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Filter by chip
      const chipFilter = CHIP_MAP[activeChip];
      if (chipFilter === 'trending') {
        merged = merged.sort((a, b) => ((b.clap_count || 0) + (b.view_count || 0) * 0.2) - ((a.clap_count || 0) + (a.view_count || 0) * 0.2));
      } else if (chipFilter) {
        merged = merged.filter(a =>
          a.page_type === chipFilter ||
          (a.meta?.tags || []).some(tag => tag.toLowerCase().includes(chipFilter.replace('-', ' ')))
        );
      }

      // Filter by search
      if (debouncedQuery.length >= 2) {
        const q = debouncedQuery.toLowerCase();
        merged = merged.filter(a =>
          a.title?.toLowerCase().includes(q) ||
          a.creator_username?.toLowerCase().includes(q) ||
          (a.meta?.tags || []).some(tg => tg.toLowerCase().includes(q)) ||
          (a.meta?.description || '').toLowerCase().includes(q)
        );
      }

      // Sort
      if (chipFilter !== 'trending') {
        merged = merged.sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at));
      }

      // Paginate
      const PAGE_SIZE = 20;
      const startIdx = (pageNum - 1) * PAGE_SIZE;
      const slice = merged.slice(startIdx, startIdx + PAGE_SIZE);
      setHasMore(startIdx + PAGE_SIZE < merged.length);

      if (reset || pageNum === 1) setArticles(slice);
      else setArticles(prev => [...prev, ...slice]);

      // Set trending list if not yet loaded
      if (merged.length > 0) {
        const topTrending = [...merged]
          .sort((a, b) => ((b.clap_count || 0) + (b.view_count || 0) * 0.2) - ((a.clap_count || 0) + (a.view_count || 0) * 0.2))
          .slice(0, 6);
        setTrending(topTrending);
        setLoadingT(false);
      } else {
        setLoadingT(false);
      }

    } catch (err) {
      console.error('[Explore] fetchArticles:', err);
    } finally {
      setLoadingA(false);
      setLoadingMore(false);
    }
  }, [activeChip, debouncedQuery, topDevs]);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchArticles(1, true);
  }, [activeChip, debouncedQuery]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const next = page + 1;
    setPage(next);
    fetchArticles(next);
  }, [loadingMore, hasMore, page, fetchArticles]);



  /* ─────────────────────────────────────────────────────────────────────────
     BREAKPOINT — JS hook for responsive layout
  ───────────────────────────────────────────────────────────────────────── */
  const [winW, setWinW] = useState(1024);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setWinW(window.innerWidth);
    const h = () => setWinW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  const isDesktop = winW >= 1024;
  const isWide    = winW >= 1400; // extra breakpoint for very wide screens

  const handleLoadMoreSearch = () => {
    if (searchSectionLoading || !searchSectionHasMore) return;
    fetchSearchSection(searchTab, searchSectionOffset + 12);
  };

  const SearchTabBar = ({ activeTab, setActiveTab, t }) => {
    const tabs = ['All', 'Videos', 'Shorts', 'People', 'Articles'];
    return (
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '8px 0', borderBottom: `1px solid ${t.border}`, marginBottom: 16, scrollbarWidth: 'none' }}>
        {tabs.map(tab => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: active ? t.purple : 'transparent',
                color: active ? '#fff' : t.sub,
                border: `1.5px solid ${active ? t.purple : t.border}`,
                borderRadius: 20,
                padding: '6px 16px',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "'Geist',sans-serif",
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>
    );
  };

  const renderSearchContent = () => {
    if (searchTab === 'All') {
      const videos = searchResults.sections?.find(s => s.type === 'videos')?.items || [];
      const shorts = searchResults.sections?.find(s => s.type === 'shorts')?.items || [];
      const articlesList = searchResults.sections?.find(s => s.type === 'articles')?.items || [];
      const peopleList = searchResults.sections?.find(s => s.type === 'people')?.items || [];

      const hasResults = searchResults.topProfileCard || searchResults.sections?.length > 0;

      if (!hasResults) {
        return <EmptyState query={debouncedQuery} t={t} />;
      }

      return (
        <div>
          {searchResults.topProfileCard && (
            <TopProfileCard profile={searchResults.topProfileCard} onAuthRequired={handleAuthRequired} />
          )}

          {(videos.length > 0 || shorts.length > 0) && (
            <VideoDiscoveryBlock videos={videos} shorts={shorts} query={debouncedQuery} loading={false} />
          )}

          {articlesList.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <SectionLabel color="#0891B2">Articles & Projects</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(2, 1fr)' : '1fr', gap: 16 }}>
                {articlesList.map(a => (
                  <ArticleCard key={a.id} article={a} t={t} onNavigate={goArticle} onAuthRequired={handleAuthRequired} horizontal={isDesktop} />
                ))}
              </div>
            </div>
          )}

          {peopleList.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <SectionLabel color="#10B981">People</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(2, 1fr)' : '1fr', gap: 16 }}>
                {peopleList.map(p => (
                  <PeopleCard key={p.id} person={p} onAuthRequired={handleAuthRequired} />
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (searchSectionItems.length === 0 && !searchSectionLoading) {
      return <EmptyState query={debouncedQuery} t={t} />;
    }

    return (
      <div>
        <SectionLabel color={searchTab === 'Videos' ? '#8A2BFF' : searchTab === 'Shorts' ? '#EC4899' : searchTab === 'Articles' ? '#0891B2' : '#10B981'}>
          {searchTab}
        </SectionLabel>

        {searchTab === 'Videos' && (
          <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : '1fr', gap: 16, marginBottom: 20 }}>
            {searchSectionItems.map(v => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        )}

        {searchTab === 'Shorts' && (
          <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: 16, marginBottom: 20 }}>
            {searchSectionItems.map((v, i) => (
              <ShortCard
                key={v.id}
                v={v}
                i={i}
                onClick={(item) => {
                  const idx = searchSectionItems.findIndex(s => s.id === item.id);
                  navigate(`/shorts/${item.id}`, {
                    state: {
                      shorts: searchSectionItems,
                      startIndex: idx >= 0 ? idx : 0,
                      query: debouncedQuery
                    }
                  });
                }}
              />
            ))}
          </div>
        )}

        {searchTab === 'Articles' && (
          <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : '1fr', gap: 16, marginBottom: 20 }}>
            {searchSectionItems.map(a => (
              <ArticleCard key={a.id} article={a} t={t} onNavigate={goArticle} onAuthRequired={handleAuthRequired} />
            ))}
          </div>
        )}

        {searchTab === 'People' && (
          <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(2, 1fr)' : '1fr', gap: 16, marginBottom: 20 }}>
            {searchSectionItems.map(p => (
              <PeopleCard key={p.id} person={p} onAuthRequired={handleAuthRequired} />
            ))}
          </div>
        )}

        {searchSectionHasMore && (
          <LoadMoreTrigger onVisible={handleLoadMoreSearch} loading={searchSectionLoading} />
        )}
        {searchSectionLoading && (
          <div style={{ padding: '16px 0', textAlign: 'center' }}>
            <Mono size={10} color={t.muted} t={t}>loading more…</Mono>
          </div>
        )}
      </div>
    );
  };

  /* ─── Mobile feed (single column, original behaviour) ─── */
  const renderMobileFeed = () => {
    if (loadingA) return [...Array(4)].map((_, i) => <ArticleCardSkeleton key={i} t={t} />);
    if (articles.length === 0) return <EmptyState query={debouncedQuery} t={t} />;
    const nodes = [];
    nodes.push(<TrendingArticlesBanner key="trending-banner" articles={articles} t={t} onNavigate={goArticle} />);
    nodes.push(<VideoShortsRow key="video-shorts" limit={8} />);
    articles.forEach((a, i) => {
      nodes.push(<ArticleCard key={a.id} article={a} t={t} onNavigate={goArticle} onAuthRequired={handleAuthRequired} />);
      if (i === articles.length - 1) nodes.push(<BuildCTA key="cta" t={t} />);
    });
    return nodes;
  };

  /* ─── Trending page view ─── */
  const renderTrendingPage = () => {
    return (
      <div style={{
        width: '100%',
        maxWidth: 720,
        margin: '0 auto',
        padding: isDesktop ? '20px 24px 0' : '14px 18px 0',
        boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgb(249, 115, 22)', boxShadow: '0 0 6px rgb(249, 115, 22)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgb(249, 115, 22)' }}>Trending</span>
          <div style={{ flex: 1, height: 1, background: 'rgb(249, 115, 22)', opacity: 0.18 }} />
        </div>
        
        {/* Trending Live section */}
        <TrendingSection posts={trending} loading={loadingT} t={t} onPostClick={goArticle} />
        
        {/* Curated Resources section */}
        <div style={{ marginTop: 24 }}>
          <ResourceGrid articles={articles} t={t} onNavigate={goArticle} />
        </div>
      </div>
    );
  };

  /* ─── Desktop Layout ─── */
  const renderDesktopLayout = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, width: '100%', maxWidth: 1600, margin: '0 auto', padding: isWide ? '20px 48px 0' : '20px 24px 0', boxSizing: 'border-box' }}>
      
      {/* ── ROW 1: Videos (Full Width) ── */}
      <div style={{ width: '100%' }}>
        <SectionLabel color="#7A00FF">Videos</SectionLabel>
        <VideoShortsRow limit={8} variant="long" />
      </div>

      {/* ── ROW 2: Shorts (Full Width) ── */}
      <div style={{ width: '100%' }}>
        <VideoShortsRow limit={8} variant="short" />
      </div>

      {/* ── ROW 3: Articles (Full Width) ── */}
      <div style={{ width: '100%' }}>
        <SectionLabel color="#0891B2">Articles</SectionLabel>
        {loadingA
          ? (
            /* Skeleton grid — same columns as live grid */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 24 }}>
              {[...Array(6)].map((_, i) => <ArticleCardSkeleton key={i} t={t} />)}
            </div>
          )
          : articles.length === 0
            ? <EmptyState query={debouncedQuery} t={t} />
            : <>
                {/* Horizontal Trending Carousel Banner */}
                <TrendingArticlesBanner articles={articles} t={t} onNavigate={goArticle} />

                {/* Feed articles — responsive YouTube-style grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 24, marginBottom: 24 }}>
                  {articles.map((a) => (
                    <ArticleCard key={a.id} article={a} t={t} onNavigate={goArticle} onAuthRequired={handleAuthRequired} horizontal={false} />
                  ))}
                </div>

                <BuildCTA t={t} />
              </>
        }
        {!loadingA && hasMore && <LoadMoreTrigger onVisible={handleLoadMore} loading={loadingMore} />}
        {loadingMore && <div style={{ padding: '16px 0', textAlign: 'center' }}><Mono size={10} color={t.muted} t={t}>loading more…</Mono></div>}
        {!hasMore && articles.length > 0 && <div style={{ padding: '16px 0', textAlign: 'center' }}><Mono size={10} color={t.muted} t={t}>// end of feed</Mono></div>}
        <div style={{ height: 80 }} />
      </div>
    </div>
  );

  if (!mounted) {
    return <div style={{ minHeight: '100vh', background: '#0B0F14' }} />;
  }

  return (
    <>
      <Helmet><title>Explore — FocusGram</title></Helmet>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(122,0,255,0.2); border-radius: 4px; }
        input::placeholder { color: #94A3B8; font-family: 'Inter',sans-serif; font-size: 13px; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
        .explore-right-col::-webkit-scrollbar { display: none; }
      `}</style>

      {authPrompt && (
        <LoginPromptModal reason={authPrompt} onClose={() => setAuthPrompt(null)} t={t} />
      )}

      <div style={{
        minHeight: '100vh', background: t.bg,
        display: 'flex', flexDirection: 'column',
        fontFamily: "'Inter',sans-serif",
        transition: 'background 0.3s ease',
      }}>
        {debouncedQuery.length < 2 && (
          <div style={{
            position: 'sticky',
            top: 56,
            zIndex: 10,
            background: t.isDark ? 'rgba(11,15,20,0.88)' : 'rgba(248,250,252,0.88)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${t.border}`,
            padding: '8px 18px 0',
            boxSizing: 'border-box',
          }}>
            <ChipBar active={activeChip} setActive={chip => { setActiveChip(chip); setQuery(''); }} t={t} />
          </div>
        )}

        {debouncedQuery.length >= 2 ? (
          <div style={{
            flex: 1,
            width: '100%',
            maxWidth: 1100,
            margin: '0 auto',
            padding: isDesktop ? '20px 24px 0' : '14px 18px 0',
            boxSizing: 'border-box',
          }}>
            <SearchTabBar activeTab={searchTab} setActiveTab={setSearchTab} t={t} />
            {loadingSearch ? (
              <LottieSearchLoader label="Searching articles, posts & users..." />
            ) : (
              renderSearchContent()
            )}
            <div style={{ height: 80 }} />
          </div>
        ) : activeChip === 'Trending' ? (
          renderTrendingPage()
        ) : isDesktop ? (
          /* ── DESKTOP: Multi-row layout ── */
          renderDesktopLayout()
        ) : (
          /* ── MOBILE: single column, max 520px ── */
          <div style={{
            flex: 1, padding: '14px 18px 0',
            maxWidth: 520, width: '100%', margin: '0 auto',
            boxSizing: 'border-box',
          }}>
            {renderMobileFeed()}
            {!loadingA && hasMore && <LoadMoreTrigger onVisible={handleLoadMore} loading={loadingMore} />}
            {loadingMore && <div style={{ padding: '16px 0', textAlign: 'center' }}><Mono size={10} color={t.muted} t={t}>loading more…</Mono></div>}
            {!hasMore && articles.length > 0 && <div style={{ padding: '16px 0', textAlign: 'center' }}><Mono size={10} color={t.muted} t={t}>// end of feed</Mono></div>}
            <div style={{ height: 80 }} />
          </div>
        )}
      </div>

      <MobileBottomNav />
    </>
  );
}

/* ─── Section label helper ─────────────────────────────────────────────────── */
function SectionLabel({ children, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      marginBottom: 12,
    }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0 }} />
      <span style={{
        fontFamily: "'Manrope',sans-serif", fontSize: 11, fontWeight: 700,
        letterSpacing: '0.08em', textTransform: 'uppercase', color,
      }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: color, opacity: 0.18 }} />
    </div>
  );
}
