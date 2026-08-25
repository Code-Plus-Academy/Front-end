/**
 * CPA S3 Media Client & Tenor GIF Integration
 * Manages loading sticker manifests from S3/CDN, preloading assets,
 * and querying curated S3 GIFs and Tenor v2 GIF search with caching.
 */

import { preloadStickers } from './stickerPreloader';

// In-memory query cache for GIF search results to prevent rate limiting (TTL 30 mins)
const gifSearchCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000;

// Local storage key for recently used and Gboard custom stickers
const RECENT_STICKERS_KEY = 'cpa_recent_stickers';
const MAX_RECENT_STICKERS = 24;

/**
 * Base CDN URL from environment or default relative path
 */
export function getStickerCdnBase() {
  return process.env.NEXT_PUBLIC_STICKER_CDN_URL || '';
}

export function getGifCdnBase() {
  return process.env.NEXT_PUBLIC_GIF_CDN_URL || '';
}

/**
 * Fetch Sticker Packs Manifest from S3/CDN with Local Fallback
 */
export async function fetchStickerPacks() {
  const cdnBase = getStickerCdnBase();
  const manifestUrl = cdnBase ? `${cdnBase}/manifest.json` : '/stickers/manifest.json';

  try {
    const res = await fetch(manifestUrl, { cache: 'force-cache' });
    if (!res.ok) throw new Error(`Failed to fetch sticker manifest: ${res.status}`);
    const data = await res.json();
    const base = cdnBase || data.base_cdn_url || '/stickers';

    // Normalise URLs with base CDN URL if provided
    const packs = (data.packs || []).map((pack) => ({
      ...pack,
      icon: pack.icon.startsWith('http')
        ? pack.icon
        : `${base.replace(/\/$/, '')}/${pack.icon.replace(/^\//, '')}`,
      stickers: (pack.stickers || []).map((st) => ({
        ...st,
        url: st.file?.startsWith('http')
          ? st.file
          : `${base.replace(/\/$/, '')}/${(st.file || '').replace(/^\//, '')}`,
      })),
    }));

    // Preload the first visible pack automatically
    if (packs[0]?.stickers) {
      preloadStickers(packs[0].stickers.slice(0, 16));
    }

    return packs;
  } catch {
    return getFallbackStickerPacks();
  }
}

/**
 * Fetch Curated S3 GIFs Manifest with Fallback
 */
export async function fetchCuratedGifs() {
  const cdnBase = getGifCdnBase();
  const manifestUrl = cdnBase ? `${cdnBase}/manifest.json` : '/gifs/manifest.json';

  try {
    const res = await fetch(manifestUrl, { cache: 'force-cache' });
    if (!res.ok) throw new Error(`Failed to fetch GIF manifest: ${res.status}`);
    const data = await res.json();
    const base = cdnBase || data.base_cdn_url || '';

    const items = (data.items || []).map((gif) => ({
      ...gif,
      url: gif.url?.startsWith('http')
        ? gif.url
        : (base ? `${base.replace(/\/$/, '')}/${(gif.file || '').replace(/^\//, '')}` : gif.file || gif.url),
      preview_url: gif.preview_url?.startsWith('http')
        ? gif.preview_url
        : (base ? `${base.replace(/\/$/, '')}/${(gif.preview || gif.file || '').replace(/^\//, '')}` : gif.preview || gif.preview_url || gif.url),
    }));

    return {
      categories: data.categories || [
        { id: 'trending', name: '🔥 Trending' },
        { id: 'coding', name: '💻 Coding & Tech' },
        { id: 'reactions', name: '🤯 Reactions' },
        { id: 'celebration', name: '🎉 Celebrations' },
      ],
      items,
    };
  } catch {
    return getFallbackGifs();
  }
}

/**
 * Search Tenor API v2 for Animated GIFs with In-Memory Caching
 * @param {string} query - Search term (or empty for trending)
 * @param {number} limit - Number of results (default 24)
 */
export async function searchTenorGifs(query = '', limit = 24) {
  const normalizedQuery = query.trim().toLowerCase();
  const cacheKey = `tenor_${normalizedQuery}_${limit}`;

  // 1. Check in-memory cache
  if (gifSearchCache.has(cacheKey)) {
    const cached = gifSearchCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  // 2. Tenor v2 Public Client Endpoint
  const tenorKey = process.env.NEXT_PUBLIC_TENOR_API_KEY || 'LIVDSRZULELA';
  const clientKey = 'cpa_web_app';
  const searchTerm = normalizedQuery || 'trending';
  const endpoint = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(searchTerm)}&key=${tenorKey}&client_key=${clientKey}&limit=${limit}&media_filter=gif,tinygif`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`Tenor API responded with status ${res.status}`);
    const json = await res.json();

    const results = (json.results || []).map((item) => {
      const media = item.media_formats || {};
      const full = media.gif || media.tinygif || media.nanogif || {};
      const preview = media.tinygif || media.nanogif || full;

      const [w, h] = full.dims || [320, 240];
      const aspect = w && h ? Number((w / h).toFixed(2)) : 1.33;

      return {
        id: item.id,
        title: item.title || item.content_description || 'GIF',
        url: full.url,
        preview_url: preview.url || full.url,
        width: w,
        height: h,
        aspect_ratio: aspect,
        source: 'tenor',
      };
    });

    if (results.length > 0) {
      gifSearchCache.set(cacheKey, {
        timestamp: Date.now(),
        data: results,
      });
      return results;
    }
    throw new Error('No results from Tenor');
  } catch {
    const fallback = await fetchCuratedGifs();
    if (normalizedQuery) {
      const filtered = fallback.items.filter(
        (i) =>
          i.title?.toLowerCase().includes(normalizedQuery) ||
          i.tags?.some((t) => t.toLowerCase().includes(normalizedQuery))
      );
      return filtered.length > 0 ? filtered : fallback.items;
    }
    return fallback.items;
  }
}

/**
 * Recent & Custom Gboard Stickers Management (localStorage)
 */
export function getRecentStickers() {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(RECENT_STICKERS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

export function saveRecentSticker(sticker) {
  if (typeof window === 'undefined' || !sticker) return;
  try {
    const current = getRecentStickers();
    const filtered = current.filter((s) => s.url !== sticker.url && s.sticker_id !== sticker.sticker_id);
    const updated = [sticker, ...filtered].slice(0, MAX_RECENT_STICKERS);
    localStorage.setItem(RECENT_STICKERS_KEY, JSON.stringify(updated));
  } catch {}
}

/**
 * Built-in Fallback Sticker Packs (Complete Dev & Student Suite)
 */
function getFallbackStickerPacks() {
  return [
    {
      id: 'dev_life',
      name: '💻 Dev Life',
      icon: '/stickers/dev_life/pack_icon.webp',
      stickers: [
        { id: 'git_fire', name: 'Ship It Fire', file: '/stickers/dev_life/git_fire.webp', tags: ['git', 'push', 'ship', 'fire'], width: 256, height: 256, url: '/stickers/dev_life/git_fire.webp' },
        { id: 'null_pointer', name: 'Null Pointer', file: '/stickers/dev_life/null_pointer.webp', tags: ['bug', 'error', 'null', 'panic'], width: 256, height: 256, url: '/stickers/dev_life/null_pointer.webp' },
        { id: 'coffee_overflow', name: 'Coffee Refill', file: '/stickers/dev_life/coffee_overflow.webp', tags: ['coffee', 'tired', 'energy', 'code'], width: 256, height: 256, url: '/stickers/dev_life/coffee_overflow.webp' },
        { id: 'merge_conflict', name: 'Merge Conflict', file: '/stickers/dev_life/merge_conflict.webp', tags: ['git', 'merge', 'conflict', 'help'], width: 256, height: 256, url: '/stickers/dev_life/merge_conflict.webp' },
        { id: 'hacker_cat', name: '10x Hacker', file: '/stickers/dev_life/hacker_cat.webp', tags: ['hacker', 'fast', '10x', 'keyboard'], width: 256, height: 256, url: '/stickers/dev_life/hacker_cat.webp' },
        { id: 'this_is_fine', name: 'This Is Fine', file: '/stickers/dev_life/this_is_fine.webp', tags: ['fine', 'fire', 'chaos', 'prod'], width: 256, height: 256, url: '/stickers/dev_life/this_is_fine.webp' },
      ],
    },
    {
      id: 'cpa_official',
      name: '🚀 Code+ Official',
      icon: '/stickers/cpa_official/pack_icon.webp',
      stickers: [
        { id: 'cpa_clap', name: 'Huge Claps', file: '/stickers/cpa_official/cpa_clap.webp', tags: ['clap', 'bravo', 'kudos', 'cpa'], width: 256, height: 256, url: '/stickers/cpa_official/cpa_clap.webp' },
        { id: 'cpa_rocket', name: 'To The Moon', file: '/stickers/cpa_official/cpa_rocket.webp', tags: ['rocket', 'launch', 'speed', 'cpa'], width: 256, height: 256, url: '/stickers/cpa_official/cpa_rocket.webp' },
        { id: 'cpa_verified', name: 'Verified Badge', file: '/stickers/cpa_official/cpa_verified.webp', tags: ['verified', 'check', 'approved'], width: 256, height: 256, url: '/stickers/cpa_official/cpa_verified.webp' },
        { id: 'cpa_brain', name: 'Galaxy Brain', file: '/stickers/cpa_official/cpa_brain.webp', tags: ['brain', 'smart', 'iq', 'idea'], width: 256, height: 256, url: '/stickers/cpa_official/cpa_brain.webp' },
      ],
    },
    {
      id: 'student_reactions',
      name: '📚 Study & Exam',
      icon: '/stickers/student_reactions/pack_icon.webp',
      stickers: [
        { id: 'pyq_panic', name: 'PYQ Panic', file: '/stickers/student_reactions/pyq_panic.webp', tags: ['pyq', 'exam', 'panic', 'notes'], width: 256, height: 256, url: '/stickers/student_reactions/pyq_panic.webp' },
        { id: 'all_nighter', name: 'All Nighter', file: '/stickers/student_reactions/all_nighter.webp', tags: ['night', 'sleep', 'study', 'cram'], width: 256, height: 256, url: '/stickers/student_reactions/all_nighter.webp' },
        { id: 'topper_notes', name: 'Topper Notes', file: '/stickers/student_reactions/topper_notes.webp', tags: ['topper', 'notes', '100', 'a+'], width: 256, height: 256, url: '/stickers/student_reactions/topper_notes.webp' },
        { id: 'deadline_sweat', name: 'Deadline Sweat', file: '/stickers/student_reactions/deadline_sweat.webp', tags: ['deadline', 'submission', 'hurry'], width: 256, height: 256, url: '/stickers/student_reactions/deadline_sweat.webp' },
      ],
    },
  ];
}

/**
 * Built-in Fallback Curated GIFs
 */
function getFallbackGifs() {
  return {
    categories: [
      { id: 'trending', name: '🔥 Trending' },
      { id: 'coding', name: '💻 Coding & Tech' },
      { id: 'reactions', name: '🤯 Reactions' },
      { id: 'celebration', name: '🎉 Celebrations' },
    ],
    items: [
      {
        id: 'hackerman_coding',
        title: 'Hackerman typing fast',
        category: 'coding',
        url: 'https://media.tenor.com/2roX3uxz_68AAAAM/hackerman-matrix.gif',
        preview_url: 'https://media.tenor.com/2roX3uxz_68AAAAM/hackerman-matrix.gif',
        width: 480,
        height: 270,
        aspect_ratio: 1.77,
        tags: ['hackerman', 'code', 'typing', 'fast', 'matrix'],
      },
      {
        id: 'mind_blown_reaction',
        title: 'Mind Blown Reaction',
        category: 'reactions',
        url: 'https://media.tenor.com/F3b8c3-NkmwAAAAM/mind-blown.gif',
        preview_url: 'https://media.tenor.com/F3b8c3-NkmwAAAAM/mind-blown.gif',
        width: 480,
        height: 360,
        aspect_ratio: 1.33,
        tags: ['mind', 'blown', 'galaxy', 'explosion', 'wow'],
      },
      {
        id: 'celebrate_confetti',
        title: 'Success Confetti Celebration',
        category: 'celebration',
        url: 'https://media.tenor.com/71G1M0_y23QAAAAM/confetti-celebrate.gif',
        preview_url: 'https://media.tenor.com/71G1M0_y23QAAAAM/confetti-celebrate.gif',
        width: 480,
        height: 270,
        aspect_ratio: 1.77,
        tags: ['celebrate', 'party', 'win', 'shipped', 'done'],
      },
      {
        id: 'developer_coffee',
        title: 'Coding with infinite coffee',
        category: 'coding',
        url: 'https://media.tenor.com/4Ym95eZt9iQAAAAM/cat-typing.gif',
        preview_url: 'https://media.tenor.com/4Ym95eZt9iQAAAAM/cat-typing.gif',
        width: 480,
        height: 360,
        aspect_ratio: 1.33,
        tags: ['cat', 'typing', 'coffee', 'dev', 'grind'],
      },
    ],
  };
}
