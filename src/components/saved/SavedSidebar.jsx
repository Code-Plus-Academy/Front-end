'use client';

import React from 'react';
import { Bookmark, Inbox, Plus, ChevronRight } from 'lucide-react';
import { PlaylistIcon, CollectionIcon, StudyPackIcon, EnvelopeIcon, VaultIcon } from './icons/ContainerIcons';

export default function SavedSidebar({
  activeSpace = 'all',
  activeContainerId = null,
  containers = [],
  totalItemsCount = 0,
  unorganizedCount = 0,
  onSelectSpace,
  onSelectContainer,
  onOpenCreateModal,
  onOpenViewAll,
}) {
  const playlists = containers.filter(c => c.container_type === 'playlist');
  const envelopes = containers.filter(c => c.container_type === 'envelope');
  const packs = containers.filter(c => c.container_type === 'packs' || c.container_type === 'study_pack');
  const collections = containers.filter(c => c.container_type === 'collection');
  const vaults = containers.filter(c => c.container_type === 'vaults' || c.container_type === 'snippet_notebook');

  const navItemStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderRadius: 'var(--r-sm, 8px)',
    fontSize: 'clamp(12px, 2vw, 13px)',
    fontWeight: isActive ? 700 : 500,
    color: isActive ? 'var(--text)' : 'var(--sub)',
    background: isActive ? 'rgba(59, 124, 255, 0.1)' : 'transparent',
    border: isActive ? '1px solid rgba(59, 124, 255, 0.35)' : '1px solid transparent',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
    boxSizing: 'border-box',
    minHeight: 38,
    gap: 8,
  });

  const renderContainerSection = (title, icon, typeKey, itemsList, accentColor) => {
    const Icon = icon;
    return (
      <div style={{ width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, padding: '0 6px' }}>
          <button
            type="button"
            onClick={() => onOpenViewAll && onOpenViewAll(typeKey)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              minWidth: 0,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              textAlign: 'left',
            }}
            className="hover:opacity-80 group"
          >
            <Icon size={15} color={accentColor} />
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              color: accentColor,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {title} ({itemsList.length})
            </span>
            <ChevronRight size={12} color={accentColor} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <button
            type="button"
            onClick={() => onOpenCreateModal && onOpenCreateModal(typeKey)}
            title={`Create ${title.slice(0, -1)}`}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--sub)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              minWidth: 28,
              minHeight: 28,
              justifyContent: 'center',
              borderRadius: 6,
              transition: 'all 0.15s ease',
            }}
            className="hover:text-blue-400 hover:bg-white/5 active:scale-90"
            aria-label={`Create ${title}`}
          >
            <Plus size={14} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {itemsList.length === 0 ? (
            <span style={{ fontSize: 12, color: 'var(--dim)', padding: '6px 12px' }}>No items yet</span>
          ) : (
            itemsList.slice(0, 5).map(c => {
              const isSelected = activeContainerId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectContainer && onSelectContainer(c)}
                  style={navItemStyle(isSelected)}
                  className="hover:bg-white/5 hover:translate-x-1 active:scale-[0.98]"
                >
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: isSelected ? 'var(--text)' : 'inherit',
                    flex: 1,
                    minWidth: 0,
                  }}>
                    {c.name}
                  </span>
                  <span style={{
                    fontSize: 10.5,
                    color: isSelected ? 'var(--primary, #3B7CFF)' : 'var(--sub)',
                    fontFamily: "'JetBrains Mono', monospace",
                    flexShrink: 0,
                    fontWeight: isSelected ? 700 : 500,
                  }}>
                    {c.item_ids?.length ?? c.item_count ?? 0}
                  </span>
                </button>
              );
            })
          )}
          {itemsList.length > 5 && (
            <button
              type="button"
              onClick={() => onOpenViewAll && onOpenViewAll(typeKey)}
              style={{
                fontSize: 11.5,
                color: 'var(--primary, #3B7CFF)',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                padding: '4px 12px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
              className="hover:underline"
            >
              + {itemsList.length - 5} more...
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <aside style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      boxSizing: 'border-box',
    }}>
      {/* ── Top Primary Navigation ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button
          type="button"
          onClick={() => onSelectSpace && onSelectSpace('all')}
          style={navItemStyle(activeSpace === 'all' && !activeContainerId)}
          className="hover:bg-white/5 hover:translate-x-1 active:scale-[0.98]"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bookmark size={15} style={{ color: 'var(--primary, #3B7CFF)' }} />
            <span>All Saved Items</span>
          </div>
          <span style={{
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 10,
            background: activeSpace === 'all' && !activeContainerId ? 'var(--primary, #3B7CFF)' : 'var(--s2)',
            color: activeSpace === 'all' && !activeContainerId ? '#ffffff' : 'var(--sub)',
            fontWeight: 800,
            fontFamily: "'JetBrains Mono', monospace",
            transition: 'all 0.18s ease',
          }}>
            {totalItemsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSpace && onSelectSpace('unorganized')}
          style={navItemStyle(activeSpace === 'unorganized' && !activeContainerId)}
          className="hover:bg-white/5 hover:translate-x-1 active:scale-[0.98]"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Inbox size={15} style={{ color: 'var(--sub)' }} />
            <span>Unorganized</span>
          </div>
          <span style={{
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 10,
            background: 'var(--s2)',
            color: 'var(--sub)',
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {unorganizedCount}
          </span>
        </button>
      </div>

      {/* ── 1. Video Playlists (Youtuber style) ── */}
      {renderContainerSection('Video Playlists', PlaylistIcon, 'playlist', playlists, 'var(--primary, #3B7CFF)')}

      {/* ── 2. Course Envelopes ── */}
      {renderContainerSection('Learning Envelopes', EnvelopeIcon, 'envelope', envelopes, '#0284C7')}

      {/* ── 3. Study Packs (Data collection style) ── */}
      {renderContainerSection('Study Packs', StudyPackIcon, 'packs', packs, 'var(--green, #34C77B)')}

      {/* ── 4. Social Collections (mikan933 style) ── */}
      {renderContainerSection('Collections', CollectionIcon, 'collection', collections, 'var(--accent-purple, #9333EA)')}

      {/* ── 5. Code Vaults ── */}
      {renderContainerSection('Code Vaults', VaultIcon, 'vaults', vaults, 'var(--yellow, #F59E0B)')}
    </aside>
  );
}
