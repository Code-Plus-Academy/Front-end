/**
 * Type definitions, Enums, and Metadata Schemas for the Story Editor Subsystem
 */

import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../utils/canvasConfig.js';

/**
 * Supported Sticker Types
 */
export const STICKER_TYPES = {
  BADGE: 'badge',
  TECH: 'tech',
  REACTION: 'reaction',
  EMOJI: 'emoji',
  LOCATION: 'location',
  LINK: 'link',
  CUSTOM: 'custom',
};

/**
 * Canvas Layer Types
 */
export const LAYER_TYPES = {
  BACKGROUND: 'background',
  IMAGE: 'image',
  TEXT: 'text',
  STICKER: 'sticker',
  DRAWING: 'drawing',
};

/**
 * Editor Tool Modes
 */
export const TOOL_MODES = {
  SELECT: 'select',
  MEDIA: 'media',
  TEXT: 'text',
  DRAW: 'draw',
  STICKER: 'sticker',
  LAYERS: 'layers',
};

/**
 * Freehand Drawing Brush Types
 */
export const BRUSH_MODES = {
  PENCIL: 'pencil',
  ERASER: 'eraser',
};

/**
 * Supported Typography Font Families
 */
export const STORY_FONTS = [
  { id: 'geist', name: 'Geist Sans', family: 'var(--font-geist-sans, sans-serif)' },
  { id: 'clash', name: 'Clash Display', family: 'var(--font-display, "Clash Display", sans-serif)' },
  { id: 'mono', name: 'JetBrains Mono', family: 'var(--font-mono, "JetBrains Mono", monospace)' },
  { id: 'jakarta', name: 'Plus Jakarta Sans', family: '"Plus Jakarta Sans", sans-serif' },
  { id: 'impact', name: 'Impact Modern', family: 'Impact, sans-serif' },
  { id: 'serif', name: 'Playfair Serif', family: 'Georgia, "Playfair Display", serif' },
  { id: 'handwriting', name: 'Casual Hand', family: 'Caveat, cursive, sans-serif' },
];

/**
 * Canvas Event Names mapped to Fabric.js v7 event signatures
 */
export const CANVAS_EVENTS = {
  SELECTION_CREATED: 'selection:created',
  SELECTION_UPDATED: 'selection:updated',
  SELECTION_CLEARED: 'selection:cleared',
  OBJECT_MODIFIED: 'object:modified',
  OBJECT_MOVING: 'object:moving',
  OBJECT_SCALING: 'object:scaling',
  OBJECT_ROTATING: 'object:rotating',
  OBJECT_ADDED: 'object:added',
  OBJECT_REMOVED: 'object:removed',
  PATH_CREATED: 'path:created',
  AFTER_RENDER: 'after:render',
};

/**
 * Factory for creating an empty interactive metadata container
 * @returns {InteractiveMetadata}
 */
export function createEmptyInteractiveMetadata() {
  return {
    version: 1,
    canvas_dimensions: {
      width: LOGICAL_WIDTH,
      height: LOGICAL_HEIGHT,
    },
    locations: [],
    links: [],
  };
}

/**
 * Normalizes an interactive sticker bounding box in logical 1080x1920 coordinates
 * @param {import('fabric').FabricObject} obj
 * @param {number} [logicalWidth=LOGICAL_WIDTH]
 * @param {number} [logicalHeight=LOGICAL_HEIGHT]
 * @returns {{ x: number, y: number, width: number, height: number, rotation: number }}
 */
export function extractObjectBoundingBox(obj, logicalWidth = LOGICAL_WIDTH, logicalHeight = LOGICAL_HEIGHT) {
  if (!obj) {
    return { x: 0, y: 0, width: 0, height: 0, rotation: 0 };
  }

  const scaleX = obj.scaleX ?? 1;
  const scaleY = obj.scaleY ?? 1;
  const rawWidth = (obj.width ?? 0) * scaleX;
  const rawHeight = (obj.height ?? 0) * scaleY;
  const left = obj.left ?? 0;
  const top = obj.top ?? 0;
  const angle = obj.angle ?? 0;

  // Handle center vs top-left origin
  let x = left;
  let y = top;

  if (obj.originX === 'center') {
    x = left - rawWidth / 2;
  }
  if (obj.originY === 'center') {
    y = top - rawHeight / 2;
  }

  return {
    x: Math.round(Math.max(0, Math.min(logicalWidth, x))),
    y: Math.round(Math.max(0, Math.min(logicalHeight, y))),
    width: Math.round(rawWidth),
    height: Math.round(rawHeight),
    rotation: Math.round(angle * 100) / 100,
  };
}

/**
 * Creates Location Sticker Metadata Entry
 * @param {Object} params
 * @param {string} params.id
 * @param {string} params.name
 * @param {number} [params.latitude]
 * @param {number} [params.longitude]
 * @param {{ x: number, y: number, width: number, height: number, rotation: number }} params.box
 * @returns {LocationMetadata}
 */
export function createLocationMetadata({ id, name, latitude = null, longitude = null, box }) {
  return {
    id: id || `loc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name: String(name || '').trim(),
    latitude: typeof latitude === 'number' ? latitude : null,
    longitude: typeof longitude === 'number' ? longitude : null,
    box: box || { x: 0, y: 0, width: 0, height: 0, rotation: 0 },
  };
}

/**
 * Creates Link Sticker Metadata Entry
 * @param {Object} params
 * @param {string} params.url
 * @param {string} params.text
 * @param {{ x: number, y: number, width: number, height: number, rotation: number }} params.box
 * @returns {LinkMetadata}
 */
export function createLinkMetadata({ url, text, box }) {
  return {
    url: String(url || '').trim(),
    text: String(text || '').trim(),
    box: box || { x: 0, y: 0, width: 0, height: 0, rotation: 0 },
  };
}

/**
 * Validates whether an interactive metadata object conforms to schema v1
 * @param {any} metadata
 * @returns {boolean}
 */
export function validateInteractiveMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return false;
  if (metadata.version !== 1) return false;
  if (!metadata.canvas_dimensions || metadata.canvas_dimensions.width !== LOGICAL_WIDTH || metadata.canvas_dimensions.height !== LOGICAL_HEIGHT) {
    return false;
  }
  if (!Array.isArray(metadata.locations) || !Array.isArray(metadata.links)) {
    return false;
  }
  return true;
}

/**
 * @typedef {Object} CanvasDimensions
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} StickerBoundingBox
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 * @property {number} rotation
 */

/**
 * @typedef {Object} LocationMetadata
 * @property {string} id
 * @property {string} name
 * @property {number|null} latitude
 * @property {number|null} longitude
 * @property {StickerBoundingBox} box
 */

/**
 * @typedef {Object} LinkMetadata
 * @property {string} url
 * @property {string} text
 * @property {StickerBoundingBox} box
 */

/**
 * @typedef {Object} InteractiveMetadata
 * @property {number} version
 * @property {CanvasDimensions} canvas_dimensions
 * @property {LocationMetadata[]} locations
 * @property {LinkMetadata[]} links
 */

/**
 * @typedef {Object} StoryExportPayload
 * @property {Blob} pngBlob
 * @property {string} pngDataUrl
 * @property {object} editableJson
 * @property {InteractiveMetadata} interactiveMetadata
 */
