'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import {
  ArrowLeft,
  Upload,
  Calendar,
  Search,
  ChevronDown,
  List,
  AlignJustify,
  LayoutGrid,
  Trash2,
  FileText,
  Code,
  CheckSquare,
  X,
  Plus,
} from 'lucide-react';
import { PlaylistIcon, CollectionIcon, StudyPackIcon, EnvelopeIcon, VaultIcon } from '../icons/ContainerIcons';
import SavedNoteCard from '../cards/SavedNoteCard';
import SavedPostCard from '../cards/SavedPostCard';
import SavedSnippetCard from '../cards/SavedSnippetCard';
import SavedArticleCard from '../cards/SavedArticleCard';
import SavedCourseCard from '../cards/SavedCourseCard';
import SavedVideoCard from '../cards/SavedVideoCard';
import { getContainerConfig } from '../../../constants/containerConfig';

// ── Cute Illustrated Empty Box / Envelope SVG ──
function IllustratedEmptyGraphic({ accent = '#7C3AED' }) {
  return (
    <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ position: 'absolute', top: 6, left: 16, width: 3.5, height: 9, background: accent, opacity: 0.6, borderRadius: 2, transform: 'rotate(-40deg)' }} />
      <span style={{ position: 'absolute', top: 6, right: 16, width: 3.5, height: 9, background: accent, opacity: 0.6, borderRadius: 2, transform: 'rotate(40deg)' }} />
      <span style={{ position: 'absolute', bottom: 10, left: 12, width: 9, height: 3.5, background: accent, opacity: 0.4, borderRadius: 2, transform: 'rotate(-10deg)' }} />
      <span style={{ position: 'absolute', bottom: 10, right: 12, width: 9, height: 3.5, background: accent, opacity: 0.4, borderRadius: 2, transform: 'rotate(10deg)' }} />

      <svg width="72" height="60" viewBox="0 0 72 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 16C6 11.5817 9.58172 8 14 8H58C62.4183 8 66 11.5817 66 16V46C66 50.4183 62.4183 54 58 54H14C9.58172 54 6 50.4183 6 46V16Z" fill="rgba(124, 58, 237, 0.08)" stroke="var(--border)" strokeWidth="2.5" />
        <rect x="18" y="2" width="36" height="30" rx="4" fill="var(--surface)" stroke="var(--border)" strokeWidth="2" />
        <line x1="24" y1="9" x2="42" y2="9" stroke="var(--sub)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="24" y1="15" x2="48" y2="15" stroke="var(--sub)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="24" y1="21" x2="38" y2="21" stroke="var(--sub)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M6 18L36 36L66 18" stroke="var(--border)" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
        <path d="M6 48L28 30" stroke="var(--border)" strokeWidth="2" />
        <path d="M66 48L44 30" stroke="var(--border)" strokeWidth="2" />
      </svg>
    </div>
  );
}

export default function CollectionDetailView({
  collection,
  items = [],
  onBack,
  onUnsaveItem,
  onAddToContainer,
  onDeleteCollection,
  onPlayVideo,
  containers = [],
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [viewLayout, setViewLayout] = useState('gallery'); // 'list' | 'compact' | 'gallery'
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSelectable, setIsSelectable] = useState(false);
  const [hydratedMap, setHydratedMap] = useState({});

  const config = getContainerConfig(collection?.container_type);
  const TypeIcon = config.icon;

  // Single-query batch hydration for items in this collection
  useEffect(() => {
    if (!collection?.item_ids || !Array.isArray(collection.item_ids) || collection.item_ids.length === 0) {
      return;
    }

    const itemMap = new Map();
    items.forEach(i => { if (i?.id) itemMap.set(i.id, i); });

    const missingIds = collection.item_ids.filter(id => !itemMap.has(id));
    if (missingIds.length === 0) return;

    let isMounted = true;
    const fetchBatch = async () => {
      try {
        const res = await api.post('/items/batch', {
          ids: missingIds,
          type: collection.container_type || 'collection',
        });

        if (isMounted) {
          // Check degraded sources
          if (Array.isArray(res.data?.degraded_sources) && res.data.degraded_sources.length > 0) {
            toast('Some items could not be loaded.', {
              icon: '⚠️',
              duration: 3500,
            });
          }

          const newlyHydrated = {};
          (res.data?.data || []).forEach(item => {
            if (item && item.id) newlyHydrated[item.id] = item;
          });
          setHydratedMap(prev => ({ ...prev, ...newlyHydrated }));
        }
      } catch (err) {
        console.warn('[CollectionDetailView] Batch hydration error:', err);
      }
    };

    fetchBatch();
    return () => { isMounted = false; };
  }, [collection?.item_ids, collection?.container_type, items]);

  // Filter and map items strictly in this container
  const rawCollectionItems = useMemo(() => {
    if (!collection || !Array.isArray(collection.item_ids)) return [];
    return collection.item_ids.map(id => {
      const found = items.find(i => i.id === id) || hydratedMap[id];
      return found || {
        id,
        title: 'Saved Content',
        item_kind: collection.container_type === 'packs' ? 'note' : (collection.container_type === 'vaults' ? 'snippet' : 'post'),
        type: collection.container_type === 'packs' ? 'note' : (collection.container_type === 'vaults' ? 'snippet' : 'post'),
        thumbnail_url: null,
      };
    });
  }, [items, collection, hydratedMap]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    let result = [...rawCollectionItems];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(i =>
        (i.title && i.title.toLowerCase().includes(q)) ||
        (i.description && i.description.toLowerCase().includes(q)) ||
        (i.subject_name && i.subject_name.toLowerCase().includes(q)) ||
        (i.author_name && i.author_name.toLowerCase().includes(q)) ||
        (i.code && i.code.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'recent') {
      result.sort((a, b) => new Date(b.saved_at || b.created_at) - new Date(a.saved_at || a.created_at));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.saved_at || a.created_at) - new Date(b.saved_at || b.created_at));
    } else if (sortBy === 'title') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return result;
  }, [rawCollectionItems, searchQuery, sortBy]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBatchRemove = () => {
    selectedIds.forEach(id => {
      onUnsaveItem && onUnsaveItem(id, 'unknown');
    });
    setSelectedIds([]);
    setIsSelectable(false);
  };

  // Format date helper
  const formattedDate = useMemo(() => {
    if (!collection?.created_at) return 'Aug 23, 2026';
    try {
      return new Date(collection.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Aug 23, 2026';
    }
  }, [collection?.created_at]);

  const creatorName = collection?.creator_name || collection?.username || 'you';

  return (
    <div className="container-detail-root" style={{
      width: '100%',
      maxWidth: 1200,
      margin: '0 auto',
      boxSizing: 'border-box',
      paddingBottom: 'clamp(40px, 8vw, 80px)',
    }}>
      {/* ── 1. Top Header Row ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        padding: '0 2px',
        width: '100%',
        boxSizing: 'border-box',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              background: 'var(--s2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              cursor: 'pointer',
              padding: '6px 8px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              transition: 'transform 0.15s ease',
              flexShrink: 0,
            }}
            className="hover:border-purple-400 active:scale-95"
            aria-label="Back to saved"
          >
            <ArrowLeft size={18} strokeWidth={2.4} />
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: config.accent,
              textTransform: 'uppercase',
              marginBottom: 2,
            }}>
              {config.badgeLabel}
            </span>
            <h1 style={{
              fontFamily: 'var(--font-display, inherit)',
              fontSize: 'clamp(18px, 3.5vw, 24px)',
              fontWeight: 800,
              color: 'var(--text)',
              margin: 0,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {collection?.name}
            </h1>
          </div>
        </div>

        {/* Action Buttons: Share & Delete */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleShare}
            style={{
              padding: '8px 16px',
              borderRadius: 12,
              background: '#7C3AED',
              color: '#FFFFFF',
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
              transition: 'all 0.18s ease',
            }}
            className="hover:bg-purple-600 active:scale-95"
          >
            <Upload size={14} strokeWidth={2.2} />
            <span>{copiedLink ? 'Copied!' : 'Share'}</span>
          </button>

          <button
            type="button"
            onClick={() => onDeleteCollection && onDeleteCollection(collection?.id)}
            style={{
              padding: '8px 12px',
              borderRadius: 12,
              background: 'var(--s2)',
              border: '1px solid var(--border)',
              color: 'var(--danger, #ef4444)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            className="hover:border-red-400 active:scale-95"
            title={`Delete ${config.label}`}
            aria-label={`Delete ${config.label}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* ── 2. Metadata Pills Row: [N items] [by username] [Aug 23, 2026] ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
        flexWrap: 'wrap',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 12px',
          borderRadius: 8,
          background: 'rgba(124, 58, 237, 0.08)',
          border: '1px solid rgba(124, 58, 237, 0.25)',
          color: config.accent,
          fontSize: 12,
          fontWeight: 700,
        }}>
          <TypeIcon size={14} color={config.accent} />
          <span>{rawCollectionItems.length} items</span>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 12px',
          borderRadius: 8,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          fontSize: 12,
        }}>
          <img
            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${creatorName}`}
            alt=""
            style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--s2)' }}
          />
          <span style={{ color: 'var(--sub)' }}>by</span>
          <span style={{ fontWeight: 700, color: 'var(--text)' }}>{creatorName}</span>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 12px',
          borderRadius: 8,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--sub)',
          fontSize: 12,
          fontWeight: 500,
        }}>
          <Calendar size={13} />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* ── 3. Desktop Controls Toolbar (Single Line on Desktop, Multi-Row on Mobile) ── */}
      <div className="container-controls-toolbar">
        {/* Search Bar */}
        <div className="controls-search-box">
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--sub)' }} />
          <input
            type="text"
            placeholder={`Search items in this ${config.label}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="controls-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--sub)', cursor: 'pointer', padding: 4 }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="controls-sort-box">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="controls-sort-select"
          >
            <option value="recent">Recently saved</option>
            <option value="oldest">Oldest saved</option>
            <option value="title">Alphabetical (A - Z)</option>
          </select>
          <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--sub)', pointerEvents: 'none' }} />
        </div>

        {/* Layout Switcher & Batch Select */}
        <div className="controls-actions-group">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: 2,
          }}>
            <button
              type="button"
              onClick={() => setViewLayout('list')}
              style={{
                padding: '6px 9px',
                borderRadius: 8,
                background: viewLayout === 'list' ? 'rgba(124, 58, 237, 0.14)' : 'transparent',
                color: viewLayout === 'list' ? '#7C3AED' : 'var(--sub)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 30,
              }}
              title="List View"
            >
              <List size={15} />
            </button>

            <button
              type="button"
              onClick={() => setViewLayout('compact')}
              style={{
                padding: '6px 9px',
                borderRadius: 8,
                background: viewLayout === 'compact' ? 'rgba(124, 58, 237, 0.14)' : 'transparent',
                color: viewLayout === 'compact' ? '#7C3AED' : 'var(--sub)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 30,
              }}
              title="Compact View"
            >
              <AlignJustify size={15} />
            </button>

            <button
              type="button"
              onClick={() => setViewLayout('gallery')}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: viewLayout === 'gallery' ? 'rgba(124, 58, 237, 0.14)' : 'transparent',
                color: viewLayout === 'gallery' ? '#7C3AED' : 'var(--sub)',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 12,
                fontWeight: 700,
                minHeight: 30,
              }}
              title="Gallery View"
            >
              <LayoutGrid size={14} />
              <span>Gallery</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsSelectable(!isSelectable);
              setSelectedIds([]);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: 10,
              background: isSelectable ? 'rgba(124, 58, 237, 0.12)' : 'var(--surface)',
              border: isSelectable ? '1px solid #7C3AED' : '1px solid var(--border)',
              color: isSelectable ? '#7C3AED' : 'var(--sub)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              minHeight: 34,
            }}
          >
            <CheckSquare size={14} />
            <span>Select</span>
          </button>
        </div>
      </div>

      {/* ── 4. Main Content Area (Tailored Directly to Container Type) ── */}
      <div style={{ marginBottom: 32 }}>
        {/* Section Title Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: config.avatarGradient,
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}>
              <TypeIcon size={15} color="#FFFFFF" />
            </div>

            <h2 style={{
              fontFamily: 'var(--font-display, inherit)',
              fontSize: 16.5,
              fontWeight: 800,
              color: 'var(--text)',
              margin: 0,
            }}>
              {config.typeTitle}
            </h2>

            <span style={{
              fontSize: 11.5,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 12,
              background: 'var(--s2)',
              color: 'var(--sub)',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {filteredItems.length}
            </span>
          </div>

          {isSelectable && selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleBatchRemove}
              style={{
                padding: '5px 12px',
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Remove ({selectedIds.length})
            </button>
          )}
        </div>

        {/* Content Stream or Empty State */}
        {filteredItems.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: viewLayout === 'gallery'
              ? 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))'
              : '1fr',
            gap: 14,
            width: '100%',
          }}>
            {filteredItems.map(item => {
              const isSelected = selectedIds.includes(item.id);
              if (item.item_kind === 'note' || item.type === 'notes' || item.type === 'question_paper') {
                return (
                  <SavedNoteCard
                    key={item.id}
                    item={item}
                    selectable={isSelectable}
                    selected={isSelected}
                    onToggleSelect={toggleSelect}
                    onUnsave={onUnsaveItem}
                    onAddToContainer={onAddToContainer}
                    containers={containers}
                  />
                );
              }
              if (item.item_kind === 'video' || item.type === 'video' || item.type === 'short') {
                return (
                  <SavedVideoCard
                    key={item.id}
                    item={item}
                    selectable={isSelectable}
                    selected={isSelected}
                    onToggleSelect={toggleSelect}
                    onUnsave={onUnsaveItem}
                    onAddToContainer={onAddToContainer}
                    onPlayVideo={onPlayVideo}
                    containers={containers}
                  />
                );
              }
              if (item.item_kind === 'snippet' || item.type === 'snippet') {
                return (
                  <SavedSnippetCard
                    key={item.id}
                    item={item}
                    selectable={isSelectable}
                    selected={isSelected}
                    onToggleSelect={toggleSelect}
                    onUnsave={onUnsaveItem}
                    onAddToContainer={onAddToContainer}
                    containers={containers}
                  />
                );
              }
              if (item.item_kind === 'course' || item.type === 'course') {
                return (
                  <SavedCourseCard
                    key={item.id}
                    item={item}
                    selectable={isSelectable}
                    selected={isSelected}
                    onToggleSelect={toggleSelect}
                    onUnsave={onUnsaveItem}
                    onAddToContainer={onAddToContainer}
                    containers={containers}
                  />
                );
              }
              if (item.item_kind === 'article' || item.type === 'article') {
                return (
                  <SavedArticleCard
                    key={item.id}
                    item={item}
                    selectable={isSelectable}
                    selected={isSelected}
                    onToggleSelect={toggleSelect}
                    onUnsave={onUnsaveItem}
                    onAddToContainer={onAddToContainer}
                    containers={containers}
                  />
                );
              }
              return (
                <SavedPostCard
                  key={item.id}
                  item={item}
                  selectable={isSelectable}
                  selected={isSelected}
                  onToggleSelect={toggleSelect}
                  onUnsave={onUnsaveItem}
                  onAddToContainer={onAddToContainer}
                  containers={containers}
                />
              );
            })}
          </div>
        ) : (
          /* Empty State Card */
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '44px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
            width: '100%',
            boxSizing: 'border-box',
          }}>
            <IllustratedEmptyGraphic accent={config.accent} />

            <h3 style={{
              fontFamily: 'var(--font-display, inherit)',
              fontSize: 16,
              fontWeight: 800,
              color: 'var(--text)',
              margin: '0 0 6px',
            }}>
              {config.emptyTitle}
            </h3>

            <p style={{
              fontSize: 13,
              color: 'var(--sub)',
              margin: '0 0 20px',
              maxWidth: 340,
              lineHeight: 1.45,
            }}>
              {config.emptyDesc}
            </p>

            <Link href={config.exploreUrl} style={{ textDecoration: 'none' }}>
              <button
                type="button"
                style={{
                  padding: '9px 24px',
                  borderRadius: 10,
                  background: 'rgba(124, 58, 237, 0.08)',
                  border: '1px solid rgba(124, 58, 237, 0.25)',
                  color: config.accent,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                className="hover:bg-purple-600 hover:text-white active:scale-95"
              >
                {config.ctaLabel}
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* ── Separate Desktop & Mobile Responsive Styles ── */}
      <style jsx>{`
        .container-controls-toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
          width: 100%;
        }
        .controls-search-box {
          position: relative;
          flex: 1;
          min-width: 220px;
        }
        .controls-search-input {
          width: 100%;
          padding: 10px 32px 10px 36px;
          border-radius: 10px;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text);
          font-size: 13px;
          outline: none;
          min-height: 38px;
          box-sizing: border-box;
          transition: border-color 0.2s ease;
        }
        .controls-search-input:focus {
          border-color: #7C3AED;
        }
        .controls-sort-box {
          position: relative;
          width: 170px;
          flex-shrink: 0;
        }
        .controls-sort-select {
          width: 100%;
          padding: 10px 30px 10px 14px;
          border-radius: 10px;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          outline: none;
          appearance: none;
          -webkit-appearance: none;
          min-height: 38px;
          box-sizing: border-box;
        }
        .controls-actions-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        /* Mobile specific layout */
        @media (max-width: 768px) {
          .container-controls-toolbar {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }
          .controls-search-box {
            width: 100%;
            min-width: 0;
          }
          .controls-sort-box {
            width: 100%;
          }
          .controls-actions-group {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
}
