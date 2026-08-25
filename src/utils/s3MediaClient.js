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
 * Search GIFs with Tenor v2, Giphy Public CDN & Curated S3 Fallback
 * @param {string} query - Search term (or empty for trending)
 * @param {number} limit - Number of results (default 24)
 */
export async function searchTenorGifs(query = '', limit = 24) {
  const normalizedQuery = query.trim().toLowerCase();
  const cacheKey = `gif_${normalizedQuery}_${limit}`;

  // 1. Check in-memory cache
  if (gifSearchCache.has(cacheKey)) {
    const cached = gifSearchCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  // 2. Try GIPHY API (Primary high-performance animated GIF engine)
  const customGiphyKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY || 'PUaNyfUjtMw4Fs4Ne8ZYnc4SjNpNJfQU';
  if (customGiphyKey) {
    try {
      const giphyEndpoint = normalizedQuery
        ? `https://api.giphy.com/v1/gifs/search?api_key=${customGiphyKey}&q=${encodeURIComponent(normalizedQuery)}&limit=${limit}&rating=g`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${customGiphyKey}&limit=${limit}&rating=g`;

      const gRes = await fetch(giphyEndpoint);
      if (gRes.ok) {
        const gJson = await gRes.json();
        const results = (gJson.data || []).map((item) => {
          const original = item.images?.original || {};
          const full = item.images?.fixed_height || original;
          const preview = item.images?.fixed_width_small || item.images?.fixed_height_small || full;
          const w = parseInt(original.width || full.width, 10) || 320;
          const h = parseInt(original.height || full.height, 10) || 240;

          return {
            id: item.id,
            title: item.title || 'Animated GIF',
            url: full.url || original.url || item.images?.downsized?.url || item.images?.fixed_width?.url,
            preview_url: preview.url || full.url || original.url,
            width: w,
            height: h,
            aspect_ratio: w && h ? Number((w / h).toFixed(2)) : 1.33,
            source: 'giphy',
          };
        });

        if (results.length > 0) {
          gifSearchCache.set(cacheKey, { timestamp: Date.now(), data: results });
          return results;
        }
      }
    } catch {}
  }

  // 3. Try Tenor API v2 if valid key is set
  const customTenorKey = process.env.NEXT_PUBLIC_TENOR_API_KEY;
  if (customTenorKey && customTenorKey !== 'LIVDSRZULELA') {
    try {
      const searchTerm = normalizedQuery || 'trending';
      const endpoint = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(searchTerm)}&key=${customTenorKey}&client_key=cpa_web_app&limit=${limit}&media_filter=gif,tinygif`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const json = await res.json();
        const results = (json.results || []).map((item) => {
          const media = item.media_formats || {};
          const full = media.gif || media.tinygif || media.nanogif || {};
          const preview = media.tinygif || media.nanogif || full;
          const [w, h] = full.dims || [320, 240];
          return {
            id: item.id,
            title: item.title || item.content_description || 'GIF',
            url: full.url,
            preview_url: preview.url || full.url,
            width: w,
            height: h,
            aspect_ratio: w && h ? Number((w / h).toFixed(2)) : 1.33,
            source: 'tenor',
          };
        });

        if (results.length > 0) {
          gifSearchCache.set(cacheKey, { timestamp: Date.now(), data: results });
          return results;
        }
      }
    } catch {}
  }

  // 4. Curated S3 / Local Fallback
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

const RECENT_GIFS_KEY = 'cpa_recent_gifs';
const MAX_RECENT_GIFS = 24;

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
 * Recent & Custom Gboard GIFs Management (localStorage)
 */
export function getRecentGifs() {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(RECENT_GIFS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

export function saveRecentGif(gif) {
  if (typeof window === 'undefined' || !gif) return;
  try {
    const current = getRecentGifs();
    const filtered = current.filter((g) => g.url !== gif.url && g.gif_id !== gif.gif_id);
    const updated = [gif, ...filtered].slice(0, MAX_RECENT_GIFS);
    localStorage.setItem(RECENT_GIFS_KEY, JSON.stringify(updated));
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
      icon: '/stickers/dev_life/pack_icon.svg',
      stickers: [
        { id: 'git_fire', name: 'Ship It Fire', file: '/stickers/dev_life/git_fire.svg', tags: ['git', 'push', 'ship', 'fire'], width: 256, height: 256, url: '/stickers/dev_life/git_fire.svg' },
        { id: 'null_pointer', name: 'Null Pointer', file: '/stickers/dev_life/null_pointer.svg', tags: ['bug', 'error', 'null', 'panic'], width: 256, height: 256, url: '/stickers/dev_life/null_pointer.svg' },
        { id: 'coffee_overflow', name: 'Coffee Refill', file: '/stickers/dev_life/coffee_overflow.svg', tags: ['coffee', 'tired', 'energy', 'code'], width: 256, height: 256, url: '/stickers/dev_life/coffee_overflow.svg' },
        { id: 'merge_conflict', name: 'Merge Conflict', file: '/stickers/dev_life/merge_conflict.svg', tags: ['git', 'merge', 'conflict', 'help'], width: 256, height: 256, url: '/stickers/dev_life/merge_conflict.svg' },
        { id: 'hacker_cat', name: '10x Hacker', file: '/stickers/dev_life/10x_hacker.svg', tags: ['hacker', 'fast', '10x', 'keyboard'], width: 256, height: 256, url: '/stickers/dev_life/10x_hacker.svg' },
        { id: 'this_is_fine', name: 'This Is Fine', file: '/stickers/dev_life/this_is_fine.svg', tags: ['fine', 'fire', 'chaos', 'prod'], width: 256, height: 256, url: '/stickers/dev_life/this_is_fine.svg' },
      ],
    },
    {
      id: 'cpa_official',
      name: '🚀 Code+ Official',
      icon: '/stickers/cpa_official/pack_icon.svg',
      stickers: [
        { id: 'cpa_clap', name: 'Huge Claps', file: '/stickers/cpa_official/cpa_clap.svg', tags: ['clap', 'bravo', 'kudos', 'cpa'], width: 256, height: 256, url: '/stickers/cpa_official/cpa_clap.svg' },
        { id: 'cpa_rocket', name: 'To The Moon', file: '/stickers/cpa_official/cpa_rocket.svg', tags: ['rocket', 'launch', 'speed', 'cpa'], width: 256, height: 256, url: '/stickers/cpa_official/cpa_rocket.svg' },
        { id: 'cpa_verified', name: 'Verified Badge', file: '/stickers/cpa_official/cpa_verified.svg', tags: ['verified', 'check', 'approved'], width: 256, height: 256, url: '/stickers/cpa_official/cpa_verified.svg' },
        { id: 'cpa_brain', name: 'Galaxy Brain', file: '/stickers/cpa_official/cpa_brain.svg', tags: ['brain', 'smart', 'iq', 'idea'], width: 256, height: 256, url: '/stickers/cpa_official/cpa_brain.svg' },
      ],
    },
    {
      id: 'student_reactions',
      name: '📚 Study & Exam',
      icon: '/stickers/student_reactions/pack_icon.svg',
      stickers: [
        { id: 'pyq_panic', name: 'PYQ Panic', file: '/stickers/student_reactions/pyq_panic.svg', tags: ['pyq', 'exam', 'panic', 'notes'], width: 256, height: 256, url: '/stickers/student_reactions/pyq_panic.svg' },
        { id: 'all_nighter', name: 'All Nighter', file: '/stickers/student_reactions/all_nighter.svg', tags: ['night', 'sleep', 'study', 'cram'], width: 256, height: 256, url: '/stickers/student_reactions/all_nighter.svg' },
        { id: 'topper_notes', name: 'Topper Notes', file: '/stickers/student_reactions/topper_notes.svg', tags: ['topper', 'notes', '100', 'a+'], width: 256, height: 256, url: '/stickers/student_reactions/topper_notes.svg' },
        { id: 'deadline_sweat', name: 'Deadline Sweat', file: '/stickers/student_reactions/deadline_sweat.svg', tags: ['deadline', 'submission', 'hurry'], width: 256, height: 256, url: '/stickers/student_reactions/deadline_sweat.svg' },
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
        id: 'hackerman_matrix',
        title: 'Hackerman Coding in Matrix',
        category: 'coding',
        url: 'https://media.giphy.com/media/YQitE4YNQNahy/giphy.gif',
        preview_url: 'https://media.giphy.com/media/YQitE4YNQNahy/200w.gif',
        width: 480,
        height: 270,
        aspect_ratio: 1.77,
        tags: ['hackerman', 'code', 'typing', 'fast', 'matrix', 'coding'],
      },
      {
        id: 'developer_cat_typing',
        title: 'Cat typing code furiously',
        category: 'coding',
        url: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
        preview_url: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/200w.gif',
        width: 480,
        height: 360,
        aspect_ratio: 1.33,
        tags: ['cat', 'typing', 'coffee', 'dev', 'grind', 'keyboard'],
      },
      {
        id: 'mind_blown_reaction',
        title: 'Mind Blown Galaxy Explosion',
        category: 'reactions',
        url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
        preview_url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/200w.gif',
        width: 480,
        height: 270,
        aspect_ratio: 1.77,
        tags: ['mind', 'blown', 'galaxy', 'explosion', 'wow', 'reactions'],
      },
      {
        id: 'celebrate_party_confetti',
        title: 'Success Confetti Celebration',
        category: 'celebration',
        url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
        preview_url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/200w.gif',
        width: 480,
        height: 270,
        aspect_ratio: 1.77,
        tags: ['celebrate', 'party', 'win', 'shipped', 'done', 'celebration'],
      },
      {
        id: 'coding_coffee_grind',
        title: 'Continuous Coffee Coding',
        category: 'coding',
        url: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif',
        preview_url: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/200w.gif',
        width: 480,
        height: 270,
        aspect_ratio: 1.77,
        tags: ['coffee', 'morning', 'code', 'grind', 'debug'],
      },
      {
        id: 'this_is_fine_dog',
        title: 'This Is Fine Room on Fire',
        category: 'reactions',
        url: 'https://media.giphy.com/media/9M5jK4GXmD5o1irGrF/giphy.gif',
        preview_url: 'https://media.giphy.com/media/9M5jK4GXmD5o1irGrF/200w.gif',
        width: 480,
        height: 270,
        aspect_ratio: 1.77,
        tags: ['fine', 'fire', 'prod', 'bug', 'chaos', 'reactions'],
      },
    ],
  };
}
