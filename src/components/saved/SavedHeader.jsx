'use client';

import React from 'react';
import { Search, LayoutGrid, List, CheckSquare, X, Filter } from 'lucide-react';

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
    { id: 'all', label: 'All Items', icon: '🌟', count: counts.all ?? 0 },
    { id: 'note', label: 'Notes & PYQs', icon: '📘', count: counts.note ?? 0 },
    { id: 'video', label: 'Videos & Shorts', icon: '🎬', count: counts.video ?? 0 },
    { id: 'course', label: 'Courses & Tracks', icon: '✉️', count: counts.course ?? 0 },
    { id: 'post', label: 'Community Posts', icon: '💡', count: counts.post ?? 0 },
    { id: 'snippet', label: 'Code Snippets', icon: '⚡', count: counts.snippet ?? 0 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
      {/* ── Top Bar: Search Input, Sort Dropdown, View Toggles & Select Mode ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '220px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
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
              padding: '10px 36px 10px 36px',
              borderRadius: 'var(--r-md, 10px)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontSize: 13,
              outline: 'none',
              transition: 'border-color 0.15s ease',
              boxSizing: 'border-box',
            }}
            className="focus:border-cyan-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--sub)',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: 'var(--r-md, 10px)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontSize: 12.5,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="recent">Recently Saved</option>
            <option value="oldest">Oldest Saved</option>
            <option value="popular">Most Popular</option>
            <option value="title">Title (A - Z)</option>
          </select>

          {/* Grid / List Layout Switch */}
          <div style={{
            display: 'flex',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md, 10px)',
            padding: 2,
          }}>
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                background: viewMode === 'grid' ? 'var(--s2)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--text)' : 'var(--sub)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Grid View"
              aria-label="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                background: viewMode === 'list' ? 'var(--s2)' : 'transparent',
                color: viewMode === 'list' ? 'var(--text)' : 'var(--sub)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="List View"
              aria-label="List View"
            >
              <List size={15} />
            </button>
          </div>

          {/* Select Mode Toggle */}
          <button
            type="button"
            onClick={onToggleSelectMode}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--r-md, 10px)',
              background: isSelectMode ? 'var(--primary, #3B7CFF)' : 'var(--surface)',
              color: isSelectMode ? '#fff' : 'var(--text)',
              border: isSelectMode ? '1px solid var(--primary, #3B7CFF)' : '1px solid var(--border)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <CheckSquare size={14} />
            <span>{isSelectMode ? 'Done' : 'Select'}</span>
          </button>
        </div>
      </div>

      {/* ── Content-Type Segmented Filter Pills ── */}
      <div style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 4,
        WebkitOverflowScrolling: 'touch',
      }}>
        {typeTabs.map(tab => {
          const isActive = activeTypeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTypeTab(tab.id)}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: isActive ? 'var(--green-dim, rgba(0,180,216,0.15))' : 'var(--surface)',
                borderColor: isActive ? 'var(--green, #00b4d8)' : 'var(--border)',
                color: isActive ? 'var(--green, #00b4d8)' : 'var(--sub)',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 10,
                background: isActive ? 'var(--green, #00b4d8)' : 'var(--s2)',
                color: isActive ? '#000' : 'var(--sub)',
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
