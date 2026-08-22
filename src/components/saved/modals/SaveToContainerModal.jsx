'use client';

import React, { useState } from 'react';
import { X, Plus, Check, Lock, Globe, FolderPlus, Sparkles, Loader2 } from 'lucide-react';

export default function SaveToContainerModal({
  isOpen,
  onClose,
  item,
  containers = [],
  onToggleItemInContainer,
  onCreateContainer,
}) {
  const [newContainerName, setNewContainerName] = useState('');
  const [newContainerType, setNewContainerType] = useState('playlist');
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen || !item) return null;

  // Determine default container type based on item type
  const defaultTypeMap = {
    video: 'playlist',
    short: 'playlist',
    course: 'envelope',
    note: 'study_pack',
    question_paper: 'study_pack',
    post: 'collection',
    snippet: 'snippet_notebook',
    article: 'collection',
  };

  const itemKind = item.item_kind || item.type || 'note';
  const recommendedType = defaultTypeMap[itemKind] || 'collection';

  const typeLabels = {
    playlist: '🎬 Video Playlist',
    envelope: '✉️ Course Envelope',
    collection: '💡 Social Collection',
    study_pack: '📘 Study Pack',
    snippet_notebook: '⚡ Snippet Notebook',
  };

  const filteredContainers = containers.filter(c => {
    if (searchQuery.trim()) {
      return c.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    }
    return true;
  });

  const handleCreateNew = async (e) => {
    e.preventDefault();
    if (!newContainerName.trim()) return;
    setIsCreating(true);
    try {
      const created = await onCreateContainer({
        name: newContainerName.trim(),
        container_type: newContainerType,
        is_public: false,
        initial_item_id: item.id,
        initial_item_kind: itemKind,
      });
      setNewContainerName('');
      setShowCreateForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md, 16px)',
          width: '100%',
          maxWidth: '460px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-modal, 0 20px 60px rgba(0, 0, 0, 0.7))',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display, inherit)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              Save to Collection or Playlist
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--sub)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.title || 'Selected Item'}
            </p>
          </div>

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
              borderRadius: 6,
            }}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search filter for containers */}
        {containers.length > 4 && (
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)' }}>
            <input
              type="text"
              placeholder="Search collections & playlists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                background: 'var(--s2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontSize: 12.5,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        {/* Container Multi-Checklist List (YouTube/Instagram Standard) */}
        <div style={{
          padding: '12px 20px',
          maxHeight: '280px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          {filteredContainers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--sub)', fontSize: 13 }}>
              <p style={{ margin: '0 0 10px' }}>No matching collections found.</p>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(true);
                  setNewContainerType(recommendedType);
                }}
                className="btn-primary"
                style={{ padding: '6px 14px', fontSize: 12 }}
              >
                + Create New
              </button>
            </div>
          ) : (
            filteredContainers.map((container) => {
              const isChecked = Boolean(container.item_ids?.includes(item.id));
              return (
                <label
                  key={container.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: isChecked ? 'rgba(59, 124, 255, 0.08)' : 'transparent',
                    border: isChecked ? '1px solid rgba(59, 124, 255, 0.3)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  className="hover:bg-white/5"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    {/* Custom Checkbox */}
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleItemInContainer && onToggleItemInContainer(container.id, item.id, itemKind)}
                      style={{
                        width: 18,
                        height: 18,
                        accentColor: 'var(--primary, #3B7CFF)',
                        cursor: 'pointer',
                      }}
                    />

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {container.name}
                        </span>
                        {container.is_public ? (
                          <Globe size={12} color="var(--dim)" title="Public" />
                        ) : (
                          <Lock size={12} color="var(--dim)" title="Private" />
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--sub)' }}>
                        {typeLabels[container.container_type] || 'Collection'} · {container.item_count || container.item_ids?.length || 0} items
                      </span>
                    </div>
                  </div>
                </label>
              );
            })
          )}
        </div>

        {/* Bottom Inline Create New Container */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border)',
          background: 'rgba(255, 255, 255, 0.02)',
        }}>
          {!showCreateForm ? (
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(true);
                setNewContainerType(recommendedType);
              }}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                background: 'var(--s2)',
                border: '1px dashed var(--border-bright)',
                color: 'var(--text)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.15s',
              }}
              className="hover:border-blue-400 hover:text-blue-400"
            >
              <Plus size={16} />
              <span>Create New Playlist / Collection</span>
            </button>
          ) : (
            <form onSubmit={handleCreateNew} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="e.g. System Design Mastery"
                  value={newContainerName}
                  onChange={(e) => setNewContainerName(e.target.value)}
                  autoFocus
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'var(--surface)',
                    border: '1px solid var(--border-bright)',
                    color: 'var(--text)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />

                <select
                  value={newContainerType}
                  onChange={(e) => setNewContainerType(e.target.value)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: 'var(--surface)',
                    border: '1px solid var(--border-bright)',
                    color: 'var(--text)',
                    fontSize: 12,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="playlist">🎬 Playlist</option>
                  <option value="envelope">✉️ Envelope</option>
                  <option value="collection">💡 Collection</option>
                  <option value="study_pack">📘 Study Pack</option>
                  <option value="snippet_notebook">⚡ Snippet Notebook</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    background: 'none',
                    border: 'none',
                    color: 'var(--sub)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!newContainerName.trim() || isCreating}
                  className="btn-primary"
                  style={{
                    padding: '6px 16px',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    opacity: !newContainerName.trim() || isCreating ? 0.6 : 1,
                  }}
                >
                  {isCreating ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  <span>Create & Add</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
