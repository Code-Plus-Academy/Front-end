'use client';
/**
 * Explore.jsx — CPA Content Discovery Engine
 *
 * RESPONSIVE LAYOUT:
 *  Mobile  (<640px):   1-column feed, stacked
 *  Tablet  (640–1023): 2-column article grid
 *  Desktop (1024–1399):2-column grid + right trending sidebar
 *  Wide    (≥1400px):  4-column article grid + right trending sidebar
 *
 * Auth pattern: YouTube-style — page is PUBLIC.
 * Login required only for: clap, save, comment (modal prompt, no redirect).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from '../components/seo/HelmetShim';
import { useRouter } from 'next/navigation';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import NoIndex from '../components/seo/NoIndex';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { DARK as DARK_T, LIGHT as LIGHT_T } from '../styles/tokens';
import VideoShortsRow from '../components/videos/VideoShortsRow';

/* ─── Design tokens ───────────────────────────────────────────────────────── */
function useT() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const base = isDark ? DARK_T : LIGHT_T;
  return {
    bg:        isDark ? '#0B0F14'  : '#F0F2F7',
    card:      isDark ? '#111827'  : '#FFFFFF',
    cardHov:   isDark ? '#161f2e'  : '#FAFBFF',
    border:    isDark ? base.cardBorder : 'rgba(0,0,0,0.08)',
    borderHov: isDark ? '#374151'  : '#C4B5FD',
    text:      base.txt,
    sub:       base.txt2,
    muted:     base.txt3,
    inputBg:   isDark ? '#1F2937'  : '#EAECF4',
    navBg:     isDark ? '#0B0F14'  : '#FFFFFF',
    isDark,
    purple:    base.accent,
    purpleHov: isDark ? '#6A00E6' : '#6B12DD',
    purpleGlow:'rgba(122,0,255,0.25)',
    purpleTint:isDark ? 'rgba(122,0,255,0.12)' : '#EDE9FE',
    sidebarBg: isDark ? '#0D1117'  : '#FFFFFF',
    trendBg:   isDark ? '#111827'  : '#FFFFFF',
    success:   base.green,
    error:     base.red || '#DC2626',
    overlay:   isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.55)',
  };
}

/* ─── Responsive breakpoint hook ─────────────────────────────────────────── */
function useBreakpoint() {
  const [w, setW] = useState(() => window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return {
    isMobile:  w < 640,
    isTablet:  w >= 640 && w < 1024,
    isDesktop: w >= 1024 && w < 1400,
    isWide:    w >= 1400,
    cols: w < 640 ? 1 : w < 1024 ? 2 : w < 1400 ? 2 : 4,
    hasSidebar: w >= 1024,
  };
}

/* ─── Constants ───────────────────────────────────────────────────────────── */
const CHIP_MAP = {
  'All':       null,
  'Trending':  'trending',
  'AI & ML':   'ai-ml',
  'Web Dev':   'web-dev',
  'Courses':   'course',
  'Projects':  'project-showcase',
  'Career':    'career',
  'Resources': 'resource-article',
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

function typeMeta(pt) { return TYPE_META[pt] || { icon: '◆', color: '#4F46E5', mono: pt || 'article' }; }
function coverGrad(pt) { return COVER_GRAD[pt] || COVER_GRAD['standard-article']; }

function extractThumbnail(article) {
  if (article.og_image_url) return article.og_image_url;
  const blocks = Array.isArray(article.content_blocks)
    ? article.content_blocks
    : (typeof article.content_blocks === 'string'
        ? (() => { try { return JSON.parse(article.content_blocks); } catch { return []; } })()
        : []);
  for (const block of blocks) {
    if (block?.src && block.src.startsWith('http')) return block.src;
    if (block?.url && block.url.startsWith('http')) return block.url;
    const html = block?.html || block?.content || '';
    const m = html.match(/src=[\"']([^\"']+)[\"']/);
    if (m && m[1].startsWith('http')) return m[1];
  }
  return null;
}

function timeAgo(date) {
  if (!date) return '';
  const m = Math.floor((Date.now() - new Date(date)) / 60000);
  if (m < 60)    return `${m}m`;
  if (m < 1440)  return `${Math.floor(m / 60)}h`;
  if (m < 43200) return `${Math.floor(m / 1440)}d`;
  return `${Math.floor(m / 43200)}mo`;
}

function fmtCount(n) {
  if (!n) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function useDebounce(value, delay = 350) {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

/* ─── Login prompt modal ──────────────────────────────────────────────────── */
function LoginPromptModal({ reason, onClose, t }) {
  const router = useRouter();
  const REASONS = {
    like:    { icon: '♥', title: 'Like this article?',   sub: 'Sign in to show your appreciation.' },
    save:    { icon: '◈', title: 'Save for later?',      sub: 'Sign in to build your reading list.' },
    comment: { icon: '◆', title: 'Join the discussion?', sub: 'Sign in to comment.' },
  };
  const r = REASONS[reason] || REASONS.like;
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:1000,background:t.overlay,display:'flex',alignItems:'flex-end',justifyContent:'center',backdropFilter:'blur(4px)',WebkitBackdropFilter:'blur(4px)',animation:'fadeIn 0.15s ease' }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'100%',maxWidth:520,background:t.card,borderRadius:'20px 20px 0 0',padding:'24px 24px 36px',border:`1px solid ${t.border}`,borderBottom:'none',boxShadow:'0 -8px 48px rgba(0,0,0,0.4)',animation:'slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div style={{ width:36,height:4,borderRadius:2,background:t.border,margin:'0 auto 20px' }} />
        <div style={{ width:52,height:52,borderRadius:'50%',background:`${t.purple}18`,border:`2px solid ${t.purple}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,margin:'0 auto 14px',color:t.purple,fontFamily:"'JetBrains Mono',monospace" }}>{r.icon}</div>
        <div style={{ textAlign:'center',marginBottom:20 }}>
          <div style={{ fontSize:18,fontWeight:700,color:t.text,fontFamily:"'Manrope',sans-serif",letterSpacing:'-0.025em',marginBottom:8 }}>{r.title}</div>
          <div style={{ fontSize:13,color:t.sub,fontFamily:"'Inter',sans-serif",lineHeight:1.65 }}>{r.sub}</div>
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
          <button onClick={()=>router.push('/login')} style={{ width:'100%',padding:'13px',borderRadius:10,background:t.purple,color:'#fff',border:'none',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:"'Inter',sans-serif",boxShadow:`0 4px 18px ${t.purple}55` }}>Sign in to Code+ Academy</button>
          <button onClick={()=>router.push('/signup')} style={{ width:'100%',padding:'13px',borderRadius:10,background:'none',color:t.purple,border:`1.5px solid ${t.purple}40`,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:"'Inter',sans-serif" }}>Create a free account</button>
          <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',color:t.muted,fontSize:13,fontFamily:"'Inter',sans-serif",padding:'6px' }}>Not now</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Primitives ──────────────────────────────────────────────────────────── */
function Mono({ children, color, size = 9, t }) {
  return <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:size,fontWeight:500,color:color||t.muted,letterSpacing:'0.04em',lineHeight:1.4 }}>{children}</span>;
}

function AvatarBubble({ src, initials, size = 28, bg }) {
  if (src) return <img src={src} alt={initials} style={{ width:size,height:size,borderRadius:'50%',objectFit:'cover',flexShrink:0,border:`1.5px solid ${bg||'#7A00FF'}44` }} />;
  return <div style={{ width:size,height:size,borderRadius:'50%',background:bg||'#7A00FF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.33,fontWeight:600,color:'#fff',flexShrink:0,fontFamily:"'Inter',sans-serif" }}>{(initials||'?').slice(0,2).toUpperCase()}</div>;
}

/* ─── Thumbnail ───────────────────────────────────────────────────────────── */
function Thumbnail({ article }) {
  const m = typeMeta(article.page_type);
  const thumb = extractThumbnail(article);
  const grad  = coverGrad(article.page_type);
  const badge = (
    <div style={{ position:'absolute',top:8,left:8,zIndex:2,display:'inline-flex',alignItems:'center',gap:4,background:m.color,borderRadius:6,padding:'3px 8px',boxShadow:`0 2px 10px ${m.color}66` }}>
      <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:'#fff',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase' }}>{m.icon} {m.mono}</span>
    </div>
  );
  const readBadge = article.read_time_mins && (
    <div style={{ position:'absolute',bottom:8,right:8,background:'rgba(0,0,0,0.78)',borderRadius:5,padding:'2px 7px' }}>
      <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:'#fff',fontWeight:500 }}>{article.read_time_mins} min</span>
    </div>
  );
  if (thumb) return (
    <div style={{ position:'relative',paddingTop:'56.25%',borderRadius:'12px 12px 0 0',overflow:'hidden',flexShrink:0 }}>
      <img src={thumb} alt="" loading="lazy" style={{ position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover' }} />
      {badge}{readBadge}
    </div>
  );
  return (
    <div style={{ position:'relative',paddingTop:'56.25%',background:grad,borderRadius:'12px 12px 0 0',overflow:'hidden',flexShrink:0 }}>
      <div style={{ position:'absolute',inset:0,background:`radial-gradient(ellipse at 50% 42%, ${m.color}55 0%, transparent 68%)` }} />
      <div style={{ position:'absolute',inset:0,opacity:.07,backgroundImage:`radial-gradient(circle, ${m.color}cc 1px, transparent 1px)`,backgroundSize:'20px 20px' }} />
      <span style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:40,filter:`drop-shadow(0 0 18px ${m.color}cc)` }}>{m.icon}</span>
      {badge}{readBadge}
    </div>
  );
}

/* ─── Article Card ────────────────────────────────────────────────────────── */
function ArticleCard({ article, t, onAuthRequired, compact = false }) {
  const { user } = useAuth();
  const [liked, setLiked]     = useState(article.is_clapped || false);
  const [saved, setSaved]     = useState(false);
  const [hov,   setHov]       = useState(false);
  const [claps, setClaps]     = useState(article.clap_count || 0);
  const m    = typeMeta(article.page_type);
  const meta = article.meta || {};
  const desc = meta.description || meta.excerpt || '';

  const handleClap = async (e) => {
    e.stopPropagation();
    if (!user) { onAuthRequired('like'); return; }
    const was = liked; setLiked(!was); setClaps(c => was ? Math.max(0,c-1) : c+1);
    try { if (was) await api.delete(`/articles/${article.id}/clap`); else await api.post(`/articles/${article.id}/clap`); }
    catch { setLiked(was); setClaps(c => was ? c+1 : Math.max(0,c-1)); }
  };
  const handleSave = (e) => { e.stopPropagation(); if (!user) { onAuthRequired('save'); return; } setSaved(s=>!s); };

  return (
    <div
      onClick={() => onNavigate(article)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? t.cardHov : t.card,
        borderRadius: 14,
        border: `1px solid ${hov ? t.borderHov : t.border}`,
        overflow: 'hidden', cursor: 'pointer',
        boxShadow: t.isDark
          ? (hov ? '0 8px 40px rgba(0,0,0,0.5)' : '0 2px 16px rgba(0,0,0,0.35)')
          : (hov ? '0 8px 32px rgba(122,0,255,0.1)' : '0 1px 6px rgba(0,0,0,0.05)'),
        transform: hov ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.18s ease',
        display: 'flex', flexDirection: 'column',
      }}>
      <Thumbnail article={article} />
      <div style={{ padding: compact ? '10px 12px 11px' : '11px 13px 12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: compact ? 13 : 14, fontWeight: 700, color: t.text, lineHeight: 1.4, fontFamily:"'Manrope',sans-serif", marginBottom: 5, display:'-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient:'vertical', overflow:'hidden', letterSpacing:'-0.02em' }}>{article.title}</div>
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom: desc ? 7 : 0 }}>
          <AvatarBubble src={article.creator_avatar_url} initials={article.creator_username} size={22} bg={m.color+'cc'} />
          <div style={{ fontSize:11,fontWeight:600,color:t.sub,fontFamily:"'Inter',sans-serif",flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>@{article.creator_username}</div>
          <Mono size={10} color={t.muted} t={t}>{timeAgo(article.published_at)}</Mono>
        </div>
        {!compact && desc && (
          <div style={{ fontSize:12,color:t.sub,lineHeight:1.55,fontFamily:"'Inter',sans-serif",marginBottom:9,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden' }}>{desc}</div>
        )}
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'auto',paddingTop:8 }}>
          <Mono size={10} color={t.muted} t={t}>{article.view_count > 0 ? `👁 ${fmtCount(article.view_count)}` : ''}</Mono>
          <div style={{ display:'flex',gap:8 }}>
            <button onClick={handleClap} style={{ display:'flex',alignItems:'center',gap:4,background:liked?`${m.color}16`:'none',border:liked?`1px solid ${m.color}28`:'1px solid transparent',borderRadius:6,padding:'3px 7px',cursor:'pointer',color:liked?m.color:t.muted,transition:'all 0.15s' }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:12,lineHeight:1 }}>{liked?'♥':'♡'}</span>
              <Mono size={10} color={liked?m.color:t.muted} t={t}>{fmtCount(claps)}</Mono>
            </button>
            <button onClick={handleSave} style={{ display:'flex',alignItems:'center',gap:4,background:saved?`${t.purple}16`:'none',border:saved?`1px solid ${t.purple}28`:'1px solid transparent',borderRadius:6,padding:'3px 7px',cursor:'pointer',color:saved?t.purple:t.muted,transition:'all 0.15s',fontFamily:"'JetBrains Mono',monospace",fontSize:12,lineHeight:1 }}>{saved?'◈':'◇'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Skeleton ────────────────────────────────────────────────────────────── */
function CardSkeleton({ t }) {
  const sh = { background: t.isDark ? 'linear-gradient(90deg,#1F2937 25%,#2D3748 50%,#1F2937 75%)' : 'linear-gradient(90deg,#E5E7EB 25%,#F3F4F6 50%,#E5E7EB 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite' };
  return (
    <div style={{ borderRadius:14,border:`1px solid ${t.border}`,overflow:'hidden',background:t.card }}>
      <div style={{ paddingTop:'56.25%',position:'relative' }}><div style={{ position:'absolute',inset:0,...sh }} /></div>
      <div style={{ padding:'11px 13px 12px' }}>
        <div style={{ height:14,borderRadius:4,marginBottom:5,...sh }} />
        <div style={{ height:14,borderRadius:4,width:'70%',marginBottom:10,...sh }} />
        <div style={{ display:'flex',gap:8,alignItems:'center',marginBottom:8 }}>
          <div style={{ width:22,height:22,borderRadius:'50%',...sh }} />
          <div style={{ height:10,width:'35%',borderRadius:4,...sh }} />
        </div>
        <div style={{ height:10,borderRadius:4,width:'90%',marginBottom:4,...sh }} />
        <div style={{ height:10,borderRadius:4,width:'60%',...sh }} />
      </div>
    </div>
  );
}

/* ─── Hero Card ───────────────────────────────────────────────────────────── */
function HeroCard({ article, t, onNavigate }) {
  const router = useRouter();
  const thumb = article ? extractThumbnail(article) : null;
  const m = article ? typeMeta(article.page_type) : null;

  return (
    <div
      onClick={() => article && onNavigate(article)}
      style={{ borderRadius:14,overflow:'hidden',marginBottom:0,cursor:article?'pointer':'default',background:t.isDark?'linear-gradient(155deg,#1a0040 0%,#0B0F14 55%,#001a30 100%)':'linear-gradient(155deg,#3a0080 0%,#1a0050 55%,#001050 100%)',border:`1px solid ${t.purple}30`,boxShadow:t.isDark?`0 0 40px ${t.purpleGlow}`:`0 4px 32px rgba(122,0,255,0.15)`,position:'relative',gridColumn:'1 / -1' }}>
      {thumb && <div style={{ height:220,overflow:'hidden',position:'relative' }}><img src={thumb} alt="" style={{ width:'100%',height:'100%',objectFit:'cover',opacity:.45 }} /><div style={{ position:'absolute',inset:0,background:'linear-gradient(transparent 30%,rgba(0,0,0,0.7) 100%)' }} /></div>}
      <div style={{ position:'absolute',inset:0,backgroundImage:`radial-gradient(ellipse at 75% 25%, rgba(122,0,255,0.35) 0%, transparent 55%)`,pointerEvents:'none' }} />
      <div style={{ position:'relative',padding:'22px 20px 20px' }}>
        <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:10 }}>
          <div style={{ width:6,height:6,borderRadius:'50%',background:m?m.color:t.purple,boxShadow:`0 0 8px ${m?m.color:t.purple}` }} />
          <Mono size={9} color="rgba(200,160,255,0.9)" t={t}>{article?`${m.mono} · @${article.creator_username}`:'featured · code plus academy'}</Mono>
        </div>
        <div style={{ fontSize:22,fontWeight:800,color:'#fff',fontFamily:"'Manrope',sans-serif",lineHeight:1.2,marginBottom:10,letterSpacing:'-0.03em' }}>
          {article ? article.title : 'Discover Knowledge.\nBuild. Ship. Grow.'}
        </div>
        {!article && <div style={{ fontSize:13,color:'rgba(255,255,255,0.6)',fontFamily:"'Inter',sans-serif",lineHeight:1.7,marginBottom:16 }}>Explore articles, courses, projects and resources from 200+ creators.</div>}
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          {article
            ? <button onClick={e=>{e.stopPropagation();onNavigate(article);}} style={{ background:t.purple,color:'#fff',border:'none',borderRadius:9,padding:'9px 20px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'Inter',sans-serif",boxShadow:`0 4px 18px ${t.purple}66` }}>Read article →</button>
            : <button onClick={()=>router.push('/articles')} style={{ background:t.purple,color:'#fff',border:'none',borderRadius:9,padding:'9px 20px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'Inter',sans-serif",boxShadow:`0 4px 18px ${t.purple}66` }}>Explore all →</button>
          }
          {article && <Mono size={10} color="rgba(255,255,255,0.4)" t={t}>{article.read_time_mins?`${article.read_time_mins} min · `:''}
            {fmtCount(article.clap_count)} claps</Mono>}
        </div>
      </div>
    </div>
  );
}

/* ─── Trending Sidebar ────────────────────────────────────────────────────── */
function TrendingSidebar({ posts, loading, t, onPostClick }) {
  const colors = ['#7A00FF','#16A34A','#DC2626','#3B82F6','#F97316','#0891B2','#E11D48','#059669'];
  return (
    <div style={{ background:t.trendBg,borderRadius:14,border:`1px solid ${t.border}`,overflow:'hidden',boxShadow:t.isDark?'none':'0 1px 4px rgba(0,0,0,0.04)',position:'sticky',top:64,maxHeight:'calc(100vh - 80px)',overflowY:'auto',scrollbarWidth:'none' }}>
      {/* Header */}
      <div style={{ padding:'14px 16px 12px',borderBottom:`1px solid ${t.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,background:t.trendBg,zIndex:2 }}>
        <span style={{ fontFamily:"'Manrope',sans-serif",fontSize:13,fontWeight:700,color:t.text,letterSpacing:'-0.02em' }}>🔥 Trending</span>
        <div style={{ display:'flex',alignItems:'center',gap:5 }}>
          <div style={{ width:5,height:5,borderRadius:'50%',background:'#E11D48',animation:'pulse 1.5s ease-in-out infinite' }} />
          <Mono size={9} color="#E11D48" t={t}>live</Mono>
        </div>
      </div>

      {loading ? (
        [...Array(5)].map((_,i) => (
          <div key={i} style={{ display:'flex',gap:10,padding:'10px 16px',borderBottom:i<4?`1px solid ${t.border}`:'none' }}>
            <div style={{ width:32,height:32,borderRadius:8,background:t.border,flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <div style={{ height:9,borderRadius:3,background:t.border,marginBottom:5,width:'40%' }} />
              <div style={{ height:11,borderRadius:3,background:t.border,width:'85%' }} />
            </div>
          </div>
        ))
      ) : posts.length === 0 ? (
        <div style={{ padding:20,textAlign:'center' }}><Mono size={11} color={t.muted} t={t}>No trending posts yet</Mono></div>
      ) : posts.map((post, i) => {
        const color = colors[i % colors.length];
        return (
          <div key={post.id} onClick={()=>onPostClick(post)} style={{ display:'flex',gap:10,padding:'10px 16px',borderBottom:i<posts.length-1?`1px solid ${t.border}`:'none',cursor:'pointer',alignItems:'flex-start',transition:'background 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.background=t.isDark?'rgba(255,255,255,0.03)':'rgba(0,0,0,0.02)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <div style={{ width:32,height:32,borderRadius:8,background:color+'18',border:`1px solid ${color}28`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <Mono size={8} color={color} t={t}>{(post.type||'post').slice(0,3)}</Mono>
            </div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ display:'flex',alignItems:'center',gap:5,marginBottom:3 }}>
                <span style={{ fontSize:10,color:color,fontFamily:"'JetBrains Mono',monospace",fontWeight:700 }}>@{post.creator_username}</span>
                <Mono size={9} color={t.muted} t={t}>{timeAgo(post.created_at)}</Mono>
              </div>
              <div style={{ fontSize:12,fontWeight:500,color:t.text,lineHeight:1.45,fontFamily:"'Inter',sans-serif",display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden',marginBottom:4 }}>{post.title||post.caption||'Untitled'}</div>
              <Mono size={9} color={t.muted} t={t}>{fmtCount(post.view_count)} views · {fmtCount(post.clap_count)} claps</Mono>
            </div>
          </div>
        );
      })}

      {/* Build CTA */}
      <div style={{ margin:14,borderRadius:12,padding:'16px',background:`linear-gradient(145deg,${t.purple},${t.purpleHov})`,boxShadow:`0 6px 24px ${t.purple}44`,textAlign:'center',position:'relative',overflow:'hidden' }}>
        <div style={{ position:'absolute',inset:0,backgroundImage:`radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)` }} />
        <div style={{ position:'relative' }}>
          <Mono size={9} color="rgba(200,160,255,0.8)" t={t}>// build-something-today</Mono>
          <div style={{ fontSize:15,fontWeight:800,color:'#fff',fontFamily:"'Manrope',sans-serif",lineHeight:1.3,marginTop:7,marginBottom:5,letterSpacing:'-0.025em' }}>50+ project starters.</div>
          <div style={{ fontSize:12,color:'rgba(255,255,255,0.65)',marginBottom:13,fontFamily:"'Inter',sans-serif",lineHeight:1.6 }}>Ship in minutes with community kits.</div>
          <button style={{ background:'#fff',color:t.purple,border:'none',borderRadius:8,padding:'9px 20px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Inter',sans-serif" }}>Explore →</button>
        </div>
      </div>

      {/* Popular tags */}
      <div style={{ padding:'0 16px 16px' }}>
        <div style={{ fontSize:11,fontWeight:700,color:t.sub,fontFamily:"'Manrope',sans-serif",marginBottom:8,letterSpacing:'-0.01em' }}>Popular Tags</div>
        <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
          {['React','Python','AI','TypeScript','System Design','Web3','DevOps','Cloud'].map(tag => (
            <span key={tag} style={{ fontSize:10,padding:'3px 9px',borderRadius:20,background:t.isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)',color:t.sub,fontFamily:"'JetBrains Mono',monospace",cursor:'pointer',border:`1px solid ${t.border}`,transition:'all 0.15s' }}>{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Trending Strip (mobile/tablet inline) ───────────────────────────────── */
function TrendingStrip({ posts, loading, t, onPostClick }) {
  const colors = ['#7A00FF','#16A34A','#DC2626','#3B82F6','#F97316','#0891B2'];
  return (
    <div style={{ background:t.card,borderRadius:12,border:`1px solid ${t.border}`,overflow:'hidden',marginBottom:16,boxShadow:t.isDark?'none':'0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ padding:'12px 14px 10px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:`1px solid ${t.border}` }}>
        <span style={{ fontFamily:"'Manrope',sans-serif",fontSize:13,fontWeight:700,color:t.text }}>🔥 Trending</span>
        <div style={{ display:'flex',alignItems:'center',gap:5 }}>
          <div style={{ width:5,height:5,borderRadius:'50%',background:'#E11D48',animation:'pulse 1.5s ease-in-out infinite' }} />
          <Mono size={9} color="#E11D48" t={t}>live</Mono>
        </div>
      </div>
      {loading ? (
        [...Array(3)].map((_,i)=>(
          <div key={i} style={{ display:'flex',gap:10,padding:'10px 14px',borderBottom:i<2?`1px solid ${t.border}`:'none' }}>
            <div style={{ width:28,height:28,borderRadius:7,background:t.border,flexShrink:0 }} />
            <div style={{ flex:1 }}><div style={{ height:9,borderRadius:3,background:t.border,marginBottom:5,width:'40%' }} /><div style={{ height:11,borderRadius:3,background:t.border }} /></div>
          </div>
        ))
      ) : posts.slice(0,4).map((post,i)=>{
        const color = colors[i%colors.length];
        return (
          <div key={post.id} onClick={()=>onPostClick(post)} style={{ display:'flex',gap:10,padding:'10px 14px',borderBottom:i<Math.min(posts.length,4)-1?`1px solid ${t.border}`:'none',cursor:'pointer',alignItems:'flex-start' }}>
            <div style={{ width:28,height:28,borderRadius:7,background:color+'18',border:`1px solid ${color}28`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <Mono size={8} color={color} t={t}>{(post.type||'post').slice(0,3)}</Mono>
            </div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ display:'flex',alignItems:'center',gap:5,marginBottom:2 }}>
                <span style={{ fontSize:10,color:color,fontFamily:"'JetBrains Mono',monospace",fontWeight:700 }}>@{post.creator_username}</span>
                <Mono size={9} color={t.muted} t={t}>{timeAgo(post.created_at)}</Mono>
              </div>
              <div style={{ fontSize:12,fontWeight:500,color:t.text,lineHeight:1.45,fontFamily:"'Inter',sans-serif",display:'-webkit-box',WebkitLineClamp:1,WebkitBoxOrient:'vertical',overflow:'hidden' }}>{post.title||post.caption||'Untitled'}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Search Bar ──────────────────────────────────────────────────────────── */
function SearchBar({ value, onChange, t }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position:'sticky',top:0,zIndex:100,background:t.isDark?`${t.navBg}f0`:`${t.navBg}f8`,backdropFilter:'blur(18px)',WebkitBackdropFilter:'blur(18px)',borderBottom:`1px solid ${t.border}`,padding:'10px 18px' }}>
      <div style={{ display:'flex',gap:8,alignItems:'center',maxWidth:1600,margin:'0 auto' }}>
        <div style={{ flex:1,display:'flex',alignItems:'center',gap:8,background:focused?t.card:t.inputBg,borderRadius:10,padding:'8px 12px',border:`1.5px solid ${focused?t.purple:t.border}`,boxShadow:focused?`0 0 0 3px ${t.purple}1a`:'none',transition:'all 0.15s' }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:t.muted }}>⌕</span>
          <input value={value} onChange={e=>onChange(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} placeholder="Search articles, courses, projects..."
            style={{ flex:1,background:'none',border:'none',outline:'none',fontSize:13,color:t.text,fontFamily:"'Inter',sans-serif" }} />
          {value && <button onClick={()=>onChange('')} style={{ background:'none',border:'none',cursor:'pointer',fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:t.muted,padding:0,lineHeight:1 }}>✕</button>}
        </div>
      </div>
    </div>
  );
}

/* ─── Chip Bar ────────────────────────────────────────────────────────────── */
function ChipBar({ active, setActive, t }) {
  return (
    <div style={{ display:'flex',gap:6,overflowX:'auto',padding:'9px 18px',borderBottom:`1px solid ${t.border}`,scrollbarWidth:'none',background:t.navBg }}>
      <div style={{ display:'flex',gap:6,maxWidth:1600,margin:'0 auto',width:'100%' }}>
        {CHIPS.map(chip => {
          const isActive = active === chip;
          return (
            <button key={chip} onClick={()=>setActive(chip)} style={{ flexShrink:0,padding:'5px 14px',borderRadius:20,border:`1px solid ${isActive?t.purple:t.border}`,background:isActive?t.purple:t.card,color:isActive?'#fff':t.sub,fontSize:12,fontWeight:isActive?600:400,cursor:'pointer',letterSpacing:'-0.02em',fontFamily:"'Inter',sans-serif",boxShadow:isActive?`0 2px 10px ${t.purple}33`:'none',transition:'all 0.12s' }}>{chip}</button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Load More Trigger ───────────────────────────────────────────────────── */
function LoadMoreTrigger({ onVisible, loading }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(entries => { if (entries[0].isIntersecting && !loading) onVisible(); }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [onVisible, loading]);
  return <div ref={ref} style={{ height:40 }} />;
}

/* ─── Main Explore Page ───────────────────────────────────────────────────── */
export default function Explore() {
  const router = useRouter();
  const { user } = useAuth();
  const t        = useT();
  const bp       = useBreakpoint();

  const [authPrompt, setAuthPrompt] = useState(null);
  const [query,      setQuery]      = useState('');
  const [activeChip, setActiveChip] = useState('All');
  const dq = useDebounce(query, 350);

  const [articles,    setArticles]    = useState([]);
  const [loadingA,    setLoadingA]    = useState(true);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [trending,    setTrending]    = useState([]);
  const [loadingT,    setLoadingT]    = useState(true);
  const [topDevs,     setTopDevs]     = useState([]);

  const goArticle = (a) => router.push(`/articles/${a.slug}`);
  const goPost    = (p) => router.push(`/posts/${p.id}`);
  const handleAuthRequired = useCallback((r) => setAuthPrompt(r), []);

  const fetchArticles = useCallback(async (pageNum = 1, reset = false) => {
    if (pageNum === 1) setLoadingA(true); else setLoadingMore(true);
    try {
      let creators = topDevs;
      if (creators.length === 0) {
        const uRes = await api.get('/users/search', { params: { limit: 8 } });
        creators = uRes.data.users || []; setTopDevs(creators);
      }
      const perCreator = await Promise.allSettled(creators.slice(0,8).map(u => api.get(`/articles/by/${u.username}`)));
      let merged = [];
      perCreator.forEach(r => { if (r.status==='fulfilled') merged = merged.concat(r.value.data.articles || []); });
      const seen = new Set();
      merged = merged.filter(a => { if(seen.has(a.id))return false; seen.add(a.id); return true; });
      const chipFilter = CHIP_MAP[activeChip];
      if (chipFilter === 'trending') merged = merged.sort((a,b) => (b.clap_count+b.view_count*.2)-(a.clap_count+a.view_count*.2));
      else if (chipFilter) merged = merged.filter(a => a.page_type===chipFilter || (a.meta?.tags||[]).some(tag=>tag.toLowerCase().includes(chipFilter.replace('-',' '))));
      if (dq.length >= 2) { const q=dq.toLowerCase(); merged=merged.filter(a => a.title?.toLowerCase().includes(q)||a.creator_username?.toLowerCase().includes(q)||(a.meta?.tags||[]).some(tg=>tg.toLowerCase().includes(q))||(a.meta?.description||'').toLowerCase().includes(q)); }
      if (chipFilter !== 'trending') merged = merged.sort((a,b) => new Date(b.published_at)-new Date(a.published_at));
      const PAGE_SIZE=20; const startIdx=(pageNum-1)*PAGE_SIZE; const slice=merged.slice(startIdx,startIdx+PAGE_SIZE);
      setHasMore(startIdx+PAGE_SIZE < merged.length);
      if (reset||pageNum===1) setArticles(slice); else setArticles(prev=>[...prev,...slice]);
    } catch(err) { console.error('[Explore]',err); }
    finally { setLoadingA(false); setLoadingMore(false); }
  }, [activeChip, dq, topDevs]);

  useEffect(() => { setPage(1); setHasMore(true); fetchArticles(1,true); }, [activeChip, dq]);
  useEffect(() => {
    setLoadingT(true);
    api.get('/posts', { params:{sort:'trending',limit:8} }).then(r=>setTrending(r.data?.posts||[])).catch(()=>setTrending([])).finally(()=>setLoadingT(false));
  }, []);

  const handleLoadMore = useCallback(() => { if(loadingMore||!hasMore)return; const next=page+1; setPage(next); fetchArticles(next); }, [loadingMore,hasMore,page,fetchArticles]);

  const heroArticle  = articles.find(a => a.clap_count > 0) || articles[0] || null;
  const feedArticles = articles.filter(a => a !== heroArticle);

  /* ── Render feed grid ── */
  const renderGrid = () => {
    if (loadingA) return [...Array(bp.cols * 2)].map((_,i) => <CardSkeleton key={i} t={t} />);
    if (articles.length === 0) return (
      <div style={{ gridColumn:'1 / -1',borderRadius:14,border:`1px dashed ${t.border}`,padding:40,textAlign:'center',color:t.muted }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:28,marginBottom:10 }}>⌀</div>
        <div style={{ fontFamily:"'Manrope',sans-serif",fontSize:14,fontWeight:600,color:t.text,marginBottom:6 }}>{dq?`No results for "${dq}"`:'No articles yet'}</div>
        <Mono size={11} color={t.muted} t={t}>{dq?'Try a different search':'Check back soon'}</Mono>
      </div>
    );
    const nodes = [];
    // Hero spans full width
    nodes.push(<HeroCard key="hero" article={heroArticle} t={t} onNavigate={goArticle} />);
    // Video shorts row spans full width
    nodes.push(<div key="vsr" style={{ gridColumn:'1 / -1' }}><VideoShortsRow limit={8} /></div>);
    // On mobile/tablet, show trending strip inline
    if (!bp.hasSidebar) nodes.push(<div key="trending-strip" style={{ gridColumn:'1 / -1' }}><TrendingStrip posts={trending} loading={loadingT} t={t} onPostClick={goPost} /></div>);
    // Article cards
    feedArticles.forEach((a, i) => {
      nodes.push(<ArticleCard key={a.id} article={a} t={t} onNavigate={goArticle} onAuthRequired={handleAuthRequired} compact={bp.isWide} />);
    });
    return nodes;
  };

  /* ── Content width by breakpoint ── */
  const contentStyle = {
    flex: 1,
    display: 'flex',
    gap: 20,
    padding: bp.isMobile ? '14px 12px 0' : '20px 20px 0',
    maxWidth: 1600,
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
  };

  const gridCols = bp.isMobile ? '1fr' : bp.isWide ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)';

  return (
    <>
      <Helmet><title>Explore — Code+ Academy</title></Helmet>
      <NoIndex />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(122,0,255,0.2); border-radius: 4px; }
        input::placeholder { color: #94A3B8; font-family: 'Inter',sans-serif; font-size: 13px; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
      `}</style>

      {authPrompt && <LoginPromptModal reason={authPrompt} onClose={()=>setAuthPrompt(null)} t={t} />}

      <div style={{ minHeight:'100vh',background:t.bg,display:'flex',flexDirection:'column',fontFamily:"'Inter',sans-serif",transition:'background 0.3s ease' }}>
        <SearchBar value={query} onChange={setQuery} t={t} />
        <ChipBar active={activeChip} setActive={chip=>{setActiveChip(chip);setQuery('');}} t={t} />

        {/* ── Two-pane layout: main grid + sticky sidebar ── */}
        <div style={contentStyle}>
          {/* Main feed */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display:'grid', gridTemplateColumns: gridCols, gap: bp.isWide ? 14 : 16, alignItems: 'start' }}>
              {renderGrid()}
            </div>

            {!loadingA && hasMore && <LoadMoreTrigger onVisible={handleLoadMore} loading={loadingMore} />}
            {loadingMore && <div style={{ padding:'16px 0',textAlign:'center' }}><Mono size={10} color={t.muted} t={t}>loading more…</Mono></div>}
            {!hasMore && articles.length > 0 && <div style={{ padding:'16px 0',textAlign:'center' }}><Mono size={10} color={t.muted} t={t}>// end of feed</Mono></div>}
            <div style={{ height: 80 }} />
          </div>

          {/* Sticky sidebar — only on desktop+ */}
          {bp.hasSidebar && (
            <div style={{ width: bp.isDesktop ? 280 : 300, flexShrink: 0 }}>
              <TrendingSidebar posts={trending} loading={loadingT} t={t} onPostClick={goPost} />
            </div>
          )}
        </div>
      </div>

      <MobileBottomNav />
    </>
  );
}
