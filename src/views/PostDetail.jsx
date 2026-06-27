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

import { useTheme } from '../context/ThemeContext';
import { DARK, LIGHT } from '../styles/tokens';

/* ─── Design Tokens (Centralized) ─── */
const F = {
  headline: '"Space Grotesk","Syne",sans-serif',
  body:     '"Outfit",sans-serif',
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
function PostContent({ post, isMobile }) {
  const { resolvedTheme } = useTheme();
  const T = resolvedTheme === 'dark' ? DARK : LIGHT;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clapped,    setClapped]    = useState(post.is_clapped || false);
  const [clapCount,  setClapCount]  = useState(parseInt(post.clap_count) || 0);
  const [saved,      setSaved]      = useState(post.is_saved || false);
  const [copied,     setCopied]     = useState(false);
  const [comments,   setComments]   = useState([]);
  const [newComment, setNewComment] = useState('');
  const [cmtOpen,    setCmtOpen]    = useState(false);
  const [cmtLoading, setCmtLoading] = useState(false);
  const commentRef = useRef(null);
  const id = post.id;

  useEffect(() => {
    api.get(`/posts/${id}/comments`)
      .then(r => setComments(r.data.comments || []))
      .catch(() => {});
  }, [id]);

  const handleClap = async () => {
    if (!user) return;
    const was = clapped; setClapped(!was); setClapCount(was ? clapCount-1 : clapCount+1);
    try { if (was) await api.delete(`/posts/${id}/clap`); else await api.post(`/posts/${id}/clap`); }
    catch { setClapped(was); setClapCount(clapCount); }
  };
  const handleSave = async () => {
    if (!user) return;
    const was = saved; setSaved(!was);
    try { if (was) await api.delete(`/saved/${id}`); else await api.post(`/saved/${id}`); }
    catch { setSaved(was); }
  };
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true); toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };
  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user || cmtLoading) return;
    setCmtLoading(true);
    try {
      const res = await api.post(`/posts/${id}/comments`, { body: newComment });
      setComments(p => [res.data.comment, ...p]); setNewComment('');
    } catch { toast.error('Failed'); } finally { setCmtLoading(false); }
  };

  const isOwn = user?.username === post.creator_username;

  return (
    <>
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
        color:'#fff', lineHeight:1.2, letterSpacing: -0.5,
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
          <div style={{ fontFamily:F.headline, fontWeight:700, fontSize: isMobile ? 12 : 14, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {post.creator_name || `@${post.creator_username}`}
          </div>
          <div style={{ fontFamily:F.label, fontSize: isMobile ? 9 : 10, color:T.secondary, letterSpacing:1, textTransform:'uppercase' }}>
            @{post.creator_username}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:4, fontFamily:F.label, fontSize: isMobile?9:10, color:T.outlineV, flexShrink:0 }}>
          <Clock size={10} />{timeAgo(post.created_at)}
        </div>
      </Link>

      {/* ── Description ── */}
      {post.description && (
        <div style={{ borderLeft:`3px solid ${T.primary}`, paddingLeft:14,
          marginBottom: isMobile ? 14 : 22 }}>
          <p style={{ fontFamily:F.body, fontSize: isMobile ? 13 : 15, color:T.onSurfV, lineHeight:1.7, margin:0 }}>
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

      {/* ── Comments ── */}
      <div style={{ marginTop: isMobile ? 20 : 32 }}>
        {/* Toggle header (mobile = accordion, desktop = always shown) */}
        {isMobile ? (
          <button onClick={() => setCmtOpen(v=>!v)}
            style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'11px 14px', background:T.surfLow, border:`1px solid ${T.outlineV}18`,
              borderRadius: cmtOpen ? '10px 10px 0 0' : 10, cursor:'pointer',
              fontFamily:F.label, fontSize:9, color:T.secondary, textTransform:'uppercase', letterSpacing:2 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <MessageSquare size={13} />Intel Stream
              <span style={{ background:T.surfHigh, borderRadius:8, padding:'1px 7px', color:T.outline }}>{comments.length}</span>
            </div>
            {cmtOpen ? <ChevronUp size={13} color={T.outlineV}/> : <ChevronDown size={13} color={T.outlineV}/>}
          </button>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
            <MessageSquare size={15} color={T.secondary} />
            <span style={{ fontFamily:F.label, fontSize:10, color:T.secondary, textTransform:'uppercase', letterSpacing:2 }}>Intel Stream</span>
            <span style={{ fontFamily:F.label, fontSize:10, color:T.outlineV, background:T.surfHigh, padding:'2px 8px', borderRadius:10 }}>{comments.length}</span>
          </div>
        )}

        {/* Comment list */}
        {(!isMobile || cmtOpen) && (
          <div style={{ background: isMobile ? T.surfLowest : 'transparent', border: isMobile ? `1px solid ${T.outlineV}18`:'none', borderTop:'none', borderRadius: isMobile ? '0 0 10px 10px':0, padding: isMobile ? '12px 12px':0 }}>
            {/* Input */}
            {user ? (
              <form onSubmit={handleComment} style={{ display:'flex', gap:8, alignItems:'flex-end', marginBottom:16 }}>
                <Avatar src={user.avatar_url} name={user.username} size={28} style={{ flexShrink:0, marginBottom:3 }} />
                <div style={{ flex:1, background:T.surfHigh, border:`1px solid ${T.outlineV}25`, borderRadius:10, padding:'8px 12px', display:'flex', gap:8, alignItems:'flex-end' }}>
                  <textarea
                    ref={commentRef}
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Add to the stream..."
                    rows={1}
                    style={{ flex:1, background:'transparent', border:'none', outline:'none', fontFamily:F.body, fontSize:12, color:T.onSurf, resize:'none', lineHeight:1.5, maxHeight:70, overflow:'auto' }}
                    onInput={e => { e.target.style.height='auto'; e.target.style.height=`${e.target.scrollHeight}px`; }}
                  />
                  <button type="submit" disabled={!newComment.trim() || cmtLoading}
                    style={{ flexShrink:0, width:28, height:28, borderRadius:7, border:'none', cursor:'pointer',
                      background: newComment.trim() ? `linear-gradient(135deg,${T.secondary},${T.primaryC})`  : T.surfHigh,
                      color: newComment.trim() ? '#fff':T.outlineV,
                      display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}>
                    <Send size={12} />
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ textAlign:'center', padding:'14px 0 8px', marginBottom:12 }}>
                <Link to={`/login?next=${encodeURIComponent(window.location.pathname)}`}
                  style={{ fontFamily:F.label, fontSize:10, color:T.secondary, textTransform:'uppercase', letterSpacing:2 }}>Login to comment →</Link>
              </div>
            )}

            {/* Comments list */}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {comments.length === 0
                ? <p style={{ fontFamily:F.label, fontSize:9, color:T.outlineV, textTransform:'uppercase', letterSpacing:2, textAlign:'center', padding:'10px 0' }}>No logs yet</p>
                : comments.map(c => (
                  <div key={c.id} style={{ display:'flex', gap:9 }}>
                    <Avatar src={c.user?.avatar_url} name={c.user?.username} size={26} style={{ flexShrink:0, marginTop:2, border:`1px solid ${T.outlineV}25` }} />
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'baseline', gap:7, marginBottom:5 }}>
                        <Link to={`/u/${c.user?.username}`} style={{ fontFamily:F.headline, fontWeight:700, fontSize:11, color:T.primary, textDecoration:'none' }}>@{c.user?.username}</Link>
                        <span style={{ fontFamily:F.label, fontSize:9, color:T.outlineV }}>{timeAgo(c.created_at)}</span>
                      </div>
                      <div style={{ background:T.surfHigh, border:`1px solid ${T.outlineV}12`, borderRadius:'3px 9px 9px 9px', padding:'8px 12px' }}>
                        <p style={{ fontFamily:F.body, fontSize:12, color:T.onSurfV, margin:0, lineHeight:1.55 }}>{c.body}</p>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════
   DESKTOP SIDEBAR
══════════════════════════════════════════════ */
function DesktopSidebar({ post, clapped, clapCount, saved, onClap, onSave, onShare, copied }) {
  const { resolvedTheme } = useTheme();
  const T = resolvedTheme === 'dark' ? DARK : LIGHT;
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
            <div style={{ fontFamily:F.headline, fontWeight:700, fontSize:14, color:'#fff' }}>{post.creator_name || `@${post.creator_username}`}</div>
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
  const T = resolvedTheme === 'dark' ? DARK : LIGHT;

  const [post,    setPost]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [clapped, setClapped] = useState(false);
  const [clapCount,setClapCount] = useState(0);
  const [saved,   setSaved]   = useState(false);
  const [copied,  setCopied]  = useState(false);
  const isMobile = useMediaQuery('(max-width: 899px)');

  useEffect(() => {
    setLoading(true);
    api.get(`/posts/${id}`)
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
    if (!user) return;
    const was = clapped; setClapped(!was); setClapCount(was ? clapCount-1:clapCount+1);
    try { if (was) await api.delete(`/posts/${id}/clap`); else await api.post(`/posts/${id}/clap`); }
    catch { setClapped(was); setClapCount(clapCount); }
  };
  const handleSave = async () => {
    if (!user) return;
    const was = saved; setSaved(!was);
    try { if (was) await api.delete(`/saved/${id}`); else await api.post(`/saved/${id}`); }
    catch { setSaved(was); }
  };
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true); toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  /* ─── LOADING ─── */
  if (loading) return (
    <div style={{ background:T.bg, minHeight:'100vh', padding:'72px 16px 120px' }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}><PostCardSkeleton /><PostCardSkeleton /></div>
    </div>
  );

  /* ─── 404 ─── */
  if (!post) return (
    <div style={{ background:T.bg, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ maxWidth:400, width:'100%', background:T.surface, borderRadius:18, padding:'36px 28px', textAlign:'center', border:`1px solid ${T.outlineV}25` }}>
        <div style={{ fontFamily:F.label, fontSize:9, color:T.secondary, letterSpacing:3, textTransform:'uppercase', marginBottom:10 }}>ERROR_404</div>
        <h2 style={{ fontFamily:F.headline, fontWeight:800, fontSize:20, color:'#fff', marginBottom:8 }}>Not Found</h2>
        <p style={{ fontFamily:F.body, fontSize:13, color:T.outline, lineHeight:1.6, marginBottom:20 }}>Post not found or access denied.</p>
        <Link to="/feed" style={{ display:'inline-block', padding:'10px 24px', background:`linear-gradient(135deg,${T.primary},${T.primaryC})`, color:'#fff', borderRadius:8, fontFamily:F.label, fontSize:9, textTransform:'uppercase', letterSpacing:2, textDecoration:'none' }}>Feed</Link>
      </div>
    </div>
  );

  if (post.type === 'post') {
    return (
      <>
        <Helmet>
          <title>{post.title || 'Social Post'} — Code+ Academy</title>
          <meta name="description" content={post.description} />
          <meta property="og:title" content={post.title || 'Social Post'} />
        </Helmet>
        <SocialPostLayout post={{ ...post, is_clapped: clapped, clap_count: clapCount, is_saved: saved }} isMobile={isMobile} />
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
        <span style={{ fontFamily:F.label, fontSize:9, color:T.outlineV, textTransform:'uppercase', letterSpacing:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, minWidth:0 }}>
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

      {/* ═══════════════════════════════════════
          LAYOUT SHELL
          Mobile: single col | Desktop: content + sidebar
      ═══════════════════════════════════════ */}
      <div style={{ maxWidth:1100, margin:'0 auto' }} className="pd-layout">
        {/* MAIN CONTENT */}
        <div className="pd-main">
          <PostContent post={{ ...post, is_clapped:clapped, clap_count:clapCount, is_saved:saved }} isMobile={false} />
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

      {/* ═══════════════════════════════════════
          MOBILE FIXED BOTTOM ACTION BAR
      ═══════════════════════════════════════ */}
      <div className="pd-bottom-bar" style={{
        position:'fixed', bottom:56, left:0, right:0, zIndex:50,
        background:`${T.bg}f4`, backdropFilter:'blur(20px)',
        borderTop:`1px solid ${T.outlineV}18`,
        padding:'8px 14px',
        alignItems:'center', gap:8,
      }}>
        <button onClick={handleClap} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, height:40, borderRadius:10, cursor:'pointer', background:clapped?`${T.secondary}18`:T.surfHigh, border:`1px solid ${clapped?T.secondary:T.outlineV}28`, color:clapped?T.secondary:T.outline, fontFamily:F.label, fontSize:10, transition:'all 0.2s' }}>
          <Hand size={15} fill={clapped?'currentColor':'none'} />{clapCount}
        </button>
        <button style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, height:40, borderRadius:10, cursor:'pointer', background:T.surfHigh, border:`1px solid ${T.outlineV}28`, color:T.outline, fontFamily:F.label, fontSize:10 }}>
          <MessageSquare size={15} />
        </button>
        <button onClick={handleSave} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, height:40, borderRadius:10, cursor:'pointer', background:saved?`${T.primary}18`:T.surfHigh, border:`1px solid ${saved?T.primary:T.outlineV}28`, color:saved?T.primary:T.outline, fontFamily:F.label, fontSize:10, transition:'all 0.2s' }}>
          <Bookmark size={15} fill={saved?'currentColor':'none'} />
        </button>
        <button onClick={handleShare} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, height:40, borderRadius:10, cursor:'pointer', background:copied?`${T.accent}18`:T.surfHigh, border:`1px solid ${copied?T.accent:T.outlineV}28`, color:copied?T.accent:T.outline, fontFamily:F.label, fontSize:10, transition:'all 0.2s' }}>
          <Share2 size={15} />
        </button>
      </div>

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
