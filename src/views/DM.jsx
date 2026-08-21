import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, MessageSquare, Check, X, Search, MoreVertical, Trash2, ShieldAlert, ShieldCheck, Reply } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';
import NoIndex from '../components/seo/NoIndex';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import SharedContentCard from '../components/direct/SharedContentCard';
import LinkPreviewCard from '../components/direct/LinkPreviewCard';
import LinkPreviewSkeleton from '../components/direct/LinkPreviewSkeleton';
import MessageInput from '../components/direct/MessageInput';
import { toast } from 'react-hot-toast';

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
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex"
      >
        <Reply size={13} />
      </button>

      {/* Message Content */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 10,
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

function ConversationItem({ conv, active, onClick }) {
  return (
    <div onClick={onClick} className={`dm-conv-item ${active ? 'active' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img
              src={conv.other_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${conv.other_username}`}
              alt=""
              style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', border: '1px solid #4a4457' }}
            />
            <div style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 10,
              height: 10,
              background: conv.other_is_active ? '#10b981' : '#64748b',
              borderRadius: '50%',
              border: '2px solid #0f1419'
            }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <span style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: 13, color: active ? '#d0bcff' : '#dee3ea', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>
                {conv.other_name}
              </span>
              <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, color: '#6b7280', flexShrink: 0, marginLeft: 8 }}>
                {timeAgo(conv.last_message_at)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {conv.last_message_type === 'story_reply' 
                  ? '📷 Replying to story' 
                  : (conv.last_message_type === 'shared_video' 
                    ? '🎬 Shared a video' 
                    : (conv.last_message_type === 'shared_short' 
                      ? '⚡ Shared a short' 
                      : (conv.last_message_type?.startsWith('shared_') 
                        ? '🔗 Shared a post' 
                        : (conv.last_message || 'Start a conversation'))))}
              </span>
              {conv.unread_count > 0 && (
                <span style={{ minWidth: 16, height: 16, background: '#4cd6fb', borderRadius: '50%', fontSize: 8, fontWeight: 700, color: '#0f1419', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', flexShrink: 0 }}>
                  {conv.unread_count}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThreadPanel({ conversationId, onBack, onConversationDeleted }) {
  const { user } = useAuth();
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
      const res = await api.get(`/direct/${conversationId}`);
      const newMessages = res.data.messages || [];
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

      setOther(res.data.other_user);
      setIsBlocked(Boolean(res.data.is_blocked));
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
      await api.delete(`/direct/${conversationId}`);
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
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#4a4457' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(110,0,255,0.1)', border: '1px solid rgba(110,0,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <MessageSquare size={32} color="#6e00ff" />
          </div>
          <p style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: 18, color: '#dee3ea', textAlign: 'center', marginBottom: 8 }}>Select a Conversation</p>
          <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: '#6b7280', textAlign: 'center' }}>Choose from your inbox to begin</p>
        </div>
      </div>
    );
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
          const isStoryReply = msg.type === 'story_reply' && Boolean(attachment?.media_snapshot_url);
          const isSharedContent = (
            msg.type === 'shared_post' ||
            msg.type === 'shared_video' ||
            msg.type === 'shared_short' ||
            msg.type === 'shared_article' ||
            msg.type === 'shared_note' ||
            Boolean(attachment && (attachment.content_type || attachment.post_id || attachment.content_id || attachment.media_snapshot_url || attachment.title))
          ) && !isStoryReply;

          const isEmojiOnly = Boolean(msg.body && isOnlyEmojiMessage(msg.body) && !isSharedContent && !isStoryReply);

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

          const hasUrl = Boolean(extractFirstUrl(msg.body));

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
                maxWidth: isSharedContent ? '380px' : (hasUrl ? '400px' : (isEmojiOnly ? 'auto' : '72%')),
                width: isSharedContent || hasUrl ? '100%' : 'auto',
                padding: isEmojiOnly ? '2px 4px' : (isSharedContent ? (caption ? '8px 8px 10px 8px' : '0') : '12px 18px'),
                borderRadius: isMine ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                background: isEmojiOnly || (isSharedContent && !caption)
                  ? 'transparent'
                  : (isMine ? 'linear-gradient(135deg, #7c1cff 0%, #5d02ee 100%)' : 'rgba(23,28,33,0.88)'),
                border: isEmojiOnly || (isSharedContent && !caption)
                  ? 'none'
                  : (isMine ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid rgba(74,68,87,0.35)'),
                color: isMine ? '#fff' : '#dee3ea',
                fontSize: isEmojiOnly ? 40 : 14.5,
                lineHeight: isEmojiOnly ? 1.2 : 1.6,
                boxShadow: isEmojiOnly || (isSharedContent && !caption)
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

                {/* 1. Shared Content Card */}
                {isSharedContent && attachment ? (
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
                  /* 2. Story Reply Preview Card */
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
                  /* 3. Regular Text Message with Link Preview or Large Emoji */
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
            if (linkPreview) {
              payload.link_preview = linkPreview;
            }
            if (replyTarget) {
              payload.reply_to = {
                message_id: replyTarget.message_id,
                body: replyTarget.body,
                sender_name: replyTarget.sender_name,
                sender_username: replyTarget.sender_username,
              };
              setReplyingTo(null);
            }
            const res = await api.post(`/direct/${conversationId}`, payload);
            if (res.data?.message) {
              setMessages(prev => [...prev, res.data.message]);
              prevMessagesCountRef.current += 1;
              prevLastMessageIdRef.current = res.data.message.id;
              isNearBottomRef.current = true;
              requestAnimationFrame(() => {
                bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
              });
            }
          } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to send message');
          }
        }}
        disabled={isBlocked}
        placeholder={isBlocked ? "Cannot send messages to a blocked user" : "Type a message…"}
        isDark={true}
        themeAccent="#6e00ff"
      />
    </div>
  );
}

export function DMInbox() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('inbox');
  const [activeConv, setActiveConv] = useState(null);
  const [query, setQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const readMobile = () => typeof window !== 'undefined' && window.innerWidth < 769;
    setIsMobile(readMobile());
    const onResize = () => setIsMobile(readMobile());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const loadInbox = () => {
    Promise.all([
      api.get('/direct/inbox'),
      api.get('/direct/requests'),
    ]).then(([inboxRes, reqRes]) => {
      setConversations(inboxRes.data.conversations || []);
      setRequests(reqRes.data.requests || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInbox();
  }, []);

  const handleRequest = async (id, action) => {
    const status = action === 'accept' ? 'accepted' : 'declined';
    try {
      await api.put(`/direct/requests/${id}`, { status });
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

  const filtered = conversations.filter(c =>
    !query || c.other_name?.toLowerCase().includes(query.toLowerCase()) || c.other_username?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <Helmet><title>Messages — Code+ Academy</title></Helmet>
      <NoIndex />
      <style>{STYLES}</style>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'clamp(320px, 26vw, 380px) 1fr',
        height: 'calc(100vh - 100px)',
        maxHeight: '1000px',
        width: '100%',
        maxWidth: '1600px',
        margin: '0 auto',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid rgba(74,68,87,0.25)',
        background: '#0f1419',
        boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
      }}>
        {/* Left sidebar */}
        <div className={`dm-sidebar${(isMobile && activeConv) ? '' : ' show'}`} style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--s2)' }}>
          {/* Header */}
          <div style={{ padding: '20px 20px 12px', flexShrink: 0 }}>
            <h2 style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 800, fontSize: 22, color: '#dee3ea', marginBottom: 14, letterSpacing: '-0.5px' }}>Inbox</h2>
            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <Search size={14} color="#6b7280" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search messages…"
                style={{ width: '100%', background: '#252a30', border: '1px solid #30353b', borderRadius: 8, padding: '8px 12px 8px 34px', fontSize: 12, color: '#dee3ea', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 6 }}>
              {['inbox', 'requests'].map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    fontFamily: '"JetBrains Mono", monospace', fontSize: 10, padding: '5px 14px', borderRadius: 999,
                    border: `1px solid ${tab === t ? '#6e00ff' : '#30353b'}`,
                    background: tab === t ? 'rgba(110,0,255,0.15)' : 'transparent',
                    color: tab === t ? '#d0bcff' : '#6b7280',
                    cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.8px', transition: 'all 0.2s', position: 'relative',
                  }}
                >
                  {t}
                  {t === 'requests' && requests.length > 0 && (
                    <span style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, background: '#4cd6fb', borderRadius: '50%', fontSize: 8, fontWeight: 700, color: '#0f1419', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {requests.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="dm-scroll" style={{ flex: 1, overflowY: 'auto', padding: '4px 10px 16px' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 6px' }}>
                {[...Array(5)].map((_, i) => <Skeleton key={i} height={64} style={{ borderRadius: 12 }} />)}
              </div>
            ) : tab === 'inbox' ? (
              filtered.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#4a4457', fontSize: 12 }}>
                  <MessageSquare size={28} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                  <p style={{ fontFamily: '"JetBrains Mono", monospace' }}>No conversations yet</p>
                </div>
              ) : filtered.map(c => (
                <ConversationItem key={c.id} conv={c} active={activeConv === c.id} onClick={() => handleConvClick(c)} />
              ))
            ) : (
              requests.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#4a4457', fontSize: 12 }}>
                  <p style={{ fontFamily: '"JetBrains Mono", monospace' }}>No pending requests</p>
                </div>
              ) : requests.map(r => {
                const name = r.sender_name || r.name || 'User';
                const username = r.sender_username || r.username || 'user';
                const avatar = r.sender_avatar || r.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
                return (
                  <div key={r.id} style={{ padding: '14px 16px', border: '1px solid rgba(74,68,87,0.2)', borderRadius: 12, marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                      <img src={avatar} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: 13, color: '#dee3ea' }}>{name}</div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{r.body}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleRequest(r.id, 'accept')} style={{ flex: 1, padding: '7px', background: 'rgba(110,0,255,0.15)', border: '1px solid rgba(110,0,255,0.4)', borderRadius: 8, color: '#d0bcff', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <Check size={12} /> Accept
                      </button>
                      <button onClick={() => handleRequest(r.id, 'decline')} style={{ flex: 1, padding: '7px', background: 'transparent', border: '1px solid #30353b', borderRadius: 8, color: '#6b7280', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <X size={12} /> Decline
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Thread panel */}
        {!isMobile && <ThreadPanel conversationId={activeConv} onConversationDeleted={handleConversationDeleted} />}
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
      <Helmet><title>Message — Code+ Academy</title></Helmet>
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
