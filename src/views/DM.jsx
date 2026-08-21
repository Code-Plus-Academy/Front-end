import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, MessageSquare, Check, X, Search, MoreVertical, Trash2, ShieldAlert, ShieldCheck } from 'lucide-react';
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
  const match = text.match(/(https?:\/\/[^\s]+)|(www\.[^\s]+)/i);
  if (!match) return null;
  let url = match[0];
  if (url.startsWith('www.')) url = 'https://' + url;
  return url;
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
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, background: '#4cd6fb', borderRadius: '50%', border: '2px solid #0f1419' }} />
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
  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const menuRef = useRef(null);
  const load = async () => {
    if (!conversationId) return;
    try {
      const res = await api.get(`/direct/${conversationId}`);
      setMessages(res.data.messages || []);
      setOther(res.data.other_user);
      setIsBlocked(Boolean(res.data.is_blocked));
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    setLoading(true);
    load();
    pollRef.current = setInterval(load, 4000);
    return () => clearInterval(pollRef.current);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    if (!window.confirm('Delete this conversation from your inbox?')) return;
    try {
      await api.delete(`/direct/${conversationId}`);
      toast.success('Conversation deleted');
      setMenuOpen(false);
      if (onConversationDeleted) onConversationDeleted(conversationId);
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative', overflow: 'hidden' }}>
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
              <img src={other.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${other.username}`} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', border: '1px solid #4a4457' }} />
              <div style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, background: isBlocked ? '#ef4444' : '#4cd6fb', borderRadius: '50%', border: '2px solid #0f1419' }} />
            </div>
            <div>
              <div style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: 15, color: '#dee3ea' }}>{other.name}</div>
              <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: isBlocked ? '#ef4444' : '#4cd6fb' }}>
                {isBlocked ? 'Blocked' : `Active now · @${other.username}`}
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
      <div className="dm-scroll" style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} height={44} width={`${35 + i * 8}%`} style={{ alignSelf: i % 2 === 0 ? 'flex-start' : 'flex-end', borderRadius: 16 }} />
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
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 10 }}>
              {!isMine && (
                <img src={other?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=other`} alt="" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
              )}
              <div style={{
                maxWidth: isSharedContent ? '304px' : (hasUrl ? '340px' : '68%'),
                width: isSharedContent || hasUrl ? '100%' : 'auto',
                padding: isSharedContent ? (caption ? '6px 6px 8px 6px' : '0') : '10px 14px',
                borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: isSharedContent && !caption ? 'transparent' : (isMine ? '#6e00ff' : 'rgba(23,28,33,0.7)'),
                border: (isSharedContent && !caption) ? 'none' : (isMine ? 'none' : '1px solid rgba(74,68,87,0.25)'),
                color: isMine ? '#fff' : '#dee3ea',
                fontSize: 13,
                lineHeight: 1.55,
                boxShadow: (isSharedContent && !caption) ? 'none' : (isMine ? '0 4px 20px rgba(110,0,255,0.3)' : 'none'),
                overflow: 'hidden',
              }}>
                {/* 1. Shared Content Card */}
                {isSharedContent && attachment ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <SharedContentCard attachment={attachment} />
                    {caption && (
                      <div style={{
                        padding: '6px 10px 2px 10px',
                        fontSize: 13,
                        lineHeight: 1.5,
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
                      padding: '5px 8px',
                      marginBottom: 8,
                    }}>
                      <img
                        src={attachment.media_snapshot_url}
                        alt="Story preview"
                        style={{ width: 32, height: 42, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: 9.5, color: '#4cd6fb', fontFamily: 'monospace', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Story Reply
                        </span>
                        {attachment.caption && (
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#dee3ea', opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {attachment.caption}
                          </p>
                        )}
                      </div>
                    </div>
                    {msg.body && <MessageTextWithLinkPreview text={msg.body} isMine={isMine} linkPreview={msg.link_preview || attachment?.link_preview} />}
                  </>
                ) : (
                  /* 3. Regular Text Message with Link Preview */
                  msg.body && <MessageTextWithLinkPreview text={msg.body} isMine={isMine} linkPreview={msg.link_preview || attachment?.link_preview} />
                )}

                <div style={{ fontSize: 9, marginTop: isSharedContent && !caption ? 4 : 4, opacity: 0.55, textAlign: 'right', fontFamily: '"JetBrains Mono", monospace', paddingRight: isSharedContent && !caption ? 4 : 0 }}>
                  {timeAgo(msg.created_at)}
                </div>
              </div>
              {isMine && (
                <img src={user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username}`} alt="" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
 
       {/* WhatsApp Refactored MessageInput Component */}
       <MessageInput
         onSend={async (messageText, linkPreview) => {
           if (!messageText.trim() || isBlocked) return;
           try {
             const payload = { body: messageText };
             if (linkPreview) {
               payload.link_preview = linkPreview;
             }
             const res = await api.post(`/direct/${conversationId}`, payload);
             setMessages(prev => [...prev, res.data.message]);
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
        gridTemplateColumns: isMobile ? '1fr' : '300px 1fr',
        height: 'calc(100vh - 104px)',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid rgba(74,68,87,0.2)',
        background: '#0f1419',
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
