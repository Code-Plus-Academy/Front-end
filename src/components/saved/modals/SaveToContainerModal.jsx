'use client';

import React, { useState } from 'react';
import { X, Plus, Bookmark, Lock, Globe, Loader2, Folder } from 'lucide-react';
import { PlaylistIcon, CollectionIcon, StudyPackIcon, EnvelopeIcon, VaultIcon } from '../icons/ContainerIcons';
import { getContainerConfig } from '../../../constants/containerConfig';

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
    try {
      await onCreateContainer({
        name: newContainerName.trim(),
        container_type: activeType,
        is_public: isPublic,
        initial_item_id: item.id,
        initial_item_kind: itemKind,
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
          borderRadius: 20,
          width: '100%',
          maxWidth: '380px',
          maxHeight: 'min(520px, 88vh)',
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
        {/* Mobile Pull Bar Indicator */}
        <div className="mobile-pull-handle" style={{ display: 'none' }}>
          <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '8px auto 2px' }} />
        </div>

        {/* ── Header: Save to... ── */}
        <div style={{
          padding: '18px 20px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <h2 style={{
            margin: 0,
            fontFamily: 'var(--font-display, inherit)',
            fontSize: 19,
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
              background: 'none',
              border: 'none',
              color: 'var(--sub)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              borderRadius: 8,
              justifyContent: 'center',
            }}
            className="hover:bg-white/10 active:scale-90"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Strict-Filtered Container Rows List (Matching media_1787412665126.png) ── */}
        <div style={{
          padding: '4px 14px 12px',
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          WebkitOverflowScrolling: 'touch',
        }}>
          {displayContainers.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '36px 16px',
              color: 'var(--sub)',
              fontSize: 13,
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: `${config.accent}15`,
                color: config.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
              }}>
                <IconComponent size={20} color={config.accent} />
              </div>
              <p style={{ margin: '0 0 4px', color: 'var(--text)', fontWeight: 700, fontSize: 14 }}>
                {config.emptyTitle}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--sub)' }}>
                {config.emptySubtitle}
              </p>
            </div>
          ) : (
            displayContainers.map((container) => {
              const isChecked = Boolean(container.item_ids?.includes(item.id));
              const coverImg = container.custom_cover_url;

              return (
                <div
                  key={container.id}
                  onClick={() => onToggleItemInContainer && onToggleItemInContainer(container.id, item.id, itemKind)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 12,
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
                      borderRadius: 6,
                      overflow: 'hidden',
                      background: '#182234',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    }}>
                      {/* Top folder tab accent */}
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
                        <IconComponent size={18} color={isChecked ? config.accent : 'rgba(255,255,255,0.7)'} />
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

        {/* ── Footer: "+ New [Type]" Pill Button / Inline Create Form ── */}
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
                borderRadius: 24,
                background: 'var(--s2, #f1f5f9)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontWeight: 700,
                fontSize: 13.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.15s ease',
                minHeight: 44,
              }}
              className="hover:border-purple-400 hover:text-purple-600 active:scale-[0.99]"
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
                  borderRadius: 10,
                  background: 'var(--surface)',
                  border: `1.5px solid ${config.accent}`,
                  color: 'var(--text)',
                  fontSize: 13.5,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                {/* Privacy toggle button */}
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
            border-top-left-radius: 24px !important;
            border-top-right-radius: 24px !important;
            max-height: 82vh !important;
            animation: slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
          }
          .mobile-pull-handle {
            display: block !important;
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
