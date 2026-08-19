'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Hand, Bookmark, Share2, Download, MessageSquare,
  ArrowLeft, Github, Star, GitFork, ExternalLink,
  Clock, Terminal, ChevronDown, ChevronUp, Send, User
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import { PostCardSkeleton, Skeleton } from '../components/ui/Skeleton';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import SocialPostLayout from '../components/posts/SocialPostLayout';
import useMediaQuery from '../hooks/useMediaQuery';
import CommentSheet from '../components/ui/CommentSheet';
import ShareSheet from '../components/ui/ShareSheet';
import RemovedContentPage from '../components/ui/RemovedContentPage';

import { useTheme } from '../context/ThemeContext';
import { DARK, LIGHT } from '../styles/tokens';

/* ─── Design Tokens (Centralized) ─── */
const F = {
  headline: '"Space Grotesk","Clash Display",sans-serif',
  body:     '"Geist",sans-serif',
  label:    '"JetBrains Mono",monospace',
};

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)  return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m`;
  if (s < 86400) return `${Math.floor(s/3600)}h`;
  return `${Math.floor(s/86400)}d`;
}

function GitHubRepoCard({ url }) {
  const { resolvedTheme } = useTheme();
  const T = resolvedTheme === 'dark' ? DARK : LIGHT;
  const [data, setData] = useState(null);
  const match = url?.match(/github\.com\/([^/]+\/[^/]+)/);
  const repo  = match?.[1];
  useEffect(() => {
    if (!repo) return;
    fetch(`https://api.github.com/repos/${repo}`)
      .then(r => r.json()).then(setData).catch(() => {});
  }, [repo]);
  if (!repo) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" style={{ display:'block', textDecoration:'none', marginTop:16 }}>
      <div style={{ background:T.surfLowest, borderRadius:10, border:`1px solid ${T.outlineV}35`, padding:'14px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <Github size={14} color={T.outline} />
          <span style={{ fontFamily:F.label, fontSize:11, color:T.secondary }}>{repo}</span>
          <ExternalLink size={11} color={T.outlineV} style={{ marginLeft:'auto' }} />
        </div>
        {data
          ? <>
              {data.description && <p style={{ fontFamily:F.body, fontSize:12, color:T.outline, lineHeight:1.55, margin:'0 0 10px' }}>{data.description}</p>}
              <div style={{ display:'flex', gap:14, fontFamily:F.label, fontSize:10, color:T.outlineV }}>
                <span style={{ display:'flex', alignItems:'center', gap:3 }}><Star size={10} color="#f59e0b"/>{data.stargazers_count}</span>
                <span style={{ display:'flex', alignItems:'center', gap:3 }}><GitFork size={10} color={T.primary}/>{data.forks_count}</span>
                {data.language && <span style={{ color:T.secondary }}>{data.language}</span>}
              </div>
            </>
          : <Skeleton height={10} width="55%" />
        }
      </div>
    </a>
  );
}

/* ── Shared post content (used in both mobile + desktop) ── */
function PostContent({ post, isMobile, onCommentTrigger }) {
  const { resolvedTheme } = useTheme();
  const baseT = resolvedTheme === 'dark' ? DARK : LIGHT;
  const T = {
    ...baseT,
    surfLowest: baseT.bg,
    surfLow:    baseT.bg2,
    surfHigh:   baseT.bg3,
    primary:    baseT.accent,
    primaryC:   baseT.accent,
    secondary:  baseT.accent2,
    accent:     baseT.gold || baseT.warning,
    outline:    resolvedTheme === 'dark' ? '#958da3' : '#64748b',
    outlineV:   resolvedTheme === 'dark' ? '#4a4457' : '#cbd5e1',
    onSurf:     baseT.txt,
    onSurfV:    baseT.txt2,
  };
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clapped,    setClapped]    = useState(post.is_clapped || false);
  const [clapCount,  setClapCount]  = useState(parseInt(post.clap_count) || 0);
  const [saved,      setSaved]      = useState(post.is_saved || false);
  const [copied,     setCopied]     = useState(false);
  const [comments,   setComments]   = useState([]);
  const id = post.id;

  useEffect(() => {
    api.get(`/posts/${id}/comments`)
      .then(r => setComments(r.data.comments || []))
      .catch(() => {});
  }, [id]);

  const handleClap = async () => {
    if (!user) {
      toast.error('Please sign in to clap!');
      return;
    }
    const was = clapped; setClapped(!was); setClapCount(was ? clapCount-1 : clapCount+1);
    try { if (was) await api.delete(`/posts/${id}/clap`); else await api.post(`/posts/${id}/clap`); }
    catch { setClapped(was); setClapCount(clapCount); }
  };
  const handleSave = async () => {
    if (!user) {
      toast.error('Please sign in to save posts!');
      return;
    }
    const was = saved; setSaved(!was);
    try { if (was) await api.delete(`/saved/${id}`); else await api.post(`/saved/${id}`); }
    catch { setSaved(was); }
  };
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true); toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };
  // Handlers for likes/save/share remain, local comment submit is removed

  const isOwn = user?.username === post.creator_username;

  return (
    <>
      {/* Moderation Status Banner */}
      {(() => {
        const s = (post?.moderation_status || post?.status || '').toLowerCase();
        if (s === 'under_review') {
          return (
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
              ⚠️ Under Review: This content has been flagged for compliance review. Comments and sharing may be restricted.
            </div>
          );
        }
        if (s === 'removed') {
          return (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
              ⛔ Content Removed: This content was removed for violating Code Plus Academy community guidelines.
            </div>
          );
        }
        return null;
      })()}

      {/* ── Tags row ── */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:isMobile ? 10 : 14 }}>
        {[post.type, post.difficulty, post.language].filter(Boolean).map((v, i) => (
          <span key={i} style={{
            padding: isMobile ? '2px 9px' : '3px 12px',
            borderRadius:14, fontFamily:F.label,
            fontSize: isMobile ? 8 : 9,
            textTransform:'uppercase', letterSpacing:1.2,
            background: i===0 ? `${T.secondary}12` : i===1 ? `${T.accent}10` : `${T.primary}10`,
            border: `1px solid ${i===0 ? T.secondary : i===1 ? T.accent : T.primary}25`,
            color: i===0 ? T.secondary : i===1 ? T.accent : T.primary,
          }}>{v}</span>
        ))}
        {post.tags?.slice(0, isMobile ? 3 : 6).map(tag => (
          <span key={tag} style={{ padding: isMobile ? '2px 9px':'3px 12px', borderRadius:14, background:T.surfHigh, border:`1px solid ${T.outlineV}20`, fontFamily:F.label, fontSize:isMobile?8:9, color:T.outlineV }}>#{tag}</span>
        ))}
      </div>

      {/* ── Title ── */}
      <h1 style={{
        fontFamily:F.headline, fontWeight:800,
        fontSize: isMobile ? 20 : 'clamp(26px,3vw,42px)',
        color: resolvedTheme === 'dark' ? '#fff' : T.txt, lineHeight:1.2, letterSpacing: -0.5,
        margin: `0 0 ${isMobile ? 12 : 20}px`,
      }}>
        {post.title}
      </h1>

      {/* ── Author row compact ── */}
      <Link to={`/u/${post.creator_username}`}
        style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', marginBottom: isMobile ? 12 : 20,
          padding: isMobile ? '10px 12px' : '12px 16px',
          background:T.surfLow, borderRadius:10, border:`1px solid ${T.outlineV}18` }}>
        <Avatar src={post.creator_avatar} name={post.creator_username} size={isMobile ? 32 : 40}
          style={{ border:`1.5px solid ${T.primary}30`, flexShrink:0 }} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:F.headline, fontWeight:700, fontSize: isMobile ? 12 : 14, color: resolvedTheme === 'dark' ? '#fff' : T.txt, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {post.creator_name || `@${post.creator_username}`}
          </div>
          <div style={{ fontFamily:F.label, fontSize: isMobile ? 9 : 10, color:T.secondary, letterSpacing:1, textTransform:'uppercase' }}>
            @{post.creator_username}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:4, fontFamily:F.label, fontSize: isMobile?9:10, color:T.outline, flexShrink:0 }}>
          <Clock size={10} />{timeAgo(post.created_at)}
        </div>
      </Link>

      {/* ── Description ── */}
      {post.description && (
        <div style={{ borderLeft:`3px solid ${T.primary}`, paddingLeft:14,
          marginBottom: isMobile ? 14 : 22 }}>
          <p style={{ fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif", fontSize: isMobile ? 13 : 15, color:T.onSurfV, lineHeight:1.7, margin:0 }}>
            {post.description}
          </p>
        </div>
      )}

      {/* ── GitHub ── */}
      {post.github_repo_url && <GitHubRepoCard url={post.github_repo_url} />}

      {/* ── Files ── */}
      {post.files?.length > 0 && (
        <div style={{ marginTop:14, background:T.surfLow, border:`1px solid ${T.outlineV}18`, borderRadius:10, overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:`1px solid ${T.outlineV}10` }}>
            <span style={{ fontFamily:F.label, fontSize:9, color:T.outline, textTransform:'uppercase', letterSpacing:2 }}>Attachments</span>
            <Terminal size={12} color={T.secondary} />
          </div>
          {post.files.map((file, i) => (
            <div key={file.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom: i < post.files.length-1 ? `1px solid ${T.outlineV}08`:' none' }}>
              <div style={{ display:'flex', gap:8, alignItems:'center', minWidth:0 }}>
                <Download size={12} color={T.outline} style={{ flexShrink:0 }} />
                <span style={{ fontFamily:F.label, fontSize:11, color:T.onSurf, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{file.file_name}</span>
              </div>
              {user
                ? <button onClick={async()=>{ try{ const r=await api.get(`/posts/${post.id}/files/${file.id}/download`); if(r.data.downloadUrl) window.open(r.data.downloadUrl,'_blank'); }catch{toast.error('Failed');} }}
                    style={{ fontFamily:F.label, fontSize:9, color:T.secondary, border:'none', background:'none', cursor:'pointer', flexShrink:0, paddingLeft:8, textTransform:'uppercase', letterSpacing:1 }}>Fetch</button>
                : <Link to={`/login?next=${encodeURIComponent(window.location.pathname)}`}
                    style={{ fontFamily:F.label, fontSize:9, color:'#f59e0b', flexShrink:0, paddingLeft:8 }}>Login</Link>
              }
            </div>
          ))}
        </div>
      )}

      {/* ── Comments button trigger ── */}
      <div style={{ marginTop: isMobile ? 20 : 32 }}>
        <button
          onClick={onCommentTrigger}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px', background: T.surfLow, border: `1px solid ${T.outlineV}18`,
            borderRadius: 16, cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = T.primary}
          onMouseLeave={e => e.currentTarget.style.borderColor = `${T.outlineV}18`}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: F.label, fontSize: 11, color: T.secondary, textTransform: 'uppercase', letterSpacing: 2 }}>
            <MessageSquare size={14} />
            <span>Intel Stream</span>
            <span style={{ background: T.surfHigh, borderRadius: 8, padding: '2px 8px', color: T.outline, fontSize: 10 }}>
              {comments.length}
            </span>
          </div>
          <span style={{ fontFamily: F.label, fontSize: 10, color: T.primary, textTransform: 'uppercase', letterSpacing: 1 }}>
            View Comments →
          </span>
        </button>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════
   DESKTOP SIDEBAR
══════════════════════════════════════════════ */
function DesktopSidebar({ post, clapped, clapCount, saved, onClap, onSave, onShare, copied }) {
  const { resolvedTheme } = useTheme();
  const baseT = resolvedTheme === 'dark' ? DARK : LIGHT;
  const T = {
    ...baseT,
    surfLowest: baseT.bg,
    surfLow:    baseT.bg2,
    surfHigh:   baseT.bg3,
    primary:    baseT.accent,
    primaryC:   baseT.accent,
    secondary:  baseT.accent2,
    accent:     baseT.gold || baseT.warning,
    outline:    resolvedTheme === 'dark' ? '#958da3' : '#64748b',
    outlineV:   resolvedTheme === 'dark' ? '#4a4457' : '#cbd5e1',
    onSurf:     baseT.txt,
    onSurfV:    baseT.txt2,
  };
  return (
    <aside style={{ width:300, flexShrink:0, position:'sticky', top:80, height:'fit-content', display:'flex', flexDirection:'column', gap:16 }}>

      {/* Action card */}
      <div style={{ background:T.surfLow, borderRadius:14, border:`1px solid ${T.outlineV}18`, padding:'18px 20px' }}>
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          <button onClick={onClap}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5, padding:'12px 0', borderRadius:10,
              background: clapped ? `${T.secondary}15` : T.surfHigh, border:`1px solid ${clapped ? T.secondary:T.outlineV}30`,
              cursor:'pointer', color: clapped ? T.secondary : T.outline, fontFamily:F.label, fontSize:10, transition:'all 0.2s' }}>
            <Hand size={18} fill={clapped?'currentColor':'none'} />
            <span>{clapCount}</span>
          </button>
          <button onClick={onSave}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5, padding:'12px 0', borderRadius:10,
              background: saved ? `${T.primary}15` : T.surfHigh, border:`1px solid ${saved ? T.primary:T.outlineV}30`,
              cursor:'pointer', color: saved ? T.primary:T.outline, fontFamily:F.label, fontSize:10, transition:'all 0.2s' }}>
            <Bookmark size={18} fill={saved?'currentColor':'none'} />
            <span>{saved?'Saved':'Save'}</span>
          </button>
          <button onClick={onShare}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5, padding:'12px 0', borderRadius:10,
              background: copied ? `${T.accent}15` : T.surfHigh, border:`1px solid ${copied?T.accent:T.outlineV}30`,
              cursor:'pointer', color: copied ? T.accent:T.outline, fontFamily:F.label, fontSize:10, transition:'all 0.2s' }}>
            <Share2 size={18} />
            <span>{copied?'Copied!':'Share'}</span>
          </button>
        </div>
      </div>

      {/* Author card */}
      <div style={{ background:T.surfLow, borderRadius:14, border:`1px solid ${T.outlineV}18`, padding:'18px 20px' }}>
        <p style={{ fontFamily:F.label, fontSize:9, color:T.primary, textTransform:'uppercase', letterSpacing:2.5, marginBottom:14 }}>Architect</p>
        <Link to={`/u/${post.creator_username}`} style={{ display:'flex', gap:12, alignItems:'center', textDecoration:'none', marginBottom:12 }}>
          <Avatar src={post.creator_avatar} name={post.creator_username} size={46} style={{ border:`2px solid ${T.primary}30`, flexShrink:0 }} />
          <div>
            <div style={{ fontFamily:F.headline, fontWeight:700, fontSize:14, color: resolvedTheme === 'dark' ? '#fff' : T.txt }}>{post.creator_name || `@${post.creator_username}`}</div>
            <div style={{ fontFamily:F.label, fontSize:10, color:T.secondary, letterSpacing:1, textTransform:'uppercase', marginTop:2 }}>@{post.creator_username}</div>
          </div>
        </Link>
        {post.creator_bio && <p style={{ fontFamily:F.body, fontSize:12, color:T.outline, lineHeight:1.6, margin:'0 0 14px' }}>{post.creator_bio}</p>}
        <Link to={`/u/${post.creator_username}`}
          style={{ display:'block', padding:'9px', background:`${T.primary}08`, border:`1px solid ${T.primary}20`, borderRadius:8, fontFamily:F.label, fontSize:9, color:T.primary, textTransform:'uppercase', letterSpacing:2, textAlign:'center', textDecoration:'none' }}>
          View Profile →
        </Link>
      </div>
    </aside>
  );
}

/* ══════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════ */
export default function PostDetail({ overrideId } = {}) {
  const params   = useParams();
  const id       = overrideId || params.id;
  const { user } = useAuth();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const baseT = resolvedTheme === 'dark' ? DARK : LIGHT;
  const T = {
    ...baseT,
    surfLowest: baseT.bg,
    surfLow:    baseT.bg2,
    surfHigh:   baseT.bg3,
    primary:    baseT.accent,
    primaryC:   baseT.accent,
    secondary:  baseT.accent2,
    accent:     baseT.gold || baseT.warning,
    outline:    resolvedTheme === 'dark' ? '#958da3' : '#64748b',
    outlineV:   resolvedTheme === 'dark' ? '#4a4457' : '#cbd5e1',
    onSurf:     baseT.txt,
    onSurfV:    baseT.txt2,
  };

  const [post,    setPost]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [clapped, setClapped] = useState(false);
  const [clapCount,setClapCount] = useState(0);
  const [saved,   setSaved]   = useState(false);
  const [copied,  setCopied]  = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 899px)');

  useEffect(() => {
    setLoading(true);
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
    const endpoint = isUuid ? `/posts/${id}` : `/posts/slug/${id}`;
    api.get(endpoint)
      .then(r => {
        const p = r.data.post;
        setPost(p);
        setClapped(p.is_clapped || false);
        setClapCount(parseInt(p.clap_count) || 0);
        setSaved(p.is_saved || false);
      }).catch(() => setPost(null))
        .finally(() => setLoading(false));
  }, [id]);

  const handleClap = async () => {
    if (!user) {
      toast.error('Please sign in to clap!');
      return;
    }
    if (!post) return;
    const was = clapped; setClapped(!was); setClapCount(was ? clapCount-1 : clapCount+1);
    try { if (was) await api.delete(`/posts/${post.id}/clap`); else await api.post(`/posts/${post.id}/clap`); }
    catch { setClapped(was); setClapCount(clapCount); }
  };
  const handleSave = async () => {
    if (!user) {
      toast.error('Please sign in to save posts!');
      return;
    }
    if (!post) return;
    const was = saved; setSaved(!was);
    try { if (was) await api.delete(`/saved/${post.id}`); else await api.post(`/saved/${post.id}`); }
    catch { setSaved(was); }
  };
  const handleShare = () => {
    setShareOpen(true);
  };

  /* ─── LOADING ─── */
  if (loading) return (
    <div style={{ background:T.bg, minHeight:'100vh', padding:'72px 16px 120px' }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}><PostCardSkeleton /><PostCardSkeleton /></div>
    </div>
  );

  /* ─── 404 / REMOVED ─── */
  if (!post || ['removed', 'temporarily_removed', 'taken_down', 'suspended'].includes((post.moderation_status || '').toLowerCase()) || post.status === 'archived') {
    return <RemovedContentPage title="Post Removed" message="This post was removed or taken down for violating community guidelines." backUrl="/feed" />;
  }

  if (post.type === 'post') {
    return (
      <>
        <Helmet>
          <title>{post.title || 'Social Post'} — Code+ Academy</title>
          <meta name="description" content={post.description} />
          <meta property="og:title" content={post.title || 'Social Post'} />
        </Helmet>
        <SocialPostLayout post={{ ...post, is_clapped: clapped, clap_count: clapCount, is_saved: saved }} isMobile={isMobile} />
        {isMobile && <MobileBottomNav />}
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{post.title} — Code+ Academy</title>
        <meta name="description" content={post.description} />
        <meta property="og:title" content={post.title} />
      </Helmet>

      {/* ═══════════════════════════════════════
          TOP NAV BAR (shared)
      ═══════════════════════════════════════ */}
      <div style={{
        position:'sticky', top:64, zIndex:40,
        background:`${T.bg}f0`, backdropFilter:'blur(20px)',
        borderBottom:`1px solid ${T.outlineV}15`,
        display:'flex', alignItems:'center', gap:8,
        padding:'0 12px', height:46, overflow:'hidden',
      }}>
        <button onClick={() => navigate(-1)}
          style={{ display:'flex', alignItems:'center', justifyContent:'center', width:30, height:30, borderRadius:7, background:T.surfHigh, border:'none', cursor:'pointer', color:T.outline, flexShrink:0 }}>
          <ArrowLeft size={14} />
        </button>
        <div style={{ width:1, height:16, background:`${T.outlineV}35`, flexShrink:0 }} />
        {/* Breadcrumb — truncated on mobile */}
        <span style={{ fontFamily:F.label, fontSize:9, color:T.outline, textTransform:'uppercase', letterSpacing:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, minWidth:0 }}>
          {post.type || 'Post'}
        </span>

        {/* Single action group — label text hidden on mobile via CSS */}
        <div style={{ display:'flex', gap:6, flexShrink:0 }}>
          <button onClick={handleShare}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, height:30, padding:'0 10px', borderRadius:8, background: copied?`${T.accent}18`:T.surfHigh, border:`1px solid ${copied?T.accent:T.outlineV}28`, cursor:'pointer', color: copied?T.accent:T.outline, fontFamily:F.label, fontSize:9, whiteSpace:'nowrap' }}>
            <Share2 size={12} /><span className="pd-nav-label">{copied?'Copied!':'Share'}</span>
          </button>
          <button onClick={handleSave}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, height:30, padding:'0 10px', borderRadius:8, background: saved?`${T.primary}15`:T.surfHigh, border:`1px solid ${saved?T.primary:T.outlineV}28`, cursor:'pointer', color: saved?T.primary:T.outline, fontFamily:F.label, fontSize:9, whiteSpace:'nowrap' }}>
            <Bookmark size={12} fill={saved?'currentColor':'none'} /><span className="pd-nav-label">{saved?'Saved':'Save'}</span>
          </button>
        </div>

      </div>

      {/* ═══════════════════════════════════════
          HERO (full-width, responsive height)
      ═══════════════════════════════════════ */}
      {post.thumbnail_url && (
        <div style={{ position:'relative', width:'100%', aspectRatio:'21/9', overflow:'hidden', maxHeight:280 }}>
          <img src={post.thumbnail_url} alt={post.title}
            style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.7)' }} />
          <div style={{ position:'absolute', inset:0, background:`linear-gradient(to top, ${T.bg} 0%, ${T.bg}70 20%, transparent 65%)` }} />
        </div>
      )}

      {/* ─── LAYOUT SHELL ─── */}
      <div style={{ maxWidth:1100, margin:'0 auto' }} className="pd-layout">
        {/* MAIN CONTENT */}
        <div className="pd-main">
          <PostContent 
            post={{ ...post, is_clapped:clapped, clap_count:clapCount, is_saved:saved }} 
            isMobile={isMobile} 
            onCommentTrigger={() => setIsCommentsOpen(true)}
          />
        </div>

        {/* DESKTOP SIDEBAR */}
        <div className="pd-sidebar">
          <DesktopSidebar
            post={post}
            clapped={clapped} clapCount={clapCount}
            saved={saved} copied={copied}
            onClap={handleClap} onSave={handleSave} onShare={handleShare}
          />
        </div>
      </div>

      {/* ─── MOBILE FIXED BOTTOM ACTION BAR ─── */}
      <div className="pd-bottom-bar" style={{
        position:'fixed',
        bottom: user ? 'calc(80px + env(safe-area-inset-bottom))' : '0px',
        left:0, right:0, zIndex:50,
        background:`${T.bg}f4`, backdropFilter:'blur(20px)',
        borderTop:`1px solid ${T.outlineV}18`,
        padding:'8px 14px',
        alignItems:'center', gap:8,
      }}>
        <button onClick={handleClap} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, height:40, borderRadius:10, cursor:'pointer', background:clapped?`${T.secondary}18`:T.surfHigh, border:`1px solid ${clapped?T.secondary:T.outlineV}28`, color:clapped?T.secondary:T.outline, fontFamily:F.label, fontSize:10, transition:'all 0.2s' }}>
          <Hand size={15} fill={clapped?'currentColor':'none'} />{clapCount}
        </button>
        <button 
          onClick={() => setIsCommentsOpen(true)}
          style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, height:40, borderRadius:10, cursor:'pointer', background:T.surfHigh, border:`1px solid ${T.outlineV}28`, color:T.outline, fontFamily:F.label, fontSize:10 }}
        >
          <MessageSquare size={15} />
        </button>
        <button onClick={handleSave} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, height:40, borderRadius:10, cursor:'pointer', background:saved?`${T.primary}18`:T.surfHigh, border:`1px solid ${saved?T.primary:T.outlineV}28`, color:saved?T.primary:T.outline, fontFamily:F.label, fontSize:10, transition:'all 0.2s' }}>
          <Bookmark size={15} fill={saved?'currentColor':'none'} />
        </button>
        <button onClick={handleShare} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, height:40, borderRadius:10, cursor:'pointer', background:copied?`${T.accent}18`:T.surfHigh, border:`1px solid ${copied?T.accent:T.outlineV}28`, color:copied?T.accent:T.outline, fontFamily:F.label, fontSize:10, transition:'all 0.2s' }}>
          <Share2 size={15} />
        </button>
      </div>

      <CommentSheet
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        entityId={post.id}
        entityType="post"
        user={user}
      />

      <ShareSheet
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        contentType={post.type || 'post'}
        contentId={post.id}
        contentTitle={post.title || post.caption || post.description || ''}
        contentThumbnail={post.thumbnail_url || null}
        contentAuthor={post.creator_name || post.creator_username || ''}
      />

      <MobileBottomNav />

      <style>{`
        /* ── Layout switching ── */
        .pd-layout  { display: flex; flex-direction: column; padding: 20px 16px 180px; }
        .pd-main    { width: 100%; }
        .pd-sidebar { display: none !important; }

        /* Mobile: hide nav button labels (icon-only) */
        .pd-nav-label { display: none !important; }

        /* Mobile bottom bar — display controlled by CSS only (no inline display) */
        .pd-bottom-bar { display: flex !important; }

        @media (min-width: 900px) {
          .pd-layout   { flex-direction: row !important; align-items: flex-start !important; gap: 32px !important; padding: 28px 32px 60px !important; }
          .pd-main     { flex: 1 !important; min-width: 0 !important; }
          .pd-sidebar  { display: block !important; }
          /* Desktop: show labels, HIDE bottom bar */
          .pd-nav-label  { display: inline !important; }
          .pd-bottom-bar { display: none !important; }
        }
      `}</style>
    </>
  );
}
