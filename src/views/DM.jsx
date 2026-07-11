import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, MessageSquare, Check, X, Search } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';
import NoIndex from '../components/seo/NoIndex';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import MobileBottomNav from '../components/layout/MobileBottomNav';

function timeAgo(date) {
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
                {conv.last_message || 'Start a conversation'}
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

function ThreadPanel({ conversationId, onBack }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [other, setOther] = useState(null);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const load = async () => {
    if (!conversationId) return;
    try {
      const res = await api.get(`/direct/${conversationId}`);
      setMessages(res.data.messages || []);
      setOther(res.data.other_user);
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

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const body = input;
    setInput('');
    try {
      const res = await api.post(`/direct/${conversationId}`, { body });
      setMessages(prev => [...prev, res.data.message]);
    } catch { setInput(body); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
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
      <div style={{ padding: '14px 24px', background: 'rgba(23,28,33,0.4)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, borderBottom: '1px solid rgba(74,68,87,0.15)' }}>
        {onBack && (
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#958da3', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={18} />
          </button>
        )}
        {other && (
          <Link to={`/u/${other.username}`} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, textDecoration: 'none' }}>
            <div style={{ position: 'relative' }}>
              <img src={other.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${other.username}`} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', border: '1px solid #4a4457' }} />
              <div style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, background: '#4cd6fb', borderRadius: '50%', border: '2px solid #0f1419' }} />
            </div>
            <div>
              <div style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: 15, color: '#dee3ea' }}>{other.name}</div>
              <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: '#4cd6fb' }}>Active now · @{other.username}</div>
            </div>
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="dm-scroll" style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} height={44} width={`${35 + i * 8}%`} style={{ alignSelf: i % 2 === 0 ? 'flex-start' : 'flex-end', borderRadius: 16 }} />
            ))}
          </div>
        ) : messages.map(msg => {
          const isMine = msg.sender_id === user.id;
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 10 }}>
              {!isMine && (
                <img src={other?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=other`} alt="" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
              )}
              <div style={{
                maxWidth: '68%',
                padding: '10px 16px',
                borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: isMine ? '#6e00ff' : 'rgba(23,28,33,0.7)',
                border: isMine ? 'none' : '1px solid rgba(74,68,87,0.25)',
                color: isMine ? '#fff' : '#dee3ea',
                fontSize: 13,
                lineHeight: 1.55,
                boxShadow: isMine ? '0 4px 20px rgba(110,0,255,0.3)' : 'none',
              }}>
                {msg.body}
                <div style={{ fontSize: 9, marginTop: 4, opacity: 0.55, textAlign: 'right', fontFamily: '"JetBrains Mono", monospace' }}>
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

      {/* Input */}
      <form onSubmit={handleSend} style={{ padding: '16px 20px', background: 'rgba(23,28,33,0.5)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(74,68,87,0.15)', flexShrink: 0 }}>
        <div className="dm-glass" style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 14, border: '1px solid rgba(74,68,87,0.3)', padding: '6px 6px 6px 16px' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Design a better world…"
            rows={1}
            style={{ flex: 1, resize: 'none', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#dee3ea', fontFamily: '"Outfit", sans-serif', padding: '6px 0', lineHeight: 1.5 }}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            style={{
              background: input.trim() ? '#6e00ff' : '#252a30',
              border: 'none',
              cursor: input.trim() ? 'pointer' : 'default',
              color: input.trim() ? '#fff' : '#4a4457',
              borderRadius: 10,
              padding: '10px 20px',
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: 700,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s',
              boxShadow: input.trim() ? '0 4px 16px rgba(110,0,255,0.4)' : 'none',
              flexShrink: 0,
            }}
          >
            Send <Send size={13} />
          </button>
        </div>
      </form>
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

  useEffect(() => {
    Promise.all([
      api.get('/direct/inbox'),
      api.get('/direct/requests'),
    ]).then(([inboxRes, reqRes]) => {
      setConversations(inboxRes.data.conversations || []);
      setRequests(reqRes.data.requests || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleRequest = async (id, action) => {
    try {
      await api.put(`/direct/requests/${id}`, { action });
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch {}
  };

  const handleConvClick = (conv) => {
    if (isMobile) navigate(`/direct/${conv.id}`);
    else setActiveConv(conv.id);
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
        <div className={`dm-sidebar${(isMobile && activeConv) ? '' : ' show'}`} style={{ borderRight: '1px solid rgba(74,68,87,0.15)', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#171c21' }}>
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
              ) : requests.map(r => (
                <div key={r.id} style={{ padding: '14px 16px', border: '1px solid rgba(74,68,87,0.2)', borderRadius: 12, marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                    <img src={r.sender_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${r.sender_username}`} alt="" style={{ width: 36, height: 36, borderRadius: 8 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: 13, color: '#dee3ea' }}>{r.sender_name}</div>
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
              ))
            )}
          </div>
        </div>

        {/* Thread panel */}
        {!isMobile && <ThreadPanel conversationId={activeConv} />}
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
        height: 'calc(100dvh - 64px - 76px - env(safe-area-inset-bottom, 0px))',
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
      {isMobile && <MobileBottomNav />}
    </>
  );
}

