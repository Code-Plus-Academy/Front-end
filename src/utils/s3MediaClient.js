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
const MAX_RECENT_STICKERS = 50;

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
 * Known sticker file aliases / legacy key mappings
 */
export const STICKER_ALIASES = {
  '236c5357-19aa-4856-bb66-6dbf6236b28b.webp': '294c1da1-e1d9-47d7-932d-e3b40159bd05.webp',
  'marathi_one_night_enough.png': 'exam_mode/294c1da1-e1d9-47d7-932d-e3b40159bd05.webp',
};

/**
 * Resolve any legacy or aliased sticker path to canonical URL
 */
export function canonicalizeStickerUrl(rawUrl, base = '') {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl || '';
  let url = rawUrl;
  for (const [legacyKey, target] of Object.entries(STICKER_ALIASES)) {
    if (url.includes(legacyKey)) {
      url = url.replace(legacyKey, target);
    }
  }
  if (url.startsWith('http') || url.startsWith('/')) {
    return url;
  }
  const cdn = base || getStickerCdnBase() || '/stickers';
  return `${cdn.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
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
        url: canonicalizeStickerUrl(st.file || st.url, base),
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
const MAX_RECENT_GIFS = 50;

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
    const filtered = current.filter((s) => s.url !== sticker.url && s.id !== sticker.id && s.sticker_id !== sticker.sticker_id);
    const updated = [sticker, ...filtered].slice(0, MAX_RECENT_STICKERS);
    localStorage.setItem(RECENT_STICKERS_KEY, JSON.stringify(updated));
  } catch {}
}

export function removeRecentSticker(identifier) {
  if (typeof window === 'undefined' || !identifier) return [];
  try {
    const current = getRecentStickers();
    const updated = current.filter((s) => s.id !== identifier && s.url !== identifier && s.sticker_id !== identifier);
    localStorage.setItem(RECENT_STICKERS_KEY, JSON.stringify(updated));
    return updated;
  } catch {}
  return [];
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
    const filtered = current.filter((g) => g.url !== gif.url && g.id !== gif.id && g.gif_id !== gif.gif_id);
    const updated = [gif, ...filtered].slice(0, MAX_RECENT_GIFS);
    localStorage.setItem(RECENT_GIFS_KEY, JSON.stringify(updated));
  } catch {}
}

export function removeRecentGif(identifier) {
  if (typeof window === 'undefined' || !identifier) return [];
  try {
    const current = getRecentGifs();
    const updated = current.filter((g) => g.id !== identifier && g.url !== identifier && g.gif_id !== identifier);
    localStorage.setItem(RECENT_GIFS_KEY, JSON.stringify(updated));
    return updated;
  } catch {}
  return [];
}

/**
 * Built-in Fallback Sticker Packs (Complete Dev & Student Suite)
 */
function getFallbackStickerPacks() {
  return [
    {
      id: 'cid_unfiltered',
      name: '🔍 CID Unfiltered',
      icon: '/stickers/cid_unfiltered/pack_icon.png',
      stickers: [
        { id: 'cid_behenchod', name: 'Behenchod!', file: '/stickers/cid_unfiltered/cid_behenchod.png', url: '/stickers/cid_unfiltered/cid_behenchod.png', tags: ['cid', 'acp', 'pradyuman', 'behenchod', 'angry', 'meme'], width: 168, height: 164 },
        { id: 'cid_ek_ge_rapta', name: 'Ek Ge Rapta Marunga', file: '/stickers/cid_unfiltered/cid_ek_ge_rapta.png', url: '/stickers/cid_unfiltered/cid_ek_ge_rapta.png', tags: ['cid', 'acp', 'pradyuman', 'rapta', 'slap', 'threat', 'meme'], width: 183, height: 159 },
        { id: 'cid_khelne_kudne', name: 'Khelne Kudne Ki Umar', file: '/stickers/cid_unfiltered/cid_khelne_kudne.png', url: '/stickers/cid_unfiltered/cid_khelne_kudne.png', tags: ['cid', 'acp', 'pradyuman', 'khelne', 'umar', 'taunt', 'meme'], width: 194, height: 168 },
        { id: 'cid_kuch_toh_gadbad_hai', name: 'Kuch Toh Gadbad Hai', file: '/stickers/cid_unfiltered/cid_kuch_toh_gadbad_hai.png', url: '/stickers/cid_unfiltered/cid_kuch_toh_gadbad_hai.png', tags: ['cid', 'acp', 'pradyuman', 'gadbad', 'suspicious', 'detective', 'meme'], width: 160, height: 167 },
        { id: 'cid_kyu_re_mc', name: 'Kyu Re Mc?', file: '/stickers/cid_unfiltered/cid_kyu_re_mc.png', url: '/stickers/cid_unfiltered/cid_kyu_re_mc.png', tags: ['cid', 'daya', 'mc', 'sunglasses', 'swag', 'meme'], width: 157, height: 165 },
        { id: 'cid_mujhe_sab_samajh_aa_raha', name: 'Mujhe Sab Samajh Aa Raha Hai', file: '/stickers/cid_unfiltered/cid_mujhe_sab_samajh_aa_raha.png', url: '/stickers/cid_unfiltered/cid_mujhe_sab_samajh_aa_raha.png', tags: ['cid', 'abhijeet', 'idea', 'smart', 'lightbulb', 'meme'], width: 176, height: 168 },
        { id: 'cid_ye_kya_dekh_raha_hu', name: 'Ye Kya Dekh Raha Hu Main?', file: '/stickers/cid_unfiltered/cid_ye_kya_dekh_raha_hu.png', url: '/stickers/cid_unfiltered/cid_ye_kya_dekh_raha_hu.png', tags: ['cid', 'acp', 'pradyuman', 'confused', 'shocked', 'meme'], width: 188, height: 164 },
        { id: 'cid_kya_bakwas_hai_ye', name: 'Kya Bakwas Hai Ye?', file: '/stickers/cid_unfiltered/cid_kya_bakwas_hai_ye.png', url: '/stickers/cid_unfiltered/cid_kya_bakwas_hai_ye.png', tags: ['cid', 'daya', 'bakwas', 'nonsense', 'angry', 'meme'], width: 169, height: 171 },
        { id: 'cid_daal_mein_kuch_kaala', name: 'Daal Mein Kuch Kaala Hai', file: '/stickers/cid_unfiltered/cid_daal_mein_kuch_kaala.png', url: '/stickers/cid_unfiltered/cid_daal_mein_kuch_kaala.png', tags: ['cid', 'acp', 'pradyuman', 'daal', 'kaala', 'doubt', 'meme'], width: 172, height: 153 },
        { id: 'cid_wah_kya_scene_hai', name: 'Wah! Kya Scene Hai!', file: '/stickers/cid_unfiltered/cid_wah_kya_scene_hai.png', url: '/stickers/cid_unfiltered/cid_wah_kya_scene_hai.png', tags: ['cid', 'daya', 'clapping', 'scene', 'sarcasm', 'meme'], width: 167, height: 158 },
        { id: 'cid_hosh_me_ayo_abhijeet', name: 'Hosh Me Ayo Abhijeet!', file: '/stickers/cid_unfiltered/cid_hosh_me_ayo_abhijeet.png', url: '/stickers/cid_unfiltered/cid_hosh_me_ayo_abhijeet.png', tags: ['cid', 'abhijeet', 'hoodie', 'hosh', 'depressed', 'meme'], width: 164, height: 164 },
        { id: 'cid_bhai_tu_kar_kya_raha', name: 'Bhai Tu Kar Kya Raha Hai?', file: '/stickers/cid_unfiltered/cid_bhai_tu_kar_kya_raha.png', url: '/stickers/cid_unfiltered/cid_bhai_tu_kar_kya_raha.png', tags: ['cid', 'abhijeet', 'annoyed', 'frustrated', 'bhai', 'meme'], width: 167, height: 166 },
        { id: 'cid_ye_nahi_ho_sakta', name: 'Ye Nahi Ho Sakta!', file: '/stickers/cid_unfiltered/cid_ye_nahi_ho_sakta.png', url: '/stickers/cid_unfiltered/cid_ye_nahi_ho_sakta.png', tags: ['cid', 'abhijeet', 'impossible', 'shock', 'denial', 'meme'], width: 170, height: 165 },
        { id: 'cid_saboot_kahan_hai', name: 'Saboot Kahan Hai?', file: '/stickers/cid_unfiltered/cid_saboot_kahan_hai.png', url: '/stickers/cid_unfiltered/cid_saboot_kahan_hai.png', tags: ['cid', 'acp', 'pradyuman', 'saboot', 'proof', 'evidence', 'meme'], width: 190, height: 160 },
        { id: 'cid_bhai_sahab', name: 'Bhai Sahab!', file: '/stickers/cid_unfiltered/cid_bhai_sahab.png', url: '/stickers/cid_unfiltered/cid_bhai_sahab.png', tags: ['cid', 'acp', 'pradyuman', 'bhai sahab', 'sarcasm', 'smirk', 'meme'], width: 171, height: 163 },
        { id: 'cid_abey_o', name: 'Abey O!', file: '/stickers/cid_unfiltered/cid_abey_o.png', url: '/stickers/cid_unfiltered/cid_abey_o.png', tags: ['cid', 'acp', 'pradyuman', 'abey o', 'warning', 'rage', 'meme'], width: 170, height: 172 },
        { id: 'cid_kya_hi_bolu_ab', name: 'Kya Hi Bolu Ab...', file: '/stickers/cid_unfiltered/cid_kya_hi_bolu_ab.png', url: '/stickers/cid_unfiltered/cid_kya_hi_bolu_ab.png', tags: ['cid', 'abhijeet', 'speechless', 'quiet', 'meme'], width: 171, height: 164 },
        { id: 'cid_dimaag_kharab_kar_diya', name: 'Dimaag Kharab Kar Diya!', file: '/stickers/cid_unfiltered/cid_dimaag_kharab_kar_diya.png', url: '/stickers/cid_unfiltered/cid_dimaag_kharab_kar_diya.png', tags: ['cid', 'fredricks', 'freddy', 'dimaag', 'screaming', 'meme'], width: 168, height: 163 },
        { id: 'cid_kya_chakkar_hai', name: 'Kya Chakkar Hai!?', file: '/stickers/cid_unfiltered/cid_kya_chakkar_hai.png', url: '/stickers/cid_unfiltered/cid_kya_chakkar_hai.png', tags: ['cid', 'team', 'daya', 'abhijeet', 'acp', 'investigation', 'meme'], width: 199, height: 166 },
        { id: 'cid_case_solved', name: 'Case Solved!', file: '/stickers/cid_unfiltered/cid_case_solved.png', url: '/stickers/cid_unfiltered/cid_case_solved.png', tags: ['cid', 'acp', 'pradyuman', 'case solved', 'success', 'winner', 'meme'], width: 203, height: 168 },
        { id: 'cid_masti_dekho_bc', name: 'Masti Dekho BC', file: '/stickers/cid_unfiltered/cid_masti_dekho_bc.png', url: '/stickers/cid_unfiltered/cid_masti_dekho_bc.png', tags: ['cid', 'daya', 'abhijeet', 'car', 'masti', 'driving', 'meme'], width: 177, height: 168 },
        { id: 'cid_arey_yaar', name: 'Arey Yaar...', file: '/stickers/cid_unfiltered/cid_arey_yaar.png', url: '/stickers/cid_unfiltered/cid_arey_yaar.png', tags: ['cid', 'sachin', 'arey yaar', 'sad', 'facepalm', 'meme'], width: 155, height: 161 },
        { id: 'cid_bas_kar_bhai', name: 'Bas Kar Bhai!', file: '/stickers/cid_unfiltered/cid_bas_kar_bhai.png', url: '/stickers/cid_unfiltered/cid_bas_kar_bhai.png', tags: ['cid', 'acp', 'pradyuman', 'bas kar', 'headache', 'done', 'meme'], width: 165, height: 177 },
        { id: 'cid_pakde_gaye', name: 'Pakde Gaye!', file: '/stickers/cid_unfiltered/cid_pakde_gaye.png', url: '/stickers/cid_unfiltered/cid_pakde_gaye.png', tags: ['cid', 'acp', 'pradyuman', 'arrest', 'handcuffs', 'caught', 'meme'], width: 160, height: 164 },
      ],
    },
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
