'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Upload,
  Calendar,
  Search,
  ChevronDown,
  List,
  AlignJustify,
  LayoutGrid,
  ChevronRight,
  Plus,
  Bookmark,
  Trash2,
  Lock,
  Globe,
  FileText,
  Code,
  CheckSquare,
  X,
} from 'lucide-react';
import { PlaylistIcon, CollectionIcon, StudyPackIcon, EnvelopeIcon, VaultIcon } from '../icons/ContainerIcons';
import SavedNoteCard from '../cards/SavedNoteCard';
import SavedPostCard from '../cards/SavedPostCard';
import SavedSnippetCard from '../cards/SavedSnippetCard';
import SavedArticleCard from '../cards/SavedArticleCard';
import SavedCourseCard from '../cards/SavedCourseCard';
import SavedVideoCard from '../cards/SavedVideoCard';

const TYPE_CONFIG = {
  envelope: {
    label: 'envelope',
    badgeLabel: 'LEARNING ENVELOPE',
    icon: EnvelopeIcon,
    accent: '#7C3AED',
    avatarGradient: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
    ctaGradient: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)',
    exploreUrl: '/notes',
  },
  playlist: {
    label: 'playlist',
    badgeLabel: 'VIDEO PLAYLIST',
    icon: PlaylistIcon,
    accent: 'var(--primary, #3B7CFF)',
    avatarGradient: 'linear-gradient(135deg, #3B7CFF 0%, #6366F1 100%)',
    ctaGradient: 'linear-gradient(135deg, #3B7CFF 0%, #8B5CF6 100%)',
    exploreUrl: '/feed',
  },
  packs: {
    label: 'study pack',
    badgeLabel: 'STUDY PACK',
    icon: StudyPackIcon,
    accent: 'var(--green, #10B981)',
    avatarGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    ctaGradient: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
    exploreUrl: '/notes',
  },
  study_pack: {
    label: 'study pack',
    badgeLabel: 'STUDY PACK',
    icon: StudyPackIcon,
    accent: 'var(--green, #10B981)',
    avatarGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    ctaGradient: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
    exploreUrl: '/notes',
  },
  collection: {
    label: 'collection',
    badgeLabel: 'COLLECTION',
    icon: CollectionIcon,
    accent: 'var(--accent-purple, #9333EA)',
    avatarGradient: 'linear-gradient(135deg, #9333EA 0%, #EC4899 100%)',
    ctaGradient: 'linear-gradient(135deg, #9333EA 0%, #FF5E62 100%)',
    exploreUrl: '/feed',
  },
  vaults: {
    label: 'code vault',
    badgeLabel: 'CODE VAULT',
    icon: VaultIcon,
    accent: 'var(--yellow, #F59E0B)',
    avatarGradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    ctaGradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
    exploreUrl: '/feed',
  },
  snippet_notebook: {
    label: 'code vault',
    badgeLabel: 'CODE VAULT',
    icon: VaultIcon,
    accent: 'var(--yellow, #F59E0B)',
    avatarGradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    ctaGradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
    exploreUrl: '/feed',
  },
};

// ── Cute Illustrated Empty Box / Envelope SVG with Radiating Bursts ──
function IllustratedEnvelopeGraphic() {
  return (
    <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* 4 Radiating Sparks */}
      <span style={{ position: 'absolute', top: 6, left: 16, width: 3.5, height: 9, background: '#A855F7', borderRadius: 2, transform: 'rotate(-40deg)' }} />
      <span style={{ position: 'absolute', top: 6, right: 16, width: 3.5, height: 9, background: '#8B5CF6', borderRadius: 2, transform: 'rotate(40deg)' }} />
      <span style={{ position: 'absolute', bottom: 10, left: 12, width: 9, height: 3.5, background: '#C084FC', borderRadius: 2, transform: 'rotate(-10deg)' }} />
      <span style={{ position: 'absolute', bottom: 10, right: 12, width: 9, height: 3.5, background: '#C084FC', borderRadius: 2, transform: 'rotate(10deg)' }} />

      {/* Center Illustrated Pastel Envelope */}
      <svg width="72" height="60" viewBox="0 0 72 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Envelope Back & Flap Base */}
        <path d="M6 16C6 11.5817 9.58172 8 14 8H58C62.4183 8 66 11.5817 66 16V46C66 50.4183 62.4183 54 58 54H14C9.58172 54 6 50.4183 6 46V16Z" fill="#F3E8FF" stroke="#D8B4FE" strokeWidth="2.5" />
        {/* Enclosed Document Paper sticking up */}
        <rect x="18" y="2" width="36" height="30" rx="4" fill="#FFFFFF" stroke="#D8B4FE" strokeWidth="2" />
        {/* Document lines */}
        <line x1="24" y1="9" x2="42" y2="9" stroke="#E9D5FF" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="24" y1="15" x2="48" y2="15" stroke="#E9D5FF" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="24" y1="21" x2="38" y2="21" stroke="#E9D5FF" strokeWidth="2.5" strokeLinecap="round" />
        {/* Envelope Front V-Flap */}
        <path d="M6 18L36 36L66 18" stroke="#D8B4FE" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
        {/* Bottom Fold Overlays */}
        <path d="M6 48L28 30" stroke="#E9D5FF" strokeWidth="2" />
        <path d="M66 48L44 30" stroke="#E9D5FF" strokeWidth="2" />
      </svg>
    </div>
  );
}

// ── Cute Illustrated Speech Bubble / Heart Graphic with Radiating Bursts ──
function IllustratedHeartGraphic() {
  return (
    <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* 4 Radiating Sparks */}
      <span style={{ position: 'absolute', top: 6, left: 16, width: 3.5, height: 9, background: '#C084FC', borderRadius: 2, transform: 'rotate(-40deg)' }} />
      <span style={{ position: 'absolute', top: 6, right: 16, width: 3.5, height: 9, background: '#C084FC', borderRadius: 2, transform: 'rotate(40deg)' }} />
      <span style={{ position: 'absolute', bottom: 10, left: 14, width: 9, height: 3.5, background: '#E879F9', borderRadius: 2, transform: 'rotate(35deg)' }} />
      <span style={{ position: 'absolute', bottom: 10, right: 14, width: 9, height: 3.5, background: '#E879F9', borderRadius: 2, transform: 'rotate(-35deg)' }} />

      {/* Bubble with Heart */}
      <svg width="68" height="68" viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="6" width="52" height="46" rx="20" fill="#FCE7F3" stroke="#F472B6" strokeWidth="2.5" />
        <path d="M34 52L26 60V52H34Z" fill="#FCE7F3" stroke="#F472B6" strokeWidth="2" />
        {/* Heart Icon */}
        <path d="M34 38.5C34 38.5 24 31.5 24 24.5C24 21 26.5 18.5 29.5 18.5C31.5 18.5 33.2 19.5 34 21C34.8 19.5 36.5 18.5 38.5 18.5C41.5 18.5 44 21 44 24.5C44 31.5 34 38.5 34 38.5Z" fill="#EC4899" />
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
  const [activeFilterTab, setActiveFilterTab] = useState('all'); // 'all' | 'video' | 'note' | 'snippet' | 'post'
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSelectable, setIsSelectable] = useState(false);

  const config = TYPE_CONFIG[collection.container_type] || TYPE_CONFIG.collection;
  const TypeIcon = config.icon;

  // Filter items in this container
  const rawCollectionItems = useMemo(() => {
    return items.filter(i => collection.item_ids?.includes(i.id)) || [];
  }, [items, collection.item_ids]);

  // Video items vs all items in this container
  const videoItems = useMemo(() => {
    return rawCollectionItems.filter(i => i.item_kind === 'video' || i.type === 'video' || i.type === 'short');
  }, [rawCollectionItems]);

  const noteItems = useMemo(() => {
    return rawCollectionItems.filter(i => i.item_kind === 'note' || i.type === 'notes' || i.type === 'question_paper');
  }, [rawCollectionItems]);

  const snippetItems = useMemo(() => {
    return rawCollectionItems.filter(i => i.item_kind === 'snippet' || i.type === 'snippet');
  }, [rawCollectionItems]);

  const postItems = useMemo(() => {
    return rawCollectionItems.filter(i => i.item_kind === 'post' || i.type === 'post' || i.type === 'article' || i.type === 'course');
  }, [rawCollectionItems]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    let result = [...rawCollectionItems];

    if (activeFilterTab === 'video') {
      result = result.filter(i => i.item_kind === 'video' || i.type === 'video' || i.type === 'short');
    } else if (activeFilterTab === 'note') {
      result = result.filter(i => i.item_kind === 'note' || i.type === 'notes' || i.type === 'question_paper');
    } else if (activeFilterTab === 'snippet') {
      result = result.filter(i => i.item_kind === 'snippet' || i.type === 'snippet');
    } else if (activeFilterTab === 'post') {
      result = result.filter(i => i.item_kind === 'post' || i.type === 'post' || i.type === 'article');
    }

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
  }, [rawCollectionItems, activeFilterTab, searchQuery, sortBy]);

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
    if (!collection.created_at) return 'Aug 17, 2025';
    try {
      return new Date(collection.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Aug 17, 2025';
    }
  }, [collection.created_at]);

  const creatorName = collection.creator_name || collection.username || 'your-username';

  return (
    <div style={{
      width: '100%',
      maxWidth: 760,
      margin: '0 auto',
      boxSizing: 'border-box',
      paddingBottom: 40,
    }}>
      {/* ── 1. Top Header Row: Arrow + Title + Purple Share Pill ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        padding: '0 4px',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              transition: 'transform 0.15s ease',
            }}
            className="hover:bg-white/5 active:scale-90"
            aria-label="Back to saved"
          >
            <ArrowLeft size={22} strokeWidth={2.4} />
          </button>

          <h1 style={{
            fontFamily: 'var(--font-display, inherit)',
            fontSize: 'clamp(18px, 4vw, 22px)',
            fontWeight: 800,
            color: 'var(--text)',
            margin: 0,
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {collection.name}
          </h1>
        </div>

        {/* Purple Share Button Pill */}
        <button
          type="button"
          onClick={handleShare}
          style={{
            padding: '8px 18px',
            borderRadius: 12,
            background: '#7C3AED',
            color: '#FFFFFF',
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
            transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
            flexShrink: 0,
          }}
          className="hover:bg-purple-600 active:scale-95"
        >
          <Upload size={15} strokeWidth={2.2} />
          <span>{copiedLink ? 'Copied!' : 'Share'}</span>
        </button>
      </div>

      {/* ── 2. Metadata Chip Row: [0 items] [by username] [Aug 17, 2025] ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 18,
        flexWrap: 'wrap',
      }}>
        {/* Chip 1: Items count pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 14px',
          borderRadius: 10,
          background: 'rgba(124, 58, 237, 0.08)',
          border: '1px solid rgba(124, 58, 237, 0.25)',
          color: '#7C3AED',
          fontSize: 12.5,
          fontWeight: 700,
        }}>
          <EnvelopeIcon size={14} color="#7C3AED" />
          <span>{rawCollectionItems.length} items</span>
        </div>

        {/* Chip 2: Creator username pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          padding: '6px 14px',
          borderRadius: 10,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          fontSize: 12.5,
        }}>
          <img
            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${creatorName}`}
            alt=""
            style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--s2)' }}
          />
          <span style={{ color: 'var(--sub)' }}>by</span>
          <span style={{ fontWeight: 700, color: 'var(--text)' }}>{creatorName}</span>
        </div>

        {/* Chip 3: Creation date pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 14px',
          borderRadius: 10,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--sub)',
          fontSize: 12.5,
          fontWeight: 500,
        }}>
          <Calendar size={14} />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* ── 3. Search Bar: "Search saved items in this envelope..." ── */}
      <div style={{ position: 'relative', marginBottom: 14, width: '100%', boxSizing: 'border-box' }}>
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--sub)',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          placeholder={`Search saved items in this ${config.label}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '11px 36px 11px 40px',
            borderRadius: 12,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontSize: 13.5,
            outline: 'none',
            transition: 'all 0.2s ease',
            boxSizing: 'border-box',
            minHeight: 44,
          }}
          className="focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
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
            }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* ── 4. Dropdown Filter Bar: "Recently saved ▼" ── */}
      <div style={{ marginBottom: 16, width: '100%' }}>
        <div style={{
          position: 'relative',
          display: 'inline-block',
          width: '100%',
        }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 36px 11px 16px',
              borderRadius: 12,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none',
              WebkitAppearance: 'none',
              minHeight: 44,
              transition: 'border-color 0.2s ease',
            }}
            className="hover:border-purple-400"
          >
            <option value="recent">Recently saved</option>
            <option value="oldest">Oldest saved</option>
            <option value="title">Alphabetical (A - Z)</option>
          </select>
          <ChevronDown
            size={16}
            style={{
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--sub)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      {/* ── 5. View Switcher Buttons [≣] [≡] [🖼 Gallery] & Horizontal Filter Tabs ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 24,
        flexWrap: 'wrap',
      }}>
        {/* Layout Mode Group */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 3,
        }}>
          {/* List View */}
          <button
            type="button"
            onClick={() => setViewLayout('list')}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              background: viewLayout === 'list' ? 'rgba(124, 58, 237, 0.12)' : 'transparent',
              color: viewLayout === 'list' ? '#7C3AED' : 'var(--sub)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 32,
              transition: 'all 0.15s ease',
            }}
            title="List View"
          >
            <List size={16} />
          </button>

          {/* Compact Lines View */}
          <button
            type="button"
            onClick={() => setViewLayout('compact')}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              background: viewLayout === 'compact' ? 'rgba(124, 58, 237, 0.12)' : 'transparent',
              color: viewLayout === 'compact' ? '#7C3AED' : 'var(--sub)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 32,
              transition: 'all 0.15s ease',
            }}
            title="Compact View"
          >
            <AlignJustify size={16} />
          </button>

          {/* Gallery View */}
          <button
            type="button"
            onClick={() => setViewLayout('gallery')}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: viewLayout === 'gallery' ? 'rgba(124, 58, 237, 0.12)' : 'transparent',
              color: viewLayout === 'gallery' ? '#7C3AED' : 'var(--sub)',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              fontWeight: 700,
              minHeight: 32,
              transition: 'all 0.15s ease',
            }}
            title="Gallery View"
          >
            <LayoutGrid size={15} />
            <span>Gallery</span>
          </button>
        </div>

        {/* Filter Chips Scroll Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          flex: '1 1 auto',
          minWidth: 0,
        }}>
          {/* Tab 1: All saved */}
          <button
            type="button"
            onClick={() => setActiveFilterTab('all')}
            style={{
              padding: '7px 14px',
              borderRadius: 20,
              background: activeFilterTab === 'all' ? 'rgba(124, 58, 237, 0.12)' : 'var(--surface)',
              border: activeFilterTab === 'all' ? '1px solid #7C3AED' : '1px solid var(--border)',
              color: activeFilterTab === 'all' ? '#7C3AED' : 'var(--text)',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <Bookmark size={13} fill={activeFilterTab === 'all' ? 'currentColor' : 'none'} />
            <span>All saved ({rawCollectionItems.length})</span>
            <ChevronRight size={13} style={{ opacity: 0.6 }} />
          </button>

          {/* Tab 2: Videos & Playlists */}
          <button
            type="button"
            onClick={() => setActiveFilterTab('video')}
            style={{
              padding: '7px 14px',
              borderRadius: 20,
              background: activeFilterTab === 'video' ? 'rgba(124, 58, 237, 0.12)' : 'var(--surface)',
              border: activeFilterTab === 'video' ? '1px solid #7C3AED' : '1px solid var(--border)',
              color: activeFilterTab === 'video' ? '#7C3AED' : 'var(--text)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <PlaylistIcon size={13} color="currentColor" />
            <span>Videos & Playlists ({videoItems.length})</span>
            <ChevronRight size={13} style={{ opacity: 0.6 }} />
          </button>

          {/* Tab 3: Notes & Docs */}
          <button
            type="button"
            onClick={() => setActiveFilterTab('note')}
            style={{
              padding: '7px 14px',
              borderRadius: 20,
              background: activeFilterTab === 'note' ? 'rgba(124, 58, 237, 0.12)' : 'var(--surface)',
              border: activeFilterTab === 'note' ? '1px solid #7C3AED' : '1px solid var(--border)',
              color: activeFilterTab === 'note' ? '#7C3AED' : 'var(--text)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <FileText size={13} />
            <span>Notes & Docs ({noteItems.length})</span>
            <ChevronRight size={13} style={{ opacity: 0.6 }} />
          </button>

          {/* Tab 4: Code & Snippets */}
          <button
            type="button"
            onClick={() => setActiveFilterTab('snippet')}
            style={{
              padding: '7px 14px',
              borderRadius: 20,
              background: activeFilterTab === 'snippet' ? 'rgba(124, 58, 237, 0.12)' : 'var(--surface)',
              border: activeFilterTab === 'snippet' ? '1px solid #7C3AED' : '1px solid var(--border)',
              color: activeFilterTab === 'snippet' ? '#7C3AED' : 'var(--text)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <Code size={13} />
            <span>Code & Snippets ({snippetItems.length})</span>
            <ChevronRight size={13} style={{ opacity: 0.6 }} />
          </button>
        </div>
      </div>

      {/* ── 6. Section 1: "Video Playlists (0)" with "View all →" ── */}
      {(activeFilterTab === 'all' || activeFilterTab === 'video') && (
        <div style={{ marginBottom: 28 }}>
          {/* Section Title Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Circular purple icon avatar */}
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#7C3AED',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)',
              }}>
                <PlaylistIcon size={16} color="#FFFFFF" />
              </div>

              <h2 style={{
                fontFamily: 'var(--font-display, inherit)',
                fontSize: 17,
                fontWeight: 800,
                color: 'var(--text)',
                margin: 0,
              }}>
                Video Playlists
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
                {videoItems.length}
              </span>
            </div>

            <Link href="/saved?playlist=all" style={{ textDecoration: 'none' }}>
              <span style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#7C3AED',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
              }}>
                View all →
              </span>
            </Link>
          </div>

          {/* If video items exist, render video cards in horizontal scroll or grid */}
          {videoItems.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: viewLayout === 'gallery'
                ? 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))'
                : '1fr',
              gap: 14,
            }}>
              {videoItems.map(item => (
                <SavedVideoCard
                  key={item.id}
                  item={item}
                  selectable={isSelectable}
                  selected={selectedIds.includes(item.id)}
                  onToggleSelect={toggleSelect}
                  onUnsave={onUnsaveItem}
                  onAddToContainer={onAddToContainer}
                  onPlayVideo={onPlayVideo}
                  containers={containers}
                />
              ))}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
              gap: 14,
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}>
              {/* Illustrated Card */}
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: '28px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
              }}>
                <IllustratedEnvelopeGraphic />

                <h3 style={{
                  fontFamily: 'var(--font-display, inherit)',
                  fontSize: 15.5,
                  fontWeight: 800,
                  color: 'var(--text)',
                  margin: '0 0 6px',
                }}>
                  No video playlists yet
                </h3>

                <p style={{
                  fontSize: 12.5,
                  color: 'var(--sub)',
                  margin: '0 0 16px',
                  maxWidth: 240,
                  lineHeight: 1.45,
                }}>
                  Save video playlists to this envelope and access them anytime.
                </p>

                <Link href="/feed" style={{ textDecoration: 'none' }}>
                  <button
                    type="button"
                    style={{
                      padding: '8px 20px',
                      borderRadius: 10,
                      background: 'rgba(124, 58, 237, 0.08)',
                      border: '1px solid rgba(124, 58, 237, 0.25)',
                      color: '#7C3AED',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    className="hover:bg-purple-600 hover:text-white active:scale-95"
                  >
                    Save a playlist
                  </button>
                </Link>
              </div>

              {/* Dashed Action Card */}
              <Link href="/feed" style={{ textDecoration: 'none', display: 'flex' }}>
                <div style={{
                  width: '100%',
                  background: 'var(--surface)',
                  border: '1.5px dashed var(--border)',
                  borderRadius: 20,
                  padding: '28px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
                className="hover:border-purple-400 active:scale-98"
                >
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    background: 'rgba(124, 58, 237, 0.1)',
                    color: '#7C3AED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Plus size={20} strokeWidth={2.4} />
                  </div>

                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                    Save a playlist
                  </span>
                </div>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── 7. Section 2: "All Saved Feed (0)" ── */}
      <div style={{ marginBottom: 28 }}>
        {/* Section Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Circular purple icon avatar */}
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#7C3AED',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)',
            }}>
              <FileText size={16} color="#FFFFFF" />
            </div>

            <h2 style={{
              fontFamily: 'var(--font-display, inherit)',
              fontSize: 17,
              fontWeight: 800,
              color: 'var(--text)',
              margin: 0,
            }}>
              All Saved Feed
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

          {/* Delete collection button on right if user wants to delete */}
          <button
            type="button"
            onClick={() => onDeleteCollection && onDeleteCollection(collection.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--sub)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              borderRadius: 6,
            }}
            className="hover:text-red-500 active:scale-95"
            title="Delete this container"
          >
            <Trash2 size={13} />
            <span>Delete envelope</span>
          </button>
        </div>

        {/* Content Stream or Empty State */}
        {filteredItems.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: viewLayout === 'gallery'
              ? 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))'
              : '1fr',
            gap: 14,
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
          /* Empty Card State */
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '36px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
            width: '100%',
            boxSizing: 'border-box',
          }}>
            <IllustratedHeartGraphic />

            <h3 style={{
              fontFamily: 'var(--font-display, inherit)',
              fontSize: 16,
              fontWeight: 800,
              color: 'var(--text)',
              margin: '0 0 6px',
            }}>
              No items saved yet
            </h3>

            <p style={{
              fontSize: 13,
              color: 'var(--sub)',
              margin: '0 0 18px',
              maxWidth: 320,
              lineHeight: 1.45,
            }}>
              Start saving notes, documents, links and more.
            </p>

            <Link href={config.exploreUrl} style={{ textDecoration: 'none' }}>
              <button
                type="button"
                style={{
                  padding: '9px 24px',
                  borderRadius: 10,
                  background: 'rgba(124, 58, 237, 0.08)',
                  border: '1px solid rgba(124, 58, 237, 0.25)',
                  color: '#7C3AED',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                className="hover:bg-purple-600 hover:text-white active:scale-95"
              >
                Save something
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Responsive Breakpoints */}
      <style jsx>{`
        @media (max-width: 600px) {
          div[style*="grid-template-columns: minmax(240px, 1.4fr) minmax(180px, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
