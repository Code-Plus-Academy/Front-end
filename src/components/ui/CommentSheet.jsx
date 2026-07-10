import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

function timeAgo(date) {
  if (!date) return '';
  const m = Math.floor((Date.now() - new Date(date)) / 60000);
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.floor(m / 60)}h`;
  return `${Math.floor(m / 1440)}d`;
}

const T = {
  accent: '#a78bfa',
  gradient: 'linear-gradient(135deg, #a78bfa 0%, #c084fc 100%)',
};

export default function CommentSheet({ isOpen, onClose, entityId, entityType = 'post', user }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!isOpen || !entityId) return;
    setLoading(true);
    const endpoint = entityType === 'video' ? `/videos/${entityId}/comments` : `/posts/${entityId}/comments`;
    api.get(`${endpoint}?limit=50`)
      .then(r => setComments(r.data.comments || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen, entityId, entityType]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user || posting) return;
    setPosting(true);
    try {
      const endpoint = entityType === 'video' ? `/videos/${entityId}/comments` : `/posts/${entityId}/comments`;
      const payload = entityType === 'video' ? { text: newComment } : { body: newComment };
      const res = await api.post(endpoint, payload);
      if (res.data.comment) {
        setComments(prev => [res.data.comment, ...prev]);
        setNewComment('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position:'fixed', inset:0, zIndex:99999, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', animation:'fadeIn 0.2s ease-out' }} onClick={onClose} />
      <div style={{
        position:'relative', width:'100%', height:'50vh', background:'#111',
        borderTopLeftRadius:24, borderTopRightRadius:24, padding:'24px 20px',
        display:'flex', flexDirection:'column',
        animation:'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.5)'
      }}>
        {/* Drag handle */}
        <div style={{ width:48, height:5, background:'rgba(255,255,255,0.2)', borderRadius:4, margin:'0 auto 24px' }} onClick={onClose} />
        
        <h3 style={{ fontFamily:"'Space Grotesk','Syne',sans-serif", fontSize:20, color:'#fff', margin:'0 0 20px', fontWeight:700 }}>
          Comments <span style={{ color:'rgba(255,255,255,0.5)', fontSize:15 }}>({comments.length})</span>
        </h3>

        {/* Comments list */}
        <div className="hide-scrollbar" style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:20, marginBottom:16 }}>
          {loading ? (
             <div style={{ textAlign:'center', color:'rgba(255,255,255,0.5)', marginTop:40, fontFamily:"'JetBrains Mono',monospace", fontSize:12 }}>Loading...</div>
          ) : comments.length === 0 ? (
            <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:'rgba(255,255,255,0.5)', textAlign:'center', marginTop:40 }}>No comments yet. Start the conversation!</p>
          ) : comments.map(c => (
            <div key={c.id} style={{ display:'flex', gap:12 }}>
              <img src={c.user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${c.user?.username}`} alt="" style={{ width:36, height:36, borderRadius:'50%', flexShrink:0, border:`1px solid rgba(255,255,255,0.1)`, objectFit: 'cover' }} />
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:4 }}>
                  <span style={{ fontFamily:"'Space Grotesk','Syne',sans-serif", fontWeight:700, fontSize:13, color:'#fff' }}>{c.user?.name || c.user?.username}</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:'rgba(255,255,255,0.5)' }}>{timeAgo(c.created_at)}</span>
                </div>
                <p style={{ fontFamily:"'Outfit',sans-serif", fontSize:14, color:'rgba(255,255,255,0.8)', margin:0, lineHeight:1.55 }}>{c.text || c.body}</p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Input */}
        {user ? (
          <form onSubmit={handlePost} style={{ display:'flex', gap:12, alignItems:'flex-end' }}>
            <img src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`} alt="" style={{ width:36, height:36, borderRadius:'50%', flexShrink:0, marginBottom:4, objectFit: 'cover' }} />
            <div style={{ flex:1, background:'rgba(255,255,255,0.1)', borderRadius:24, padding:'12px 16px', display:'flex', gap:10, alignItems:'flex-end' }}>
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handlePost(e);
                  }
                }}
                placeholder="Add a comment..."
                rows={1}
                style={{ flex:1, background:'transparent', border:'none', outline:'none', fontFamily:"'Outfit',sans-serif", fontSize:14, color:'#fff', resize:'none', lineHeight:1.5, maxHeight:80, overflow:'auto' }}
                onInput={e => { e.target.style.height='auto'; e.target.style.height=`${e.target.scrollHeight}px`; }}
              />
              <button type="submit" disabled={!newComment.trim() || posting}
                style={{ flexShrink:0, width:36, height:36, borderRadius:18, border:'none', cursor:'pointer',
                  background: newComment.trim() ? T.gradient : 'rgba(255,255,255,0.1)',
                  color: newComment.trim() ? '#fff':'rgba(255,255,255,0.3)',
                  display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </form>
        ) : (
          <div style={{ textAlign:'center', padding:'12px 0', background:'rgba(255,255,255,0.05)', borderRadius:16 }}>
             <a href={`/login`} style={{ fontFamily:"'Space Grotesk','Syne',sans-serif", fontWeight:600, fontSize:14, color:T.accent, textDecoration:'none' }}>Log in to comment</a>
          </div>
        )}
      </div>
    </div>
  );
}
