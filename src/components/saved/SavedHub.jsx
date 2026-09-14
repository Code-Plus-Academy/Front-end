'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import api from '../../api/axios';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useSaveToContainer } from '../../context/SaveToContainerContext';
import toast from 'react-hot-toast';
import SavedSidebar from './SavedSidebar';
import SavedHeader from './SavedHeader';
import SavedBatchActionBar from './SavedBatchActionBar';
import SavedHubSkeleton from './skeletons/SavedHubSkeleton';
import SavedNoteCard from './cards/SavedNoteCard';
import SavedVideoCard from './cards/SavedVideoCard';
import SavedPostCard from './cards/SavedPostCard';
import SavedSnippetCard from './cards/SavedSnippetCard';
import SavedArticleCard from './cards/SavedArticleCard';
import SavedCourseCard from './cards/SavedCourseCard';
import ContainerCarouselSection from './containers/ContainerCarouselSection';
import ContainerAllView from './views/ContainerAllView';
import PlaylistDetailView from './views/PlaylistDetailView';
import CollectionDetailView from './views/CollectionDetailView';
import SaveToContainerModal from './modals/SaveToContainerModal';
import CreateContainerModal from './modals/CreateContainerModal';
import PlaylistQueuePlayer from './player/PlaylistQueuePlayer';
import { Bookmark, Inbox, FileText, Plus } from 'lucide-react';
import { CollectionIcon } from './icons/ContainerIcons';
import { getContainerConfig } from '../../constants/containerConfig';

const TYPE_QUERY_PARAM_MAP = {
  playlist: 'playlist',
  collection: 'collection',
  envelope: 'envelope',
  packs: 'packs',
  study_pack: 'packs',
  vaults: 'vaults',
  snippet_notebook: 'vaults',
};

const LOCAL_STORAGE_KEY = 'cpa_saved_containers_cache';

export default function SavedHub() {
  const { user } = useAuth();
  const {
    containers: contextContainers,
    savedItemsMeta,
    saveItemMetadata,
    refreshContainers,
    handleToggleItemInContainer: toggleInContext,
    handleCreateContainer: createContextContainer,
  } = useSaveToContainer();

  const [items, setItems] = useState([]);
  const [containers, setContainers] = useState(contextContainers || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync containers when context updates
  useEffect(() => {
    if (Array.isArray(contextContainers)) {
      setContainers(contextContainers);
    }
  }, [contextContainers]);

  // View States
  const [activeSpace, setActiveSpace] = useState('all'); // 'all' | 'unorganized'
  const [activeContainer, setActiveContainer] = useState(null);
  const [viewAllType, setViewAllType] = useState(null); // 'envelope' | 'playlist' | 'packs' | 'collection' | 'vaults' | null
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTypeTab, setActiveTypeTab] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('grid');

  // Multi-Selection State
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal States
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveModalItem, setSaveModalItem] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState('playlist');

  // Video Queue Player State
  const [activeVideo, setActiveVideo] = useState(null);
  const [videoQueue, setVideoQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [activePlaylistForQueue, setActivePlaylistForQueue] = useState(null);

  // Check if native Supabase Auth session is active
  const isSupabaseAuthActive = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return Boolean(session?.access_token && session?.user?.id);
    } catch {
      return false;
    }
  }, []);

  // Helper to resolve user ID safely
  const getEffectiveUserId = useCallback(async () => {
    if (user?.id) return user.id;
    if (user?.auth_user_id) return user.auth_user_id;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) return session.user.id;
    } catch {}
    return null;
  }, [user]);

  // ── Route Query-Param Sync Handler ──
  const syncStateFromUrl = useCallback((containersList) => {
    if (typeof window === 'undefined' || !Array.isArray(containersList)) return;
    const params = new URLSearchParams(window.location.search);

    // 1. Sync Create Container Modal state from URL
    const createParam = params.get('create');
    if (createParam) {
      setIsCreateModalOpen(true);
      if (['playlist', 'collection', 'envelope', 'packs', 'vaults'].includes(createParam)) {
        setCreateModalType(createParam);
      }
    } else {
      setIsCreateModalOpen(false);
    }

    // 2. Check for "View All" container pages (e.g., /saved?envelope=all)
    const envelopeParam = params.get('envelope');
    const playlistParam = params.get('playlist');
    const packsParam = params.get('packs') || params.get('study_pack');
    const collectionParam = params.get('collection');
    const vaultsParam = params.get('vaults') || params.get('snippet_notebook');

    if (envelopeParam === 'all') {
      setViewAllType('envelope');
      setActiveContainer(null);
      return;
    }
    if (playlistParam === 'all') {
      setViewAllType('playlist');
      setActiveContainer(null);
      return;
    }
    if (packsParam === 'all') {
      setViewAllType('packs');
      setActiveContainer(null);
      return;
    }
    if (collectionParam === 'all') {
      setViewAllType('collection');
      setActiveContainer(null);
      return;
    }
    if (vaultsParam === 'all') {
      setViewAllType('vaults');
      setActiveContainer(null);
      return;
    }

    // 3. Check for specific Container detail slugs
    const targetSlug = playlistParam || collectionParam || envelopeParam || packsParam || vaultsParam;
    if (targetSlug && targetSlug !== 'all') {
      const found = containersList.find(c =>
        c.slug === targetSlug ||
        c.id === targetSlug ||
        c.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === targetSlug
      );
      if (found) {
        setActiveContainer(found);
        setViewAllType(null);
        return;
      }
    }

    // Default overview
    setViewAllType(null);
    setActiveContainer(null);
  }, []);

  // ── Open / Close Create Container Modal with URL Sync ──
  const handleOpenCreateModal = (type = 'playlist') => {
    setCreateModalType(type);
    setIsCreateModalOpen(true);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('create', type || 'new');
      window.history.pushState({ modal: 'create' }, '', url.toString());
    }
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('create')) {
        url.searchParams.delete('create');
        const newSearch = url.searchParams.toString();
        const newUrl = url.pathname + (newSearch ? `?${newSearch}` : '');
        window.history.pushState({}, '', newUrl);
      }
    }
  };

  // ── Navigate to Container Detail View ──
  const navigateToContainer = (container) => {
    setViewAllType(null);
    if (!container) {
      setActiveContainer(null);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        const createParam = url.searchParams.get('create');
        const newParams = new URLSearchParams();
        if (createParam) newParams.set('create', createParam);
        const newSearch = newParams.toString();
        const newUrl = url.pathname + (newSearch ? `?${newSearch}` : '');
        window.history.pushState({}, '', newUrl);
      }
      return;
    }

    setActiveContainer(container);
    if (typeof window !== 'undefined') {
      const paramKey = TYPE_QUERY_PARAM_MAP[container.container_type] || 'collection';
      const slugVal = container.slug || container.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || container.id;

      const url = new URL(window.location.href);
      const createParam = url.searchParams.get('create');

      const newParams = new URLSearchParams();
      newParams.set(paramKey, slugVal);
      if (createParam) newParams.set('create', createParam);

      const newUrl = url.pathname + `?${newParams.toString()}`;
      window.history.pushState({ containerId: container.id }, '', newUrl);
    }
  };

  // ── Navigate to "View All" Container Page (e.g. /saved?envelope=all) ──
  const handleOpenViewAll = (typeKey) => {
    setActiveContainer(null);
    setViewAllType(typeKey);
    if (typeof window !== 'undefined') {
      const paramKey = TYPE_QUERY_PARAM_MAP[typeKey] || typeKey;
      const url = new URL(window.location.href);
      const createParam = url.searchParams.get('create');

      const newParams = new URLSearchParams();
      newParams.set(paramKey, 'all');
      if (createParam) newParams.set('create', createParam);

      const newUrl = url.pathname + `?${newParams.toString()}`;
      window.history.pushState({ viewAll: typeKey }, '', newUrl);
    }
  };

  // Listen for browser forward/backward navigation
  useEffect(() => {
    const handlePopState = () => {
      syncStateFromUrl(containers);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [containers, syncStateFromUrl]);

  // ── Fetch Bookmarks & Containers Concurrently ──
  const isFetchingRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const itemsMap = new Map();

      // 1. Load from persistent savedItemsMeta first (preserves saved videos, notes, posts)
      if (savedItemsMeta && typeof savedItemsMeta === 'object') {
        Object.values(savedItemsMeta).forEach(item => {
          if (item && item.id) itemsMap.set(item.id, item);
        });
      }

      // 2. Concurrently fetch saved items feed and fresh containers from backend
      let fetchedContainers = [];
      const [savedFeedRes, containersRes] = await Promise.allSettled([
        api.get('/saved'),
        api.get('/saved/containers').catch(() => api.get('/containers')),
      ]);

      if (savedFeedRes.status === 'fulfilled') {
        const res = savedFeedRes.value;
        const posts = res.data?.posts || res.data?.items || (Array.isArray(res.data) ? res.data : []);
        posts.forEach(p => {
          const norm = {
            ...p,
            id: p.id || p.post_id || p.item_id,
            item_kind: p.item_kind || (p.type === 'notes' || p.note_type ? 'note' : (p.type || 'post')),
            created_at: p.created_at || new Date().toISOString(),
            saved_at: p.saved_at || p.created_at || new Date().toISOString(),
          };
          if (norm.id) {
            itemsMap.set(norm.id, { ...(itemsMap.get(norm.id) || {}), ...norm });
          }
        });

        // Check for degraded sources and notify gracefully
        if (Array.isArray(res.data?.degraded_sources) && res.data.degraded_sources.length > 0) {
          toast('Some saved notes or posts could not be reached. Showing available cached items.', {
            icon: '⚠️',
            duration: 3500,
          });
        }
      }

      if (containersRes.status === 'fulfilled') {
        const cRes = containersRes.value;
        const rawContainers = cRes.data && Array.isArray(cRes.data.data) ? cRes.data.data : (Array.isArray(cRes.data) ? cRes.data : null);
        if (Array.isArray(rawContainers)) {
          fetchedContainers = rawContainers.map(c => ({
            ...c,
            item_ids: Array.isArray(c.item_ids) ? c.item_ids : [],
            item_count: typeof c.item_count === 'number' ? c.item_count : (c.item_ids?.length || 0),
          }));
        }
      }

      const activeContainers = fetchedContainers.length > 0 ? fetchedContainers : (contextContainers?.length > 0 ? contextContainers : []);

      // 3. Collect missing item IDs across containers for single batch hydration
      const missingVideoIds = [];
      const missingNoteIds = [];
      const missingPostIds = [];

      activeContainers.forEach(c => {
        (c.item_ids || []).forEach(itemId => {
          if (!itemsMap.has(itemId) || itemsMap.get(itemId)?.title === 'Saved Content') {
            // Temporary entry to prevent layout shift
            if (!itemsMap.has(itemId)) {
              itemsMap.set(itemId, {
                id: itemId,
                title: 'Saved Content',
                item_kind: c.container_type === 'playlist' ? 'video' : (c.container_type === 'packs' ? 'note' : 'post'),
                type: c.container_type === 'playlist' ? 'video' : (c.container_type === 'packs' ? 'note' : 'post'),
              });
            }

            if (c.container_type === 'playlist') {
              missingVideoIds.push(itemId);
            } else if (c.container_type === 'packs' || c.container_type === 'study_pack') {
              missingNoteIds.push(itemId);
            } else {
              missingPostIds.push(itemId);
            }
          }
        });
      });

      // Issue single batch POST requests instead of N parallel individual fetches
      const batchPromises = [];
      if (missingVideoIds.length > 0) {
        batchPromises.push(
          api.post('/items/batch', { ids: missingVideoIds, type: 'video' })
            .then(r => {
              (r.data?.data || []).forEach(v => {
                const norm = {
                  ...v,
                  id: v.id,
                  item_kind: 'video',
                  type: 'video',
                  title: v.title || 'Saved Video',
                  thumbnail_url: v.thumbnail_url || null,
                  channel_title: v.channel_title || v.creator_name || 'Creator',
                };
                itemsMap.set(v.id, norm);
              });
            })
            .catch(() => {})
        );
      }
      if (missingNoteIds.length > 0) {
        batchPromises.push(
          api.post('/items/batch', { ids: missingNoteIds, type: 'note' })
            .then(r => {
              (r.data?.data || []).forEach(n => {
                const norm = {
                  ...n,
                  id: n.id,
                  item_kind: 'note',
                  type: 'note',
                  title: n.title || 'Saved Note',
                };
                itemsMap.set(n.id, norm);
              });
            })
            .catch(() => {})
        );
      }
      if (missingPostIds.length > 0) {
        batchPromises.push(
          api.post('/items/batch', { ids: missingPostIds, type: 'post' })
            .then(r => {
              (r.data?.data || []).forEach(p => {
                const norm = {
                  ...p,
                  id: p.id,
                  item_kind: p.type === 'article' ? 'article' : 'post',
                  title: p.title || 'Saved Post',
                };
                itemsMap.set(p.id, norm);
              });
            })
            .catch(() => {})
        );
      }

      if (batchPromises.length > 0) {
        await Promise.allSettled(batchPromises);
      }

      const allItems = Array.from(itemsMap.values());
      setItems(allItems);
      if (activeContainers.length > 0) {
        setContainers(activeContainers);
      }
      syncStateFromUrl(activeContainers);
    } catch (err) {
      console.error('Error in fetchData:', err);
      setError('Failed to load saved items.');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user?.id, syncStateFromUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Unsave Mutation ──
  const handleUnsave = async (itemId, kind = 'post') => {
    try {
      if (kind === 'note') {
        await api.post(`/notes/${itemId}/bookmark`).catch(() => {});
      } else {
        await api.delete(`/saved/${itemId}`).catch(() => {});
      }

      setItems(prev => prev.filter(i => i.id !== itemId));
      setContainers(prev => {
        const updated = prev.map(c => ({
          ...c,
          item_ids: c.item_ids?.filter(id => id !== itemId) || [],
          item_count: Math.max(0, (c.item_ids?.filter(id => id !== itemId) || []).length),
        }));
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        }
        return updated;
      });
      setSelectedIds(prev => prev.filter(id => id !== itemId));
    } catch (err) {
      console.error('Failed to unsave:', err);
    }
  };

  // ── Toggle Item in Container ──
  const handleToggleItemInContainer = async (containerId, itemId, itemKind) => {
    await toggleInContext(containerId, itemId, itemKind);
  };

  // ── Create Container Mutation ──
  const handleCreateContainer = async (containerData) => {
    const created = await createContextContainer(containerData);
    handleCloseCreateModal();
    if (created) {
      navigateToContainer(created);
    }
    return created;
  };

  // ── Delete Container Mutation ──
  const handleDeleteContainer = async (containerId) => {
    setContainers(prev => {
      const updated = prev.filter(c => c.id !== containerId);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });

    if (activeContainer?.id === containerId) {
      navigateToContainer(null);
    }

    // Primary: backend API soft-delete (enforces is_default = FALSE guard server-side)
    try {
      await api.delete(`/saved/containers/${containerId}`);
    } catch {
      // Fallback: direct Supabase soft-delete
      try {
        const hasSbAuth = await isSupabaseAuthActive();
        const effectiveUserId = await getEffectiveUserId();
        if (hasSbAuth && effectiveUserId) {
          await supabase
            .from('saved_containers')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', containerId)
            .eq('user_id', effectiveUserId);
        }
      } catch (err) {
        console.warn('Supabase delete container error (updated locally):', err);
      }
    }
  };

  // ── Video Playback Triggers ──
  const handlePlayVideo = (video, fromPlaylist = null) => {
    setActiveVideo(video);
    setActivePlaylistForQueue(fromPlaylist);
    if (fromPlaylist) {
      const playlistVideos = items.filter(i => fromPlaylist.item_ids?.includes(i.id));
      setVideoQueue(playlistVideos);
      const idx = playlistVideos.findIndex(v => v.id === video.id);
      setQueueIndex(idx >= 0 ? idx : 0);
    } else {
      setVideoQueue([video]);
      setQueueIndex(0);
    }
  };

  const handlePlayAll = (playlist) => {
    const playlistVideos = items.filter(i => playlist.item_ids?.includes(i.id));
    if (playlistVideos.length === 0) return;
    setActiveVideo(playlistVideos[0]);
    setActivePlaylistForQueue(playlist);
    setVideoQueue(playlistVideos);
    setQueueIndex(0);
  };

  // ── Multi-Select Batch Actions ──
  const toggleSelectItem = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBatchDelete = () => {
    selectedIds.forEach(id => {
      handleUnsave(id, 'unknown');
    });
    setSelectedIds([]);
    setIsSelectMode(false);
  };

  const handleBatchAddToContainer = () => {
    if (selectedIds.length === 0) return;
    const firstItem = items.find(i => i.id === selectedIds[0]);
    setSaveModalItem(firstItem || { id: selectedIds[0], title: `${selectedIds.length} Selected Items` });
    setIsSaveModalOpen(true);
  };

  // ── Grouped Containers by Type ──
  const envelopeContainers = useMemo(() => containers.filter(c => c.container_type === 'envelope'), [containers]);
  const playlistContainers = useMemo(() => containers.filter(c => c.container_type === 'playlist'), [containers]);
  const packContainers = useMemo(() => containers.filter(c => c.container_type === 'packs' || c.container_type === 'study_pack'), [containers]);
  const collectionContainers = useMemo(() => containers.filter(c => c.container_type === 'collection'), [containers]);
  const vaultContainers = useMemo(() => containers.filter(c => c.container_type === 'vaults' || c.container_type === 'snippet_notebook'), [containers]);

  // ── Filtering and Counts ──
  const assignedItemIds = useMemo(() => {
    const ids = new Set();
    containers.forEach(c => c.item_ids?.forEach(id => ids.add(id)));
    return ids;
  }, [containers]);

  const counts = useMemo(() => {
    return {
      all: items.length,
      note: items.filter(i => i.item_kind === 'note' || i.type === 'notes' || i.type === 'question_paper').length,
      video: items.filter(i => i.item_kind === 'video' || i.type === 'video' || i.type === 'short').length,
      course: items.filter(i => i.item_kind === 'course' || i.type === 'course').length,
      post: items.filter(i => (i.item_kind === 'post' || i.type === 'post') && !(typeof i.description === 'string' && i.description.includes('```'))).length,
      snippet: items.filter(i => i.item_kind === 'snippet' || i.type === 'snippet' || (typeof i.description === 'string' && i.description.includes('```'))).length,
      unorganized: items.filter(i => !assignedItemIds.has(i.id)).length,
    };
  }, [items, assignedItemIds]);

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (activeSpace === 'unorganized') {
      result = result.filter(i => !assignedItemIds.has(i.id));
    }

    if (activeTypeTab !== 'all') {
      result = result.filter(i => {
        if (activeTypeTab === 'note') return i.item_kind === 'note' || i.type === 'notes' || i.type === 'question_paper';
        if (activeTypeTab === 'video') return i.item_kind === 'video' || i.type === 'video' || i.type === 'short';
        if (activeTypeTab === 'course') return i.item_kind === 'course' || i.type === 'course';
        if (activeTypeTab === 'post') return (i.item_kind === 'post' || i.type === 'post') && !(typeof i.description === 'string' && i.description.includes('```'));
        if (activeTypeTab === 'snippet') return i.item_kind === 'snippet' || i.type === 'snippet' || (typeof i.description === 'string' && i.description.includes('```'));
        return true;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(i =>
        (i.title && i.title.toLowerCase().includes(q)) ||
        (i.description && i.description.toLowerCase().includes(q)) ||
        (i.subject_name && i.subject_name.toLowerCase().includes(q)) ||
        (i.author_name && i.author_name.toLowerCase().includes(q)) ||
        (i.code && i.code.toLowerCase().includes(q)) ||
        (i.content && i.content.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'recent') {
      result.sort((a, b) => new Date(b.saved_at || b.created_at) - new Date(a.saved_at || a.created_at));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.saved_at || a.created_at) - new Date(b.saved_at || b.created_at));
    } else if (sortBy === 'title') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'popular') {
      result.sort((a, b) => (b.upvote_count || b.downloads || b.likes_count || 0) - (a.upvote_count || a.downloads || a.likes_count || 0));
    }

    return result;
  }, [items, activeSpace, assignedItemIds, activeTypeTab, searchQuery, sortBy]);

  return (
    <div className="saved-hub-root" style={{
      width: '100%',
      maxWidth: 1400,
      margin: '0 auto',
      padding: 'clamp(12px, 3vw, 24px) clamp(10px, 2.5vw, 20px) max(96px, calc(80px + env(safe-area-inset-bottom)))',
      boxSizing: 'border-box',
      overflowX: 'hidden',
    }}>
      {/* ── 1. View All Containers Grid Page (/saved?envelope=all etc.) ── */}
      {viewAllType ? (
        <ContainerAllView
          containerType={viewAllType}
          containers={containers}
          items={items}
          onBack={() => navigateToContainer(null)}
          onSelectContainer={navigateToContainer}
          onOpenCreateModal={handleOpenCreateModal}
          onPlayAll={handlePlayAll}
        />
      ) : activeContainer ? (
        /* ── 2. Container Detail View ── */
        activeContainer.container_type === 'playlist' ? (
          <PlaylistDetailView
            playlist={activeContainer}
            items={items}
            onBack={() => navigateToContainer(null)}
            onPlayAll={handlePlayAll}
            onPlayItem={(v) => handlePlayVideo(v, activeContainer)}
            onRemoveItemFromPlaylist={(cid, iid) => handleToggleItemInContainer(cid, iid, 'video')}
            onDeletePlaylist={handleDeleteContainer}
          />
        ) : (
          <CollectionDetailView
            collection={activeContainer}
            items={items}
            onBack={() => navigateToContainer(null)}
            onUnsaveItem={handleUnsave}
            onAddToContainer={(item) => {
              setSaveModalItem(item);
              setIsSaveModalOpen(true);
            }}
            onDeleteCollection={handleDeleteContainer}
            onPlayVideo={handlePlayVideo}
            containers={containers}
          />
        )
      ) : (
        /* ── 3. Main Hub View: Dual-Column with Sliding Carousels ── */
        <div className="saved-hub-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(240px, 280px) minmax(0, 1fr)',
          gap: 'clamp(16px, 2.5vw, 28px)',
          alignItems: 'start',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}>
          {/* ── Desktop Left Sidebar ── */}
          <div className="saved-desktop-sidebar" style={{
            position: 'sticky',
            top: 24,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md, 16px)',
            padding: '18px 16px',
            boxSizing: 'border-box',
          }}>
            <SavedSidebar
              activeSpace={activeSpace}
              activeContainerId={activeContainer?.id}
              containers={containers}
              totalItemsCount={items.length}
              unorganizedCount={counts.unorganized}
              onSelectSpace={(space) => {
                setActiveSpace(space);
                navigateToContainer(null);
              }}
              onSelectContainer={(c) => navigateToContainer(c)}
              onOpenCreateModal={(type) => handleOpenCreateModal(type)}
              onOpenViewAll={(type) => handleOpenViewAll(type)}
            />
          </div>

          {/* ── Mobile Container Quick Selector Bar (Visible only on screens < 960px) ── */}
          <div className="saved-mobile-container-bar" style={{
            display: 'none',
            flexDirection: 'column',
            gap: 10,
            width: '100%',
            marginBottom: 12,
            boxSizing: 'border-box',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Your Containers ({containers.length})
              </span>
              <button
                type="button"
                onClick={() => handleOpenCreateModal('playlist')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 12px',
                  borderRadius: 20,
                  background: 'var(--primary, #3B7CFF)',
                  color: '#fff',
                  border: 'none',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(59, 124, 255, 0.3)',
                  transition: 'all 0.15s ease',
                }}
                className="active:scale-95"
              >
                <Plus size={13} />
                <span>New</span>
              </button>
            </div>

            {/* Horizontal Scrolling Container Chips */}
            <div style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 4,
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
            }}>
              <button
                type="button"
                onClick={() => {
                  setActiveSpace('all');
                  navigateToContainer(null);
                }}
                style={{
                  padding: '7px 12px',
                  borderRadius: 10,
                  background: activeSpace === 'all' && !activeContainer ? 'rgba(59, 124, 255, 0.12)' : 'var(--surface)',
                  border: activeSpace === 'all' && !activeContainer ? '1px solid var(--primary, #3B7CFF)' : '1px solid var(--border)',
                  color: activeSpace === 'all' && !activeContainer ? 'var(--primary, #3B7CFF)' : 'var(--text)',
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
                className="active:scale-95"
              >
                <Bookmark size={13} />
                <span>All ({items.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveSpace('unorganized');
                  navigateToContainer(null);
                }}
                style={{
                  padding: '7px 12px',
                  borderRadius: 10,
                  background: activeSpace === 'unorganized' && !activeContainer ? 'var(--s2)' : 'var(--surface)',
                  border: activeSpace === 'unorganized' && !activeContainer ? '1px solid var(--border-bright)' : '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
                className="active:scale-95"
              >
                <Inbox size={13} />
                <span>Unorganized ({counts.unorganized})</span>
              </button>

              {containers.map(c => {
                const isSelected = activeContainer?.id === c.id;
                const IconComponent = getContainerConfig(c.container_type).icon;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => navigateToContainer(c)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 10,
                      background: isSelected ? 'rgba(59, 124, 255, 0.15)' : 'var(--surface)',
                      border: isSelected ? '1px solid var(--primary, #3B7CFF)' : '1px solid var(--border)',
                      color: isSelected ? 'var(--primary, #3B7CFF)' : 'var(--text)',
                      fontSize: 12,
                      fontWeight: isSelected ? 700 : 500,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                    className="active:scale-95"
                  >
                    <IconComponent size={13} color={isSelected ? 'var(--primary, #3B7CFF)' : 'currentColor'} />
                    <span>{c.name}</span>
                    <span style={{ fontSize: 10, color: isSelected ? 'var(--primary)' : 'var(--sub)', fontFamily: "'JetBrains Mono', monospace" }}>
                      ({c.item_ids?.length ?? c.item_count ?? 0})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Right Main Content Stage ── */}
          <main style={{ minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
            <SavedHeader
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeTypeTab={activeTypeTab}
              onSelectTypeTab={setActiveTypeTab}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              isSelectMode={isSelectMode}
              onToggleSelectMode={() => {
                setIsSelectMode(!isSelectMode);
                setSelectedIds([]);
              }}
              counts={counts}
            />

            {/* ── Fixed-Size Horizontal Sliding Carousels for Each Container Type ── */}
            {activeSpace === 'all' && !searchQuery && activeTypeTab === 'all' && (
              <div style={{ marginBottom: 32, width: '100%', boxSizing: 'border-box' }}>
                {/* 1. Learning Envelopes Carousel */}
                <ContainerCarouselSection
                  type="envelope"
                  containers={envelopeContainers}
                  items={items}
                  onSelectContainer={navigateToContainer}
                  onOpenViewAll={handleOpenViewAll}
                  onOpenCreateModal={handleOpenCreateModal}
                />

                {/* 2. Video Playlists Carousel */}
                <ContainerCarouselSection
                  type="playlist"
                  containers={playlistContainers}
                  items={items}
                  onSelectContainer={navigateToContainer}
                  onOpenViewAll={handleOpenViewAll}
                  onOpenCreateModal={handleOpenCreateModal}
                  onPlayAll={handlePlayAll}
                />

                {/* 3. Study Packs Carousel */}
                <ContainerCarouselSection
                  type="packs"
                  containers={packContainers}
                  items={items}
                  onSelectContainer={navigateToContainer}
                  onOpenViewAll={handleOpenViewAll}
                  onOpenCreateModal={handleOpenCreateModal}
                />

                {/* 4. Social Collections Carousel */}
                <ContainerCarouselSection
                  type="collection"
                  containers={collectionContainers}
                  items={items}
                  onSelectContainer={navigateToContainer}
                  onOpenViewAll={handleOpenViewAll}
                  onOpenCreateModal={handleOpenCreateModal}
                />

                {/* 5. Code Vaults Carousel */}
                <ContainerCarouselSection
                  type="vaults"
                  containers={vaultContainers}
                  items={items}
                  onSelectContainer={navigateToContainer}
                  onOpenViewAll={handleOpenViewAll}
                  onOpenCreateModal={handleOpenCreateModal}
                />
              </div>
            )}

            {/* ── All Items Feed Stream ── */}
            {loading ? (
              <SavedHubSkeleton />
            ) : filteredItems.length === 0 ? (
              <div style={{
                padding: 'clamp(40px, 8vw, 64px) clamp(16px, 4vw, 24px)',
                textAlign: 'center',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md, 16px)',
                boxSizing: 'border-box',
                width: '100%',
              }}>
                <Bookmark size={40} style={{ color: 'var(--primary)', margin: '0 auto 12px', opacity: 0.8 }} />
                <h3 style={{ fontFamily: 'var(--font-display, inherit)', fontSize: 'clamp(16px, 3vw, 18px)', fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>
                  {searchQuery ? 'No matching bookmarks found' : 'No saved items here yet'}
                </h3>
                <p style={{ color: 'var(--sub)', fontSize: 'clamp(12.5px, 2vw, 13.5px)', maxWidth: 440, margin: '0 auto 20px', lineHeight: 1.5 }}>
                  {searchQuery
                    ? `No bookmarks matched "${searchQuery}". Try a different keyword.`
                    : 'Save PYQs, lecture notes, video tutorials, code snippets, or community discussions to build your private learning library.'}
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link href="/notes">
                    <button className="btn-primary" style={{ padding: '8px 18px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 38 }}>
                      <FileText size={14} />
                      <span>Browse Notes & PYQs</span>
                    </button>
                  </Link>
                  <Link href="/feed">
                    <button className="btn-secondary" style={{ padding: '8px 18px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 38 }}>
                      <CollectionIcon size={14} />
                      <span>Explore Community Feed</span>
                    </button>
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                {activeSpace === 'all' && !searchQuery && activeTypeTab === 'all' && (
                  <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                      All Saved Feed ({filteredItems.length})
                    </h3>
                  </div>
                )}

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: viewMode === 'grid'
                    ? 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))'
                    : '1fr',
                  gap: 16,
                  width: '100%',
                  boxSizing: 'border-box',
                }}>
                  {filteredItems.map(item => {
                    const isSelected = selectedIds.includes(item.id);

                    if (item.item_kind === 'note' || item.type === 'notes' || item.type === 'question_paper') {
                      return (
                        <SavedNoteCard
                          key={`note-${item.id}`}
                          item={item}
                          selectable={isSelectMode}
                          selected={isSelected}
                          onToggleSelect={toggleSelectItem}
                          onUnsave={handleUnsave}
                          onAddToContainer={(it) => {
                            setSaveModalItem(it);
                            setIsSaveModalOpen(true);
                          }}
                          containers={containers}
                        />
                      );
                    }

                    if (item.item_kind === 'video' || item.type === 'video' || item.type === 'short') {
                      return (
                        <SavedVideoCard
                          key={`video-${item.id}`}
                          item={item}
                          selectable={isSelectMode}
                          selected={isSelected}
                          onToggleSelect={toggleSelectItem}
                          onUnsave={handleUnsave}
                          onAddToContainer={(it) => {
                            setSaveModalItem(it);
                            setIsSaveModalOpen(true);
                          }}
                          onPlayVideo={handlePlayVideo}
                          containers={containers}
                        />
                      );
                    }

                    if (item.item_kind === 'snippet' || item.type === 'snippet') {
                      return (
                        <SavedSnippetCard
                          key={`snippet-${item.id}`}
                          item={item}
                          selectable={isSelectMode}
                          selected={isSelected}
                          onToggleSelect={toggleSelectItem}
                          onUnsave={handleUnsave}
                          onAddToContainer={(it) => {
                            setSaveModalItem(it);
                            setIsSaveModalOpen(true);
                          }}
                          containers={containers}
                        />
                      );
                    }

                    if (item.item_kind === 'course' || item.type === 'course') {
                      return (
                        <SavedCourseCard
                          key={`course-${item.id}`}
                          item={item}
                          selectable={isSelectMode}
                          selected={isSelected}
                          onToggleSelect={toggleSelectItem}
                          onUnsave={handleUnsave}
                          onAddToContainer={(it) => {
                            setSaveModalItem(it);
                            setIsSaveModalOpen(true);
                          }}
                          containers={containers}
                        />
                      );
                    }

                    if (item.item_kind === 'article' || item.type === 'article') {
                      return (
                        <SavedArticleCard
                          key={`article-${item.id}`}
                          item={item}
                          selectable={isSelectMode}
                          selected={isSelected}
                          onToggleSelect={toggleSelectItem}
                          onUnsave={handleUnsave}
                          onAddToContainer={(it) => {
                            setSaveModalItem(it);
                            setIsSaveModalOpen(true);
                          }}
                          containers={containers}
                        />
                      );
                    }

                    return (
                      <SavedPostCard
                        key={`post-${item.id}`}
                        item={item}
                        selectable={isSelectMode}
                        selected={isSelected}
                        onToggleSelect={toggleSelectItem}
                        onUnsave={handleUnsave}
                        onAddToContainer={(it) => {
                          setSaveModalItem(it);
                          setIsSaveModalOpen(true);
                        }}
                        containers={containers}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* ── Multi-Select Batch Action Bar ── */}
      <SavedBatchActionBar
        selectedCount={selectedIds.length}
        onBatchAddToContainer={handleBatchAddToContainer}
        onBatchDelete={handleBatchDelete}
        onDeselectAll={() => {
          setSelectedIds([]);
          setIsSelectMode(false);
        }}
      />

      {/* ── YouTube-Style Save Modal ── */}
      <SaveToContainerModal
        isOpen={isSaveModalOpen}
        onClose={() => {
          setIsSaveModalOpen(false);
          setSaveModalItem(null);
        }}
        item={saveModalItem}
        containers={containers}
        onToggleItemInContainer={handleToggleItemInContainer}
        onCreateContainer={handleCreateContainer}
      />

      {/* ── Create New Container Modal with URL ?create=new Sync ── */}
      <CreateContainerModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onCreate={handleCreateContainer}
        initialType={createModalType}
      />

      {/* ── Continuous Video Queue Player Drawer ── */}
      <PlaylistQueuePlayer
        activeVideo={activeVideo}
        playlist={activePlaylistForQueue}
        queue={videoQueue}
        currentIndex={queueIndex}
        onNext={() => {
          if (queueIndex < videoQueue.length - 1) {
            setQueueIndex(queueIndex + 1);
            setActiveVideo(videoQueue[queueIndex + 1]);
          }
        }}
        onPrev={() => {
          if (queueIndex > 0) {
            setQueueIndex(queueIndex - 1);
            setActiveVideo(videoQueue[queueIndex - 1]);
          }
        }}
        onClose={() => setActiveVideo(null)}
        onSelectIndex={(idx) => {
          setQueueIndex(idx);
          setActiveVideo(videoQueue[idx]);
        }}
      />

      {/* Responsive Breakpoint Rules */}
      <style jsx global>{`
        @media (max-width: 960px) {
          .saved-hub-grid {
            grid-template-columns: 100% !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow-x: hidden !important;
          }
          .saved-desktop-sidebar {
            display: none !important;
          }
          .saved-mobile-container-bar {
            display: flex !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow-x: hidden !important;
          }
        }
        @media (max-width: 640px) {
          .saved-hub-root {
            padding-left: 12px !important;
            padding-right: 12px !important;
            padding-bottom: calc(96px + env(safe-area-inset-bottom)) !important;
          }
          .container-card-fluid {
            --container-card-width: clamp(200px, 58vw, 240px) !important;
            max-width: calc(100vw - 32px) !important;
          }
        }
      `}</style>
    </div>
  );
}
