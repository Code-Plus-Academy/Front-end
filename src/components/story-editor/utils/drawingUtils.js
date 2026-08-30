/**
 * Freehand Vector Drawing & Non-Destructive Vector Eraser Utilities (Fabric.js v7/v6)
 * Handles Pen mode, Highlighter mode (semi-transparent), Brush sizing/coloring,
 * and Vector Eraser that deletes drawn paths without raster flattening.
 */

import { PencilBrush } from 'fabric';

/**
 * Standard vibrant drawing color presets
 */
export const DRAWING_COLOR_PRESETS = [
  '#ffffff',
  '#000000',
  '#6366f1', // CPA Indigo
  '#38bdf8', // Neon Cyan
  '#22c55e', // Emerald
  '#eab308', // Amber
  '#f43f5e', // Rose
  '#a855f7', // Purple
  '#ec4899', // Hot Pink
  '#f97316', // Orange
];

/**
 * Brush mode configurations
 */
export const BRUSH_MODES = {
  PEN: 'pen',
  HIGHLIGHTER: 'highlighter',
  ERASER: 'eraser',
};

let eraserActive = false;
let isPointerDown = false;
let eraserCleanupFn = null;

/**
 * Enables freehand drawing mode on Fabric Canvas
 * 
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {Object} [config]
 * @param {'pen' | 'highlighter' | 'eraser'} [config.mode='pen']
 * @param {number} [config.strokeWidth=12]
 * @param {string} [config.strokeColor='#ffffff']
 * @param {number} [config.opacity=1]
 */
export function enableDrawingMode(
  fabricCanvas,
  {
    mode = BRUSH_MODES.PEN,
    strokeWidth = 12,
    strokeColor = '#ffffff',
    opacity = 1,
  } = {}
) {
  if (!fabricCanvas) return;

  // Ensure any previous eraser listener is cleaned up
  if (eraserCleanupFn) {
    eraserCleanupFn();
    eraserCleanupFn = null;
  }

  // Tag newly created paths as drawing paths
  if (!fabricCanvas.__hasStoryPathCreatedListener) {
    fabricCanvas.on('path:created', (e) => {
      if (e.path) {
        e.path.isDrawingPath = true;
        e.path.customType = 'drawing_path';
      }
    });
    fabricCanvas.__hasStoryPathCreatedListener = true;
  }

  if (mode === BRUSH_MODES.ERASER) {
    setupVectorEraser(fabricCanvas);
    return;
  }

  // Normal / Highlighter Drawing Mode
  fabricCanvas.isDrawingMode = true;
  eraserActive = false;

  if (!fabricCanvas.freeDrawingBrush) {
    fabricCanvas.freeDrawingBrush = new PencilBrush(fabricCanvas);
  }

  const brush = fabricCanvas.freeDrawingBrush;
  brush.strokeLineCap = 'round';
  brush.strokeLineJoin = 'round';

  if (mode === BRUSH_MODES.HIGHLIGHTER) {
    brush.width = strokeWidth || 36;
    brush.color = hexToRgba(strokeColor, 0.45);
  } else {
    // Standard Pen
    brush.width = strokeWidth || 12;
    brush.color = opacity < 1 ? hexToRgba(strokeColor, opacity) : strokeColor;
  }

  fabricCanvas.discardActiveObject();
  fabricCanvas.requestRenderAll();
}

/**
 * Disables drawing and eraser modes, restoring standard selection
 * @param {import('fabric').Canvas} fabricCanvas
 */
export function disableDrawingMode(fabricCanvas) {
  if (!fabricCanvas) return;

  fabricCanvas.isDrawingMode = false;
  eraserActive = false;

  if (eraserCleanupFn) {
    eraserCleanupFn();
    eraserCleanupFn = null;
  }

  fabricCanvas.defaultCursor = 'default';
  fabricCanvas.hoverCursor = 'move';
  fabricCanvas.requestRenderAll();
}

/**
 * Sets up the non-destructive vector eraser.
 * Removes drawn vector paths upon tap/drag without flattening raster layers.
 * 
 * @param {import('fabric').Canvas} fabricCanvas
 */
export function setupVectorEraser(fabricCanvas) {
  if (!fabricCanvas) return;

  fabricCanvas.isDrawingMode = false;
  eraserActive = true;
  fabricCanvas.defaultCursor = 'crosshair';
  fabricCanvas.hoverCursor = 'crosshair';
  fabricCanvas.discardActiveObject();

  const eraseTarget = (target) => {
    if (!target) return;

    const isPath =
      target.type === 'Path' ||
      target.type === 'path' ||
      target.isDrawingPath ||
      target.customType === 'drawing_path';

    if (isPath) {
      fabricCanvas.remove(target);
      fabricCanvas.requestRenderAll();
    }
  };

  const handleMouseDown = (opt) => {
    isPointerDown = true;
    if (opt.target) {
      eraseTarget(opt.target);
    }
  };

  const handleMouseMove = (opt) => {
    if (!isPointerDown) return;
    if (opt.target) {
      eraseTarget(opt.target);
    }
  };

  const handleMouseUp = () => {
    isPointerDown = false;
  };

  fabricCanvas.on('mouse:down', handleMouseDown);
  fabricCanvas.on('mouse:move', handleMouseMove);
  fabricCanvas.on('mouse:up', handleMouseUp);

  eraserCleanupFn = () => {
    fabricCanvas.off('mouse:down', handleMouseDown);
    fabricCanvas.off('mouse:move', handleMouseMove);
    fabricCanvas.off('mouse:up', handleMouseUp);
  };
}

/**
 * Updates brush configuration in real time while drawing mode is active
 * 
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {Object} config
 */
export function setBrushConfig(
  fabricCanvas,
  {
    mode = BRUSH_MODES.PEN,
    strokeWidth = 12,
    strokeColor = '#ffffff',
    opacity = 1,
  }
) {
  if (!fabricCanvas) return;
  enableDrawingMode(fabricCanvas, { mode, strokeWidth, strokeColor, opacity });
}

/**
 * Removes all drawn vector paths from the canvas
 * @param {import('fabric').Canvas} fabricCanvas
 */
export function clearDrawings(fabricCanvas) {
  if (!fabricCanvas) return;

  const objects = fabricCanvas.getObjects();
  const pathsToRemove = objects.filter(
    (obj) =>
      obj.type === 'Path' ||
      obj.type === 'path' ||
      obj.isDrawingPath ||
      obj.customType === 'drawing_path'
  );

  pathsToRemove.forEach((path) => {
    fabricCanvas.remove(path);
  });

  fabricCanvas.discardActiveObject();
  fabricCanvas.requestRenderAll();
}

/**
 * Helper to convert hex to rgba
 * @param {string} hex
 * @param {number} opacity
 * @returns {string}
 */
function hexToRgba(hex, opacity = 1) {
  if (hex.startsWith('rgba')) return hex;
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return `rgba(255, 255, 255, ${opacity})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
