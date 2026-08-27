'use client';

import React, { useState } from 'react';
import { X, Plus, Bookmark, Lock, Globe, Loader2, Folder } from 'lucide-react';
import { getContainerConfig } from '../../../constants/containerConfig';

/**
 * Illustrated empty state folder graphic with soft glowing backdrop,
 * sparkle stars, hanging bookmark ribbon, and center dots matching the design.
 */
function FolderEmptyGraphic({ accent = '#7C3AED' }) {
  return (
    <div style={{
      position: 'relative',
      width: 140,
      height: 140,
      margin: '0 auto 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <svg width="136" height="136" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Soft Circular Backdrop */}
        <circle cx="60" cy="60" r="46" fill={accent} fillOpacity="0.09" />

        {/* Ambient Bursts / Ticks */}
        <line x1="22" y1="46" x2="26" y2="47.5" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <line x1="24" y1="37" x2="27.5" y2="40.5" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <line x1="98" y1="48" x2="94" y2="50" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <line x1="96" y1="58" x2="92.5" y2="56.5" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.6" />

        {/* Sparkle top-right */}
        <path
          d="M87 26 C87 29.5 88.5 31 92 31 C88.5 31 87 32.5 87 36 C87 32.5 85.5 31 82 31 C85.5 31 87 29.5 87 26 Z"
          fill={accent}
        />

        {/* Sparkle bottom-left */}
        <path
          d="M31 68 C31 70.8 32.2 72 35 72 C32.2 72 31 73.2 31 76 C31 73.2 29.8 72 27 72 C29.8 72 31 70.8 31 68 Z"
          fill={accent}
        />

        {/* Back Folder Layer / Tab */}
        <path
          d="M40 37 C40 34.5 42 32.5 44.5 32.5 H55 C57 32.5 58.8 33.6 59.8 35.3 L61.5 38.5 H81.5 C84 38.5 86 40.5 86 43 V48 H36 V41 C36 38.8 37.8 37 40 37 Z"
          fill={accent}
          fillOpacity="0.75"
        />

        {/* Front Main Folder Body */}
        <rect
          x="33"
          y="42"
          width="54"
          height="38"
          rx="7"
          fill="var(--surface, #FFFFFF)"
          stroke={accent}
          strokeWidth="2.2"
        />

        {/* Hanging Bookmark Ribbon on Front Flap */}
        <path
          d="M68 42 V58 L74 53.5 L80 58 V42 H68 Z"
          fill={accent}
          fillOpacity="0.85"
        />

        {/* Folder Content Indicator Dots (...) */}
        <circle cx="53" cy="62" r="1.8" fill={accent} fillOpacity="0.6" />
        <circle cx="58.5" cy="62" r="1.8" fill={accent} fillOpacity="0.6" />
        <circle cx="64" cy="62" r="1.8" fill={accent} fillOpacity="0.6" />
      </svg>
    </div>
  );
}

export default function SaveToContainerModal({
  isOpen,
  onClose,
  item,
  containers = [],
  onToggleItemInContainer,
  onCreateContainer,
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newContainerName, setNewContainerName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen || !item) return null;

  const itemKind = (item.item_kind || item.type || (item.files ? 'post' : 'note')).toLowerCase();

  // Strict 1-to-1 Content Type to Container Type Mapping:
  // Post / Article / Discussion -> Collection ONLY
  // Video / Short -> Playlist ONLY
  // Note / PYQ / Resource / PDF -> Study Pack ONLY
  // Code / Snippet -> Code Vault ONLY
  // Course / Track -> Learning Envelope ONLY
  const inferContainerType = () => {
    if (['video', 'short', 'reel', 'yt_video'].includes(itemKind)) return 'playlist';
    if (['course', 'track', 'syllabus', 'curriculum'].includes(itemKind)) return 'envelope';
    if (['note', 'notes', 'question_paper', 'pyq', 'pdf', 'doc', 'resource'].includes(itemKind)) return 'packs';
    if (['snippet', 'code', 'algo', 'gist'].includes(itemKind) || Boolean(item.code || item.code_snippet)) return 'vaults';
    return 'collection';
  };

  const activeType = inferContainerType();
  const config = getContainerConfig(activeType);

  // STRICT FILTER: Only show containers that match this content's container_type!
  const displayContainers = containers.filter(c => {
    if (activeType === 'playlist') return c.container_type === 'playlist';
    if (activeType === 'collection') return c.container_type === 'collection';
    if (activeType === 'packs' || activeType === 'study_pack') return c.container_type === 'packs' || c.container_type === 'study_pack';
    if (activeType === 'vaults' || activeType === 'snippet_notebook') return c.container_type === 'vaults' || c.container_type === 'snippet_notebook';
    if (activeType === 'envelope') return c.container_type === 'envelope';
    return c.container_type === activeType;
  });

  const handleCreateNew = async (e) => {
    e.preventDefault();
    if (!newContainerName.trim() || isCreating) return;
    setIsCreating(true);
    const normalizedKind = ['carousel', 'image', 'media'].includes(itemKind) ? 'post' : itemKind;
    try {
      await onCreateContainer({
        name: newContainerName.trim(),
        container_type: activeType,
        is_public: isPublic,
        initial_item_id: item.id,
        initial_item_kind: normalizedKind,
      });
      setNewContainerName('');
      setShowCreateForm(false);
    } catch (err) {
      console.error('Failed to create container from modal:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const IconComponent = config.icon || Folder;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
      }}
      className="save-modal-overlay"
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface, #ffffff)',
          border: '1px solid var(--border)',
          borderRadius: 28,
          width: '100%',
          maxWidth: '390px',
          maxHeight: 'min(560px, 88vh)',
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          position: 'relative',
        }}
        className="save-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Centered Pull Bar Indicator (Visible across devices for native feel) */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 2 }}>
          <div style={{ width: 38, height: 4.5, background: 'var(--border, #e2e8f0)', borderRadius: 3 }} />
        </div>

        {/* ── Header: Save to... with Circular Close (X) Button ── */}
        <div style={{
          padding: '12px 22px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <h2 style={{
            margin: 0,
            fontFamily: 'var(--font-display, inherit)',
            fontSize: 20,
            fontWeight: 800,
            color: 'var(--text)',
            letterSpacing: '-0.01em',
          }}>
            Save to...
          </h2>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--s2, #f1f5f9)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              cursor: 'pointer',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'all 0.15s ease',
            }}
            className="hover:opacity-80 active:scale-90"
            aria-label="Close modal"
          >
            <X size={15} strokeWidth={2.4} />
          </button>
        </div>

        {/* ── Main Modal Content: Empty State or Container Rows ── */}
        <div style={{
          padding: displayContainers.length === 0 ? '16px 22px 28px' : '4px 14px 12px',
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: displayContainers.length === 0 ? 'center' : 'flex-start',
          gap: displayContainers.length === 0 ? 0 : 6,
          WebkitOverflowScrolling: 'touch',
        }}>
          {displayContainers.length === 0 ? (
            /* ── Beautiful Illustration Empty State Matching Reference Image ── */
            <div style={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 0',
            }}>
              {/* Folder Graphic with glowing backdrop & sparkles */}
              <FolderEmptyGraphic accent={config.accent} />

              {/* Title: e.g. "No collections yet" */}
              <h3 style={{
                fontFamily: 'var(--font-display, inherit)',
                fontSize: 18.5,
                fontWeight: 800,
                color: 'var(--text)',
                margin: '0 0 8px',
                letterSpacing: '-0.01em',
              }}>
                {config.emptyTitle}
              </h3>

              {/* Subtitle: e.g. "Create a collection to organize your saved posts and articles." */}
              <p style={{
                fontSize: 13.5,
                color: 'var(--sub)',
                margin: '0 auto 24px',
                maxWidth: 270,
                lineHeight: 1.45,
              }}>
                {config.emptySubtitle || config.emptyDesc}
              </p>

              {/* Action Button: "+ New collection" / Inline Form */}
              {!showCreateForm ? (
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  style={{
                    width: '100%',
                    maxWidth: 260,
                    padding: '13px 20px',
                    borderRadius: 18,
                    background: `${config.accent}14`,
                    border: `1.5px solid ${config.accent}35`,
                    color: config.accent,
                    fontWeight: 700,
                    fontSize: 14.5,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.15s ease',
                    boxShadow: `0 4px 14px ${config.accent}15`,
                  }}
                  className="hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus size={18} strokeWidth={2.4} />
                  <span>+ {config.btnLabel}</span>
                </button>
              ) : (
                <form
                  onSubmit={handleCreateNew}
                  style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    background: 'var(--s2, #f8fafc)',
                    border: '1px solid var(--border)',
                    borderRadius: 18,
                    padding: 14,
                    boxSizing: 'border-box',
                  }}
                >
                  <input
                    type="text"
                    placeholder={`Name your ${config.label.toLowerCase()}...`}
                    value={newContainerName}
                    onChange={(e) => setNewContainerName(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 12,
                      background: 'var(--surface)',
                      border: `1.5px solid ${config.accent}`,
                      color: 'var(--text)',
                      fontSize: 13.5,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setIsPublic(!isPublic)}
                      style={{
                        padding: '7px 12px',
                        borderRadius: 8,
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--sub)',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        minHeight: 34,
                      }}
                    >
                      {isPublic ? <Globe size={13} /> : <Lock size={13} />}
                      <span>{isPublic ? 'Public' : 'Private'}</span>
                    </button>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateForm(false);
                          setNewContainerName('');
                        }}
                        style={{
                          padding: '7px 12px',
                          borderRadius: 8,
                          background: 'none',
                          border: 'none',
                          color: 'var(--sub)',
                          fontSize: 12.5,
                          fontWeight: 600,
                          cursor: 'pointer',
                          minHeight: 34,
                        }}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={!newContainerName.trim() || isCreating}
                        style={{
                          padding: '7px 18px',
                          fontSize: 12.5,
                          fontWeight: 700,
                          borderRadius: 8,
                          background: config.accent,
                          color: '#ffffff',
                          border: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          opacity: !newContainerName.trim() || isCreating ? 0.6 : 1,
                          cursor: !newContainerName.trim() || isCreating ? 'not-allowed' : 'pointer',
                          minHeight: 34,
                        }}
                      >
                        {isCreating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={14} />}
                        <span>Create</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          ) : (
            displayContainers.map((container) => {
              const isChecked = Boolean(container.item_ids?.includes(item.id));
              const coverImg = container.custom_cover_url;

              return (
                <div
                  key={container.id}
                  onClick={() => onToggleItemInContainer && onToggleItemInContainer(container.id, item.id, normalizedKind)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 14,
                    background: isChecked ? `${config.accent}15` : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    gap: 12,
                    minHeight: 54,
                    boxSizing: 'border-box',
                  }}
                  className="hover:bg-white/5 active:scale-[0.99]"
                >
                  {/* Left: Container Preview Box with Folder / Cover style */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    minWidth: 0,
                    flex: 1,
                  }}>
                    {/* Folder Tab style Box */}
                    <div style={{
                      position: 'relative',
                      width: 52,
                      height: 38,
                      borderRadius: 8,
                      overflow: 'hidden',
                      background: 'var(--s2, #182234)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 4,
                        width: 20,
                        height: 3,
                        background: isChecked ? config.accent : 'rgba(255,255,255,0.4)',
                        borderTopLeftRadius: 2,
                        borderTopRightRadius: 2,
                      }} />

                      {coverImg ? (
                        <img
                          src={coverImg}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <IconComponent size={18} color={isChecked ? config.accent : 'var(--sub)'} />
                      )}
                    </div>

                    {/* Middle: Name & Privacy / Status */}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: 'var(--text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.3,
                      }}>
                        {container.name}
                      </div>

                      <div style={{
                        fontSize: 11.5,
                        color: 'var(--sub)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        marginTop: 1,
                      }}>
                        {container.is_public ? (
                          <>
                            <span>Public</span>
                            <span>•</span>
                            <span>Collaborative</span>
                          </>
                        ) : (
                          <span>Private</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Bookmark Checkbox Icon */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleItemInContainer && onToggleItemInContainer(container.id, item.id, itemKind);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isChecked ? config.accent : 'var(--text)',
                      cursor: 'pointer',
                      padding: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 8,
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                    aria-label={isChecked ? 'Remove from container' : 'Add to container'}
                  >
                    <Bookmark
                      size={22}
                      fill={isChecked ? config.accent : 'none'}
                      stroke={isChecked ? config.accent : 'currentColor'}
                      strokeWidth={isChecked ? 0 : 1.8}
                    />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* ── Footer: "+ New [Type]" Button when containers exist ── */}
        {displayContainers.length > 0 && (
          <div style={{
            padding: '12px 16px max(16px, env(safe-area-inset-bottom))',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface)',
            flexShrink: 0,
          }}>
            {!showCreateForm ? (
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 18,
                  background: `${config.accent}14`,
                  border: `1.5px solid ${config.accent}35`,
                  color: config.accent,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.15s ease',
                  minHeight: 44,
                }}
                className="hover:scale-[1.01] active:scale-[0.99]"
              >
                <Plus size={18} strokeWidth={2.4} />
                <span>+ {config.btnLabel}</span>
              </button>
            ) : (
              <form onSubmit={handleCreateNew} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  type="text"
                  placeholder={`Name your ${config.label.toLowerCase()}...`}
                  value={newContainerName}
                  onChange={(e) => setNewContainerName(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: 'var(--surface)',
                    border: `1.5px solid ${config.accent}`,
                    color: 'var(--text)',
                    fontSize: 13.5,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setIsPublic(!isPublic)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 8,
                      background: 'var(--s2)',
                      border: '1px solid var(--border)',
                      color: 'var(--sub)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      minHeight: 34,
                    }}
                  >
                    {isPublic ? <Globe size={13} /> : <Lock size={13} />}
                    <span>{isPublic ? 'Public' : 'Private'}</span>
                  </button>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewContainerName('');
                      }}
                      style={{
                        padding: '7px 12px',
                        borderRadius: 8,
                        background: 'none',
                        border: 'none',
                        color: 'var(--sub)',
                        fontSize: 12.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                        minHeight: 34,
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={!newContainerName.trim() || isCreating}
                      style={{
                        padding: '7px 18px',
                        fontSize: 12.5,
                        fontWeight: 700,
                        borderRadius: 8,
                        background: config.accent,
                        color: '#ffffff',
                        border: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        opacity: !newContainerName.trim() || isCreating ? 0.6 : 1,
                        cursor: !newContainerName.trim() || isCreating ? 'not-allowed' : 'pointer',
                        minHeight: 34,
                      }}
                    >
                      {isCreating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={14} />}
                      <span>Create</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .save-modal-overlay {
            align-items: flex-end !important;
            padding: 0 !important;
          }
          .save-modal-card {
            max-width: 100% !important;
            border-bottom-left-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
            border-top-left-radius: 28px !important;
            border-top-right-radius: 28px !important;
            max-height: 85vh !important;
            animation: slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

