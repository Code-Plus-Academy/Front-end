'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import api from '../api/axios';
import SaveToContainerModal from '../components/saved/modals/SaveToContainerModal';

const SaveToContainerContext = createContext(null);

const LEGACY_STORAGE_KEY = 'cpa_saved_containers_cache';
const getContainersKey = (uid) => uid ? `cpa_saved_containers_${uid}` : 'cpa_saved_containers_guest';
const getItemsMetaKey = (uid) => uid ? `cpa_saved_items_meta_${uid}` : 'cpa_saved_items_meta_guest';

export function SaveToContainerProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id || user?.user_id || null;
  const [isOpen, setIsOpen] = useState(false);
  const [targetItem, setTargetItem] = useState(null);
  const [containers, setContainers] = useState([]);
  const [savedItemsMeta, setSavedItemsMeta] = useState({});

  // Check if native Supabase Auth session is active
  const isSupabaseAuthActive = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return Boolean(session?.access_token && session?.user?.id);
    } catch {
      return false;
    }
  }, []);

  const getEffectiveUserId = useCallback(async () => {
    if (user?.id) return user.id;
    if (user?.auth_user_id) return user.auth_user_id;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) return session.user.id;
    } catch {}
    return null;
  }, [user]);

  // Load saved item metadata from user-scoped storage
  const loadSavedItemsMeta = useCallback(() => {
    if (typeof window === 'undefined') return {};
    try {
      const key = getItemsMetaKey(userId);
      const dataStr = localStorage.getItem(key);
      if (dataStr) {
        return JSON.parse(dataStr) || {};
      }
    } catch (e) {
      console.warn('Error reading saved items metadata cache:', e);
    }
    return {};
  }, [userId]);

  // Persist single item metadata
  const saveItemMetadata = useCallback((item) => {
    if (!item || !item.id || typeof window === 'undefined') return;
    try {
      const key = getItemsMetaKey(userId);
      const currentMeta = loadSavedItemsMeta();
      const normalized = {
        id: item.id,
        title: item.title || item.name || item.caption || item.description || 'Saved Content',
        description: item.description || '',
        item_kind: item.item_kind || item.type || 'video',
        type: item.type || item.item_kind || 'video',
        thumbnail_url: item.thumbnail_url || item.thumbnail || item.preview_url || (item.files?.[0]?.storage_url) || null,
        video_url: item.video_url || item.source_url || null,
        channel_title: item.channel_title || item.creator_name || item.author_name || 'Creator',
        creator_name: item.creator_name || item.channel_title || item.author_name || item.creator_username || 'Creator',
        duration: item.duration || item.duration_formatted || null,
        views_count: item.views_count || item.views || 0,
        likes_count: item.likes_count || item.likes || 0,
        saved_at: item.saved_at || new Date().toISOString(),
        created_at: item.created_at || new Date().toISOString(),
      };
      const updated = { ...currentMeta, [item.id]: normalized };
      localStorage.setItem(key, JSON.stringify(updated));
      setSavedItemsMeta(updated);
    } catch (e) {
      console.warn('Error saving item metadata cache:', e);
    }
  }, [userId, loadSavedItemsMeta]);

  const isRefreshingRef = useRef(false);

  // Load containers from backend API / Supabase and sync user-scoped storage safely
  const refreshContainers = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    let localCached = [];
    if (typeof window !== 'undefined') {
      try {
        const userKey = getContainersKey(userId);
        let cachedStr = localStorage.getItem(userKey);
        if (!cachedStr) {
          cachedStr = localStorage.getItem(LEGACY_STORAGE_KEY);
          if (cachedStr) {
            localStorage.setItem(userKey, cachedStr);
          }
        }
        if (cachedStr) {
          localCached = JSON.parse(cachedStr) || [];
        }
      } catch (e) {
        console.warn('Error parsing cached containers:', e);
      }
    }

    let dbContainers = [...localCached];

    // 1. Try Backend API as primary source of truth
    try {
      let apiContainers = null;
      try {
        const res = await api.get('/saved/containers');
        if (res.data && Array.isArray(res.data.data)) {
          apiContainers = res.data.data;
        } else if (Array.isArray(res.data)) {
          apiContainers = res.data;
        }
      } catch {
        const res = await api.get('/containers').catch(() => null);
        if (res?.data && Array.isArray(res.data.data)) {
          apiContainers = res.data.data;
        } else if (Array.isArray(res?.data)) {
          apiContainers = res.data;
        }
      }

      if (Array.isArray(apiContainers)) {
        dbContainers = apiContainers.map(c => ({
          ...c,
          item_ids: Array.isArray(c.item_ids) ? c.item_ids : [],
          item_count: typeof c.item_count === 'number' ? c.item_count : (c.item_ids?.length || 0),
        }));

        if (typeof window !== 'undefined') {
          const userKey = getContainersKey(userId);
          localStorage.setItem(userKey, JSON.stringify(dbContainers));
          localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(dbContainers));
        }

        setContainers(dbContainers);
        setSavedItemsMeta(loadSavedItemsMeta());
        isRefreshingRef.current = false;
        return dbContainers;
      }
    } catch (apiErr) {
      console.warn('[refreshContainers] API fetch fallback to Supabase:', apiErr.message);
    }

    // 2. Fallback to direct Supabase if API is unreachable
    try {
      const hasSbAuth = await isSupabaseAuthActive();
      const effectiveUserId = await getEffectiveUserId();

      if (hasSbAuth && effectiveUserId) {
        const { data: fetchedContainers, error: fetchErr } = await supabase
          .from('saved_containers')
          .select('*')
          .eq('user_id', effectiveUserId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (fetchedContainers && !fetchErr && Array.isArray(fetchedContainers)) {
          const { data: fetchedItems } = await supabase
            .from('saved_container_items')
            .select('*')
            .eq('user_id', effectiveUserId)
            .is('deleted_at', null);

          const containerItemMap = {};
          (fetchedItems || []).forEach(ci => {
            if (!containerItemMap[ci.container_id]) containerItemMap[ci.container_id] = [];
            containerItemMap[ci.container_id].push(ci.item_id);
          });

          const mergedMap = new Map();
          localCached.forEach(c => mergedMap.set(c.id, c));

          fetchedContainers.forEach(c => {
            const existing = mergedMap.get(c.id) || {};
            const itemIds = containerItemMap[c.id] || existing.item_ids || [];
            mergedMap.set(c.id, {
              ...existing,
              ...c,
              slug: c.slug || c.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || c.id,
              item_ids: Array.from(new Set([...(existing.item_ids || []), ...itemIds])),
              item_count: Array.from(new Set([...(existing.item_ids || []), ...itemIds])).length,
            });
          });

          dbContainers = Array.from(mergedMap.values());

          if (typeof window !== 'undefined') {
            const userKey = getContainersKey(userId);
            localStorage.setItem(userKey, JSON.stringify(dbContainers));
            localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(dbContainers));
          }
        }
      }
    } catch (err) {
      console.warn('Refresh containers error (using durable local storage):', err);
    } finally {
      isRefreshingRef.current = false;
    }

    setContainers(dbContainers);
    setSavedItemsMeta(loadSavedItemsMeta());
    return dbContainers;
  }, [userId, getEffectiveUserId, isSupabaseAuthActive, loadSavedItemsMeta]);

  useEffect(() => {
    refreshContainers();
  }, [userId]);

  // Open the "Save to..." pop-up modal for any item
  const openSaveToContainer = useCallback((item) => {
    if (!item) return;
    saveItemMetadata(item);
    setTargetItem(item);
    setIsOpen(true);
    refreshContainers();
  }, [saveItemMetadata, refreshContainers]);

  const closeSaveToContainer = useCallback(() => {
    setIsOpen(false);
    setTargetItem(null);
  }, []);

  // Toggle item in container with durable persistence & atomic API mutation
  const handleToggleItemInContainer = useCallback(async (containerId, itemId, itemKind) => {
    const targetContainer = containers.find(c => c.id === containerId);
    if (!targetContainer) return;

    if (targetItem && targetItem.id === itemId) {
      saveItemMetadata(targetItem);
    }

    const isCurrentlyAssigned = targetContainer.item_ids?.includes(itemId);

    // Optimistic UI state update
    setContainers(prev => {
      const updated = prev.map(c => {
        if (c.id !== containerId) return c;
        const newIds = isCurrentlyAssigned
          ? (c.item_ids || []).filter(id => id !== itemId)
          : Array.from(new Set([...(c.item_ids || []), itemId]));
        return {
          ...c,
          item_ids: newIds,
          item_count: newIds.length,
        };
      });
      if (typeof window !== 'undefined') {
        const userKey = getContainersKey(userId);
        localStorage.setItem(userKey, JSON.stringify(updated));
        localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });

    // 1. Atomic backend container item mutation
    try {
      await api.post(`/saved/containers/${containerId}/items`, {
        itemId,
        itemType: itemKind || 'post',
        action: isCurrentlyAssigned ? 'REMOVE' : 'ADD',
      }).catch(async () => {
        await api.post(`/containers/${containerId}/items`, {
          itemId,
          itemType: itemKind || 'post',
          action: isCurrentlyAssigned ? 'REMOVE' : 'ADD',
        });
      });
    } catch (apiErr) {
      console.warn('[handleToggleItemInContainer] Backend atomic mutation warning:', apiErr.message);
    }

    // 2. Direct Supabase sync if active
    try {
      const hasSbAuth = await isSupabaseAuthActive();
      const effectiveUserId = await getEffectiveUserId();
      if (hasSbAuth && effectiveUserId) {
        if (isCurrentlyAssigned) {
          await supabase
            .from('saved_container_items')
            .delete()
            .eq('container_id', containerId)
            .eq('item_id', itemId)
            .eq('user_id', effectiveUserId);
        } else {
          await supabase
            .from('saved_container_items')
            .insert({
              container_id: containerId,
              item_id: itemId,
              item_kind: itemKind || 'video',
              user_id: effectiveUserId,
            });
        }
      }
    } catch (err) {
      console.warn('Supabase toggle item error (persisted locally):', err);
    }
  }, [containers, targetItem, userId, saveItemMetadata, getEffectiveUserId, isSupabaseAuthActive]);

  // Create new container with atomic backend transaction commit & immediate UI sync
  const handleCreateContainer = useCallback(async (containerData) => {
    const slug = containerData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `container-${Date.now()}`;
    const fallbackContainer = {
      id: `container-${Date.now()}`,
      name: containerData.name,
      slug,
      container_type: containerData.container_type || 'collection',
      description: containerData.description || '',
      color_token: containerData.color_token || 'var(--primary)',
      is_public: Boolean(containerData.is_public),
      item_ids: containerData.initial_item_id ? [containerData.initial_item_id] : [],
      item_count: containerData.initial_item_id ? 1 : 0,
      created_at: new Date().toISOString(),
    };

    if (targetItem && targetItem.id === containerData.initial_item_id) {
      saveItemMetadata(targetItem);
    }

    let persistedContainer = fallbackContainer;

    // 1. Primary: POST to backend API (Full PostgreSQL BEGIN/COMMIT transaction)
    try {
      let res;
      try {
        res = await api.post('/saved/containers', {
          name: containerData.name,
          container_type: containerData.container_type || 'collection',
          description: containerData.description || '',
          color_token: containerData.color_token || 'var(--primary)',
          is_public: Boolean(containerData.is_public),
          initial_item_id: containerData.initial_item_id,
          initial_item_kind: containerData.initial_item_kind || 'post',
        });
      } catch {
        res = await api.post('/containers', {
          name: containerData.name,
          container_type: containerData.container_type || 'collection',
          description: containerData.description || '',
          color_token: containerData.color_token || 'var(--primary)',
          is_public: Boolean(containerData.is_public),
          initial_item_id: containerData.initial_item_id,
          initial_item_kind: containerData.initial_item_kind || 'post',
        });
      }

      if (res?.data?.data) {
        persistedContainer = {
          ...res.data.data,
          item_ids: Array.isArray(res.data.data.item_ids) ? res.data.data.item_ids : (containerData.initial_item_id ? [containerData.initial_item_id] : []),
          item_count: typeof res.data.data.item_count === 'number' ? res.data.data.item_count : (containerData.initial_item_id ? 1 : 0),
        };
      }
    } catch (apiErr) {
      console.warn('[handleCreateContainer] API create failed, falling back to Supabase:', apiErr.message);

      // 2. Fallback: Supabase direct insert
      try {
        const hasSbAuth = await isSupabaseAuthActive();
        const effectiveUserId = await getEffectiveUserId();
        if (hasSbAuth && effectiveUserId) {
          const { data: createdDbContainer, error: insertErr } = await supabase
            .from('saved_containers')
            .insert({
              user_id: effectiveUserId,
              name: fallbackContainer.name,
              slug: fallbackContainer.slug,
              container_type: fallbackContainer.container_type,
              description: fallbackContainer.description,
              color_token: fallbackContainer.color_token,
              is_public: fallbackContainer.is_public,
            })
            .select()
            .single();

          if (createdDbContainer && !insertErr) {
            persistedContainer = {
              ...createdDbContainer,
              slug: createdDbContainer.slug || slug,
              item_ids: containerData.initial_item_id ? [containerData.initial_item_id] : [],
              item_count: containerData.initial_item_id ? 1 : 0,
            };
            if (containerData.initial_item_id) {
              await supabase
                .from('saved_container_items')
                .insert({
                  container_id: createdDbContainer.id,
                  item_id: containerData.initial_item_id,
                  item_kind: containerData.initial_item_kind || 'post',
                  user_id: effectiveUserId,
                });
            }
          }
        }
      } catch (err) {
        console.warn('Supabase create container error (persisted locally):', err);
      }
    }

    // 3. Immediately update React state and local storage cache (Zero-lag UI sync)
    setContainers(prev => {
      const updated = [persistedContainer, ...prev.filter(c => c.id !== persistedContainer.id)];
      if (typeof window !== 'undefined') {
        const userKey = getContainersKey(userId);
        localStorage.setItem(userKey, JSON.stringify(updated));
        localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });

    return persistedContainer;
  }, [targetItem, userId, saveItemMetadata, getEffectiveUserId, isSupabaseAuthActive]);

  return (
    <SaveToContainerContext.Provider value={{
      openSaveToContainer,
      closeSaveToContainer,
      containers,
      savedItemsMeta,
      saveItemMetadata,
      refreshContainers,
      handleToggleItemInContainer,
      handleCreateContainer,
    }}>
      {children}

      {/* Global YouTube-style "Save to..." Modal */}
      <SaveToContainerModal
        isOpen={isOpen}
        onClose={closeSaveToContainer}
        item={targetItem}
        containers={containers}
        onToggleItemInContainer={handleToggleItemInContainer}
        onCreateContainer={handleCreateContainer}
      />
    </SaveToContainerContext.Provider>
  );
}

export function useSaveToContainer() {
  const context = useContext(SaveToContainerContext);
  if (!context) {
    return {
      openSaveToContainer: () => {},
      closeSaveToContainer: () => {},
      containers: [],
      savedItemsMeta: {},
      saveItemMetadata: () => {},
      refreshContainers: () => {},
      handleToggleItemInContainer: () => {},
      handleCreateContainer: () => {},
    };
  }
  return context;
}

export default SaveToContainerContext;
