/**
 * Sticker & Interactive Metadata Utilities for Story Editor (Fabric.js v7/v6)
 * Handles Manifest Loading, SVG/PNG Sticker Ingestion, Interactive Location & Link Stickers,
 * and Interactive Metadata Extraction for Viewer Tap Zones.
 */

import {
  FabricImage,
  Group,
  Rect,
  FabricText,
  Path,
  loadSVGFromString,
  util,
} from 'fabric';
import {
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  applyDefaultObjectControls,
} from './canvasConfig.js';
import { resolveImageSourceUrl } from './imageLayerUtils.js';
import { sanitizeSvg, isValidUrl, sanitizeText } from './sanitizeUtils.js';

// SVG Icon Paths
const MAP_PIN_PATH =
  'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z';

const LINK_CHAIN_PATH =
  'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z';

/**
 * Loads sticker catalog manifest
 * @returns {Promise<Object>}
 */
export async function loadStickersManifest() {
  try {
    const res = await fetch('/stickers/manifest.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('[stickerUtils:loadStickersManifest] Failed to fetch /stickers/manifest.json:', err);
    return { packs: [] };
  }
}

/**
 * Adds an SVG sticker to the canvas with DOMPurify sanitization
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {string} svgContentOrUrl SVG XML string or asset URL
 * @param {Object} [options]
 * @returns {Promise<import('fabric').Group | import('fabric').FabricObject>}
 */
export async function addSvgSticker(fabricCanvas, svgContentOrUrl, options = {}) {
  if (!fabricCanvas) {
    throw new Error('[stickerUtils:addSvgSticker] Fabric canvas is required.');
  }

  let rawSvg = svgContentOrUrl;
  if (
    typeof svgContentOrUrl === 'string' &&
    (svgContentOrUrl.startsWith('http') ||
      svgContentOrUrl.startsWith('/') ||
      svgContentOrUrl.startsWith('blob:'))
  ) {
    const res = await fetch(svgContentOrUrl);
    rawSvg = await res.text();
  }

  const cleanSvg = sanitizeSvg(rawSvg);
  if (!cleanSvg) {
    throw new Error('[stickerUtils:addSvgSticker] Sanitized SVG is empty or invalid.');
  }

  const result = await loadSVGFromString(cleanSvg);
  const objects = (result.objects || []).filter(Boolean);

  if (objects.length === 0) {
    throw new Error('[stickerUtils:addSvgSticker] No valid SVG objects found.');
  }

  let stickerObject;
  if (objects.length === 1 && !result.options) {
    stickerObject = objects[0];
  } else if (util && typeof util.groupSVGElements === 'function') {
    stickerObject = util.groupSVGElements(objects, result.options || {});
  } else {
    stickerObject = new Group(objects, result.options || {});
  }

  // Scale sticker to fit ~320px bounding box
  const targetMaxDim = 320;
  const currentWidth = stickerObject.width || 100;
  const currentHeight = stickerObject.height || 100;
  const maxDim = Math.max(currentWidth, currentHeight);
  const initialScale = targetMaxDim / maxDim;

  stickerObject.set({
    scaleX: initialScale,
    scaleY: initialScale,
    originX: 'center',
    originY: 'center',
    left: LOGICAL_WIDTH / 2,
    top: LOGICAL_HEIGHT / 2,
    customType: 'sticker_svg',
    ...options,
  });

  applyDefaultObjectControls(stickerObject);

  fabricCanvas.add(stickerObject);
  fabricCanvas.setActiveObject(stickerObject);
  fabricCanvas.requestRenderAll();

  return stickerObject;
}

/**
 * Adds a PNG/raster sticker (from catalog or custom user upload) to canvas
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {File | Blob | string} imageSource
 * @param {Object} [options]
 * @returns {Promise<FabricImage>}
 */
export async function addPngSticker(fabricCanvas, imageSource, options = {}) {
  if (!fabricCanvas) {
    throw new Error('[stickerUtils:addPngSticker] Fabric canvas is required.');
  }

  const url = await resolveImageSourceUrl(imageSource);

  const img = await FabricImage.fromURL(url, {
    crossOrigin: 'anonymous',
  });

  const imgWidth = img.width || 100;
  const imgHeight = img.height || 100;
  const targetMaxDim = 350;
  const maxDim = Math.max(imgWidth, imgHeight);
  const fitScale = Math.min(targetMaxDim / maxDim, 1);

  img.set({
    scaleX: fitScale,
    scaleY: fitScale,
    originX: 'center',
    originY: 'center',
    left: LOGICAL_WIDTH / 2,
    top: LOGICAL_HEIGHT / 2,
    customType: 'sticker_png',
    ...options,
  });

  applyDefaultObjectControls(img);

  fabricCanvas.add(img);
  fabricCanvas.setActiveObject(img);
  fabricCanvas.requestRenderAll();

  return img;
}

/**
 * Creates an interactive Location Sticker badge with separated metadata
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {Object} locationData
 * @param {string} [locationData.id]
 * @param {string} locationData.name
 * @param {number} [locationData.latitude]
 * @param {number} [locationData.longitude]
 * @param {Object} [options]
 * @returns {import('fabric').Group}
 */
export function addLocationSticker(
  fabricCanvas,
  { id, name, latitude = null, longitude = null },
  options = {}
) {
  if (!fabricCanvas) {
    throw new Error('[stickerUtils:addLocationSticker] Fabric canvas is required.');
  }

  const sanitizedName = sanitizeText(name) || 'Current Location';
  const locationId = id || `loc_${Date.now()}`;

  // 1. Text Label
  const textLabel = new FabricText(sanitizedName, {
    fontSize: 34,
    fontFamily: 'Inter',
    fontWeight: '700',
    fill: '#ffffff',
    originX: 'left',
    originY: 'center',
    left: 48,
    top: 0,
  });

  // 2. Map Pin Icon
  const pinIcon = new Path(MAP_PIN_PATH, {
    scaleX: 1.8,
    scaleY: 1.8,
    fill: '#f43f5e', // Vibrant rose/red pin
    originX: 'center',
    originY: 'center',
    left: 16,
    top: 0,
  });

  const textWidth = textLabel.width || 200;
  const totalPaddingX = 40;
  const badgeWidth = Math.max(textWidth + 80 + totalPaddingX, 220);
  const badgeHeight = 72;

  // 3. Pill Background
  const pillBg = new Rect({
    width: badgeWidth,
    height: badgeHeight,
    rx: 36,
    ry: 36,
    fill: 'rgba(15, 23, 42, 0.88)', // Sleek slate backdrop
    stroke: 'rgba(255, 255, 255, 0.25)',
    strokeWidth: 2,
    shadow: {
      color: 'rgba(0, 0, 0, 0.4)',
      blur: 16,
      offsetX: 0,
      offsetY: 6,
    },
    originX: 'center',
    originY: 'center',
    left: 0,
    top: 0,
  });

  // Recenter contents inside group
  pinIcon.set({ left: -badgeWidth / 2 + 36, top: 0 });
  textLabel.set({ left: -badgeWidth / 2 + 64, top: 0 });

  // 4. Combine into Group
  const locationGroup = new Group([pillBg, pinIcon, textLabel], {
    originX: 'center',
    originY: 'center',
    left: LOGICAL_WIDTH / 2,
    top: LOGICAL_HEIGHT / 2,
    subTargetCheck: false,
    customType: 'interactive_location',
    locationMetadata: {
      id: locationId,
      name: sanitizedName,
      latitude: latitude !== null ? Number(latitude) : null,
      longitude: longitude !== null ? Number(longitude) : null,
    },
    ...options,
  });

  applyDefaultObjectControls(locationGroup);

  fabricCanvas.add(locationGroup);
  fabricCanvas.setActiveObject(locationGroup);
  fabricCanvas.requestRenderAll();

  return locationGroup;
}

/**
 * Creates an interactive Link Sticker chip with strict HTTPS validation
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {Object} linkData
 * @param {string} linkData.url
 * @param {string} [linkData.text]
 * @param {Object} [options]
 * @returns {import('fabric').Group}
 */
export function addLinkSticker(fabricCanvas, { url, text }, options = {}) {
  if (!fabricCanvas) {
    throw new Error('[stickerUtils:addLinkSticker] Fabric canvas is required.');
  }

  const urlCheck = isValidUrl(url);
  if (!urlCheck.valid || !urlCheck.sanitizedUrl) {
    throw new Error(urlCheck.error || 'Invalid link URL.');
  }

  const sanitizedUrl = urlCheck.sanitizedUrl;
  let parsedDomain = 'link';
  try {
    parsedDomain = new URL(sanitizedUrl).hostname.replace(/^www\./, '');
  } catch {
    // fallback
  }

  const rawDisplay = text ? sanitizeText(text) : parsedDomain;
  const displayLabel = rawDisplay.toUpperCase();

  // 1. Text Label
  const textLabel = new FabricText(displayLabel, {
    fontSize: 32,
    fontFamily: 'Inter',
    fontWeight: '800',
    fill: '#0f172a', // High contrast dark text on white chip
    originX: 'left',
    originY: 'center',
    left: 48,
    top: 0,
    charSpacing: 20,
  });

  // 2. Link Icon
  const linkIcon = new Path(LINK_CHAIN_PATH, {
    scaleX: 1.6,
    scaleY: 1.6,
    fill: '#4338ca', // Indigo link icon
    originX: 'center',
    originY: 'center',
    left: 16,
    top: 0,
  });

  const textWidth = textLabel.width || 180;
  const totalPaddingX = 44;
  const badgeWidth = Math.max(textWidth + 70 + totalPaddingX, 220);
  const badgeHeight = 72;

  // 3. Pill Background
  const pillBg = new Rect({
    width: badgeWidth,
    height: badgeHeight,
    rx: 36,
    ry: 36,
    fill: '#ffffff',
    stroke: '#e2e8f0',
    strokeWidth: 2,
    shadow: {
      color: 'rgba(0, 0, 0, 0.35)',
      blur: 18,
      offsetX: 0,
      offsetY: 6,
    },
    originX: 'center',
    originY: 'center',
    left: 0,
    top: 0,
  });

  // Recenter contents inside group
  linkIcon.set({ left: -badgeWidth / 2 + 34, top: 0 });
  textLabel.set({ left: -badgeWidth / 2 + 62, top: 0 });

  // 4. Combine into Group
  const linkGroup = new Group([pillBg, linkIcon, textLabel], {
    originX: 'center',
    originY: 'center',
    left: LOGICAL_WIDTH / 2,
    top: LOGICAL_HEIGHT / 2,
    subTargetCheck: false,
    customType: 'interactive_link',
    linkMetadata: {
      url: sanitizedUrl,
      text: rawDisplay,
    },
    ...options,
  });

  applyDefaultObjectControls(linkGroup);

  fabricCanvas.add(linkGroup);
  fabricCanvas.setActiveObject(linkGroup);
  fabricCanvas.requestRenderAll();

  return linkGroup;
}

/**
 * Extracts structured interactive metadata (locations and links) with normalized coordinates
 * for high-res export and viewer tap zones.
 * 
 * @param {import('fabric').Canvas} fabricCanvas
 * @returns {StoryInteractiveMetadata}
 */
export function extractInteractiveMetadata(fabricCanvas) {
  if (!fabricCanvas) {
    return {
      version: 1,
      canvas_dimensions: { width: LOGICAL_WIDTH, height: LOGICAL_HEIGHT },
      locations: [],
      links: [],
    };
  }

  const objects = fabricCanvas.getObjects();
  const locations = [];
  const links = [];

  objects.forEach((obj) => {
    if (!obj || !obj.customType) return;

    // Get scaled bounding box in 1080x1920 space
    const width = obj.getScaledWidth ? obj.getScaledWidth() : (obj.width || 0) * (obj.scaleX || 1);
    const height = obj.getScaledHeight ? obj.getScaledHeight() : (obj.height || 0) * (obj.scaleY || 1);
    const left = obj.left || 0;
    const top = obj.top || 0;
    const rotation = obj.angle || 0;

    const box = {
      x: Math.round(left),
      y: Math.round(top),
      width: Math.round(width),
      height: Math.round(height),
      rotation: Math.round(rotation * 10) / 10,
    };

    if (obj.customType === 'interactive_location' && obj.locationMetadata) {
      locations.push({
        id: obj.locationMetadata.id || `loc_${Date.now()}`,
        name: obj.locationMetadata.name || '',
        latitude: obj.locationMetadata.latitude,
        longitude: obj.locationMetadata.longitude,
        box,
      });
    } else if (obj.customType === 'interactive_link' && obj.linkMetadata) {
      links.push({
        url: obj.linkMetadata.url || '',
        text: obj.linkMetadata.text || '',
        box,
      });
    }
  });

  return {
    version: 1,
    canvas_dimensions: { width: LOGICAL_WIDTH, height: LOGICAL_HEIGHT },
    locations,
    links,
  };
}
