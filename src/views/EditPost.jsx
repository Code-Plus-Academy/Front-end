'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Code2, ArrowLeft, Save, Loader2, X, Globe, Lock, Users,
  AlertCircle, CheckCircle2, Trash2, ChevronLeft, ChevronRight,
  Image as ImageIcon, Video as VideoIcon, GripVertical, Undo2, Sparkles, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NoIndex from '../components/seo/NoIndex';
import api from '../api/axios';
import {
  getGraphQLPostBySlugOrId,
  updateGraphQLPost,
  logGraphQLFallback
} from '../api/graphql';
import { useAuth } from '../context/AuthContext';
import CodeSnippetCard, { extractCodeBlock, detectLanguage } from '../components/posts/CodeSnippetCard';

let toast = { success: () => {}, error: () => {} };
try { toast = require('react-hot-toast').default; } catch {}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = (e) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);
  return matches;
}

const CODE_LANGUAGES = [
  { value: 'auto', label: '✨ Auto Detect' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go (Golang)' },
  { value: 'rust', label: 'Rust' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'sql', label: 'SQL / PostgreSQL' },
  { value: 'html', label: 'HTML / CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'bash', label: 'Bash / Shell' },
  { value: 'solidity', label: 'Solidity' },
];

const T = {
  cyan: '#00dbe9',
  cyanGlow: 'rgba(0, 219, 233, 0.15)',
  accent: '#2563eb',
  accentGlow: 'rgba(37, 99, 235, 0.25)',
  fontMono: '"JetBrains Mono", monospace',
  fontHead: '"Space Grotesk", sans-serif',
  fontBody: '"Geist", -apple-system, sans-serif',
};

export default function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [post, setPost] = useState(null);
  const [saveError, setSaveError] = useState(null);

  // Form fields
  const [caption, setCaption] = useState('');
  const [includeCode, setIncludeCode] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('auto');
  const [codeTitle, setCodeTitle] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');
  const [visibility, setVisibility] = useState('public');

  // Media state
  const [mediaList, setMediaList] = useState([]);
  const [stagedDeletions, setStagedDeletions] = useState(() => new Set());
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // Initial snapshot to determine dirty state
  const initialSnapshotRef = useRef(null);

  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    background: 'var(--s2, #070a0e)',
    border: '1px solid var(--border, rgba(255,255,255,0.08))',
    borderRadius: 8,
    padding: isMobile ? '8px 10px' : '10px 12px',
    color: 'var(--text, #f0f2f8)',
    fontSize: isMobile ? 13 : 14,
    fontFamily: T.fontBody,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const labelStyle = {
    display: 'block',
    fontFamily: T.fontMono,
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--primary, #00dbe9)',
    textTransform: 'lowercase',
    letterSpacing: '0.04em',
    marginBottom: 4,
  };

  useEffect(() => {
    let mounted = true;
    async function fetchPost() {
      try {
        setLoading(true);
        let p;
        try {
          p = await getGraphQLPostBySlugOrId(id);
          if (!p) throw new Error('Post not found in GraphQL');
        } catch (gqlErr) {
          logGraphQLFallback({ feature: 'Feed', operation: 'getPostForEdit', error: gqlErr, fallbackEndpoint: `/posts/${id}` });
          const res = await api.get(`/posts/${id}`);
          p = res.data.post;
        }
        if (!mounted) return;

        if (!p) {
          toast.error('Post not found');
          navigate('/feed');
          return;
        }

        // Authorize check - strictly fail closed for non-owners
        const currentUserId = user?.id;
        const authorId = p.creator_id || p.creator?.id;
        const isAdmin = user?.role === 'admin';
        if (user && authorId && String(currentUserId) !== String(authorId) && !isAdmin) {
          toast.error('You do not have permission to edit this post');
          navigate(`/posts/${id}`);
          return;
        }

        setPost(p);
        setDifficulty(p.difficulty || 'beginner');
        setVisibility(p.visibility || 'public');

        const initialTags = Array.isArray(p.tags) ? p.tags : [];
        setTags(initialTags);

        // Normalize media list sorted by sort_order
        const initialMedia = (p.media || []).map((m, idx) => ({
          id: String(m.id || m._id || idx),
          media_url: m.media_url || m.url || m.storage_url || '',
          media_type: m.media_type || m.mediaType || (m.file_type?.startsWith('video/') ? 'video' : 'image'),
          sort_order: Number(m.sort_order ?? m.sortOrder ?? idx),
          aspect_ratio: m.aspect_ratio || m.aspectRatio || null,
        })).sort((a, b) => a.sort_order - b.sort_order);

        setMediaList(initialMedia);

        // Extract code block if existing
        const raw = p.description || p.caption || p.content || p.title || '';
        const { beforeText, codeSnippet: parsedCode } = extractCodeBlock(raw);

        let initialCode = '';
        let initialLang = 'auto';
        let initialCap = raw;
        let hasCode = false;

        if (parsedCode) {
          hasCode = true;
          initialCode = parsedCode.code || '';
          initialLang = parsedCode.language || 'auto';
          initialCap = beforeText || '';
          setIncludeCode(true);
          setCodeSnippet(initialCode);
          setCodeLanguage(initialLang);
          setCaption(initialCap);
        } else {
          setCaption(raw);
        }

        initialSnapshotRef.current = {
          caption: initialCap,
          tags: initialTags,
          difficulty: p.difficulty || 'beginner',
          visibility: p.visibility || 'public',
          mediaIds: initialMedia.map(m => m.id),
          includeCode: hasCode,
          codeSnippet: initialCode,
        };
      } catch (err) {
        if (!mounted) return;
        toast.error('Failed to load post for editing');
        navigate('/feed');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (id) fetchPost();

    return () => { mounted = false; };
  }, [id, user, navigate]);

  // Active remaining media (excluding staged deletions)
  const activeMedia = useMemo(() => {
    return mediaList.filter(m => !stagedDeletions.has(m.id));
  }, [mediaList, stagedDeletions]);

  // Determine dirty state
  const isDirty = useMemo(() => {
    if (!initialSnapshotRef.current) return false;
    const snap = initialSnapshotRef.current;
    if (caption !== snap.caption) return true;
    if (difficulty !== snap.difficulty) return true;
    if (visibility !== snap.visibility) return true;
    if (includeCode !== snap.includeCode) return true;
    if (includeCode && codeSnippet !== snap.codeSnippet) return true;
    if (tags.length !== snap.tags.length || !tags.every((t, i) => t === snap.tags[i])) return true;
    if (stagedDeletions.size > 0) return true;
    if (activeMedia.length !== snap.mediaIds.length) return true;
    if (!activeMedia.every((m, i) => m.id === snap.mediaIds[i])) return true;
    return false;
  }, [caption, difficulty, visibility, includeCode, codeSnippet, tags, stagedDeletions, activeMedia]);

  // Warn before discarding unsaved edits via beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Safe navigation handler
  const handleSafeBack = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      navigate(-1);
    }
  };

  // Move media item in carousel order
  const moveMedia = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= activeMedia.length) return;
    const itemToMove = activeMedia[fromIndex];
    const newActive = [...activeMedia];
    newActive.splice(fromIndex, 1);
    newActive.splice(toIndex, 0, itemToMove);

    // Merge reordered active items back with deleted items
    const deletedItems = mediaList.filter(m => stagedDeletions.has(m.id));
    setMediaList([...newActive, ...deletedItems]);
  };

  // Drag-and-drop handlers
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', String(index));
    setDraggedIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!isNaN(sourceIndex) && sourceIndex !== targetIndex) {
      moveMedia(sourceIndex, targetIndex);
    }
    setDraggedIndex(null);
  };

  // Stage media deletion with minimum-1-media invariant protection
  const handleStageDelete = (mediaId) => {
    if (activeMedia.length <= 1) {
      toast.error('A post must have at least one media item.');
      return;
    }
    setPendingDeleteId(mediaId);
  };

  const confirmDelete = () => {
    if (!pendingDeleteId) return;
    setStagedDeletions(prev => {
      const next = new Set(prev);
      next.add(pendingDeleteId);
      return next;
    });
    setPendingDeleteId(null);
  };

  const undoDelete = (mediaId) => {
    setStagedDeletions(prev => {
      const next = new Set(prev);
      next.delete(mediaId);
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasCode = includeCode && codeSnippet.trim().length > 0;
    if (!caption.trim() && !hasCode && activeMedia.length === 0) {
      toast.error('Please enter a caption or include media.');
      return;
    }

    if (activeMedia.length === 0 && mediaList.length > 0) {
      toast.error('Cannot delete all media. A post must have at least one media item.');
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      let finalDescription = caption.trim();
      if (hasCode) {
        const finalLang = (codeLanguage === 'auto' || !codeLanguage)
          ? detectLanguage(codeSnippet)
          : codeLanguage;

        finalDescription = finalDescription
          ? `${finalDescription}\n\n\`\`\`${finalLang}\n${codeSnippet.trim()}\n\`\`\``
          : `\`\`\`${finalLang}\n${codeSnippet.trim()}\n\`\`\``;
      }

      // Compute contiguous 0..N-1 media reorder payload for active media
      const hasReordered = !activeMedia.every((m, idx) => initialSnapshotRef.current?.mediaIds[idx] === m.id);
      const mediaReorder = (hasReordered || stagedDeletions.size > 0) && activeMedia.length > 0
        ? activeMedia.map((m, idx) => ({ mediaId: String(m.id), sortOrder: idx }))
        : undefined;

      const mediaDeletions = stagedDeletions.size > 0
        ? Array.from(stagedDeletions).map(String)
        : undefined;

      const input = {
        description: finalDescription,
        tags,
        difficulty,
        visibility,
        mediaDeletions,
        mediaReorder,
      };

      try {
        await updateGraphQLPost(id, input);
      } catch (gqlErr) {
        logGraphQLFallback({ feature: 'Feed', operation: 'updatePost', error: gqlErr, fallbackEndpoint: `/posts/${id}` });
        // Fallback to REST PATCH if GraphQL fails
        await api.patch(`/posts/${id}`, {
          description: finalDescription,
          tags,
          difficulty,
          visibility,
          mediaDeletions,
          mediaReorder,
        });
      }

      toast.success('Post updated successfully!');
      navigate(`/posts/${id}`);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to update post';
      setSaveError(errMsg);
      toast.error(errMsg);
      // Crucial: We do NOT wipe user edits or reset the form here!
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--primary, #00dbe9)', fontFamily: T.fontMono, fontSize: 13 }}>
          <Loader2 className="animate-spin" size={20} />
          <span>Loading post...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: 780,
      margin: isMobile ? '16px auto 0' : '24px auto 0',
      padding: isMobile ? '12px 8px 90px' : '20px 16px 90px',
      boxSizing: 'border-box',
    }}>
      <NoIndex />
      <Helmet>
        <title>Edit Post | FocusGram</title>
      </Helmet>

      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: isMobile ? 8 : 12,
        padding: '0 2px',
      }}>
        <button
          type="button"
          onClick={handleSafeBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--s2, rgba(255,255,255,0.05))',
            border: '1px solid var(--border, rgba(255,255,255,0.1))',
            color: 'var(--text, #f0f2f8)',
            padding: isMobile ? '5px 12px' : '6px 14px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isDirty && (
            <span style={{
              fontSize: 11,
              fontFamily: T.fontMono,
              color: 'var(--accent-purple, #a855f7)',
            }}>
              ● unsaved changes
            </span>
          )}
          <span style={{
            fontSize: 10,
            fontFamily: T.fontMono,
            color: 'var(--primary, #00dbe9)',
            background: 'rgba(0, 219, 233, 0.1)',
            border: '1px solid rgba(0, 219, 233, 0.3)',
            padding: '2px 8px',
            borderRadius: 4,
            fontWeight: 700,
          }}>
            EDIT MODE
          </span>
        </div>
      </div>

      {/* Main Card */}
      <div style={{
        background: 'var(--s1, #0a0e14)',
        border: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
        borderRadius: isMobile ? 12 : 16,
        padding: isMobile ? '14px 12px' : '20px 24px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        <h1 style={{
          margin: '0 0 2px',
          fontSize: isMobile ? 18 : 22,
          fontWeight: 800,
          fontFamily: T.fontHead,
          color: 'var(--text, #fff)',
          letterSpacing: '-0.02em',
        }}>
          Edit Post
        </h1>
        <p style={{
          margin: isMobile ? '0 0 12px' : '0 0 16px',
          fontSize: 12,
          color: 'var(--dim, #94a3b8)',
        }}>
          Reorder or remove carousel media, edit your caption, code snippet, tags, and audience visibility.
        </p>

        {/* Error Banner if last save attempt failed */}
        {saveError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#ef4444',
            fontSize: 13,
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>{saveError} (your changes have been retained)</div>
            <button
              type="button"
              onClick={() => setSaveError(null)}
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 16 }}>
          {/* Media & Carousel Management Section */}
          {mediaList.length > 0 && (
            <div style={{
              background: 'var(--s2, #070a0e)',
              border: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
              borderRadius: 10,
              padding: isMobile ? '12px 10px' : '14px 14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={labelStyle}>
                  // carousel media ({activeMedia.length} active{stagedDeletions.size > 0 ? `, ${stagedDeletions.size} staged for deletion` : ''})
                </span>
                {activeMedia.length <= 1 && (
                  <span style={{ fontSize: 10, color: 'var(--dim, #64748b)', fontFamily: T.fontMono }}>
                    minimum 1 media required
                  </span>
                )}
              </div>

              {/* Media Thumbnails Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(130px, 1fr))' : 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 10,
              }}>
                {activeMedia.map((m, idx) => (
                  <div
                    key={m.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, idx)}
                    style={{
                      position: 'relative',
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: draggedIndex === idx ? '2px dashed var(--primary, #00dbe9)' : '1px solid var(--border, rgba(255,255,255,0.12))',
                      background: 'var(--surface, #0d121a)',
                      aspectRatio: '1',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'grab',
                    }}
                  >
                    {/* Media preview */}
                    <div style={{ flex: 1, position: 'relative', width: '100%', overflow: 'hidden' }}>
                      {m.media_type === 'video' ? (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                          <VideoIcon size={28} color="var(--primary, #00dbe9)" />
                        </div>
                      ) : (
                        <img
                          src={m.media_url}
                          alt={`Carousel item ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}

                      {/* Position Badge */}
                      <span style={{
                        position: 'absolute',
                        top: 6,
                        left: 6,
                        background: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(4px)',
                        color: '#fff',
                        fontSize: 10,
                        fontFamily: T.fontMono,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}>
                        #{idx + 1}
                      </span>

                      {/* Delete button (disabled when only 1 item remaining) */}
                      <button
                        type="button"
                        onClick={() => handleStageDelete(m.id)}
                        disabled={activeMedia.length <= 1}
                        title={activeMedia.length <= 1 ? "Cannot delete the only media item" : "Delete this media item"}
                        style={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          background: activeMedia.length <= 1 ? 'rgba(0,0,0,0.5)' : 'rgba(239, 68, 68, 0.85)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          padding: 4,
                          cursor: activeMedia.length <= 1 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: activeMedia.length <= 1 ? 0.4 : 1,
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    {/* Touch / Accessible Reorder Controls */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(0, 0, 0, 0.65)',
                      padding: '4px 6px',
                      borderTop: '1px solid var(--border, rgba(255,255,255,0.08))',
                    }}>
                      <button
                        type="button"
                        onClick={() => moveMedia(idx, idx - 1)}
                        disabled={idx === 0}
                        aria-label="Move item left"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: idx === 0 ? 'var(--dim, #64748b)' : 'var(--text, #f0f2f8)',
                          cursor: idx === 0 ? 'default' : 'pointer',
                          padding: 2,
                          display: 'flex',
                        }}
                      >
                        <ChevronLeft size={16} />
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, color: 'var(--dim, #64748b)', fontSize: 10 }}>
                        <GripVertical size={12} />
                        <span>drag</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => moveMedia(idx, idx + 1)}
                        disabled={idx === activeMedia.length - 1}
                        aria-label="Move item right"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: idx === activeMedia.length - 1 ? 'var(--dim, #64748b)' : 'var(--text, #f0f2f8)',
                          cursor: idx === activeMedia.length - 1 ? 'default' : 'pointer',
                          padding: 2,
                          display: 'flex',
                        }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Staged Deletions List with Undo */}
              {stagedDeletions.size > 0 && (
                <div style={{ marginTop: 12, borderTop: '1px dashed rgba(239,68,68,0.3)', paddingTop: 10 }}>
                  <div style={{ fontSize: 11, color: '#ef4444', fontFamily: T.fontMono, marginBottom: 6 }}>
                    Staged for deletion upon save:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {Array.from(stagedDeletions).map(delId => {
                      const item = mediaList.find(m => m.id === delId);
                      return (
                        <div
                          key={delId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            padding: '4px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            color: '#fca5a5',
                          }}
                        >
                          <span>Item #{mediaList.findIndex(m => m.id === delId) + 1}</span>
                          <button
                            type="button"
                            onClick={() => undoDelete(delId)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--primary, #00dbe9)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 2,
                              fontSize: 10,
                              fontWeight: 600,
                            }}
                          >
                            <Undo2 size={11} /> Undo
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Caption */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={labelStyle}>// caption</span>
              <span style={{ fontSize: 10, color: 'var(--dim, #64748b)', fontFamily: T.fontMono }}>
                {caption.length} chars
              </span>
            </div>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Write or edit your caption... ✨"
              rows={isMobile ? 3 : 4}
              style={{
                ...inputStyle,
                resize: 'vertical',
                lineHeight: 1.5,
              }}
            />
          </div>

          {/* Code Snippet Module */}
          <div style={{
            background: includeCode ? 'rgba(0, 219, 233, 0.03)' : 'var(--s2, #070a0e)',
            border: `1px solid ${includeCode ? 'rgba(0, 219, 233, 0.35)' : 'var(--border, rgba(255,255,255,0.08))'}`,
            borderRadius: 10,
            padding: isMobile ? '10px 10px' : '14px 14px',
            transition: 'all 0.25s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Terminal size={16} color="var(--primary, #00dbe9)" />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text, #fff)' }}>
                  Code Snippet
                </span>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11, color: 'var(--dim, #94a3b8)' }}>
                <input
                  type="checkbox"
                  checked={includeCode}
                  onChange={e => setIncludeCode(e.target.checked)}
                  style={{ accentColor: 'var(--primary, #00dbe9)' }}
                />
                <span>Include Code</span>
              </label>
            </div>

            <AnimatePresence>
              {includeCode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
                    <div>
                      <span style={labelStyle}>// language</span>
                      <select
                        value={codeLanguage}
                        onChange={e => setCodeLanguage(e.target.value)}
                        style={inputStyle}
                      >
                        {CODE_LANGUAGES.map(lang => (
                          <option key={lang.value} value={lang.value} style={{ background: '#0a0e14' }}>
                            {lang.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span style={labelStyle}>// snippet title (optional)</span>
                      <input
                        value={codeTitle}
                        onChange={e => setCodeTitle(e.target.value)}
                        placeholder="e.g. useDebounce.ts"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      background: 'rgba(0, 0, 0, 0.4)',
                      padding: '4px 8px',
                      borderTopLeftRadius: 8,
                      borderTopRightRadius: 8,
                      border: '1px solid var(--border, rgba(255,255,255,0.08))',
                      borderBottom: 'none',
                      fontSize: 10,
                      fontFamily: T.fontMono,
                      color: 'var(--dim, #64748b)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#00dbe9', fontWeight: 800 }}>&gt;_</span>
                        <span>{codeLanguage === 'auto' ? detectLanguage(codeSnippet) + ' (auto)' : codeLanguage}</span>
                      </div>
                      <span>{codeSnippet.split('\n').length} lines</span>
                    </div>

                    <textarea
                      value={codeSnippet}
                      onChange={e => setCodeSnippet(e.target.value)}
                      placeholder="// Paste your code here..."
                      rows={isMobile ? 5 : 8}
                      spellCheck={false}
                      style={{
                        ...inputStyle,
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: 0,
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        fontSize: 12,
                        lineHeight: 1.45,
                        tabSize: 2,
                      }}
                    />
                  </div>

                  {codeSnippet.trim() && (
                    <div style={{ marginTop: 8 }}>
                      <span style={{ ...labelStyle, fontSize: 9, color: 'var(--primary, #00dbe9)' }}>
                        // Live Card Preview
                      </span>
                      <CodeSnippetCard
                        code={codeSnippet}
                        language={codeLanguage}
                        title={codeTitle}
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Difficulty & Audience Visibility */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
            <div>
              <span style={labelStyle}>// difficulty level</span>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
                style={inputStyle}
              >
                <option value="beginner" style={{ background: '#0a0e14' }}>Beginner</option>
                <option value="intermediate" style={{ background: '#0a0e14' }}>Intermediate</option>
                <option value="advanced" style={{ background: '#0a0e14' }}>Advanced</option>
              </select>
            </div>

            <div>
              <span style={labelStyle}>// audience visibility</span>
              <select
                value={visibility}
                onChange={e => setVisibility(e.target.value)}
                style={inputStyle}
              >
                <option value="public" style={{ background: '#0a0e14' }}>Public (Everyone)</option>
                <option value="followers_only" style={{ background: '#0a0e14' }}>Followers Only</option>
                <option value="subscribers_only" style={{ background: '#0a0e14' }}>Subscribers Only</option>
                <option value="private" style={{ background: '#0a0e14' }}>Private (Only Me)</option>
              </select>
            </div>
          </div>

          {/* Tags / Topics */}
          <div>
            <span style={labelStyle}>// tags / topics (press enter to add)</span>
            <div style={{
              ...inputStyle,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 4,
              alignItems: 'center',
              padding: '5px 8px',
              minHeight: 36,
            }}>
              {tags.map((tag, i) => (
                <span key={i} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: 'rgba(0, 219, 233, 0.12)',
                  border: '1px solid rgba(0, 219, 233, 0.3)',
                  color: 'var(--primary, #00dbe9)',
                  fontSize: 10,
                  fontFamily: T.fontMono,
                  fontWeight: 700,
                }}>
                  #{tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((_, idx) => idx !== i))}
                    style={{ background: 'none', border: 'none', color: 'var(--primary, #00dbe9)', cursor: 'pointer', padding: 0, display: 'flex' }}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}

              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const val = tagInput.trim().replace(/^#/, '').replace(/\s+/g, '-');
                    if (val && !tags.includes(val) && tags.length < 8) {
                      setTags([...tags, val]);
                      setTagInput('');
                    }
                  }
                }}
                placeholder={tags.length === 0 ? "e.g. TypeScript, React, SystemDesign" : "Add tag..."}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text, #f0f2f8)',
                  fontSize: 12,
                  flex: 1,
                  minWidth: 90,
                  fontFamily: T.fontBody,
                }}
              />
            </div>
          </div>

          {/* Submit & Actions */}
          <div style={{
            display: 'flex',
            gap: 8,
            paddingTop: 12,
            justifyContent: 'flex-end',
            borderTop: '1px solid var(--border, rgba(255,255,255,0.06))',
          }}>
            <button
              type="button"
              onClick={handleSafeBack}
              disabled={saving}
              style={{
                padding: isMobile ? '7px 14px' : '8px 16px',
                borderRadius: 20,
                background: 'transparent',
                border: '1px solid var(--border, rgba(255,255,255,0.1))',
                color: 'var(--text, #f0f2f8)',
                cursor: 'pointer',
                fontWeight: 600,
                fontFamily: T.fontBody,
                fontSize: 12,
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: isMobile ? '7px 16px' : '8px 20px',
                borderRadius: 20,
                background: saving ? 'rgba(0, 219, 233, 0.4)' : 'var(--primary, #00dbe9)',
                border: 'none',
                color: '#000',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontFamily: T.fontBody,
                fontSize: 12,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: saving ? 'none' : '0 2px 10px rgba(0, 219, 233, 0.25)',
              }}
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal for Destructive Media Deletion */}
      {pendingDeleteId && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: 16,
        }}>
          <div style={{
            background: 'var(--surface, #0d121a)',
            border: '1px solid var(--border, rgba(255,255,255,0.12))',
            borderRadius: 14,
            padding: 20,
            maxWidth: 380,
            width: '100%',
            textAlign: 'center',
          }}>
            <AlertCircle size={32} color="#ef4444" style={{ margin: '0 auto 10px' }} />
            <h3 style={{ margin: '0 0 6px', fontSize: 16, color: 'var(--text, #f0f2f8)' }}>
              Remove Media Item?
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--sub, #94a3b8)', lineHeight: 1.4 }}>
              This item will be deleted from the post when you save changes. You can undo this before saving.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setPendingDeleteId(null)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  background: 'var(--s2, #070a0e)',
                  border: '1px solid var(--border, rgba(255,255,255,0.1))',
                  color: 'var(--text, #f0f2f8)',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  background: '#ef4444',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Discarding Unsaved Changes */}
      {showDiscardConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: 16,
        }}>
          <div style={{
            background: 'var(--surface, #0d121a)',
            border: '1px solid var(--border, rgba(255,255,255,0.12))',
            borderRadius: 14,
            padding: 20,
            maxWidth: 380,
            width: '100%',
            textAlign: 'center',
          }}>
            <AlertCircle size={32} color="var(--accent-purple, #a855f7)" style={{ margin: '0 auto 10px' }} />
            <h3 style={{ margin: '0 0 6px', fontSize: 16, color: 'var(--text, #f0f2f8)' }}>
              Discard Unsaved Changes?
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--sub, #94a3b8)', lineHeight: 1.4 }}>
              You have unsaved changes that will be lost if you leave now.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  background: 'var(--s2, #070a0e)',
                  border: '1px solid var(--border, rgba(255,255,255,0.1))',
                  color: 'var(--text, #f0f2f8)',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDiscardConfirm(false);
                  navigate(-1);
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.9)',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Discard & Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
