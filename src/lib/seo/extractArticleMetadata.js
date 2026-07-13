/**
 * extractArticleMetadata.js
 *
 * Pure function — no side effects, no I/O, no framework imports.
 * Works in Node.js (backfill script) and in the Next.js runtime.
 *
 * Extracts a real SEO description and OG image URL from an article's
 * content_blocks, falling back gracefully when blocks are empty or
 * contain only placeholder boilerplate.
 *
 * Priority — Description:
 *   1. hero.data.subtitle   (non-empty, non-placeholder)
 *   2. First rich_text.data.content   (HTML-stripped, non-empty)
 *   3. First callout.data.body        (non-empty)
 *   4. article.title                  (last resort — isPlaceholder = true)
 *
 * Priority — Image:
 *   1. hero.data.imageUrl           (new field, added by this task)
 *   2. hero.data.backgroundImageUrl (existing field already used by HeroBlock renderer)
 *   3. First image_block.data.url   (new field, added by this task)
 *   4. null
 *
 * @param {object} article
 * @param {string} article.title
 * @param {object} [article.meta]
 * @param {Array}  [article.content_blocks]
 *
 * @returns {{ description: string, ogImageUrl: string|null, isPlaceholder: boolean }}
 */

// ---------------------------------------------------------------------------
// Known boilerplate strings that were auto-generated at article creation time
// and should never be surfaced as real descriptions.
// ---------------------------------------------------------------------------
const PLACEHOLDER_STRINGS = new Set([
  'General purpose long-form editorial article.',
  'Curated resources, tools, and reading lists.',
  'GitHub-style repo explanation and usage guide.',
  // Legacy fallbacks used in older page_type defaults
  'A standard long-form article.',
  'A curated resource article.',
  'A repository article.',
  'A course overview article.',
]);

/**
 * Returns true if the string is a known boilerplate placeholder.
 * Comparison is exact and case-sensitive, matching DB storage.
 * @param {string} str
 * @returns {boolean}
 */
function isPlaceholderString(str) {
  if (!str || typeof str !== 'string') return true;
  return PLACEHOLDER_STRINGS.has(str.trim());
}

// ---------------------------------------------------------------------------
// HTML + Markdown stripping
// ---------------------------------------------------------------------------
// The rich_text block stores either plain text or basic HTML produced by a
// rich-text editor. A simple regex strip is safe here because:
//  - The content is trusted (creator-authored, not user-submitted)
//  - We only need plain text for a 155-char description
//  - No external library is introduced per the task constraints
// ---------------------------------------------------------------------------

/**
 * Strips HTML tags and collapses markdown/whitespace to plain text.
 * Also decodes a small set of common HTML entities.
 * @param {string} html
 * @returns {string}
 */
function stripMarkupToPlainText(html) {
  if (!html || typeof html !== 'string') return '';

  let text = html
    // Remove script / style blocks entirely (content, not just tags)
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
    // Remove all remaining HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    // Strip markdown code fences (remove content) and inline code (keep content)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    // Strip markdown headings, bold, italic, links
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Collapse all whitespace (newlines, tabs, multiple spaces) to single space
    .replace(/\s+/g, ' ')
    // Remove space before punctuation that can appear after entity decoding
    .replace(/ ([.,;:!?])/g, '$1')
    .trim();

  return text;
}

// ---------------------------------------------------------------------------
// Description truncation
// ---------------------------------------------------------------------------
const MAX_DESCRIPTION_LENGTH = 155;

/**
 * Truncates text to at most maxLen characters, breaking at the last space
 * before the limit, and appending '…' only if truncation occurred.
 * @param {string} text
 * @param {number} [maxLen]
 * @returns {string}
 */
function truncateAtWordBoundary(text, maxLen = MAX_DESCRIPTION_LENGTH) {
  if (!text || text.length <= maxLen) return text;

  const sliced = text.slice(0, maxLen);
  // Find the last space within the sliced portion to avoid cutting mid-word
  const lastSpace = sliced.lastIndexOf(' ');
  const truncated = lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced;
  return truncated + '…';
}

// ---------------------------------------------------------------------------
// Block helpers
// ---------------------------------------------------------------------------

/**
 * Safely parse content_blocks — the field may arrive as a JSON string
 * (some API responses) or as a parsed array.
 * @param {any} blocks
 * @returns {Array<object>}
 */
function normaliseBlocks(blocks) {
  if (Array.isArray(blocks)) return blocks;
  if (typeof blocks === 'string') {
    try { return JSON.parse(blocks); } catch { return []; }
  }
  return [];
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * @param {{ title: string, meta?: object, content_blocks?: any }} article
 * @returns {{ description: string, ogImageUrl: string|null, isPlaceholder: boolean }}
 */
export function extractArticleMetadata(article) {
  const { title = '', content_blocks } = article;
  const blocks = normaliseBlocks(content_blocks);

  // ── Find blocks by type ──────────────────────────────────────────────────
  const heroBlock       = blocks.find(b => b?.type === 'hero');
  const richTextBlocks  = blocks.filter(b => b?.type === 'rich_text');
  const calloutBlocks   = blocks.filter(b => b?.type === 'callout');
  const imageBlocks     = blocks.filter(b => b?.type === 'image_block');

  // ── Extract description ──────────────────────────────────────────────────
  let description = null;
  let isPlaceholder = false;

  // 1. hero.data.subtitle
  const heroSubtitle = heroBlock?.data?.subtitle?.trim();
  if (heroSubtitle && !isPlaceholderString(heroSubtitle)) {
    description = heroSubtitle;
  }

  // 2. First non-empty rich_text block (strip HTML/markdown)
  if (!description) {
    for (const block of richTextBlocks) {
      const raw = block?.data?.content;
      if (!raw) continue;
      const stripped = stripMarkupToPlainText(raw);
      if (stripped && !isPlaceholderString(stripped)) {
        description = stripped;
        break;
      }
    }
  }

  // 3. First non-empty callout body
  if (!description) {
    for (const block of calloutBlocks) {
      const body = block?.data?.body?.trim();
      if (body && !isPlaceholderString(body)) {
        description = body;
        break;
      }
    }
  }

  // 4. Fallback: article title (signals no real content was found)
  if (!description) {
    description = title.trim() || 'Read on Code Plus Academy';
    isPlaceholder = true;
  }

  // Truncate to 155 chars at word boundary
  description = truncateAtWordBoundary(description);

  // ── Extract OG image URL ─────────────────────────────────────────────────
  let ogImageUrl = null;

  // 1. hero.data.imageUrl (new field introduced by this task)
  if (heroBlock?.data?.imageUrl && typeof heroBlock.data.imageUrl === 'string') {
    ogImageUrl = heroBlock.data.imageUrl;
  }

  // 2. hero.data.backgroundImageUrl (already written by Studio for hero banner images)
  if (!ogImageUrl && heroBlock?.data?.backgroundImageUrl && typeof heroBlock.data.backgroundImageUrl === 'string') {
    ogImageUrl = heroBlock.data.backgroundImageUrl;
  }

  // 3. First image_block.data.url (new field introduced by this task)
  if (!ogImageUrl) {
    for (const block of imageBlocks) {
      const url = block?.data?.url;
      if (url && typeof url === 'string') {
        ogImageUrl = url;
        break;
      }
    }
  }

  return { description, ogImageUrl, isPlaceholder };
}

// ---------------------------------------------------------------------------
// CommonJS-compatible export (for the backfill script running in Node.js
// without --experimental-vm-modules, or older tooling)
// ---------------------------------------------------------------------------
// We export as both ESM (above) and attach to module.exports for CJS callers.
// This file uses ESM `export` — CJS callers should use dynamic import() or
// the compiled version. The backfill script imports this via ESM.
