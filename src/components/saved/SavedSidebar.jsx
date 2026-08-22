'use client';

import React from 'react';
import { Bookmark, Folder, Plus, Layers, Play, BookOpen, Terminal, Sparkles, FolderPlus } from 'lucide-react';

export default function SavedSidebar({
  activeSpace = 'all',
  activeContainerId = null,
  containers = [],
  totalItemsCount = 0,
  unorganizedCount = 0,
  onSelectSpace,
  onSelectContainer,
  onOpenCreateModal,
}) {
  const playlists = containers.filter(c => c.container_type === 'playlist');
  const envelopes = containers.filter(c => c.container_type === 'envelope');
  const collections = containers.filter(c => c.container_type === 'collection');
  const studyPacks = containers.filter(c => c.container_type === 'study_pack');
  const snippetNotebooks = containers.filter(c => c.container_type === 'snippet_notebook');

  const navItemStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderRadius: 'var(--r-sm, 8px)',
    fontSize: 13,
    fontWeight: isActive ? 700 : 500,
    color: isActive ? 'var(--text)' : 'var(--sub)',
    background: isActive ? 'var(--s2, rgba(255,255,255,0.06))' : 'transparent',
    border: isActive ? '1px solid var(--border-bright)' : '1px solid transparent',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.15s ease',
    boxSizing: 'border-box',
  });

  return (
    <aside style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      boxSizing: 'border-box',
    }}>
      {/* ── Top Primary Navigation ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button
          type="button"
          onClick={() => onSelectSpace && onSelectSpace('all')}
          style={navItemStyle(activeSpace === 'all' && !activeContainerId)}
          className="hover:bg-white/5"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>🌟</span>
            <span>All Saved Items</span>
          </div>
          <span style={{
            fontSize: 11,
            padding: '2px 7px',
            borderRadius: 10,
            background: activeSpace === 'all' && !activeContainerId ? 'var(--green, #00b4d8)' : 'var(--s2)',
            color: activeSpace === 'all' && !activeContainerId ? '#000' : 'var(--sub)',
            fontWeight: 800,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {totalItemsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSpace && onSelectSpace('unorganized')}
          style={navItemStyle(activeSpace === 'unorganized' && !activeContainerId)}
          className="hover:bg-white/5"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>📂</span>
            <span>Unorganized</span>
          </div>
          <span style={{
            fontSize: 11,
            padding: '2px 7px',
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

      {/* ── 1. Video Playlists Section (YouTube Model) ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, padding: '0 6px' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary, #3B7CFF)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🎬 Video Playlists ({playlists.length})
          </span>
          <button
            type="button"
            onClick={() => onOpenCreateModal && onOpenCreateModal('playlist')}
            title="Create Playlist"
            style={{ background: 'none', border: 'none', color: 'var(--sub)', cursor: 'pointer', padding: 2 }}
            className="hover:text-blue-400"
          >
            <Plus size={14} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {playlists.length === 0 ? (
            <span style={{ fontSize: 12, color: 'var(--dim)', padding: '6px 12px' }}>No playlists yet</span>
          ) : (
            playlists.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectContainer && onSelectContainer(p)}
                style={navItemStyle(activeContainerId === p.id)}
                className="hover:bg-white/5"
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name}
                </span>
                <span style={{ fontSize: 10.5, color: 'var(--sub)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {p.item_ids?.length || 0}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── 2. Course Envelopes Section (Binder Model) ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, padding: '0 6px' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary, #3B7CFF)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ✉️ Learning Envelopes ({envelopes.length})
          </span>
          <button
            type="button"
            onClick={() => onOpenCreateModal && onOpenCreateModal('envelope')}
            title="Create Course Envelope"
            style={{ background: 'none', border: 'none', color: 'var(--sub)', cursor: 'pointer', padding: 2 }}
            className="hover:text-blue-400"
          >
            <Plus size={14} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {envelopes.length === 0 ? (
            <span style={{ fontSize: 12, color: 'var(--dim)', padding: '6px 12px' }}>No envelopes yet</span>
          ) : (
            envelopes.map(e => (
              <button
                key={e.id}
                type="button"
                onClick={() => onSelectContainer && onSelectContainer(e)}
                style={navItemStyle(activeContainerId === e.id)}
                className="hover:bg-white/5"
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.name}
                </span>
                <span style={{ fontSize: 10.5, color: 'var(--sub)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {e.item_ids?.length || 0}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── 3. Academic Study Packs ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, padding: '0 6px' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--green, #00b4d8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            📘 Study Packs ({studyPacks.length})
          </span>
          <button
            type="button"
            onClick={() => onOpenCreateModal && onOpenCreateModal('study_pack')}
            title="Create Study Pack"
            style={{ background: 'none', border: 'none', color: 'var(--sub)', cursor: 'pointer', padding: 2 }}
            className="hover:text-cyan-400"
          >
            <Plus size={14} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {studyPacks.length === 0 ? (
            <span style={{ fontSize: 12, color: 'var(--dim)', padding: '6px 12px' }}>No study packs yet</span>
          ) : (
            studyPacks.map(sp => (
              <button
                key={sp.id}
                type="button"
                onClick={() => onSelectContainer && onSelectContainer(sp)}
                style={navItemStyle(activeContainerId === sp.id)}
                className="hover:bg-white/5"
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sp.name}
                </span>
                <span style={{ fontSize: 10.5, color: 'var(--sub)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {sp.item_ids?.length || 0}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── 4. Social Collections (Instagram Model) ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, padding: '0 6px' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-purple, #9333EA)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            💡 Collections ({collections.length})
          </span>
          <button
            type="button"
            onClick={() => onOpenCreateModal && onOpenCreateModal('collection')}
            title="Create Collection"
            style={{ background: 'none', border: 'none', color: 'var(--sub)', cursor: 'pointer', padding: 2 }}
            className="hover:text-purple-400"
          >
            <Plus size={14} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {collections.length === 0 ? (
            <span style={{ fontSize: 12, color: 'var(--dim)', padding: '6px 12px' }}>No collections yet</span>
          ) : (
            collections.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectContainer && onSelectContainer(c)}
                style={navItemStyle(activeContainerId === c.id)}
                className="hover:bg-white/5"
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.name}
                </span>
                <span style={{ fontSize: 10.5, color: 'var(--sub)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {c.item_ids?.length || 0}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── 5. Snippet Notebooks ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, padding: '0 6px' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--yellow, #F59E0B)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ⚡ Snippet Notebooks ({snippetNotebooks.length})
          </span>
          <button
            type="button"
            onClick={() => onOpenCreateModal && onOpenCreateModal('snippet_notebook')}
            title="Create Snippet Notebook"
            style={{ background: 'none', border: 'none', color: 'var(--sub)', cursor: 'pointer', padding: 2 }}
            className="hover:text-yellow-400"
          >
            <Plus size={14} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {snippetNotebooks.length === 0 ? (
            <span style={{ fontSize: 12, color: 'var(--dim)', padding: '6px 12px' }}>No notebooks yet</span>
          ) : (
            snippetNotebooks.map(sn => (
              <button
                key={sn.id}
                type="button"
                onClick={() => onSelectContainer && onSelectContainer(sn)}
                style={navItemStyle(activeContainerId === sn.id)}
                className="hover:bg-white/5"
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sn.name}
                </span>
                <span style={{ fontSize: 10.5, color: 'var(--sub)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {sn.item_ids?.length || 0}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
