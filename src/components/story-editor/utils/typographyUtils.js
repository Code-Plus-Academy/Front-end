/**
 * Rich Typography Utilities for Story Editor (Fabric.js v7/v6)
 * Handles Textbox creation, Custom Font Families, Toggleable Pill Backgrounds,
 * Font Sizing, Alignment, and Styling.
 */

import { Textbox } from 'fabric';
import {
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  applyDefaultObjectControls,
} from './canvasConfig.js';

/**
 * List of supported font families for story typography
 */
export const SUPPORTED_FONTS = [
  { id: 'Inter', name: 'Inter', family: 'Inter, sans-serif', sample: 'Clean Sans' },
  { id: 'Clash Display', name: 'Clash Display', family: "'Clash Display', sans-serif", sample: 'Bold & Punchy' },
  { id: 'Geist', name: 'Geist', family: 'Geist, sans-serif', sample: 'Modern Minimal' },
  { id: 'JetBrains Mono', name: 'JetBrains Mono', family: "'JetBrains Mono', monospace", sample: 'Tech Code' },
  { id: 'Impact', name: 'Impact', family: 'Impact, sans-serif', sample: 'Meme & Loud' },
  { id: 'Playfair Display', name: 'Playfair Display', family: "'Playfair Display', serif", sample: 'Classic Serif' },
];

/**
 * Standard text color presets
 */
export const TEXT_COLOR_PRESETS = [
  '#ffffff',
  '#000000',
  '#6366f1', // CPA Indigo
  '#38bdf8', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#a855f7', // Purple
  '#fb7185', // Coral
  '#facc15', // Yellow
];

/**
 * Adds a new Textbox to the canvas with default styling
 * 
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {string} [initialText='Type something...']
 * @param {Object} [options]
 * @returns {Textbox}
 */
export function addTextToCanvas(
  fabricCanvas,
  initialText = 'Type something...',
  options = {}
) {
  if (!fabricCanvas) {
    throw new Error('[typographyUtils:addTextToCanvas] Fabric canvas is required.');
  }

  const textObject = new Textbox(initialText, {
    fontSize: 54,
    fontFamily: 'Inter',
    fontWeight: '700',
    fill: '#ffffff',
    textAlign: 'center',
    width: 650,
    originX: 'center',
    originY: 'center',
    left: LOGICAL_WIDTH / 2,
    top: LOGICAL_HEIGHT / 2,
    splitByGrapheme: false,
    cursorColor: '#6366f1',
    cursorWidth: 3,
    padding: 12,
    customType: 'story_text',
    pillMode: 'none', // 'none' | 'solid' | 'translucent'
    ...options,
  });

  applyDefaultObjectControls(textObject);

  fabricCanvas.add(textObject);
  fabricCanvas.setActiveObject(textObject);

  if (typeof textObject.enterEditing === 'function') {
    textObject.enterEditing();
    if (typeof textObject.selectAll === 'function') {
      textObject.selectAll();
    }
  }

  fabricCanvas.requestRenderAll();

  return textObject;
}

/**
 * Toggles or sets the pill background style on a Textbox
 * Cycles: 'none' -> 'solid' -> 'translucent' -> 'none' (or applies specific mode)
 * 
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {Textbox} textObject
 * @param {Object} [config]
 * @param {'none' | 'solid' | 'translucent'} [config.mode]
 * @param {string} [config.pillColor='#000000']
 * @param {number} [config.opacity=0.7]
 * @returns {'none' | 'solid' | 'translucent'} New pill mode
 */
export function toggleTextPillBackground(
  fabricCanvas,
  textObject,
  { mode, pillColor = '#000000', opacity = 0.7 } = {}
) {
  if (!fabricCanvas || !textObject) return 'none';

  const currentMode = textObject.pillMode || 'none';
  let nextMode = mode;

  if (!nextMode) {
    if (currentMode === 'none') nextMode = 'solid';
    else if (currentMode === 'solid') nextMode = 'translucent';
    else nextMode = 'none';
  }

  textObject.pillMode = nextMode;

  if (nextMode === 'none') {
    textObject.set({
      backgroundColor: '',
      padding: 12,
    });
  } else if (nextMode === 'solid') {
    textObject.set({
      backgroundColor: pillColor,
      padding: 16,
    });
  } else if (nextMode === 'translucent') {
    // Convert hex or rgb to rgba with opacity
    const rgba = hexToRgba(pillColor, opacity);
    textObject.set({
      backgroundColor: rgba,
      padding: 16,
    });
  }

  if (typeof textObject.setCoords === 'function') {
    textObject.setCoords();
  }

  fabricCanvas.requestRenderAll();
  return nextMode;
}

/**
 * Sets font family for text object
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {Textbox} textObject
 * @param {string} fontFamily
 */
export function setTextFontFamily(fabricCanvas, textObject, fontFamily) {
  if (!fabricCanvas || !textObject || !fontFamily) return;
  textObject.set('fontFamily', fontFamily);
  if (typeof textObject.setCoords === 'function') textObject.setCoords();
  fabricCanvas.requestRenderAll();
}

/**
 * Sets font size for text object
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {Textbox} textObject
 * @param {number} fontSize
 */
export function setTextFontSize(fabricCanvas, textObject, fontSize) {
  if (!fabricCanvas || !textObject || !fontSize) return;
  textObject.set('fontSize', fontSize);
  if (typeof textObject.setCoords === 'function') textObject.setCoords();
  fabricCanvas.requestRenderAll();
}

/**
 * Sets text fill color
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {Textbox} textObject
 * @param {string} color
 */
export function setTextFill(fabricCanvas, textObject, color) {
  if (!fabricCanvas || !textObject || !color) return;
  textObject.set('fill', color);
  fabricCanvas.requestRenderAll();
}

/**
 * Sets text alignment (left, center, right)
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {Textbox} textObject
 * @param {'left' | 'center' | 'right'} alignment
 */
export function setTextAlign(fabricCanvas, textObject, alignment) {
  if (!fabricCanvas || !textObject || !alignment) return;
  textObject.set('textAlign', alignment);
  if (typeof textObject.setCoords === 'function') textObject.setCoords();
  fabricCanvas.requestRenderAll();
}

/**
 * Sets letter spacing (charSpacing)
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {Textbox} textObject
 * @param {number} charSpacing
 */
export function setTextLetterSpacing(fabricCanvas, textObject, charSpacing) {
  if (!fabricCanvas || !textObject) return;
  textObject.set('charSpacing', charSpacing);
  fabricCanvas.requestRenderAll();
}

/**
 * Toggles bold styling
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {Textbox} textObject
 * @returns {boolean} Is bold
 */
export function toggleTextBold(fabricCanvas, textObject) {
  if (!fabricCanvas || !textObject) return false;
  const isBold = textObject.fontWeight === 'bold' || textObject.fontWeight === '700';
  textObject.set('fontWeight', isBold ? 'normal' : 'bold');
  if (typeof textObject.setCoords === 'function') textObject.setCoords();
  fabricCanvas.requestRenderAll();
  return !isBold;
}

/**
 * Toggles italic styling
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {Textbox} textObject
 * @returns {boolean} Is italic
 */
export function toggleTextItalic(fabricCanvas, textObject) {
  if (!fabricCanvas || !textObject) return false;
  const isItalic = textObject.fontStyle === 'italic';
  textObject.set('fontStyle', isItalic ? 'normal' : 'italic');
  if (typeof textObject.setCoords === 'function') textObject.setCoords();
  fabricCanvas.requestRenderAll();
  return !isItalic;
}

/**
 * Toggles underline styling
 * @param {import('fabric').Canvas} fabricCanvas
 * @param {Textbox} textObject
 * @returns {boolean} Is underlined
 */
export function toggleTextUnderline(fabricCanvas, textObject) {
  if (!fabricCanvas || !textObject) return false;
  const isUnderlined = !!textObject.underline;
  textObject.set('underline', !isUnderlined);
  if (typeof textObject.setCoords === 'function') textObject.setCoords();
  fabricCanvas.requestRenderAll();
  return !isUnderlined;
}

/**
 * Helper to convert hex color to rgba string
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
  if (isNaN(num)) return `rgba(0, 0, 0, ${opacity})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
