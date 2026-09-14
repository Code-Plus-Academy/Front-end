/**
 * Export Utilities for Story Editor (Fabric.js v7/v6)
 * Generates crisp 1080x1920 PNG export, extracts editable JSON snapshot,
 * and compiles interactive metadata (locations & links) for viewer tap zones.
 */

import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from './canvasConfig.js';
import { extractInteractiveMetadata } from './stickerUtils.js';
import { HISTORY_CUSTOM_PROPERTIES } from '../hooks/useCanvasHistory.js';

/**
 * Converts a base64 Data URL to a Blob
 * @param {string} dataUrl
 * @returns {Blob}
 */
export function dataUrlToBlob(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') {
    throw new Error('[exportUtils:dataUrlToBlob] Invalid data URL.');
  }

  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const byteString = atob(parts[1]);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }

  return new Blob([uint8Array], { type: mime });
}

/**
 * Helper to download a Blob or File directly to client device
 * @param {Blob | File} blob
 * @param {string} [filename='story_1080x1920.png']
 */
export function downloadBlob(blob, filename = 'story_1080x1920.png') {
  if (typeof window === 'undefined' || !blob) return;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Creates a File object from a Blob suitable for multipart form uploads
 * @param {Blob} blob
 * @param {string} [filename='story_1080x1920.png']
 * @returns {File}
 */
export function createStoryImageFile(blob, filename = 'story_1080x1920.png') {
  return new File([blob], filename, {
    type: 'image/png',
    lastModified: Date.now(),
  });
}

/**
 * Exports complete high-resolution dual payload from active Fabric Canvas:
 * 1. 1080x1920 crisp PNG dataUrl & Blob (with zoom multiplier normalized).
 * 2. Editable JSON state including custom interactive properties.
 * 3. Structured Interactive Metadata for locations & HTTPS links.
 * 
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {Object} [options]
 * @param {string[]} [options.customProperties=HISTORY_CUSTOM_PROPERTIES]
 * @returns {Promise<import('../types/storyEditorTypes').StoryExportPayload>}
 */
export async function exportStoryPayload(fabricCanvas, options = {}) {
  if (!fabricCanvas) {
    throw new Error('[exportUtils:exportStoryPayload] Fabric canvas instance is required.');
  }

  const customProperties = options.customProperties || HISTORY_CUSTOM_PROPERTIES;

  // 1. Temporarily deselect any active object so selection handles & bounding borders are not burned into the PNG
  const activeObj = fabricCanvas.getActiveObject();
  if (activeObj) {
    fabricCanvas.discardActiveObject();
    fabricCanvas.requestRenderAll();
  }

  try {
    // 2. Compute zoom multiplier to ensure exported image is exactly logical 1080x1920 px
    const zoom = fabricCanvas.getZoom() || 1;
    const multiplier = 1 / zoom;

    // 3. Render crisp 1080x1920 PNG
    const pngDataUrl = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier,
      enableRetinaScaling: true,
    });

    const pngBlob = dataUrlToBlob(pngDataUrl);

    // 4. Extract complete editable JSON
    const editableJson = fabricCanvas.toJSON(customProperties);

    // 5. Extract structured interactive metadata (location coordinates & link bounds)
    const interactiveMetadata = extractInteractiveMetadata(fabricCanvas);

    return {
      pngBlob,
      pngDataUrl,
      editableJson,
      interactiveMetadata,
    };
  } finally {
    // 6. Restore active selection if user is still in the editor
    if (activeObj) {
      fabricCanvas.setActiveObject(activeObj);
      fabricCanvas.requestRenderAll();
    }
  }
}
