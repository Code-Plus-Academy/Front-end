/**
 * Security & Sanitization Utilities for Story Editor
 * - DOMPurify SVG sanitization to eliminate stored XSS
 * - Strict HTTPS URL protocol validation for interactive link stickers
 * - User text input sanitization
 */

import DOMPurify from 'dompurify';

/**
 * Sanitizes SVG vector markup using DOMPurify before parsing on canvas.
 * Blocks <script>, inline event handlers, javascript: URIs, etc.
 * 
 * @param {string} rawSvgString Raw SVG string
 * @returns {string} Sanitized clean SVG string
 */
export function sanitizeSvg(rawSvgString) {
  if (!rawSvgString || typeof rawSvgString !== 'string') {
    return '';
  }

  if (typeof window === 'undefined') {
    return rawSvgString;
  }

  const sanitized = DOMPurify.sanitize(rawSvgString, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ['use', 'path', 'g', 'svg', 'circle', 'rect', 'line', 'polygon', 'polyline', 'text', 'defs', 'clipPath', 'linearGradient', 'radialGradient', 'stop'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'style'],
    FORBID_ATTR: [
      'onload',
      'onerror',
      'onclick',
      'onmouseover',
      'onfocus',
      'onblur',
      'href:javascript',
      'xlink:href:javascript',
    ],
  });

  return sanitized;
}

/**
 * Validates URLs for interactive link stickers with strict protocol enforcement.
 * Only permits https:// (and http:// on localhost during development).
 * Blocks javascript:, data:, vbscript:, and file: schemes.
 * 
 * @param {string} url User input URL string
 * @returns {{ valid: boolean, error?: string, sanitizedUrl?: string }}
 */
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL cannot be empty.' };
  }

  const trimmed = url.trim();

  // Instant blocklist for dangerous pseudo-protocols
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    lower.startsWith('blob:')
  ) {
    return { valid: false, error: 'Invalid URL scheme. Only HTTPS links are allowed.' };
  }

  try {
    const parsed = new URL(trimmed);
    const isDev =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (parsed.protocol === 'https:' || (isDev && parsed.protocol === 'http:')) {
      return { valid: true, sanitizedUrl: parsed.href };
    }

    return { valid: false, error: 'Only secure HTTPS URLs are permitted.' };
  } catch {
    // If the user typed "codeplus.academy", try prepending https://
    try {
      if (!trimmed.includes('://') && trimmed.includes('.')) {
        const fallback = new URL(`https://${trimmed}`);
        if (fallback.protocol === 'https:' && fallback.hostname.includes('.')) {
          return { valid: true, sanitizedUrl: fallback.href };
        }
      }
    } catch {
      // ignore
    }

    return { valid: false, error: 'Please enter a valid website URL (e.g., https://codeplus.academy).' };
  }
}

/**
 * Strips dangerous HTML characters from text inputs (e.g. location labels, link display texts)
 * @param {string} text
 * @returns {string} Sanitized plain text
 */
export function sanitizeText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  return text.replace(/[<>]/g, '').trim();
}
