'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom object properties to include during Fabric.js canvas serialization
 */
export const HISTORY_CUSTOM_PROPERTIES = [
  'id',
  'name',
  'customType',
  'locationMetadata',
  'linkMetadata',
  'isBackground',
  'isDrawingPath',
  'hasPillBackground',
  'selectable',
  'evented',
  'lockMovementX',
  'lockMovementY',
  'originX',
  'originY',
  'strokeUniform',
  'pillMode',
  'pillFill',
  'pillPadding',
  'subTargetCheck',
];

export const MAX_HISTORY_SNAPSHOTS = 30;
export const DEBOUNCE_DELAY_MS = 300;

/**
 * Custom hook providing robust Undo / Redo history tracking for Fabric.js v7/v6 Story Editor.
 *
 * Guarantees:
 * 1. Capped snapshot stack (max 30 snapshots) preventing memory bloat.
 * 2. Debounced auto-recording on terminal canvas events (`object:modified`, `object:added`, `object:removed`, `path:created`).
 * 3. Complete preservation of interactive custom properties (`locationMetadata`, `linkMetadata`, `customType`, etc.).
 * 4. Loop-free state restoration (ignores mutation events emitted during `loadFromJSON`).
 * 
 * @param {import('fabric').Canvas | null} fabricCanvas Fabric Canvas instance
 * @param {Object} [options]
 * @param {number} [options.maxSnapshots=MAX_HISTORY_SNAPSHOTS]
 * @param {number} [options.debounceDelay=DEBOUNCE_DELAY_MS]
 * @param {string[]} [options.customProperties=HISTORY_CUSTOM_PROPERTIES]
 * @param {(state: { canUndo: boolean, canRedo: boolean, index: number, total: number }) => void} [options.onHistoryChange]
 * @returns {HistoryHookResult}
 */
export function useCanvasHistory(
  fabricCanvas,
  {
    maxSnapshots = MAX_HISTORY_SNAPSHOTS,
    debounceDelay = DEBOUNCE_DELAY_MS,
    customProperties = HISTORY_CUSTOM_PROPERTIES,
    onHistoryChange,
  } = {}
) {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [historyLength, setHistoryLength] = useState(0);

  const historyStackRef = useRef([]);
  const currentIndexRef = useRef(-1);
  const isHistoryProcessingRef = useRef(false);
  const debounceTimerRef = useRef(null);
  const isInitialSnapshotTakenRef = useRef(false);

  const onHistoryChangeRef = useRef(onHistoryChange);
  useEffect(() => {
    onHistoryChangeRef.current = onHistoryChange;
  });

  /**
   * Updates state flags and notifies external listener
   */
  const updateHistoryState = useCallback(() => {
    const idx = currentIndexRef.current;
    const len = historyStackRef.current.length;
    const nextCanUndo = idx > 0;
    const nextCanRedo = idx >= 0 && idx < len - 1;

    setCanUndo(nextCanUndo);
    setCanRedo(nextCanRedo);
    setHistoryIndex(idx);
    setHistoryLength(len);

    if (onHistoryChangeRef.current) {
      onHistoryChangeRef.current({
        canUndo: nextCanUndo,
        canRedo: nextCanRedo,
        index: idx,
        total: len,
      });
    }
  }, []);

  /**
   * Captures current canvas JSON representation and appends to history stack
   */
  const captureSnapshot = useCallback(() => {
    if (!fabricCanvas || isHistoryProcessingRef.current) return;

    try {
      const json = fabricCanvas.toJSON(customProperties);
      const jsonString = JSON.stringify(json);

      const stack = historyStackRef.current;
      const currIdx = currentIndexRef.current;

      // Don't push if identical to current snapshot
      if (currIdx >= 0 && stack[currIdx] === jsonString) {
        return;
      }

      // Truncate any redo history if a new action is performed
      let nextStack = stack.slice(0, currIdx + 1);

      // Append new snapshot
      nextStack.push(jsonString);

      // Cap at maxSnapshots
      if (nextStack.length > maxSnapshots) {
        nextStack = nextStack.slice(nextStack.length - maxSnapshots);
      }

      historyStackRef.current = nextStack;
      currentIndexRef.current = nextStack.length - 1;

      updateHistoryState();
    } catch (err) {
      console.warn('[useCanvasHistory] Failed to capture canvas snapshot:', err);
    }
  }, [fabricCanvas, customProperties, maxSnapshots, updateHistoryState]);

  /**
   * Schedules a debounced snapshot save
   */
  const saveState = useCallback(
    (immediate = false) => {
      if (isHistoryProcessingRef.current || !fabricCanvas) return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      if (immediate) {
        captureSnapshot();
      } else {
        debounceTimerRef.current = setTimeout(() => {
          captureSnapshot();
        }, debounceDelay);
      }
    },
    [fabricCanvas, captureSnapshot, debounceDelay]
  );

  /**
   * Restores a snapshot at the given stack index
   */
  const restoreState = useCallback(
    async (targetIndex) => {
      const stack = historyStackRef.current;
      if (!fabricCanvas || targetIndex < 0 || targetIndex >= stack.length) {
        return;
      }

      isHistoryProcessingRef.current = true;
      currentIndexRef.current = targetIndex;

      try {
        const jsonString = stack[targetIndex];
        const parsedJson = JSON.parse(jsonString);

        // Deserialization with support for Fabric v7/v6 Promise-based API
        if (typeof fabricCanvas.loadFromJSON === 'function') {
          const loadPromise = fabricCanvas.loadFromJSON(parsedJson);
          if (loadPromise && typeof loadPromise.then === 'function') {
            await loadPromise;
          }
        }

        // Re-render and calculate offsets
        fabricCanvas.discardActiveObject();
        fabricCanvas.requestRenderAll();
        fabricCanvas.calcOffset?.();
      } catch (err) {
        console.error('[useCanvasHistory] Error restoring history state:', err);
      } finally {
        isHistoryProcessingRef.current = false;
        updateHistoryState();
      }
    },
    [fabricCanvas, updateHistoryState]
  );

  /**
   * Step backward in history
   */
  const undo = useCallback(async () => {
    if (currentIndexRef.current > 0 && !isHistoryProcessingRef.current) {
      await restoreState(currentIndexRef.current - 1);
    }
  }, [restoreState]);

  /**
   * Step forward in history
   */
  const redo = useCallback(async () => {
    const stack = historyStackRef.current;
    if (
      currentIndexRef.current < stack.length - 1 &&
      !isHistoryProcessingRef.current
    ) {
      await restoreState(currentIndexRef.current + 1);
    }
  }, [restoreState]);

  /**
   * Clears the history stack
   */
  const clearHistory = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    historyStackRef.current = [];
    currentIndexRef.current = -1;
    isInitialSnapshotTakenRef.current = false;
    updateHistoryState();
  }, [updateHistoryState]);

  // Wire up event listeners to Fabric Canvas
  useEffect(() => {
    if (!fabricCanvas) return;

    // Capture initial blank/loaded canvas state once ready
    if (!isInitialSnapshotTakenRef.current && historyStackRef.current.length === 0) {
      isInitialSnapshotTakenRef.current = true;
      captureSnapshot();
    }

    const handleCanvasModified = () => {
      if (!isHistoryProcessingRef.current) {
        saveState(false);
      }
    };

    const handleCanvasPathCreated = () => {
      if (!isHistoryProcessingRef.current) {
        // Freehand path creation is a completed stroke - save immediately or debounced
        saveState(false);
      }
    };

    const handleObjectAdded = (e) => {
      // Ignore internal background or history restoration additions
      if (!isHistoryProcessingRef.current && e?.target) {
        saveState(false);
      }
    };

    const handleObjectRemoved = () => {
      if (!isHistoryProcessingRef.current) {
        saveState(false);
      }
    };

    // Attach listeners
    fabricCanvas.on('object:modified', handleCanvasModified);
    fabricCanvas.on('object:added', handleObjectAdded);
    fabricCanvas.on('object:removed', handleObjectRemoved);
    fabricCanvas.on('path:created', handleCanvasPathCreated);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      fabricCanvas.off('object:modified', handleCanvasModified);
      fabricCanvas.off('object:added', handleObjectAdded);
      fabricCanvas.off('object:removed', handleObjectRemoved);
      fabricCanvas.off('path:created', handleCanvasPathCreated);
    };
  }, [fabricCanvas, saveState, captureSnapshot]);

  return {
    canUndo,
    canRedo,
    historyIndex,
    historyLength,
    undo,
    redo,
    saveState,
    captureSnapshot,
    clearHistory,
    isProcessing: isHistoryProcessingRef.current,
  };
}

export default useCanvasHistory;
