'use client';

import React from 'react';
import { Search, LayoutGrid, List, AlignJustify, CheckSquare, X, Bookmark, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import { PlaylistIcon, CollectionIcon, EnvelopeIcon, VaultIcon } from './icons/ContainerIcons';

export default function SavedHeader({
  searchQuery = '',
  onSearchChange,
  activeTypeTab = 'all',
  onSelectTypeTab,
  sortBy = 'recent',
  onSortChange,
  viewMode = 'grid',
  onViewModeChange,
  isSelectMode = false,
  onToggleSelectMode,
  counts = {},
}) {
  const typeTabs = [
    { id: 'all', label: 'All saved', icon: Bookmark, count: counts.all ?? 0 },
    { id: 'video', label: 'Videos & Playlists', icon: PlaylistIcon, count: counts.video ?? 0 },
    { id: 'note', label: 'Notes & Docs', icon: FileText, count: counts.note ?? 0 },
    { id: 'snippet', label: 'Code & Vaults', icon: VaultIcon, count: counts.snippet ?? 0 },
    { id: 'post', label: 'Community Posts', icon: CollectionIcon, count: counts.post ?? 0 },
    { id: 'course', label: 'Courses & Tracks', icon: EnvelopeIcon, count: counts.course ?? 0 },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      marginBottom: 20,
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
    }}>
      {/* ── 1. Search Bar (Full Width) ── */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}>
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--sub)',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          placeholder="Search saved titles, subjects, code, authors..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '100%',
            padding: '12px 38px 12px 42px',
            borderRadius: 14,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontSize: 'clamp(12.5px, 2vw, 13.5px)',
            outline: 'none',
            transition: 'all 0.2s ease',
            boxSizing: 'border-box',
            minHeight: 46,
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}
          className="focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--sub)',
              cursor: 'pointer',
              padding: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
            }}
            className="hover:bg-white/10 active:scale-90"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── 2. Full-Width "Recently saved ▼" Dropdown Bar (Matching media_1787416286250.png) ── */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '100%',
            padding: '12px 36px 12px 16px',
            borderRadius: 14,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontSize: 'clamp(13px, 2vw, 14px)',
            fontWeight: 700,
            cursor: 'pointer',
            outline: 'none',
            appearance: 'none',
            WebkitAppearance: 'none',
            minHeight: 46,
            transition: 'border-color 0.2s ease',
            boxSizing: 'border-box',
          }}
          className="hover:border-purple-400"
        >
          <option value="recent">Recently saved</option>
          <option value="oldest">Oldest saved</option>
          <option value="popular">Most popular</option>
          <option value="title">Alphabetical (A - Z)</option>
        </select>
        <ChevronDown
          size={16}
          style={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--sub)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* ── 3. View Switcher Row: [≣] [≡] [🖼 Gallery] on Left & [☑ Select] on Right ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}>
        {/* 3-Button View Mode Group matching media_1787416286250.png */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 3,
          flexShrink: 0,
        }}>
          {/* List View [≣] */}
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              background: viewMode === 'list' ? 'rgba(124, 58, 237, 0.12)' : 'transparent',
              color: viewMode === 'list' ? '#7C3AED' : 'var(--sub)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 34,
              minWidth: 36,
              transition: 'all 0.15s ease',
            }}
            title="List View"
            aria-label="List View"
          >
            <List size={16} />
          </button>

          {/* Compact View [≡] */}
          <button
            type="button"
            onClick={() => onViewModeChange('compact')}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              background: viewMode === 'compact' ? 'rgba(124, 58, 237, 0.12)' : 'transparent',
              color: viewMode === 'compact' ? '#7C3AED' : 'var(--sub)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 34,
              minWidth: 36,
              transition: 'all 0.15s ease',
            }}
            title="Compact View"
            aria-label="Compact View"
          >
            <AlignJustify size={16} />
          </button>

          {/* Gallery / Grid View [🖼 Gallery] */}
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              background: viewMode === 'grid' ? 'rgba(124, 58, 237, 0.12)' : 'transparent',
              color: viewMode === 'grid' ? '#7C3AED' : 'var(--sub)',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              fontWeight: 700,
              minHeight: 34,
              transition: 'all 0.15s ease',
            }}
            title="Gallery View"
            aria-label="Gallery View"
          >
            <LayoutGrid size={15} />
            <span>Gallery</span>
          </button>
        </div>

        {/* Select Mode Toggle */}
        <button
          type="button"
          onClick={onToggleSelectMode}
          style={{
            padding: '7px 14px',
            borderRadius: 12,
            background: isSelectMode ? '#7C3AED' : 'var(--surface)',
            color: isSelectMode ? '#fff' : 'var(--text)',
            border: isSelectMode ? '1px solid #7C3AED' : '1px solid var(--border)',
            fontSize: 'clamp(12px, 2vw, 13px)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            minHeight: 40,
            flexShrink: 0,
            transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: isSelectMode ? '0 4px 14px rgba(124, 58, 237, 0.35)' : 'none',
          }}
          className="hover:border-purple-400 active:scale-95"
        >
          <CheckSquare size={15} />
          <span>{isSelectMode ? 'Done' : 'Select'}</span>
        </button>
      </div>

      {/* ── 4. Horizontal Filter Chips with Right Chevron ── */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 4,
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
        }}
      >
        {typeTabs.map(tab => {
          const isActive = activeTypeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTypeTab(tab.id)}
              style={{
                padding: '7px 14px',
                borderRadius: 22,
                fontSize: 'clamp(12px, 2vw, 13px)',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                border: '1px solid',
                transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: isActive ? 'rgba(124, 58, 237, 0.12)' : 'var(--surface)',
                borderColor: isActive ? '#7C3AED' : 'var(--border)',
                color: isActive ? '#7C3AED' : 'var(--text)',
                minHeight: 36,
                flexShrink: 0,
                boxShadow: isActive ? '0 2px 10px rgba(124, 58, 237, 0.18)' : 'none',
              }}
              className="hover:border-purple-400 active:scale-95"
            >
              <Icon size={14} color={isActive ? '#7C3AED' : 'currentColor'} />
              <span>{tab.label} ({tab.count})</span>
              <ChevronRight size={13} style={{ opacity: 0.6 }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
