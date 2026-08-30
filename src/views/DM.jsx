import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, MessageSquare, Check, X, Search, MoreVertical, Trash2, ShieldAlert, ShieldCheck, Reply, Loader2, Pin, Clock, Lock, Users, Zap, Sparkles, Heart, Filter, Plus } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';
import NoIndex from '../components/seo/NoIndex';
import api from '../api/axios';
import {
  getGraphQLDirectInbox,
  getGraphQLDirectRequests,
  getGraphQLDirectConversation,
  sendGraphQLDirectMessage,
  startGraphQLDirectMessage,
  respondGraphQLMessageRequest,
  deleteGraphQLDirectConversation,
} from '../api/graphql';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import SharedContentCard from '../components/direct/SharedContentCard';
import LinkPreviewCard from '../components/direct/LinkPreviewCard';
import LinkPreviewSkeleton from '../components/direct/LinkPreviewSkeleton';
import MessageInput from '../components/direct/MessageInput';
import StickerMessageCard from '../components/direct/media/StickerMessageCard';
import GifMessageCard from '../components/direct/media/GifMessageCard';
import DocumentMessageCard from '../components/direct/cards/DocumentMessageCard';
import MediaMessageCard from '../components/direct/cards/MediaMessageCard';
import CodeMessageCard from '../components/direct/cards/CodeMessageCard';
import PollMessageCard from '../components/direct/cards/PollMessageCard';
import { getMessageMediaType } from '../utils/mediaDetector';
import { saveRecentSticker, saveRecentGif } from '../utils/s3MediaClient';
import { toast } from 'react-hot-toast';
import useAnalytics from '../hooks/useAnalytics';

// Client-side cache for scraped link previews
const clientPreviewCache = new Map();

function extractFirstUrl(text) {
  if (!text || typeof text !== 'string') return null;
  const match = text.match(/(https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*)|(www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*)/i);
  if (!match) return null;
  let url = match[0].trim();
  if (url.startsWith('www.')) url = 'https://' + url;
  return url;
}

function QuotedReplyCard({ replyTo, isMine, onJumpToMessage }) {
  if (!replyTo) return null;
  const authorName = replyTo.sender_name || (replyTo.sender_username ? `@${replyTo.sender_username}` : 'User');
  const quoteText = replyTo.body || (replyTo.title ? `Shared: ${replyTo.title}` : 'Attachment');

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (replyTo.message_id) onJumpToMessage?.(replyTo.message_id);
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: '5px 9px',
        marginBottom: 6,
        borderRadius: 8,
        background: isMine ? 'rgba(0, 0, 0, 0.22)' : 'rgba(0, 0, 0, 0.35)',
        borderLeft: '3.5px solid #4cd6fb',
        cursor: replyTo.message_id ? 'pointer' : 'default',
        overflow: 'hidden',
        textAlign: 'left',
        minWidth: 0,
        maxWidth: '100%',
      }}
    >
      <div style={{
        fontFamily: '"Space Grotesk", sans-serif',
        fontSize: 11,
        fontWeight: 700,
        color: '#4cd6fb',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}>
        <Reply size={11} />
        <span>{authorName}</span>
      </div>
      <div style={{
        fontSize: 11.5,
        color: isMine ? 'rgba(255, 255, 255, 0.85)' : '#cbd5e1',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        minWidth: 0,
        maxWidth: '100%',
      }}>
        {quoteText}
      </div>
    </div>
  );
}

function SwipeableMessageRow({ msg, isMine, onReply, children }) {
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isHorizontalRef = useRef(null);

  const handleTouchStart = (e) => {
    const t = e.touches[0];
    startXRef.current = t.clientX;
    startYRef.current = t.clientY;
    isHorizontalRef.current = null;
    setSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!swiping) return;
    const t = e.touches[0];
    const dx = t.clientX - startXRef.current;
    const dy = t.clientY - startYRef.current;

    if (isHorizontalRef.current === null) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        isHorizontalRef.current = Math.abs(dx) > Math.abs(dy);
      }
    }

    if (!isHorizontalRef.current) return;

    if (dx > 0) {
      const resistedDx = Math.min(dx * 0.45, 60);
      setOffsetX(resistedDx);
    }
  };

  const handleTouchEnd = () => {
    if (!swiping) return;
    setSwiping(false);
    if (offsetX >= 35) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(12);
      }
      onReply?.(msg);
    }
    setOffsetX(0);
    isHorizontalRef.current = null;
  };

  const replyOpacity = Math.min(1, offsetX / 30);
  const replyScale = Math.min(1, 0.4 + (offsetX / 30) * 0.6);

  return (
    <div
      id={`dm-msg-${msg.id}`}
      className="group"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: isMine ? 'flex-end' : 'flex-start',
        alignItems: 'flex-end',
        width: '100%',
        gap: 8,
        touchAction: 'pan-y',
        transition: 'background 0.3s ease',
        borderRadius: 12,
      }}
    >
      {/* Swipe Gesture Indicator Icon (revealed when swiped right) */}
      <div
        style={{
          position: 'absolute',
          left: 4,
          top: '50%',
          transform: `translateY(-50%) scale(${replyScale})`,
          opacity: replyOpacity,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: 'rgba(110, 0, 255, 0.25)',
          border: '1px solid rgba(110, 0, 255, 0.5)',
          color: '#d0bcff',
          transition: swiping ? 'none' : 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        <Reply size={15} />
      </div>

      {/* Desktop Quick Reply Button (hover) */}
      <button
        type="button"
        onClick={() => onReply?.(msg)}
        title="Reply"
        aria-label="Reply to message"
        style={{
          order: isMine ? -1 : 10,
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#94a3b8',
          marginBottom: 4,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex"
      >
        <Reply size={13} />
      </button>

      {/* Message Content */}
      <div
        style={{
          display: 'flex',
          justifyContent: isMine ? 'flex-end' : 'flex-start',
          alignItems: 'flex-end',
          gap: 8,
          maxWidth: '100%',
          transform: `translateX(${offsetX}px)`,
          transition: swiping ? 'none' : 'transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function FormattedMessageText({ text, isMine }) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const parts = text.split(urlRegex);

  return (
    <span style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap', padding: '0 4px', display: 'inline-block' }}>
      {parts.map((part, idx) => {
        if (!part) return null;
        if (part.match(urlRegex)) {
          const href = part.startsWith('www.') ? `https://${part}` : part;
          return (
            <a
              key={idx}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                color: isMine ? '#ffffff' : '#38bdf8',
                textDecoration: 'underline',
                wordBreak: 'break-all',
                fontWeight: 500,
              }}
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </span>
  );
}

function MessageTextWithLinkPreview({ text, isMine, linkPreview: initialPreview }) {
  const firstUrl = extractFirstUrl(text);
  const [preview, setPreview] = useState(() => initialPreview || (firstUrl ? clientPreviewCache.get(firstUrl) : null));
  const [loading, setLoading] = useState(() => Boolean(firstUrl && !initialPreview && !clientPreviewCache.has(firstUrl)));

  useEffect(() => {
    if (!firstUrl || preview || clientPreviewCache.has(firstUrl)) return;
    let isCancelled = false;
    setLoading(true);

    api.post('/meta/preview', { url: firstUrl })
      .then((res) => {
        if (isCancelled) return;
        if (res.data?.success && res.data?.data) {
          clientPreviewCache.set(firstUrl, res.data.data);
          setPreview(res.data.data);
        } else {
          clientPreviewCache.set(firstUrl, null);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          clientPreviewCache.set(firstUrl, null);
        }
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [firstUrl]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '6px' }}>
      {loading && <LinkPreviewSkeleton />}
      {!loading && preview && <LinkPreviewCard preview={preview} isMine={isMine} />}
      <FormattedMessageText text={text} isMine={isMine} />
    </div>
  );
}

function timeAgo(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const STYLES = `
  .dm-glass { background: rgba(23,28,33,0.65); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
  .dm-neon { box-shadow: 0 0 22px rgba(110,0,255,0.25); }
  .dm-scroll::-webkit-scrollbar { width: 3px; }
  .dm-scroll::-webkit-scrollbar-track { background: transparent; }
  .dm-scroll::-webkit-scrollbar-thumb { background: #30353b; border-radius: 10px; }
  .dm-conv-item { display: flex; flex-direction: column; gap: 6px; padding: 14px 16px; cursor: pointer; border-radius: 12px; transition: background 0.2s; }
  .dm-conv-item:hover { background: #252a30; }
  .dm-conv-item.active { background: rgba(23,28,33,0.8); border-left: 3px solid #6e00ff; box-shadow: 0 0 22px rgba(110,0,255,0.2); padding-left: 13px; }
  @media(max-width: 768px) {
    .dm-sidebar { display: none !important; }
    .dm-sidebar.show { display: flex !important; }
    .dm-thread { flex: 1; }
  }
`;

const ONLY_EMOJI_REGEX = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\s)+$/u;
function isOnlyEmojiMessage(text) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 25) return false;
  return ONLY_EMOJI_REGEX.test(trimmed);
}

function ConversationItem({ conv, active, isPinned, onClick, onTogglePin }) {
  const isOnline = Boolean(conv.other_is_active);
  const unread = conv.unread_count || 0;

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 13px',
        borderRadius: 18,
        cursor: 'pointer',
        transition: 'all 0.16s cubic-bezier(0.16, 1, 0.3, 1)',
        marginBottom: 6,
        background: active
          ? 'rgba(124, 58, 237, 0.18)'
          : unread > 0
            ? 'rgba(23, 28, 38, 0.95)'
            : '#131926',
        border: active
          ? '1.5px solid #8B5CF6'
          : unread > 0
            ? '1px solid rgba(139, 92, 246, 0.35)'
            : '1px solid rgba(255, 255, 255, 0.07)',
        boxShadow: active
          ? '0 4px 18px rgba(124, 58, 237, 0.14)'
          : '0 2px 8px rgba(0,0,0,0.2)',
        position: 'relative',
      }}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = unread > 0 ? 'rgba(23, 28, 38, 0.95)' : '#131926';
        }
      }}
    >
      {/* Avatar Container with Online Indicator */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <img
          src={conv.other_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${conv.other_username}`}
          alt=""
          style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
        />
        {isOnline && (
          <span
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#10B981',
              border: '2.5px solid #0F172A',
              boxShadow: '0 0 4px rgba(16, 185, 129, 0.4)',
            }}
          />
        )}
      </div>

      {/* Main Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
            <span style={{
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: 700,
              fontSize: 14,
              color: active ? '#DDD6FE' : '#F1F5F9',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.2px',
            }}>
              {conv.other_name || conv.other_username}
            </span>
            {conv.other_account_type && conv.other_account_type !== 'learner' && (
              <span style={{
                fontSize: 9,
                fontWeight: 700,
                background: '#EDE9FE',
                color: '#7C3AED',
                border: '1px solid #DDD6FE',
                borderRadius: 6,
                padding: '1px 5px',
                fontFamily: '"JetBrains Mono", monospace',
                flexShrink: 0,
                textTransform: 'uppercase',
              }}>
                {conv.other_account_type}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {isPinned && (
              <Pin size={12} color="#8B5CF6" fill="#8B5CF6" style={{ transform: 'rotate(45deg)' }} />
            )}
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: '#94A3B8' }}>
              {timeAgo(conv.last_message_at)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{
            fontSize: 12,
            color: unread > 0 ? '#F8FAFC' : '#94A3B8',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: unread > 0 ? 600 : 400,
            lineHeight: 1.4,
            flex: 1,
            minWidth: 0,
          }}>
            {conv.last_message_type === 'story_reply' 
              ? '📷 Replying to story' 
              : (conv.last_message_type === 'shared_video' 
                ? '🎬 Shared a video' 
                : (conv.last_message_type === 'shared_short' 
                  ? '⚡ Shared a short' 
                  : (conv.last_message_type?.startsWith('shared_') 
                    ? '🔗 Shared a post' 
                    : (conv.last_message || <span style={{ fontStyle: 'italic', opacity: 0.6 }}>Start a conversation</span>))))}
          </div>

          {unread > 0 && (
            <span style={{
              minWidth: 19,
              height: 19,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
              color: '#FFFFFF',
              fontSize: 9.5,
              fontWeight: 800,
              fontFamily: '"JetBrains Mono", monospace',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.45)',
              flexShrink: 0,
            }}>
              {unread}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function DMWelcomeArtwork() {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
      height: '100%',
      background: 'linear-gradient(180deg, #0F172A 0%, #0B1120 100%)',
    }}>
      {/* Floating Paper Airplane with curved dotted flight trail */}
      <div style={{ position: 'absolute', top: 35, left: 35, pointerEvents: 'none' }}>
        <svg width="130" height="90" viewBox="0 0 130 90" fill="none">
          <path d="M10 80 C 35 45, 55 70, 85 45 C 95 35, 105 25, 115 15" stroke="#A78BFA" strokeWidth="1.6" strokeDasharray="3 4" strokeLinecap="round" fill="none" opacity="0.75" />
          <g transform="translate(100, 5) rotate(-10)">
            <polygon points="0,15 26,0 15,28 10,17" fill="#8B5CF6" />
            <polygon points="26,0 10,17 2,14" fill="#7C3AED" />
          </g>
        </svg>
      </div>

      {/* Floating Sparkles */}
      <div style={{ position: 'absolute', top: 75, right: 65, color: '#F59E0B', fontSize: 20, pointerEvents: 'none' }}>✦</div>
      <div style={{ position: 'absolute', top: 180, right: 40, color: '#A78BFA', fontSize: 13, pointerEvents: 'none' }}>✦</div>
      <div style={{ position: 'absolute', top: 140, left: 45, color: '#C084FC', fontSize: 14, pointerEvents: 'none' }}>✦</div>
      <div style={{ position: 'absolute', bottom: 120, right: 55, color: '#818CF8', fontSize: 16, pointerEvents: 'none' }}>✦</div>

      {/* Decorative center backdrop glow */}
      <div style={{
        position: 'absolute',
        top: '32%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 380,
        height: 380,
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0) 70%)',
        pointerEvents: 'none',
      }} />

      {/* 3D Chat Bubbles Illustration */}
      <div style={{ position: 'relative', width: 170, height: 135, marginBottom: 20 }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 125,
          height: 90,
          borderRadius: '26px 26px 26px 8px',
          background: 'linear-gradient(145deg, #9333EA 0%, #7C3AED 45%, #6366F1 100%)',
          boxShadow: '0 18px 38px rgba(124, 58, 237, 0.32), inset 0 2px 4px rgba(255,255,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          zIndex: 2,
        }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
        </div>

        <div style={{
          position: 'absolute',
          bottom: 5,
          right: 0,
          width: 80,
          height: 64,
          borderRadius: '20px 20px 6px 20px',
          background: '#1E293B',
          border: '1.5px solid #334155',
          boxShadow: '0 12px 28px rgba(0,0,0,0.12), inset 0 1px 2px rgba(255,255,255,0.6)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          zIndex: 3,
        }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <span style={{ width: 4.5, height: 4.5, borderRadius: '50%', background: '#7C3AED' }} />
            <span style={{ width: 4.5, height: 4.5, borderRadius: '50%', background: '#7C3AED' }} />
          </div>
          <svg width="22" height="10" viewBox="0 0 22 10" fill="none">
            <path d="M2 2 Q 11 10, 20 2" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      </div>

      <h2 style={{
        fontFamily: '"Space Grotesk", sans-serif',
        fontWeight: 800,
        fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)',
        color: '#F8FAFC',
        margin: '0 0 2px',
        letterSpacing: '-0.4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}>
        <span>Hey there!</span>
        <span style={{ fontSize: '1.2em' }}>👋</span>
      </h2>

      <svg width="100" height="10" viewBox="0 0 100 10" fill="none" style={{ margin: '2px auto 14px' }}>
        <path d="M2 5 Q 14 1, 26 5 T 50 5 T 74 5 T 98 5" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </svg>

      <p style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 14,
        color: '#94A3B8',
        margin: '0 0 4px',
        lineHeight: 1.5,
      }}>
        Your <strong style={{ color: '#8B5CF6', fontWeight: 700 }}>conversations</strong> will appear here
      </p>
      <p style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 13,
        color: '#64748B',
        margin: '0 0 26px',
      }}>
        Start a chat and make something amazing happen ✨
      </p>

      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        flexWrap: 'wrap',
        padding: '14px 28px',
        borderRadius: 20,
        border: '1.5px dashed rgba(139, 92, 246, 0.35)',
        background: 'rgba(30, 41, 59, 0.4)',
        marginBottom: 26,
        maxWidth: 520,
      }}>
        <div style={{
          position: 'absolute',
          top: -11,
          right: 20,
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FB7185, #E11D48)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(225, 29, 72, 0.4)',
        }}>
          <Heart size={11} color="#FFFFFF" fill="#FFFFFF" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#F1F5F9', fontWeight: 500 }}>
          <Lock size={14} color="#8B5CF6" />
          <span>End-to-end encrypted</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#F1F5F9', fontWeight: 500 }}>
          <Users size={14} color="#8B5CF6" />
          <span>Private & confidential</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#F1F5F9', fontWeight: 500 }}>
          <Zap size={14} color="#8B5CF6" />
          <span>Fast & reliable</span>
        </div>
      </div>

      <div style={{
        position: 'relative',
        background: '#FEF08A',
        color: '#713F12',
        borderRadius: '3px 3px 14px 3px',
        padding: '12px 20px',
        fontFamily: '"Space Grotesk", cursive, sans-serif',
        fontSize: 13,
        fontWeight: 700,
        lineHeight: 1.45,
        boxShadow: '0 8px 24px rgba(0,0,0,0.08), 2px 2px 0px rgba(0,0,0,0.05)',
        transform: 'rotate(-2deg)',
        display: 'inline-block',
        textAlign: 'left',
      }}>
        <div style={{
          position: 'absolute',
          top: -7,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 32,
          height: 11,
          background: 'rgba(255, 255, 255, 0.75)',
          borderRadius: 2,
          boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
        }} />
        <div>Ideas</div>
        <div>+ Teamwork</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          = Impact <span style={{ color: '#7C3AED' }}>💜</span>
        </div>
      </div>
    </div>
  );
}

function ThreadPanel({ conversationId, onBack, onConversationDeleted }) {
  const { user } = useAuth();
  const { trackEvent, GA_EVENTS } = useAnalytics();
  const themeContext = useTheme();
  const isDark = themeContext?.resolvedTheme !== 'light';
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [other, setOther] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const bottomRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const pollRef = useRef(null);
  const menuRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const prevMessagesCountRef = useRef(0);
  const prevLastMessageIdRef = useRef(null);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceToBottom < 150;
  };

  const handleReply = (msg) => {
    if (!msg) return;
    const isMine = msg.sender_id === user?.id;
    const senderName = isMine ? 'You' : (other?.name || (other?.username ? `@${other.username}` : 'User'));
    const senderUsername = isMine ? user?.username : other?.username;
    let attachment = null;
    if (msg.content_attachment) {
      try {
        attachment = typeof msg.content_attachment === 'string'
          ? JSON.parse(msg.content_attachment)
          : msg.content_attachment;
      } catch (e) { attachment = null; }
    }
    setReplyingTo({
      message_id: msg.id,
      body: msg.body,
      sender_id: msg.sender_id,
      sender_name: senderName,
      sender_username: senderUsername,
      content_attachment: attachment,
    });
  };

  const handleJumpToMessage = (targetId) => {
    const el = document.getElementById(`dm-msg-${targetId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.transition = 'background 0.3s ease';
      el.style.background = 'rgba(110, 0, 255, 0.2)';
      setTimeout(() => {
        el.style.background = 'transparent';
      }, 1200);
    }
  };

  const load = async (isManualOrInitial = false) => {
    if (!conversationId) return;
    try {
      let data = null;
      try {
        data = await getGraphQLDirectConversation(conversationId);
      } catch (err) {
        console.warn('[DM GraphQL] Falling back to REST for conversation:', err?.message);
        const res = await api.get(`/direct/${conversationId}`);
        data = res.data;
      }

      if (data) {
        const newMessages = data.messages || [];
        const lastMsg = newMessages[newMessages.length - 1];
        const hasChanged =
          newMessages.length !== prevMessagesCountRef.current ||
          lastMsg?.id !== prevLastMessageIdRef.current;

        if (hasChanged || isManualOrInitial) {
          prevMessagesCountRef.current = newMessages.length;
          prevLastMessageIdRef.current = lastMsg?.id;
          setMessages(newMessages);

          if (isManualOrInitial || isNearBottomRef.current) {
            requestAnimationFrame(() => {
              bottomRef.current?.scrollIntoView({
                behavior: isManualOrInitial ? 'auto' : 'smooth',
              });
            });
          }
        }

        setOther(data.other_user);
        setIsBlocked(Boolean(data.is_blocked));
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setReplyingTo(null);
    isNearBottomRef.current = true;
    prevMessagesCountRef.current = 0;
    prevLastMessageIdRef.current = null;
    load(true);
    if (conversationId) {
      trackEvent(GA_EVENTS.DM_CONVERSATION_OPEN, { conversation_id: conversationId });
    }
    pollRef.current = setInterval(() => load(false), 4000);
    return () => clearInterval(pollRef.current);
  }, [conversationId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeleteConversation = async () => {
    if (!window.confirm('Delete this entire chat? Messages will be removed from your inbox.')) return;
    try {
      try {
        await deleteGraphQLDirectConversation(conversationId);
      } catch {
        await api.delete(`/direct/${conversationId}`);
      }
      toast.success('Conversation deleted');
      setMenuOpen(false);
      onConversationDeleted?.(conversationId);
      if (onBack) onBack();
    } catch {
      toast.error('Failed to delete conversation');
    }
  };


  const handleToggleBlock = async () => {
    if (!other) return;
    try {
      if (isBlocked) {
        await api.delete(`/direct/block/${other.id}`);
        setIsBlocked(false);
        toast.success(`Unblocked @${other.username}`);
      } else {
        if (!window.confirm(`Block @${other.username}? You won't be able to message each other or see each other's stories.`)) return;
        await api.post(`/direct/block/${other.id}`);
        setIsBlocked(true);
        toast.success(`Blocked @${other.username}`);
      }
      setMenuOpen(false);
    } catch {
      toast.error('Failed to update block status');
    }
  };

  if (!conversationId) {
    return <DMWelcomeArtwork />;
  }

  return (
    <div className="dm-thread" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#0f1419', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative glow */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: 400, height: 400, background: 'rgba(110,0,255,0.04)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', transform: 'translate(30%, -30%)' }} />

      {/* Header */}
      <div style={{ padding: '14px 24px', background: 'rgba(23,28,33,0.4)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, borderBottom: '1px solid rgba(74,68,87,0.15)', position: 'relative', zIndex: 10 }}>
        {onBack && (
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#958da3', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={18} />
          </button>
        )}
        {other && (
          <Link to={`/u/${other.username}`} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, textDecoration: 'none' }}>
            <div style={{ position: 'relative' }}>
              <img src={other.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${other.username}`} alt="" style={{ width: 42, height: 42, borderRadius: 12, objectFit: 'cover', border: '1px solid #4a4457' }} />
              <div style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 11,
                height: 11,
                background: isBlocked ? '#ef4444' : (other.is_active ? '#10b981' : '#64748b'),
                borderRadius: '50%',
                border: '2.5px solid #0f1419'
              }} />
            </div>
            <div>
              <div style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: 16, color: '#dee3ea' }}>{other.name}</div>
              <div style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 11,
                color: isBlocked ? '#ef4444' : (other.is_active ? '#10b981' : '#94a3b8')
              }}>
                {isBlocked
                  ? 'Blocked'
                  : other.is_active
                    ? `Active now · @${other.username}`
                    : `Offline · @${other.username}`}
              </div>
            </div>
          </Link>
        )}

        {/* 3-dots Menu for Delete & Block */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 8,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <MoreVertical size={18} />
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 6,
              background: '#121824',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 12,
              padding: 6,
              minWidth: 170,
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}>
              <button
                type="button"
                onClick={handleToggleBlock}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'transparent',
                  color: isBlocked ? '#4cd6fb' : '#f87171',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
                className="hover:bg-white/5"
              >
                {isBlocked ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                <span>{isBlocked ? 'Unblock User' : 'Block User'}</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteConversation}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'transparent',
                  color: '#94a3b8',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
                className="hover:bg-white/5"
              >
                <Trash2 size={14} />
                <span>Delete Chat</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Safety Banner if Blocked */}
      {isBlocked && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          borderBottom: '1px solid rgba(239, 68, 68, 0.25)',
          padding: '10px 20px',
          color: '#fca5a5',
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span>You have blocked @{other?.username}. Unblock to send messages.</span>
          <button
            onClick={handleToggleBlock}
            style={{
              background: '#ef4444',
              border: 'none',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Unblock
          </button>
        </div>
      )}

      {/* Messages Feed */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="dm-scroll"
        style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}
      >
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} height={48} width={`${35 + i * 8}%`} style={{ alignSelf: i % 2 === 0 ? 'flex-start' : 'flex-end', borderRadius: 16 }} />
            ))}
          </div>
        ) : messages.map(msg => {
          const isMine = msg.sender_id === user?.id;
          let attachment = null;
          if (msg.content_attachment) {
            try {
              attachment = typeof msg.content_attachment === 'string'
                ? JSON.parse(msg.content_attachment)
                : msg.content_attachment;
            } catch (e) {
              attachment = null;
            }
          }

          const mediaType = getMessageMediaType(msg);
          const isSticker = mediaType === 'sticker';
          const isGif = mediaType === 'gif';
          const isDocument = attachment?.type === 'document';
          const isMedia = attachment?.type === 'media';
          const isCode = attachment?.type === 'code_snippet';
          const isPoll = attachment?.type === 'poll';
          const isCustomAttachment = isDocument || isMedia || isCode || isPoll;

          const isStoryReply = msg.type === 'story_reply' && Boolean(attachment?.media_snapshot_url);
          const isSharedContent = (
            msg.type === 'shared_post' ||
            msg.type === 'shared_video' ||
            msg.type === 'shared_short' ||
            msg.type === 'shared_article' ||
            msg.type === 'shared_note' ||
            Boolean(attachment && (attachment.content_type?.startsWith('shared_') || attachment.post_id || attachment.content_id || attachment.title))
          ) && !isStoryReply && !isSticker && !isGif && !isCustomAttachment;

          const isEmojiOnly = Boolean(msg.body && isOnlyEmojiMessage(msg.body) && !isSharedContent && !isStoryReply && !isSticker && !isGif && !isCustomAttachment);

          // Extract caption without raw URLs or duplicate titles
          let caption = null;
          if (isSharedContent) {
            if (msg.text && typeof msg.text === 'string' && msg.text.trim()) {
              caption = msg.text.trim();
            } else if (msg.body) {
              let text = msg.body;
              if (attachment?.url) {
                text = text.replace(attachment.url, '');
              }
              text = text.replace(/https?:\/\/[^\s]+/g, '');
              if (attachment?.title) {
                text = text.replace(new RegExp(`"${attachment.title}"`, 'g'), '');
                text = text.replace(new RegExp(attachment.title, 'g'), '');
              }
              text = text.trim();
              if (text.length > 0) caption = text;
            }
          }

          const hasUrl = Boolean(extractFirstUrl(msg.body)) && !isSticker && !isGif && !isCustomAttachment;

          return (
            <SwipeableMessageRow key={msg.id} msg={msg} isMine={isMine} onReply={handleReply}>
              {!isMine && (
                <img
                  src={other?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=other`}
                  alt=""
                  style={{ width: 34, height: 34, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                />
              )}
              <div
                id={`dm-msg-${msg.id}`}
                style={{
                maxWidth: isSticker ? '170px' : (isGif ? '320px' : (isCustomAttachment ? (isCode ? '460px' : (isPoll ? '390px' : '370px')) : (isSharedContent ? '380px' : (hasUrl ? '400px' : (isEmojiOnly ? 'auto' : '72%'))))),
                width: isSharedContent || hasUrl || isCustomAttachment ? '100%' : 'auto',
                minWidth: 0,
                padding: isCustomAttachment ? '0' : (isSticker || isEmojiOnly ? '2px 4px' : (isGif ? '0' : (isSharedContent ? (caption ? '8px 8px 10px 8px' : '0') : '12px 18px'))),
                borderRadius: isSticker || isCustomAttachment ? '18px' : (isMine ? '20px 20px 4px 20px' : '20px 20px 20px 4px'),
                background: isCustomAttachment || isSticker || isEmojiOnly || (isSharedContent && !caption)
                  ? 'transparent'
                  : (isGif ? 'transparent' : (isMine ? 'linear-gradient(135deg, #7c1cff 0%, #5d02ee 100%)' : 'rgba(23,28,33,0.88)')),
                border: isCustomAttachment || isSticker || isGif || isEmojiOnly || (isSharedContent && !caption)
                  ? 'none'
                  : (isMine ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid rgba(74,68,87,0.35)'),
                color: isMine ? '#fff' : '#dee3ea',
                fontSize: isEmojiOnly ? 40 : 14.5,
                lineHeight: isEmojiOnly ? 1.2 : 1.6,
                boxShadow: isCustomAttachment || isSticker || isGif || isEmojiOnly || (isSharedContent && !caption)
                  ? 'none'
                  : (isMine ? '0 4px 22px rgba(110,0,255,0.32), inset 0 1px 0 rgba(255,255,255,0.2)' : '0 2px 8px rgba(0,0,0,0.18)'),
                overflow: 'hidden',
              }}>
                {/* Quoted Message Card (if this message is a reply to an earlier message) */}
                {attachment?.reply_to && (
                  <QuotedReplyCard
                    replyTo={attachment.reply_to}
                    isMine={isMine}
                    onJumpToMessage={handleJumpToMessage}
                  />
                )}

                {/* 1. Custom Attachment Cards */}
                {isDocument ? (
                  <DocumentMessageCard attachment={attachment} isMine={isMine} />
                ) : isMedia ? (
                  <MediaMessageCard attachment={attachment} isMine={isMine} />
                ) : isCode ? (
                  <CodeMessageCard attachment={attachment} isMine={isMine} />
                ) : isPoll ? (
                  <PollMessageCard attachment={attachment} isMine={isMine} />
                ) : isSticker ? (
                  <StickerMessageCard
                    attachment={attachment || { url: msg.body }}
                    isMine={isMine}
                    status={msg.status || 'sent'}
                    onRetry={msg.status === 'failed' ? () => handleRetryMedia(msg) : undefined}
                  />
                ) : isGif ? (
                  /* 2. GIF Message (Aspect-ratio locked) */
                  <GifMessageCard
                    attachment={attachment || { url: msg.body }}
                    isMine={isMine}
                    status={msg.status || 'sent'}
                    onRetry={msg.status === 'failed' ? () => handleRetryMedia(msg) : undefined}
                  />
                ) : isSharedContent && attachment ? (
                  /* 3. Shared Content Card */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <SharedContentCard attachment={attachment} />
                    {caption && (
                      <div style={{
                        padding: '6px 10px 2px 10px',
                        fontSize: 14,
                        lineHeight: 1.55,
                        color: isMine ? '#fff' : '#dee3ea',
                        wordBreak: 'break-word',
                      }}>
                        {caption}
                      </div>
                    )}
                  </div>
                ) : isStoryReply && attachment?.media_snapshot_url ? (
                  /* 4. Story Reply Preview Card */
                  <>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: isMine ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 10,
                      padding: '6px 10px',
                      marginBottom: 8,
                    }}>
                      <img
                        src={attachment.media_snapshot_url}
                        alt="Story preview"
                        style={{ width: 36, height: 48, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: 10, color: '#4cd6fb', fontFamily: 'monospace', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Story Reply
                        </span>
                        {attachment.caption && (
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#dee3ea', opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {attachment.caption}
                          </p>
                        )}
                      </div>
                    </div>
                    {msg.body && <MessageTextWithLinkPreview text={msg.body} isMine={isMine} linkPreview={msg.link_preview || attachment?.link_preview} />}
                  </>
                ) : (
                  /* 5. Regular Text Message with Link Preview or Large Emoji */
                  msg.body && (
                    isEmojiOnly ? (
                      <div style={{ fontSize: 40, lineHeight: 1.2, letterSpacing: '0.05em' }}>
                        {msg.body}
                      </div>
                    ) : (
                      <MessageTextWithLinkPreview text={msg.body} isMine={isMine} linkPreview={msg.link_preview || attachment?.link_preview} />
                    )
                  )
                )}

                <div style={{ fontSize: 9.5, marginTop: isSharedContent && !caption ? 4 : 4, opacity: 0.55, textAlign: 'right', fontFamily: '"JetBrains Mono", monospace', paddingRight: isSharedContent && !caption ? 4 : 0 }}>
                  {timeAgo(msg.created_at)}
                </div>
              </div>
              {isMine && (
                <img
                  src={user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username}`}
                  alt=""
                  style={{ width: 34, height: 34, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                />
              )}
            </SwipeableMessageRow>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* WhatsApp Refactored MessageInput Component */}
      <MessageInput
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        onSend={async (messageText, linkPreview, replyTarget) => {
          if (!messageText.trim() || isBlocked) return;
          try {
            const payload = { body: messageText };
            let attachmentObj = null;
            if (linkPreview) {
              payload.link_preview = linkPreview;
              attachmentObj = { ...(attachmentObj || {}), link_preview: linkPreview };
            }
            if (replyTarget) {
              const replyData = {
                message_id: replyTarget.message_id,
                body: replyTarget.body,
                sender_name: replyTarget.sender_name,
                sender_username: replyTarget.sender_username,
              };
              payload.reply_to = replyData;
              attachmentObj = { ...(attachmentObj || {}), reply_to: replyData };
              setReplyingTo(null);
            }
            if (attachmentObj) {
              payload.content_attachment = attachmentObj;
            }

            let newMsg = null;
            try {
              newMsg = await sendGraphQLDirectMessage(conversationId, {
                body: payload.message || payload.body || '',
                type: payload.type || 'text',
                contentAttachment: attachmentObj,
                linkPreview: payload.link_preview,
                replyTo: payload.reply_to,
              });
            } catch (err) {
              console.warn('[DM GraphQL] Send message falling back to REST:', err?.message);
              const res = await api.post(`/direct/${conversationId}`, payload);
              newMsg = res.data?.message;
            }

            if (newMsg) {
              trackEvent(GA_EVENTS.DM_MESSAGE_SEND, {
                conversation_id: conversationId,
                message_type: 'text',
                has_attachment: Boolean(attachmentObj),
                is_reply: Boolean(replyTarget),
              });
              setMessages((prev) => [...prev, newMsg]);
              prevMessagesCountRef.current += 1;
              prevLastMessageIdRef.current = newMsg.id;
              isNearBottomRef.current = true;
              requestAnimationFrame(() => {
                bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
              });
            }
          } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to send message');
          }
        }}
        onSelectSticker={async (stickerData) => {
          if (isBlocked) return;
          try {
            const optimisticId = `temp_sticker_${Date.now()}`;
            const optimisticMsg = {
              id: optimisticId,
              conversation_id: conversationId,
              sender_id: user?.id,
              type: 'sticker',
              body: stickerData.alt || 'Sticker',
              content_attachment: stickerData,
              created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, optimisticMsg]);
            requestAnimationFrame(() => {
              bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            });

            let confirmedMsg = null;
            try {
              confirmedMsg = await sendGraphQLDirectMessage(conversationId, {
                type: 'sticker',
                body: stickerData.alt || 'Sticker',
                contentAttachment: stickerData,
              });
            } catch (err) {
              console.warn('[DM GraphQL] Send sticker falling back to REST:', err?.message);
              const res = await api.post(`/direct/${conversationId}`, {
                type: 'sticker',
                body: stickerData.alt || 'Sticker',
                content_attachment: stickerData,
              });
              confirmedMsg = res.data?.message;
            }

            if (confirmedMsg) {
              trackEvent(GA_EVENTS.DM_MESSAGE_SEND, {
                conversation_id: conversationId,
                message_type: 'sticker',
              });
              setMessages((prev) => prev.map((m) => (m.id === optimisticId ? confirmedMsg : m)));
            }
          } catch (err) {
            toast.error('Failed to send sticker');
          }
        }}
        onSelectGif={async (gifData) => {
          if (isBlocked) return;
          try {
            const optimisticId = `temp_gif_${Date.now()}`;
            const optimisticMsg = {
              id: optimisticId,
              conversation_id: conversationId,
              sender_id: user?.id,
              type: 'gif',
              body: gifData.title || 'GIF',
              content_attachment: gifData,
              created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, optimisticMsg]);
            requestAnimationFrame(() => {
              bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            });

            let confirmedMsg = null;
            try {
              confirmedMsg = await sendGraphQLDirectMessage(conversationId, {
                type: 'gif',
                body: gifData.title || 'GIF',
                contentAttachment: gifData,
              });
            } catch (err) {
              console.warn('[DM GraphQL] Send GIF falling back to REST:', err?.message);
              const res = await api.post(`/direct/${conversationId}`, {
                type: 'gif',
                body: gifData.title || 'GIF',
                content_attachment: gifData,
              });
              confirmedMsg = res.data?.message;
            }

            if (confirmedMsg) {
              trackEvent(GA_EVENTS.DM_MESSAGE_SEND, {
                conversation_id: conversationId,
                message_type: 'gif',
              });
              setMessages((prev) => prev.map((m) => (m.id === optimisticId ? confirmedMsg : m)));
            }
          } catch (err) {
            toast.error('Failed to send GIF');
          }
        }}
        onSendMediaFile={async (file, mediaType, replyTarget) => {
          if (isBlocked) return;
          const previewUrl = URL.createObjectURL(file);
          const optimisticId = `temp_media_${Date.now()}`;
          const optimisticAttachment = {
            content_type: mediaType,
            url: previewUrl,
            source: 'gboard',
            width: 320,
            height: 240,
          };
          const optimisticMsg = {
            id: optimisticId,
            conversation_id: conversationId,
            sender_id: user?.id,
            type: mediaType,
            body: mediaType === 'gif' ? 'GIF' : 'Sticker',
            content_attachment: optimisticAttachment,
            created_at: new Date().toISOString(),
            status: 'sending',
            _pendingFile: file,
            _pendingType: mediaType,
            _replyTarget: replyTarget,
          };
          setMessages((prev) => [...prev, optimisticMsg]);
          requestAnimationFrame(() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
          });

          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('resource_type', 'image');

            const uploadRes = await fetch('/api/upload/media', {
              method: 'POST',
              body: formData,
            });

            if (!uploadRes.ok) throw new Error('Media upload failed');
            const uploadData = await uploadRes.json();
            const permanentUrl = uploadData.secure_url || uploadData.url;

            const finalAttachment = {
              content_type: mediaType,
              url: permanentUrl,
              id: uploadData.public_id || `gboard_${Date.now()}`,
              source: 'gboard',
              width: uploadData.width || 320,
              height: uploadData.height || 240,
            };

            const payload = {
              type: mediaType,
              body: mediaType === 'gif' ? 'GIF' : 'Sticker',
              content_attachment: finalAttachment,
            };
            if (replyTarget) payload.reply_to = replyTarget;

            let confirmedMsg = null;
            try {
              confirmedMsg = await sendGraphQLDirectMessage(conversationId, {
                type: mediaType,
                body: mediaType === 'gif' ? 'GIF' : 'Sticker',
                contentAttachment: finalAttachment,
                replyTo: replyTarget || undefined,
              });
            } catch (err) {
              console.warn('[DM GraphQL] Send media attachment falling back to REST:', err?.message);
              const res = await api.post(`/direct/${conversationId}`, payload);
              confirmedMsg = res.data?.message;
            }

            if (confirmedMsg) {
              trackEvent(GA_EVENTS.DM_MESSAGE_SEND, {
                conversation_id: conversationId,
                message_type: mediaType,
              });
              setMessages((prev) => prev.map((m) => (m.id === optimisticId ? confirmedMsg : m)));
            }
          } catch (err) {
            setMessages((prev) => prev.map((m) => (m.id === optimisticId ? { ...m, status: 'failed' } : m)));
            toast.error('Failed to upload media. Tap retry.');
          }
        }}
        onSendAttachment={async (attachment, textBody, replyTarget) => {
          const optimisticId = `temp_att_${Date.now()}`;
          const optimisticMsg = {
            id: optimisticId,
            conversation_id: conversationId,
            sender_id: user?.id,
            body: textBody || (attachment.type === 'document' ? attachment.file_name : (attachment.type === 'code_snippet' ? (attachment.title || 'Code Snippet') : (attachment.type === 'poll' ? attachment.question : 'Media'))),
            type: attachment.type,
            content_attachment: attachment,
            created_at: new Date().toISOString(),
            status: 'sending',
            reply_to: replyTarget || null,
          };
          setMessages((prev) => [...prev, optimisticMsg]);
          scrollToBottom();

          try {
            const payload = {
              type: attachment.type,
              body: optimisticMsg.body,
              content_attachment: attachment,
            };
            if (replyTarget) payload.reply_to = replyTarget;

            let confirmedMsg = null;
            try {
              confirmedMsg = await sendGraphQLDirectMessage(conversationId, {
                type: attachment.type,
                body: optimisticMsg.body,
                contentAttachment: attachment,
                replyTo: replyTarget || undefined,
              });
            } catch (err) {
              console.warn('[DM GraphQL] Send attachment falling back to REST:', err?.message);
              const res = await api.post(`/direct/${conversationId}`, payload);
              confirmedMsg = res.data?.message;
            }

            if (confirmedMsg) {
              trackEvent(GA_EVENTS.DM_MESSAGE_SEND, {
                conversation_id: conversationId,
                message_type: attachment.type || 'attachment',
              });
              setMessages((prev) => prev.map((m) => (m.id === optimisticId ? confirmedMsg : m)));
            }
          } catch (err) {
            setMessages((prev) => prev.map((m) => (m.id === optimisticId ? { ...m, status: 'failed' } : m)));
            toast.error('Failed to send attachment');
          }
        }}
        disabled={isBlocked}
        placeholder={isBlocked ? "Cannot send messages to a blocked user" : "Type a message…"}
        isDark={isDark}
        themeAccent="#6e00ff"
      />
    </div>
  );
}

export function DMInbox() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const [conversations, setConversations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'unread', 'groups', 'direct', 'requests'
  const [activeConv, setActiveConv] = useState(null);
  const [query, setQuery] = useState('');
  const [globalUsers, setGlobalUsers] = useState([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [pinnedIds, setPinnedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cpa_pinned_chats') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const readMobile = () => typeof window !== 'undefined' && window.innerWidth < 769;
    setIsMobile(readMobile());
    const onResize = () => setIsMobile(readMobile());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const loadInbox = async () => {
    try {
      const [inboxRes, reqRes] = await Promise.all([
        getGraphQLDirectInbox(),
        getGraphQLDirectRequests(),
      ]);
      setConversations(inboxRes.conversations || []);
      setRequests(reqRes.requests || []);
    } catch (err) {
      console.warn('[DMInbox GraphQL] Falling back to REST:', err?.message);
      Promise.all([
        api.get('/direct/inbox'),
        api.get('/direct/requests'),
      ]).then(([inboxRes, reqRes]) => {
        setConversations(inboxRes.data.conversations || []);
        setRequests(reqRes.data.requests || []);
      }).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInbox();
  }, []);

  const togglePin = (convId, e) => {
    if (e) e.stopPropagation();
    setPinnedIds(prev => {
      const updated = prev.includes(convId) ? prev.filter(id => id !== convId) : [...prev, convId];
      try { localStorage.setItem('cpa_pinned_chats', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  // Ctrl + K shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Live Elasticsearch user search across the platform
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setGlobalUsers([]);
      setIsSearchingGlobal(false);
      return;
    }

    setIsSearchingGlobal(true);
    const timer = setTimeout(async () => {
      try {
        let results = [];
        try {
          const esRes = await api.get('/search/section', {
            params: { type: 'people', q, limit: 15 }
          });
          results = esRes.data?.items || [];
        } catch {}

        if (!results.length) {
          try {
            const sqlRes = await api.get('/users/search', {
              params: { q, limit: 15 }
            });
            results = sqlRes.data?.users || sqlRes.data?.items || [];
          } catch {
            const fbRes = await api.get('/users', {
              params: { q, limit: 15 }
            });
            results = fbRes.data?.users || [];
          }
        }

        const myUsername = user?.username?.toLowerCase();
        const mapped = results
          .filter(u => !myUsername || u.username?.toLowerCase() !== myUsername)
          .map(u => ({
            id: u.id || u.user_id,
            name: u.name || u.username,
            username: u.username,
            avatar_url: u.avatar_url || u.avatar,
            bio: u.bio || '',
            account_type: u.account_type || 'learner',
            tech_interests: u.tech_interests || []
          }));

        setGlobalUsers(mapped);
      } catch (err) {
        console.error('[DM Search] Failed to fetch users:', err);
        setGlobalUsers([]);
      } finally {
        setIsSearchingGlobal(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, user]);

  const handleRequest = async (id, action) => {
    const status = action === 'accept' ? 'accepted' : 'declined';
    try {
      try {
        await respondGraphQLMessageRequest(id, status);
      } catch (err) {
        console.warn('[DMInbox GraphQL] respondMessageRequest falling back to REST:', err?.message);
        await api.put(`/direct/requests/${id}`, { status });
      }
      setRequests(prev => prev.filter(r => r.id !== id));
      if (action === 'accept') {
        loadInbox();
      }
    } catch {}
  };


  const handleConvClick = (conv) => {
    if (isMobile) navigate(`/direct/${conv.id}`);
    else setActiveConv(conv.id);
  };

  const handleConversationDeleted = (convId) => {
    setConversations(prev => prev.filter(c => c.id !== convId));
    setActiveConv(null);
  };

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  const filtered = conversations.filter(c => {
    const matchQuery = !query ||
      c.other_name?.toLowerCase().includes(query.toLowerCase()) ||
      c.other_username?.toLowerCase().includes(query.toLowerCase()) ||
      c.last_message?.toLowerCase().includes(query.toLowerCase());

    if (!matchQuery) return false;
    if (activeTab === 'unread') return (c.unread_count > 0);
    if (activeTab === 'groups') return c.is_group || c.type === 'group';
    if (activeTab === 'direct') return !c.is_group && c.type !== 'group';
    return true;
  });

  const pinnedConvs = filtered.filter(c => pinnedIds.includes(c.id) || c._pinned);
  const recentConvs = filtered.filter(c => !pinnedIds.includes(c.id) && !c._pinned);

  return (
    <>
      <Helmet><title>Messages — FocusGram</title></Helmet>
      <NoIndex />
      <style>{STYLES}</style>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'clamp(340px, 28vw, 420px) 1fr',
        gap: isMobile ? 0 : 16,
        height: 'calc(100vh - 100px)',
        maxHeight: '1000px',
        width: '100%',
        maxWidth: '1600px',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}>
        {/* Left sidebar card */}
        <div className={`dm-sidebar${(isMobile && activeConv) ? '' : ' show'}`} style={{
          borderRadius: isMobile ? 0 : 24,
          border: '1px solid rgba(255,255,255,0.08)',
          background: '#0F172A',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Header */}
          <div style={{ padding: '18px 20px 12px', display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <h1 style={{
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontWeight: 800,
                  fontSize: 22,
                  color: '#F8FAFC',
                  margin: '0 0 2px',
                  letterSpacing: '-0.4px',
                }}>
                  Chats
                </h1>
                <p style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 11.5,
                  color: '#94A3B8',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <span>〽</span> Let's connect and build together! <span style={{ color: '#8B5CF6' }}>💜</span>
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => navigate('/network')}
                  title="New Conversation"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#8B5CF6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={16} color="#8B5CF6" />
                </button>
              </div>
            </div>

            {/* Capsule Search */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: 14, pointerEvents: 'none' }} />
              <input
                ref={searchInputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search chats and contacts..."
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 9999,
                  padding: '9px 65px 9px 38px',
                  fontSize: 12.5,
                  color: '#F8FAFC',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ position: 'absolute', right: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                {isSearchingGlobal ? (
                  <Loader2 size={13} className="animate-spin" color="#8B5CF6" />
                ) : query ? (
                  <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', padding: 0 }}>
                    <X size={13} />
                  </button>
                ) : (
                  <span style={{
                    fontSize: 10,
                    fontFamily: '"JetBrains Mono", monospace',
                    fontWeight: 600,
                    color: '#94A3B8',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6,
                    padding: '1px 5px',
                  }}>
                    ⌘ K
                  </span>
                )}
              </div>
            </div>

            {/* Filter Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'unread', label: 'Unread', count: totalUnread },
                { id: 'groups', label: 'Groups' },
                { id: 'direct', label: 'Direct' },
                { id: 'requests', label: 'Requests', count: requests.length },
              ].map(chip => {
                const isActive = activeTab === chip.id;
                return (
                  <button
                    key={chip.id}
                    onClick={() => setActiveTab(chip.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '5px 12px',
                      borderRadius: 9999,
                      border: isActive ? '1px solid #7C3AED' : '1px solid rgba(255,255,255,0.08)',
                      background: isActive ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)' : 'transparent',
                      color: isActive ? '#FFFFFF' : '#94A3B8',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: 11.5,
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{chip.label}</span>
                    {chip.count > 0 && (
                      <span style={{
                        fontSize: 9.5,
                        fontFamily: '"JetBrains Mono", monospace',
                        fontWeight: 800,
                        background: isActive ? '#FFFFFF' : '#8B5CF6',
                        color: isActive ? '#6D28D9' : '#FFFFFF',
                        borderRadius: 999,
                        padding: '0 5px',
                      }}>
                        {chip.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* List */}
          <div className="dm-scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 20px' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[...Array(5)].map((_, i) => <Skeleton key={i} height={64} style={{ borderRadius: 16 }} />)}
              </div>
            ) : activeTab === 'requests' ? (
              requests.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
                  <MessageSquare size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, margin: 0 }}>No pending requests</p>
                </div>
              ) : (
                requests.map(r => {
                  const name = r.sender_name || r.name || 'User';
                  const username = r.sender_username || r.username || 'user';
                  const avatar = r.sender_avatar || r.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
                  return (
                    <div key={r.id} style={{ padding: '14px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, marginBottom: 8, background: 'rgba(18, 24, 38, 0.65)' }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                        <img src={avatar} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: 13.5, color: '#F8FAFC' }}>{name}</div>
                          <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.body}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleRequest(r.id, 'accept')} style={{ flex: 1, padding: '7px 0', background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                          <Check size={13} /> Accept
                        </button>
                        <button onClick={() => handleRequest(r.id, 'decline')} style={{ flex: 1, padding: '7px 0', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#94A3B8', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                          <X size={13} /> Decline
                        </button>
                      </div>
                    </div>
                  );
                })
              )
            ) : query.trim() ? (
              /* Search results: local filtered + global contacts */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filtered.length > 0 && (
                  <div>
                    <div style={{ padding: '2px 6px 6px', fontSize: 10.5, fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Conversations ({filtered.length})
                    </div>
                    {filtered.map(c => (
                      <ConversationItem
                        key={c.id}
                        conv={c}
                        active={activeConv === c.id}
                        isPinned={pinnedIds.includes(c.id) || c._pinned}
                        onClick={() => handleConvClick(c)}
                        onTogglePin={(e) => togglePin(c.id, e)}
                      />
                    ))}
                  </div>
                )}

                <div>
                  <div style={{ padding: '2px 6px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10.5, fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Contacts & People {globalUsers.length > 0 ? `(${globalUsers.length})` : ''}
                    </span>
                  </div>

                  {globalUsers.length > 0 ? (
                    globalUsers.map(gu => {
                      const existing = conversations.find(c =>
                        (c.other_username && c.other_username.toLowerCase() === gu.username.toLowerCase()) ||
                        (c.other_user_id && String(c.other_user_id) === String(gu.id))
                      );

                      return (
                        <div
                          key={gu.id || gu.username}
                          onClick={() => {
                            if (existing) {
                              handleConvClick(existing);
                            } else {
                              navigate(`/network?dm=${encodeURIComponent(gu.username)}`);
                            }
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 12px', borderRadius: 16, cursor: 'pointer',
                            background: 'transparent', transition: 'background 0.15s',
                            border: '1px solid rgba(255,255,255,0.04)', marginBottom: 4
                          }}
                          className="hover:bg-purple-500/10"
                        >
                          <img
                            src={gu.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${gu.username}`}
                            alt=""
                            style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: 13.5, color: '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {gu.name}
                              </span>
                              <span style={{ fontSize: 9.5, color: '#8B5CF6', fontFamily: '"JetBrains Mono", monospace', fontWeight: 700 }}>
                                {existing ? 'Chatting' : 'Message'}
                              </span>
                            </div>
                            <div style={{ fontSize: 11, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              @{gu.username} {gu.bio ? `· ${gu.bio}` : ''}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : !isSearchingGlobal && filtered.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center', color: '#64748B', fontSize: 12 }}>
                      <Search size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                      <p style={{ fontFamily: '"Space Grotesk", sans-serif', color: '#F8FAFC', margin: '0 0 4px', fontWeight: 600 }}>No users found</p>
                      <p style={{ fontFamily: '"JetBrains Mono", monospace', margin: 0 }}>Try searching by exact @username</p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#64748B' }}>
                <MessageSquare size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                <p style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: 14, color: '#F8FAFC', margin: '0 0 4px' }}>No conversations yet</p>
                <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, margin: 0 }}>Start a chat from the Network page</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pinnedConvs.length > 0 && (
                  <div>
                    <div style={{
                      padding: '2px 8px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: '#8B5CF6',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}>
                      <Pin size={11} color="#8B5CF6" fill="#8B5CF6" style={{ transform: 'rotate(45deg)' }} />
                      <span>Pinned</span>
                    </div>
                    {pinnedConvs.map(c => (
                      <ConversationItem
                        key={c.id}
                        conv={c}
                        active={activeConv === c.id}
                        isPinned={true}
                        onClick={() => handleConvClick(c)}
                        onTogglePin={(e) => togglePin(c.id, e)}
                      />
                    ))}
                  </div>
                )}

                {recentConvs.length > 0 && (
                  <div>
                    {pinnedConvs.length > 0 && (
                      <div style={{
                        padding: '8px 8px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: '#94A3B8',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}>
                        <Clock size={11} color="#94A3B8" />
                        <span>Recent</span>
                      </div>
                    )}
                    {recentConvs.map(c => (
                      <ConversationItem
                        key={c.id}
                        conv={c}
                        active={activeConv === c.id}
                        isPinned={false}
                        onClick={() => handleConvClick(c)}
                        onTogglePin={(e) => togglePin(c.id, e)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Thread panel card */}
        {!isMobile && (
          <div style={{
            borderRadius: 24,
            border: '1px solid rgba(255,255,255,0.08)',
            background: '#0F172A',
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <ThreadPanel conversationId={activeConv} onConversationDeleted={handleConversationDeleted} />
          </div>
        )}
      </div>
    </>
  );
}

export function DMThread() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const readMobile = () => typeof window !== 'undefined' && window.innerWidth < 769;
    setIsMobile(readMobile());
    const onResize = () => setIsMobile(readMobile());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <>
      <Helmet><title>Message — FocusGram</title></Helmet>
      <NoIndex />
      <style>{STYLES}</style>
      <div style={isMobile ? {
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100dvh - 64px - env(safe-area-inset-bottom, 0px))',
        width: '100%',
        background: '#0f1419',
        overflow: 'hidden'
      } : {
        height: 'calc(100vh - 104px)',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid rgba(74,68,87,0.2)',
        background: '#0f1419'
      }}>
        <ThreadPanel conversationId={conversationId} onBack={() => navigate('/messages')} />
      </div>
    </>
  );
}
