import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, Bookmark, Send, ArrowLeft, Clock } from 'lucide-react';
import ContentActionMenu from '../ui/ContentActionMenu';
import ClapIcon from '../icons/ClapIcon';
import Avatar from '../ui/Avatar';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useSaveToContainer } from '../../context/SaveToContainerContext';
import { MediaCarousel } from './PostCard';
import CodeSnippetCard, { extractCodeBlock } from './CodeSnippetCard';
import toast from 'react-hot-toast';
import CommentSheet from '../ui/CommentSheet';
import ShareSheet from '../ui/ShareSheet';

import { useTheme } from '../../context/ThemeContext';
import { DARK, LIGHT } from '../../styles/tokens';

const F = {
  headline: '"Space Grotesk","Clash Display",sans-serif',
  body: '"Geist",sans-serif',
  label: '"JetBrains Mono",monospace',
};

function timeAgo(date) {
  const diff = Date.now() - new Date(date);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return `${Math.floor(d / 30)}w`;
}

export default function SocialPostLayout({ post, isMobile }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const baseT = resolvedTheme === 'dark' ? DARK : LIGHT;
  const T = {
    bg:       baseT.bg,
    surface:  baseT.bg2,
    surfHigh: baseT.bg3,
    primary:  baseT.accent,
    primaryC: baseT.accent,
    secondary:baseT.accent2,
    accent:   baseT.gold || baseT.warning,
    outline:  resolvedTheme === 'dark' ? '#958da3' : '#64748b',
    outlineV: resolvedTheme === 'dark' ? '#4a4457' : '#cbd5e1',
    onSurf:   baseT.txt,
    onSurfV:  baseT.txt2,
  };

  const { openSaveToContainer } = useSaveToContainer();
  const [clapped, setClapped] = useState(post.is_clapped || false);
  const [clapCount, setClapCount] = useState(parseInt(post.clap_count) || 0);
  const [saved, setSaved] = useState(post.is_saved || false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [cmtLoading, setCmtLoading] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const id = post.id;

  useEffect(() => {
    api.get(`/posts/${id}/comments`)
      .then(r => setComments(r.data.comments || []))
      .catch(() => {});
  }, [id]);

  const handleClap = async () => {
    if (!user) {
      toast.error('Please sign in to like!');
      return;
    }
    const was = clapped; setClapped(!was); setClapCount(was ? clapCount - 1 : clapCount + 1);
    try { if (was) await api.delete(`/posts/${id}/clap`); else await api.post(`/posts/${id}/clap`); }
    catch { setClapped(was); setClapCount(clapCount); }
  };

  const handleSave = () => {
    if (!user) {
      toast.error('Please sign in to save!');
      return;
    }
    setSaved(true);
    openSaveToContainer({
      id: post.id || id,
      title: post.title || post.caption || post.description || 'Community Post',
      type: 'post',
      item_kind: 'post',
      thumbnail_url: post.thumbnail_url || post.files?.[0]?.storage_url || null,
      creator_name: post.creator_name || post.creator_username,
    });
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user || cmtLoading) return;
    setCmtLoading(true);
    try {
      const res = await api.post(`/posts/${id}/comments`, { body: newComment });
      setComments(p => [res.data.comment, ...p]);
      setNewComment('');
    } catch { } // toast.error wouldn't hurt but let's keep it clean
    finally { setCmtLoading(false); }
  };

  const rawMedia = (post.media && post.media.length > 0)
    ? post.media
    : (post.files && post.files.length > 0)
      ? post.files
      : (post.thumbnail_url ? [{ storage_url: post.thumbnail_url, file_type: 'image/jpeg' }] : []);

  const normalizedFiles = rawMedia.map((m) => {
    const src = m.media_url || m.storage_url || m.url || (typeof m === 'string' ? m : '');
    const isVid = m.media_type === 'video' ||
      m.file_type?.startsWith('video/') ||
      /\.(mp4|mov|webm|mkv|m3u8)/i.test(src);
    return {
      storage_url: src,
      url: src,
      media_url: src,
      file_type: isVid ? 'video/mp4' : (m.media_type || m.file_type || 'image/jpeg'),
      media_type: isVid ? 'video' : 'image',
      aspect_ratio: m.aspect_ratio || post.aspect_ratio || '1:1',
    };
  }).filter((f) => Boolean(f.storage_url));

  const hasMedia = normalizedFiles.length > 0;

  // Single-column mobile layout
  if (isMobile) {
    return (
      <div style={{ paddingBottom: user ? 160 : 80 }}>
        {/* Mobile top nav */}
        <div style={{ position: 'sticky', top: 0, zIndex: 40, background: T.bg, borderBottom: `1px solid ${T.outlineV}35`, display: 'flex', alignItems: 'center', height: 50, padding: '0 16px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: resolvedTheme === 'dark' ? '#fff' : T.onSurf, padding: 0 }}>
            <ArrowLeft size={24} />
          </button>
          <span style={{ fontFamily: F.headline, fontWeight: 700, fontSize: 16, color: resolvedTheme === 'dark' ? '#fff' : T.onSurf, marginLeft: 16 }}>Posts</span>
        </div>

        {/* Header */}
        {(() => {
          const s = (post?.moderation_status || post?.status || '').toLowerCase();
          if (s === 'under_review') return <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', padding: '8px 12px', fontSize: 12, fontWeight: 600, margin: '8px 14px', borderRadius: 6 }}>⚠️ Under Review: Flagged for compliance review.</div>;
          if (s === 'removed') return <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '8px 12px', fontSize: 12, fontWeight: 600, margin: '8px 14px', borderRadius: 6 }}>⛔ Content Removed: Removed for policy violations.</div>;
          return null;
        })()}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px' }}>
          <Link to={`/u/${post.creator_username}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <Avatar src={post.creator_avatar} name={post.creator_username} size={36} />
            <div>
              <div style={{ fontFamily: F.headline, fontWeight: 700, fontSize: 14, color: resolvedTheme === 'dark' ? '#fff' : T.onSurf }}>{post.creator_username}</div>
              <div style={{ fontFamily: F.label, fontSize: 10, color: T.outline }}>{timeAgo(post.created_at)}</div>
            </div>
          </Link>
          <ContentActionMenu
            contentId={post.id}
            contentType="post"
            contentAuthorId={post.creator_id || post.creator_user_id || post.user_id}
            creatorUsername={post.creator_username}
            title={post.title}
            contentUrl={typeof window !== 'undefined' ? `${window.location.origin}/posts/${post.id}` : undefined}
            onSave={handleSave}
            isSaved={saved}
            onShare={() => setShareOpen(true)}
            sourceSurface="post_detail"
          />
        </div>

        {/* Media */}
        {hasMedia && <MediaCarousel files={normalizedFiles} aspectRatio={post.aspect_ratio || '1:1'} />}

        {/* Actions */}
        <div style={{ padding: '12px 14px 8px', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div onClick={handleClap} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
              <ClapIcon size={25} color={clapped ? '#ef4444' : (resolvedTheme === 'dark' ? '#fff' : T.onSurf)} filled={clapped} />
            </div>
            <MessageCircle size={24} color={resolvedTheme === 'dark' ? '#fff' : T.onSurf} onClick={() => setIsCommentsOpen(true)} style={{ cursor: 'pointer' }} />
            <Send size={24} color={resolvedTheme === 'dark' ? '#fff' : T.onSurf} onClick={() => setShareOpen(true)} style={{ cursor: 'pointer' }} />
          </div>
          <Bookmark size={24} color={saved ? T.primary : (resolvedTheme === 'dark' ? '#fff' : T.onSurf)} fill={saved ? T.primary : 'none'} onClick={handleSave} style={{ cursor: 'pointer' }} />
        </div>
        <div style={{ padding: '0 14px 8px', fontFamily: F.headline, fontWeight: 700, fontSize: 14, color: resolvedTheme === 'dark' ? '#fff' : T.onSurf }}>
          {clapCount} likes
        </div>

        {/* Caption */}
        <div style={{ padding: '0 14px 12px' }}>
          {(() => {
            const raw = post.description || post.caption || post.content || post.title || '';
            const { beforeText, codeSnippet, afterText } = extractCodeBlock(raw);
            const finalCode = post.code_snippet ? { code: post.code_snippet, language: post.code_language || 'typescript', title: post.code_title } : codeSnippet;
            return (
              <>
                <div style={{ marginBottom: finalCode ? 8 : 0 }}>
                  <span style={{ fontFamily: F.headline, fontWeight: 700, fontSize: 14, color: resolvedTheme === 'dark' ? '#fff' : T.onSurf, marginRight: 8 }}>{post.creator_username}</span>
                  <span style={{ fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif", fontSize: 14, color: resolvedTheme === 'dark' ? '#fff' : T.onSurf, lineHeight: 1.4 }}>{codeSnippet ? beforeText : raw}</span>
                </div>
                {finalCode && (
                  <CodeSnippetCard
                    code={finalCode.code}
                    language={finalCode.language}
                    title={finalCode.title}
                  />
                )}
                {codeSnippet && afterText && (
                  <div style={{ fontSize: 14, color: resolvedTheme === 'dark' ? '#fff' : T.onSurf, lineHeight: 1.4, marginTop: 8 }}>
                    {afterText}
                  </div>
                )}
              </>
            );
          })()}
          {comments.length > 0 && (
            <button 
              onClick={() => setIsCommentsOpen(true)}
              style={{ background: 'none', border: 'none', color: T.outline, fontSize: 13, cursor: 'pointer', display: 'block', marginTop: 6, padding: 0 }}
            >
              View all {comments.length} comments
            </button>
          )}
        </div>

        <div style={{ height: 1, background: `${T.outlineV}20`, margin: '0 14px 16px' }} />

        {/* Comments section is now modal/sheet based on mobile */}
      </div>
    );
  }

  // Two-column desktop layout (Instagram Style)
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', background: T.bg, position: 'relative' }}>
      
      {/* Close Button */}
      <button onClick={() => navigate(-1)} style={{ position: 'absolute', top: 24, right: 24, width: 40, height: 40, borderRadius: '50%', background: T.surfHigh, border: 'none', color: resolvedTheme === 'dark' ? '#fff' : T.onSurf, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
        <ArrowLeft size={20} />
      </button>

      {/* Container */}
      <div style={{ display: 'flex', width: '100%', maxWidth: 1000, height: 'min(calc(100vh - 120px), 850px)', background: '#000', border: `1px solid ${T.outlineV}35`, borderRadius: 4, overflow: 'hidden' }}>
        
        {/* Left: Media (Fit to container bounds) */}
        <div style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', borderRight: `1px solid ${T.outlineV}35`, overflow: 'hidden', position: 'relative' }}>
          {hasMedia ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MediaCarousel files={normalizedFiles} aspectRatio={post.aspect_ratio || '1:1'} />
            </div>
          ) : (
            <div style={{ color: T.outline, fontFamily: F.label, fontSize: 12 }}>No Media</div>
          )}
        </div>

        {/* Right: Sidebar */}
        <div style={{ width: 400, flexShrink: 0, display: 'flex', flexDirection: 'column', background: T.bg }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: `1px solid ${T.outlineV}35` }}>
             <Link to={`/u/${post.creator_username}`} style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none' }}>
               <Avatar src={post.creator_avatar} name={post.creator_username} size={36} />
               <span style={{ fontFamily: F.headline, fontWeight: 700, fontSize: 15, color: resolvedTheme === 'dark' ? '#fff' : T.onSurf }}>{post.creator_username}</span>
             </Link>
             <ContentActionMenu
               contentId={post.id}
               contentType="post"
               contentAuthorId={post.creator_id || post.creator_user_id || post.user_id}
               creatorUsername={post.creator_username}
               title={post.title}
               contentUrl={typeof window !== 'undefined' ? `${window.location.origin}/posts/${post.id}` : undefined}
               onSave={handleSave}
               isSaved={saved}
               onShare={() => setShareOpen(true)}
               sourceSurface="post_detail"
             />
          </div>

          {/* Comments Area (Scrollable) */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Caption (Looks like a comment) */}
            <div style={{ display: 'flex', gap: 14 }}>
              <Link to={`/u/${post.creator_username}`} style={{ flexShrink: 0 }}><Avatar src={post.creator_avatar} name={post.creator_username} size={36} /></Link>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontFamily: F.headline, fontWeight: 700, fontSize: 15, color: resolvedTheme === 'dark' ? '#fff' : T.onSurf, marginRight: 8 }}>{post.creator_username}</span>
                {(() => {
                  const raw = post.description || post.caption || post.content || post.title || '';
                  const { beforeText, codeSnippet, afterText } = extractCodeBlock(raw);
                  const finalCode = post.code_snippet ? { code: post.code_snippet, language: post.code_language || 'typescript', title: post.code_title } : codeSnippet;
                  return (
                    <>
                      <span style={{ fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif", fontSize: 15, color: resolvedTheme === 'dark' ? '#e5e7eb' : T.onSurf, lineHeight: 1.5, wordBreak: 'break-word' }}>
                        {codeSnippet ? beforeText : raw}
                      </span>
                      {finalCode && (
                        <div style={{ marginTop: 8 }}>
                          <CodeSnippetCard
                            code={finalCode.code}
                            language={finalCode.language}
                            title={finalCode.title}
                          />
                        </div>
                      )}
                      {codeSnippet && afterText && (
                        <div style={{ fontSize: 14, color: resolvedTheme === 'dark' ? '#e5e7eb' : T.onSurf, lineHeight: 1.5, marginTop: 8 }}>
                          {afterText}
                        </div>
                      )}
                    </>
                  );
                })()}
                <div style={{ fontFamily: F.label, fontSize: 11, color: T.outline, marginTop: 6 }}>{timeAgo(post.created_at)}</div>
              </div>
            </div>

            {/* Comment List */}
            {comments.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: 12 }}>
                <Link to={`/u/${c.user?.username}`} style={{ flexShrink: 0 }}>
                  <Avatar src={c.user?.avatar_url} name={c.user?.username} size={32} style={{ border: `1px solid ${T.outlineV}` }} />
                </Link>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 4 }}>
                    <Link to={`/u/${c.user?.username}`} style={{ fontFamily: F.headline, fontWeight: 700, fontSize: 13, color: T.primary, textDecoration: 'none' }}>@{c.user?.username}</Link>
                    <span style={{ fontFamily: F.label, fontSize: 10, color: T.outline }}>{timeAgo(c.created_at)}</span>
                  </div>
                  <div style={{ background: T.surfHigh, border: `1px solid ${T.outlineV}`, borderRadius: '4px 16px 16px 16px', padding: '8px 12px' }}>
                    <p style={{ fontFamily: F.body, fontSize: 14, color: T.onSurf, margin: 0, lineHeight: 1.5, wordBreak: 'break-word' }}>{c.body}</p>
                  </div>
                  <div style={{ fontFamily: F.label, fontSize: 10, color: T.outline, marginTop: 4, display: 'flex', gap: 12, paddingLeft: 4 }}>
                    <span style={{ cursor: 'pointer', fontWeight: 600 }}>Reply</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div style={{ borderTop: `1px solid ${T.outlineV}35`, padding: '14px 16px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div onClick={handleClap} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', transition: 'transform 0.1s' }}>
                  <ClapIcon size={26} color={clapped ? '#ef4444' : (resolvedTheme === 'dark' ? '#fff' : T.onSurf)} filled={clapped} />
                </div>
                <MessageCircle size={26} color={resolvedTheme === 'dark' ? '#fff' : T.onSurf} style={{ cursor: 'pointer' }} onClick={() => document.getElementById('comInput').focus()} />
                <Send size={26} color={resolvedTheme === 'dark' ? '#fff' : T.onSurf} style={{ cursor: 'pointer' }} onClick={() => setShareOpen(true)} />
              </div>
              <Bookmark size={26} color={saved ? T.primary : (resolvedTheme === 'dark' ? '#fff' : T.onSurf)} fill={saved ? T.primary : 'none'} onClick={handleSave} style={{ cursor: 'pointer' }} />
            </div>
            <div style={{ fontFamily: F.headline, fontWeight: 700, fontSize: 14, color: resolvedTheme === 'dark' ? '#fff' : T.onSurf, marginBottom: 4 }}>
              {clapCount} likes
            </div>
            <div style={{ fontFamily: F.label, fontSize: 10, color: T.outline, marginBottom: 16 }}>
              {timeAgo(post.created_at).toUpperCase()}
            </div>
          </div>

          {/* Add Comment Input */}
          <div style={{ borderTop: `1px solid ${T.outlineV}35`, padding: '14px 16px' }}>
            <form onSubmit={submitComment} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                id="comInput"
                value={newComment} onChange={e => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                style={{ flex: 1, background: 'transparent', border: 'none', color: resolvedTheme === 'dark' ? '#fff' : T.onSurf, fontFamily: F.body, fontSize: 14, outline: 'none' }}
              />
              <button disabled={!newComment.trim() || cmtLoading} style={{ background: 'none', border: 'none', color: newComment.trim() ? T.primary : T.outlineV, fontFamily: F.headline, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                Post
              </button>
            </form>
          </div>
        </div>

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
        contentThumbnail={post.thumbnail_url || (post.files?.[0]?.storage_url) || null}
        contentAuthor={post.creator_name || post.creator_username || ''}
      />
    </div>
  );
}
