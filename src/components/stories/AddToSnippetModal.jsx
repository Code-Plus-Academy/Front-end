'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check, Loader2, Bookmark } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';

export default function AddToSnippetModal({ isOpen, onClose, storyId, currentStoryUrl }) {
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    fetchSnippets();
  }, [isOpen]);

  const fetchSnippets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/snippets/user/me');
      setSnippets(res.data?.snippets || []);
    } catch {
      try {
        const meRes = await api.get('/auth/me');
        if (meRes.data?.user?.username) {
          const sRes = await api.get(`/snippets/user/${meRes.data.user.username}`);
          setSnippets(sRes.data?.snippets || []);
        }
      } catch {
        setSnippets([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (newTitle.trim().length > 15) {
      toast.error('Title must be 15 characters or less');
      return;
    }

    setSavingId('new');
    try {
      const res = await api.post('/snippets', {
        title: newTitle.trim().slice(0, 15),
        cover_image_url: currentStoryUrl || null,
        story_id: storyId,
      });
      toast.success('Snippet created & story saved!');
      setSnippets(prev => [res.data.snippet, ...prev]);
      setCreating(false);
      setNewTitle('');
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create snippet');
    } finally {
      setSavingId(null);
    }
  };

  const handleAddToExisting = async (snippetId) => {
    setSavingId(snippetId);
    try {
      await api.post(`/snippets/${snippetId}/stories`, {
        story_id: storyId,
      });
      toast.success('Added to Snippet!');
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add to snippet');
    } finally {
      setSavingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          style={{
            width: '100%',
            maxWidth: 380,
            background: '#0d131f',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 20,
            padding: 22,
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
            color: '#fff',
            position: 'relative',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bookmark size={18} color="#00dbe9" />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display, sans-serif)' }}>
                Add to Snippet
              </h3>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Create New Toggle */}
          {!creating ? (
            <button
              type="button"
              onClick={() => setCreating(true)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 14,
                background: 'rgba(0, 219, 233, 0.08)',
                border: '1px dashed rgba(0, 219, 233, 0.4)',
                color: '#00dbe9',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: 16,
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(0, 219, 233, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Plus size={16} />
              </div>
              <span>New Snippet</span>
            </button>
          ) : (
            <form onSubmit={handleCreateNew} style={{ marginBottom: 16 }}>
              <div style={{
                display: 'flex',
                gap: 8,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(0, 219, 233, 0.4)',
                borderRadius: 14,
                padding: '4px 6px 4px 14px',
              }}>
                <input
                  type="text"
                  placeholder="Snippet name (max 15 chars)"
                  value={newTitle}
                  maxLength={15}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#fff',
                    fontSize: 13,
                  }}
                />
                <button
                  type="submit"
                  disabled={!newTitle.trim() || savingId === 'new'}
                  style={{
                    background: '#00dbe9',
                    border: 'none',
                    color: '#020617',
                    borderRadius: 10,
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: newTitle.trim() ? 'pointer' : 'default',
                    opacity: newTitle.trim() ? 1 : 0.5,
                  }}
                >
                  {savingId === 'new' ? <Loader2 size={14} className="animate-spin" /> : 'Create'}
                </button>
              </div>
            </form>
          )}

          {/* Snippet List */}
          <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                <Loader2 size={20} className="animate-spin" color="#00dbe9" />
              </div>
            ) : snippets.length === 0 && !creating ? (
              <p style={{ color: '#64748b', fontSize: 12, textAlign: 'center', margin: '16px 0' }}>
                No snippets yet. Create your first one above!
              </p>
            ) : (
              snippets.map((snip) => (
                <button
                  key={snip.id}
                  type="button"
                  onClick={() => handleAddToExisting(snip.id)}
                  disabled={savingId === snip.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    color: '#f0f2f8',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  className="hover:border-cyan-500/40 hover:bg-white/[0.06]"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(0, 219, 233, 0.3)',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}>
                      {snip.cover_image_url ? (
                        <img src={snip.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00dbe9', fontSize: 12, fontWeight: 700 }}>
                          {snip.title?.[0]?.toUpperCase() || 'S'}
                        </div>
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {snip.title}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>
                        {snip.items_count || (snip.stories?.length) || 0} stories
                      </p>
                    </div>
                  </div>

                  {savingId === snip.id ? (
                    <Loader2 size={16} className="animate-spin" color="#00dbe9" />
                  ) : (
                    <span style={{ fontSize: 11, color: '#00dbe9', fontWeight: 600 }}>+ Add</span>
                  )}
                </button>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
