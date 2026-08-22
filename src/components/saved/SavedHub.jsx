'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import api from '../../api/axios';
import { supabase } from '../../lib/supabaseClient';
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
import CompositeCoverCard from './containers/CompositeCoverCard';
import CourseEnvelopeCard from './containers/CourseEnvelopeCard';
import PlaylistDetailView from './views/PlaylistDetailView';
import CollectionDetailView from './views/CollectionDetailView';
import SaveToContainerModal from './modals/SaveToContainerModal';
import CreateContainerModal from './modals/CreateContainerModal';
import PlaylistQueuePlayer from './player/PlaylistQueuePlayer';
import { Plus, Sparkles, FolderPlus, Layers, Play } from 'lucide-react';

export default function SavedHub() {
  const [items, setItems] = useState([]);
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View States
  const [activeSpace, setActiveSpace] = useState('all'); // 'all' | 'unorganized'
  const [activeContainer, setActiveContainer] = useState(null); // When opening a specific playlist/collection
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

  // ── Fetch Bookmarks & Containers ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch saved posts & items from main API
      let allItems = [];
      try {
        const res = await api.get('/saved');
        const posts = res.data?.posts || res.data?.items || (Array.isArray(res.data) ? res.data : []);
        allItems = posts.map(p => ({
          ...p,
          id: p.id || p.post_id || p.item_id,
          item_kind: p.item_kind || (p.type === 'notes' || p.note_type ? 'note' : (p.type || 'post')),
          created_at: p.created_at || new Date().toISOString(),
          saved_at: p.saved_at || p.created_at || new Date().toISOString(),
        }));
      } catch (err) {
        console.warn('Fallback: API /saved failed, checking local or supabase:', err);
      }

      // 2. Fetch containers and container items from Supabase if logged in
      let dbContainers = [];
      let containerItemMap = {};

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;

        if (userId) {
          const { data: fetchedContainers } = await supabase
            .from('saved_containers')
            .select('*')
            .eq('user_id', userId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

          if (fetchedContainers) {
            const { data: fetchedItems } = await supabase
              .from('saved_container_items')
              .select('*')
              .eq('user_id', userId)
              .is('deleted_at', null);

            (fetchedItems || []).forEach(ci => {
              if (!containerItemMap[ci.container_id]) containerItemMap[ci.container_id] = [];
              containerItemMap[ci.container_id].push(ci.item_id);
            });

            dbContainers = fetchedContainers.map(c => ({
              ...c,
              item_ids: containerItemMap[c.id] || [],
              item_count: (containerItemMap[c.id] || []).length,
            }));
          }
        }
      } catch (dbErr) {
        console.warn('Supabase containers query:', dbErr);
      }

      // Fallback default sample containers if none exist yet for a rich initial experience
      if (dbContainers.length === 0) {
        dbContainers = [
          {
            id: 'default-playlist-1',
            container_type: 'playlist',
            name: 'System Design & Distributed Systems',
            slug: 'system-design',
            description: 'Core concepts for backend scalability, microservices, and database partitioning.',
            icon: '🎬',
            color_token: '#3B7CFF',
            is_public: true,
            item_ids: allItems.filter(i => i.item_kind === 'video').map(i => i.id),
          },
          {
            id: 'default-envelope-1',
            container_type: 'envelope',
            name: 'Full-Stack Next.js 16 & AI Track',
            slug: 'fullstack-ai-track',
            description: 'Complete course track encompassing frontend architecture, AI tools, and notes.',
            icon: '✉️',
            color_token: '#34C77B',
            is_public: false,
            item_ids: allItems.filter(i => i.item_kind === 'course' || i.item_kind === 'note').map(i => i.id),
          },
          {
            id: 'default-collection-1',
            container_type: 'collection',
            name: 'AI Tooling & Prompts',
            slug: 'ai-tooling',
            description: 'Community posts and discussions regarding modern LLM workflows and prompts.',
            icon: '💡',
            color_token: '#9333EA',
            is_public: true,
            item_ids: allItems.filter(i => i.item_kind === 'post').map(i => i.id),
          },
        ];
      }

      setItems(allItems);
      setContainers(dbContainers);
    } catch (err) {
      console.error('Error in fetchData:', err);
      setError('Failed to load saved items.');
    } finally {
      setLoading(false);
    }
  }, []);

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
      setContainers(prev => prev.map(c => ({
        ...c,
        item_ids: c.item_ids?.filter(id => id !== itemId) || [],
      })));
      setSelectedIds(prev => prev.filter(id => id !== itemId));
    } catch (err) {
      console.error('Failed to unsave:', err);
    }
  };

  // ── Toggle Item in Container (YouTube/IG Checkbox standard) ──
  const handleToggleItemInContainer = async (containerId, itemId, itemKind) => {
    const targetContainer = containers.find(c => c.id === containerId);
    if (!targetContainer) return;

    const isCurrentlyAssigned = targetContainer.item_ids?.includes(itemId);

    // Optimistic Update
    setContainers(prev => prev.map(c => {
      if (c.id !== containerId) return c;
      const newIds = isCurrentlyAssigned
        ? (c.item_ids || []).filter(id => id !== itemId)
        : [...(c.item_ids || []), itemId];
      return {
        ...c,
        item_ids: newIds,
        item_count: newIds.length,
      };
    }));

    // Persist to Supabase
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (userId) {
        if (isCurrentlyAssigned) {
          await supabase
            .from('saved_container_items')
            .delete()
            .eq('container_id', containerId)
            .eq('item_id', itemId)
            .eq('user_id', userId);
        } else {
          await supabase
            .from('saved_container_items')
            .insert({
              container_id: containerId,
              item_id: itemId,
              item_kind: itemKind || 'note',
              user_id: userId,
            });
        }
      }
    } catch (err) {
      console.error('Error persisting container toggle:', err);
    }
  };

  // ── Create Container Mutation ──
  const handleCreateContainer = async (containerData) => {
    const slug = containerData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newContainer = {
      id: `container-${Date.now()}`,
      name: containerData.name,
      slug,
      container_type: containerData.container_type || 'playlist',
      description: containerData.description || '',
      color_token: containerData.color_token || 'var(--primary)',
      is_public: Boolean(containerData.is_public),
      item_ids: containerData.initial_item_id ? [containerData.initial_item_id] : [],
      item_count: containerData.initial_item_id ? 1 : 0,
      created_at: new Date().toISOString(),
    };

    setContainers(prev => [newContainer, ...prev]);

    // Persist to Supabase
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (userId) {
        const { data: createdDbContainer } = await supabase
          .from('saved_containers')
          .insert({
            user_id: userId,
            name: newContainer.name,
            slug: newContainer.slug,
            container_type: newContainer.container_type,
            description: newContainer.description,
            color_token: newContainer.color_token,
            is_public: newContainer.is_public,
          })
          .select()
          .single();

        if (createdDbContainer && containerData.initial_item_id) {
          await supabase
            .from('saved_container_items')
            .insert({
              container_id: createdDbContainer.id,
              item_id: containerData.initial_item_id,
              item_kind: containerData.initial_item_kind || 'note',
              user_id: userId,
            });
        }
      }
    } catch (err) {
      console.error('Error creating container in Supabase:', err);
    }

    return newContainer;
  };

  // ── Delete Container Mutation ──
  const handleDeleteContainer = async (containerId) => {
    setContainers(prev => prev.filter(c => c.id !== containerId));
    if (activeContainer?.id === containerId) {
      setActiveContainer(null);
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (userId) {
        await supabase
          .from('saved_containers')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', containerId)
          .eq('user_id', userId);
      }
    } catch (err) {
      console.error('Error deleting container:', err);
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

  // ── Filtering and Sorting Engine ──
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
      post: items.filter(i => i.item_kind === 'post' || i.type === 'post').length,
      snippet: items.filter(i => i.item_kind === 'snippet' || i.type === 'snippet').length,
      unorganized: items.filter(i => !assignedItemIds.has(i.id)).length,
    };
  }, [items, assignedItemIds]);

  const filteredItems = useMemo(() => {
    let result = [...items];

    // 1. Space Filter (All vs Unorganized)
    if (activeSpace === 'unorganized') {
      result = result.filter(i => !assignedItemIds.has(i.id));
    }

    // 2. Type Pill Filter
    if (activeTypeTab !== 'all') {
      result = result.filter(i => {
        if (activeTypeTab === 'note') return i.item_kind === 'note' || i.type === 'notes' || i.type === 'question_paper';
        if (activeTypeTab === 'video') return i.item_kind === 'video' || i.type === 'video' || i.type === 'short';
        if (activeTypeTab === 'course') return i.item_kind === 'course' || i.type === 'course';
        if (activeTypeTab === 'post') return i.item_kind === 'post' || i.type === 'post';
        if (activeTypeTab === 'snippet') return i.item_kind === 'snippet' || i.type === 'snippet';
        return true;
      });
    }

    // 3. Search Filter
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

    // 4. Sort
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
    <div style={{
      width: '100%',
      maxWidth: 1400,
      margin: '0 auto',
      padding: '24px 16px 80px',
      boxSizing: 'border-box',
    }}>
      {/* ── Detail Views (Playlist View or Collection View) ── */}
      {activeContainer ? (
        activeContainer.container_type === 'playlist' ? (
          <PlaylistDetailView
            playlist={activeContainer}
            items={items}
            onBack={() => setActiveContainer(null)}
            onPlayAll={handlePlayAll}
            onPlayItem={(v) => handlePlayVideo(v, activeContainer)}
            onRemoveItemFromPlaylist={(cid, iid) => handleToggleItemInContainer(cid, iid, 'video')}
            onDeletePlaylist={handleDeleteContainer}
          />
        ) : (
          <CollectionDetailView
            collection={activeContainer}
            items={items}
            onBack={() => setActiveContainer(null)}
            onUnsaveItem={handleUnsave}
            onAddToContainer={(item) => {
              setSaveModalItem(item);
              setIsSaveModalOpen(true);
            }}
            onDeleteCollection={handleDeleteContainer}
            onPlayVideo={handlePlayVideo}
          />
        )
      ) : (
        /* ── Main Hub View: Dual-Column Desktop Layout ── */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(240px, 280px) 1fr',
          gap: 28,
          alignItems: 'start',
        }} className="saved-hub-grid">
          {/* ── Left Sidebar (Spaces & Container Tree) ── */}
          <div style={{
            position: 'sticky',
            top: 24,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md, 16px)',
            padding: '18px 16px',
            boxSizing: 'border-box',
          }} className="saved-sidebar-container">
            <SavedSidebar
              activeSpace={activeSpace}
              activeContainerId={activeContainer?.id}
              containers={containers}
              totalItemsCount={items.length}
              unorganizedCount={counts.unorganized}
              onSelectSpace={(space) => {
                setActiveSpace(space);
                setActiveContainer(null);
              }}
              onSelectContainer={(c) => setActiveContainer(c)}
              onOpenCreateModal={(type) => {
                setCreateModalType(type);
                setIsCreateModalOpen(true);
              }}
            />
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

            {/* ── Featured Envelopes & Playlists Carousels on Hub ── */}
            {activeSpace === 'all' && !searchQuery && activeTypeTab === 'all' && containers.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                {/* Course Envelopes Section */}
                {containers.filter(c => c.container_type === 'envelope').map(env => (
                  <CourseEnvelopeCard
                    key={env.id}
                    container={env}
                    items={items}
                    onOpenEnvelope={() => setActiveContainer(env)}
                    onAddMaterials={() => {
                      setSaveModalItem({ id: 'sample', title: 'Add Course or Notes' });
                      setIsSaveModalOpen(true);
                    }}
                  />
                ))}

                {/* 4-Quadrant Composite Covers Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 16,
                  marginBottom: 20,
                }}>
                  {containers.filter(c => c.container_type !== 'envelope').slice(0, 4).map(c => (
                    <CompositeCoverCard
                      key={c.id}
                      container={c}
                      items={items}
                      onClick={() => setActiveContainer(c)}
                      onPlayAll={() => handlePlayAll(c)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── All Items Feed Stream ── */}
            {loading ? (
              <SavedHubSkeleton />
            ) : filteredItems.length === 0 ? (
              <div style={{
                padding: '64px 24px',
                textAlign: 'center',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md, 16px)',
              }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>🔖</div>
                <h3 style={{ fontFamily: 'var(--font-display, inherit)', fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>
                  {searchQuery ? 'No matching bookmarks found' : 'No saved items here yet'}
                </h3>
                <p style={{ color: 'var(--sub)', fontSize: 13.5, maxWidth: 440, margin: '0 auto 20px', lineHeight: 1.5 }}>
                  {searchQuery
                    ? `No bookmarks matched "${searchQuery}". Try a different keyword.`
                    : 'Save PYQs, lecture notes, video tutorials, code snippets, or community discussions to build your private learning library.'}
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link href="/notes">
                    <button className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>
                      Browse Notes & PYQs
                    </button>
                  </Link>
                  <Link href="/feed">
                    <button className="btn-secondary" style={{ padding: '8px 18px', fontSize: 13 }}>
                      Explore Community Feed
                    </button>
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: viewMode === 'grid'
                  ? 'repeat(auto-fill, minmax(280px, 1fr))'
                  : '1fr',
                gap: 16,
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

      {/* ── YouTube/Instagram Checkbox Save Modal ── */}
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

      {/* ── Create New Container Modal ── */}
      <CreateContainerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
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

      {/* Responsive Styles */}
      <style jsx global>{`
        @media (max-width: 900px) {
          .saved-hub-grid {
            grid-template-columns: 1fr !important;
          }
          .saved-sidebar-container {
            position: relative !important;
            top: 0 !important;
            margin-bottom: 20px;
          }
        }
      `}</style>
    </div>
  );
}
