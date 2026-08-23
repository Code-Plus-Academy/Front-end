'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import api from '../api/axios';
import SaveToContainerModal from '../components/saved/modals/SaveToContainerModal';

const SaveToContainerContext = createContext(null);
const LOCAL_STORAGE_KEY = 'cpa_saved_containers_cache';

export function SaveToContainerProvider({ children }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [targetItem, setTargetItem] = useState(null);
  const [containers, setContainers] = useState([]);

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

  // Load containers from cache and Supabase
  const refreshContainers = useCallback(async () => {
    let localCached = [];
    if (typeof window !== 'undefined') {
      try {
        const cachedStr = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cachedStr) {
          localCached = JSON.parse(cachedStr) || [];
        }
      } catch {}
    }

    let dbContainers = localCached;
    let containerItemMap = {};

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

        if (fetchedContainers && !fetchErr) {
          const { data: fetchedItems } = await supabase
            .from('saved_container_items')
            .select('*')
            .eq('user_id', effectiveUserId)
            .is('deleted_at', null);

          (fetchedItems || []).forEach(ci => {
            if (!containerItemMap[ci.container_id]) containerItemMap[ci.container_id] = [];
            containerItemMap[ci.container_id].push(ci.item_id);
          });

          dbContainers = fetchedContainers.map(c => ({
            ...c,
            slug: c.slug || c.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || c.id,
            item_ids: containerItemMap[c.id] || [],
            item_count: (containerItemMap[c.id] || []).length,
          }));

          if (typeof window !== 'undefined') {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dbContainers));
          }
        }
      }
    } catch (err) {
      console.warn('Refresh containers error (using local cache):', err);
    }

    setContainers(dbContainers);
  }, [getEffectiveUserId, isSupabaseAuthActive]);

  useEffect(() => {
    refreshContainers();
  }, [refreshContainers]);

  // Open the "Save to..." pop-up modal for any item
  const openSaveToContainer = useCallback((item) => {
    if (!item) return;
    setTargetItem(item);
    setIsOpen(true);
    refreshContainers();
  }, [refreshContainers]);

  const closeSaveToContainer = useCallback(() => {
    setIsOpen(false);
    setTargetItem(null);
  }, []);

  // Toggle item in container
  const handleToggleItemInContainer = useCallback(async (containerId, itemId, itemKind) => {
    const targetContainer = containers.find(c => c.id === containerId);
    if (!targetContainer) return;

    const isCurrentlyAssigned = targetContainer.item_ids?.includes(itemId);

    setContainers(prev => {
      const updated = prev.map(c => {
        if (c.id !== containerId) return c;
        const newIds = isCurrentlyAssigned
          ? (c.item_ids || []).filter(id => id !== itemId)
          : [...(c.item_ids || []), itemId];
        return {
          ...c,
          item_ids: newIds,
          item_count: newIds.length,
        };
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });

    // Also persist globally to backend /saved API
    try {
      if (itemKind === 'note' || itemKind === 'notes' || itemKind === 'question_paper') {
        await api.post(`/notes/${itemId}/bookmark`).catch(() => {});
      } else {
        await api.post(`/saved/${itemId}`).catch(() => {});
      }
    } catch {}

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
              item_kind: itemKind || 'note',
              user_id: effectiveUserId,
            });
        }
      }
    } catch (err) {
      console.warn('Supabase toggle item error (cached locally):', err);
    }
  }, [containers, getEffectiveUserId, isSupabaseAuthActive]);

  // Create new container and add item
  const handleCreateContainer = useCallback(async (containerData) => {
    const slug = containerData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `container-${Date.now()}`;
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

    let persistedContainer = newContainer;

    try {
      const hasSbAuth = await isSupabaseAuthActive();
      const effectiveUserId = await getEffectiveUserId();
      if (hasSbAuth && effectiveUserId) {
        const { data: createdDbContainer, error: insertErr } = await supabase
          .from('saved_containers')
          .insert({
            user_id: effectiveUserId,
            name: newContainer.name,
            slug: newContainer.slug,
            container_type: newContainer.container_type,
            description: newContainer.description,
            color_token: newContainer.color_token,
            is_public: newContainer.is_public,
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
                item_kind: containerData.initial_item_kind || 'note',
                user_id: effectiveUserId,
              });
          }
        }
      }
    } catch (err) {
      console.warn('Supabase create container error (persisted locally):', err);
    }

    setContainers(prev => {
      const updated = [persistedContainer, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });

    return persistedContainer;
  }, [getEffectiveUserId, isSupabaseAuthActive]);

  return (
    <SaveToContainerContext.Provider value={{
      openSaveToContainer,
      closeSaveToContainer,
      containers,
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
      refreshContainers: () => {},
      handleToggleItemInContainer: () => {},
      handleCreateContainer: () => {},
    };
  }
  return context;
}

export default SaveToContainerContext;
