'use client';

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

/**
 * Custom hook for performing atomic container item mutations with optimistic updates
 * and degraded source handling.
 */
export function useContainerItems() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Atomic ADD item to container
   * Prevents race conditions and array overwriting.
   */
  const addItemToContainer = useCallback(async (containerId, item, options = {}) => {
    if (!containerId || !item || !item.id) {
      toast.error('Invalid container or item');
      return { success: false };
    }

    const { onSuccess, onRollback } = options;
    const itemId = item.id;
    const itemType = item.item_kind || item.type || 'post';

    setLoading(true);
    setError(null);

    // 1. Optimistic UI update callback
    if (typeof onSuccess === 'function') {
      onSuccess(containerId, itemId, 'ADD');
    }

    try {
      // 2. Atomic HTTP POST mutation
      let responseData;
      try {
        const res = await api.post(`/containers/${containerId}/items`, {
          itemId,
          itemType,
          action: 'ADD',
        });
        responseData = res.data;
      } catch (axiosErr) {
        // Fallback using standard fetch API if axios instance is not available
        const res = await fetch(`/api/containers/${containerId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId, itemType, action: 'ADD' }),
        });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        responseData = await res.json();
      }

      toast.success('Saved to collection!', { duration: 2500 });
      return { success: true, data: responseData };
    } catch (err) {
      console.error('[useContainerItems] Add item error:', err);
      setError(err.message || 'Failed to add item');

      // 3. Rollback optimistic update on failure
      if (typeof onRollback === 'function') {
        onRollback(containerId, itemId, 'ADD');
      }

      toast.error('Failed to save to collection. Please try again.');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Atomic REMOVE item from container
   */
  const removeItemFromContainer = useCallback(async (containerId, itemId, options = {}) => {
    if (!containerId || !itemId) return { success: false };

    const { onSuccess, onRollback } = options;

    setLoading(true);
    setError(null);

    if (typeof onSuccess === 'function') {
      onSuccess(containerId, itemId, 'REMOVE');
    }

    try {
      let responseData;
      try {
        const res = await api.post(`/containers/${containerId}/items`, {
          itemId,
          action: 'REMOVE',
        });
        responseData = res.data;
      } catch (axiosErr) {
        const res = await fetch(`/api/containers/${containerId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId, action: 'REMOVE' }),
        });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        responseData = await res.json();
      }

      toast.success('Removed from collection.', { duration: 2500 });
      return { success: true, data: responseData };
    } catch (err) {
      console.error('[useContainerItems] Remove item error:', err);
      setError(err.message || 'Failed to remove item');

      if (typeof onRollback === 'function') {
        onRollback(containerId, itemId, 'REMOVE');
      }

      toast.error('Failed to remove item. Please try again.');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    addItemToContainer,
    removeItemFromContainer,
  };
}

export default useContainerItems;
