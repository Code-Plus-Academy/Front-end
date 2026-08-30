'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas } from 'fabric';
import {
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  DEFAULT_CANVAS_OPTIONS,
  computeCanvasScale,
  configureFabricDefaults,
  applyDefaultObjectControls,
} from '../utils/canvasConfig.js';

/**
 * Custom hook managing the Fabric.js Canvas instance lifecycle with 9:16 responsive scaling.
 * 
 * Guarantees:
 * 1. Fixed 1080x1920 logical coordinate resolution for all objects.
 * 2. Real-time responsive scaling across mobile (<640px), tablet, and desktop viewports.
 * 3. Zero hitbox coordinate drift or touch selection offset.
 * 4. Strict memory cleanup on unmount (canvas.dispose, observer disconnect).
 * 
 * @param {Object} options Hook configuration options
 * @param {number} [options.width=LOGICAL_WIDTH] Logical width (default: 1080)
 * @param {number} [options.height=LOGICAL_HEIGHT] Logical height (default: 1920)
 * @param {Object} [options.canvasOptions] Custom options passed to new Canvas()
 * @param {(e: any) => void} [options.onSelectionCreated]
 * @param {(e: any) => void} [options.onSelectionUpdated]
 * @param {(e: any) => void} [options.onSelectionCleared]
 * @param {(e: any) => void} [options.onObjectModified]
 * @param {(e: any) => void} [options.onObjectMoving]
 * @param {(e: any) => void} [options.onObjectScaling]
 * @param {(e: any) => void} [options.onObjectRotating]
 * @param {(e: any) => void} [options.onObjectAdded]
 * @param {(e: any) => void} [options.onObjectRemoved]
 * @param {(e: any) => void} [options.onPathCreated]
 * @param {(e: any) => void} [options.onAfterRender]
 * @returns {FabricCanvasHookResult}
 */
export function useFabricCanvas({
  width = LOGICAL_WIDTH,
  height = LOGICAL_HEIGHT,
  canvasOptions = {},
  onSelectionCreated,
  onSelectionUpdated,
  onSelectionCleared,
  onObjectModified,
  onObjectMoving,
  onObjectScaling,
  onObjectRotating,
  onObjectAdded,
  onObjectRemoved,
  onPathCreated,
  onAfterRender,
} = {}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const fabricRef = useRef(null);

  const [fabricCanvas, setFabricCanvas] = useState(null);
  const [scale, setScale] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const [dimensions, setDimensionsState] = useState({
    width,
    height,
    offsetX: 0,
    offsetY: 0,
  });

  // Store latest callbacks in ref to avoid recreating canvas on callback change
  const callbacksRef = useRef({
    onSelectionCreated,
    onSelectionUpdated,
    onSelectionCleared,
    onObjectModified,
    onObjectMoving,
    onObjectScaling,
    onObjectRotating,
    onObjectAdded,
    onObjectRemoved,
    onPathCreated,
    onAfterRender,
  });

  useEffect(() => {
    callbacksRef.current = {
      onSelectionCreated,
      onSelectionUpdated,
      onSelectionCleared,
      onObjectModified,
      onObjectMoving,
      onObjectScaling,
      onObjectRotating,
      onObjectAdded,
      onObjectRemoved,
      onPathCreated,
      onAfterRender,
    };
  });

  /**
   * Recalculates display dimensions and applies uniform zoom scale to Fabric Canvas
   */
  const updateCanvasDimensions = useCallback(
    (cWidth, cHeight) => {
      const canvas = fabricRef.current;
      if (!canvas || !cWidth || !cHeight) return;

      const {
        scale: newScale,
        width: dispWidth,
        height: dispHeight,
        offsetX,
        offsetY,
      } = computeCanvasScale(cWidth, cHeight, width, height);

      // Set physical display dimensions
      canvas.setDimensions({ width: dispWidth, height: dispHeight });

      // Apply zoom transformation to map 1080x1920 logical space to display box
      canvas.setZoom(newScale);

      // Refresh hit-testing and control offsets
      canvas.calcOffset();
      canvas.requestRenderAll();

      setScale(newScale);
      setDimensionsState({
        width: dispWidth,
        height: dispHeight,
        offsetX,
        offsetY,
      });
    },
    [width, height]
  );

  // Initialize Fabric Canvas on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !canvasRef.current || !containerRef.current) {
      return;
    }

    // Configure Fabric global defaults (touchCornerSize, circle handles, etc.)
    configureFabricDefaults();

    let isDisposed = false;
    let animationFrameId = null;

    // Instantiate Fabric Canvas
    const canvas = new Canvas(canvasRef.current, {
      width,
      height,
      ...DEFAULT_CANVAS_OPTIONS,
      ...canvasOptions,
    });

    fabricRef.current = canvas;
    setFabricCanvas(canvas);

    // Event Wire-up
    canvas.on('selection:created', (e) => callbacksRef.current.onSelectionCreated?.(e));
    canvas.on('selection:updated', (e) => callbacksRef.current.onSelectionUpdated?.(e));
    canvas.on('selection:cleared', (e) => callbacksRef.current.onSelectionCleared?.(e));

    canvas.on('object:modified', (e) => callbacksRef.current.onObjectModified?.(e));
    canvas.on('object:moving', (e) => callbacksRef.current.onObjectMoving?.(e));
    canvas.on('object:scaling', (e) => callbacksRef.current.onObjectScaling?.(e));
    canvas.on('object:rotating', (e) => callbacksRef.current.onObjectRotating?.(e));

    canvas.on('object:added', (e) => {
      if (e.target) {
        applyDefaultObjectControls(e.target);
      }
      callbacksRef.current.onObjectAdded?.(e);
    });

    canvas.on('object:removed', (e) => callbacksRef.current.onObjectRemoved?.(e));

    canvas.on('path:created', (e) => {
      if (e.path) {
        applyDefaultObjectControls(e.path);
      }
      callbacksRef.current.onPathCreated?.(e);
    });

    canvas.on('after:render', (e) => callbacksRef.current.onAfterRender?.(e));

    // Setup ResizeObserver for smooth responsive adaptation
    const resizeObserver = new ResizeObserver((entries) => {
      if (isDisposed) return;
      for (const entry of entries) {
        const { width: cWidth, height: cHeight } = entry.contentRect;
        if (cWidth > 0 && cHeight > 0) {
          if (animationFrameId) cancelAnimationFrame(animationFrameId);
          animationFrameId = requestAnimationFrame(() => {
            if (!isDisposed) {
              updateCanvasDimensions(cWidth, cHeight);
            }
          });
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        updateCanvasDimensions(rect.width, rect.height);
      }
    }

    // Window resize listener as fallback
    const handleWindowResize = () => {
      if (isDisposed || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        updateCanvasDimensions(rect.width, rect.height);
      }
    };
    window.addEventListener('resize', handleWindowResize, { passive: true });

    setIsReady(true);

    // Strict Unmount Cleanup
    return () => {
      isDisposed = true;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);

      try {
        canvas.dispose();
      } catch (err) {
        console.warn('[StoryEditor:useFabricCanvas] Error during canvas disposal:', err);
      }

      fabricRef.current = null;
      setFabricCanvas(null);
      setIsReady(false);
    };
  }, [width, height, updateCanvasDimensions]);

  // Utility helpers exposed to consumers
  const requestRender = useCallback(() => {
    if (fabricRef.current) {
      fabricRef.current.requestRenderAll();
    }
  }, []);

  const getActiveObject = useCallback(() => {
    return fabricRef.current?.getActiveObject() || null;
  }, []);

  const setActiveObject = useCallback((obj) => {
    if (fabricRef.current && obj) {
      fabricRef.current.setActiveObject(obj);
      fabricRef.current.requestRenderAll();
    }
  }, []);

  const discardActiveObject = useCallback(() => {
    if (fabricRef.current) {
      fabricRef.current.discardActiveObject();
      fabricRef.current.requestRenderAll();
    }
  }, []);

  const clearObjects = useCallback(() => {
    if (fabricRef.current) {
      const objects = fabricRef.current.getObjects();
      // Remove all objects while preserving background
      objects.forEach((obj) => {
        fabricRef.current.remove(obj);
      });
      fabricRef.current.discardActiveObject();
      fabricRef.current.requestRenderAll();
    }
  }, []);

  return {
    canvasRef,
    containerRef,
    fabricCanvas,
    scale,
    isReady,
    dimensions,
    logicalWidth: width,
    logicalHeight: height,
    updateCanvasDimensions,
    requestRender,
    getActiveObject,
    setActiveObject,
    discardActiveObject,
    clearObjects,
  };
}

export default useFabricCanvas;
