/**
 * CPA S3 Media Client & Tenor GIF Integration
 * Manages loading sticker manifests from S3/CDN, preloading assets,
 * and querying curated S3 GIFs and Tenor v2 GIF search with caching.
 */

import { preloadStickers } from './stickerPreloader.js';

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
  return (
    process.env.NEXT_PUBLIC_STICKER_CDN_URL ||
    (process.env.NEXT_PUBLIC_CDN_URL
      ? `${process.env.NEXT_PUBLIC_CDN_URL.replace(/\/$/, '')}/stickers`
      : 'https://cdn.codeplusacademy.in/stickers')
  );
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

  // Already absolute or browser data/blob URL -> return untouched to prevent double-prefixing
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }

  const cdn = (base || getStickerCdnBase() || '/stickers').replace(/\/$/, '');

  // Strip leading /stickers/ or stickers/ prefix to avoid double folder segments
  if (url.startsWith('/stickers/')) {
    return `${cdn}/${url.slice('/stickers/'.length)}`;
  }
  if (url.startsWith('stickers/')) {
    return `${cdn}/${url.slice('stickers/'.length)}`;
  }

  return `${cdn}/${url.replace(/^\//, '')}`;
}

/**
 * Fetch Sticker Packs Manifest from S3/CDN with Local Fallback
 */
export async function fetchStickerPacks() {
  const cdnBase = getStickerCdnBase();
  const manifestUrl = cdnBase ? `${cdnBase}/manifest.json` : '/stickers/manifest.json';

  let data = null;
  try {
    const res = await fetch(manifestUrl, { cache: 'force-cache' });
    if (!res.ok) throw new Error(`Failed to fetch sticker manifest: ${res.status}`);
    data = await res.json();
  } catch {
    // If CDN fails or is blocked by CORS in the browser, fallback to same-origin /stickers/manifest.json
    try {
      const localRes = await fetch('/stickers/manifest.json');
      if (localRes.ok) {
        data = await localRes.json();
      }
    } catch {}
  }

  if (data && data.packs && data.packs.length > 0) {
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
  }

  return getFallbackStickerPacks();
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
      id: 'doremon',
      name: '🐱 Doremon Vibes (डेलुलु & Harami)',
      icon: '/stickers/doremon/310b0512-8856-4475-9c98-3eed255a26fd.webp',
      stickers: [
        { id: 'doremon_harami_mon', name: 'Harami mon 😈', file: '/stickers/doremon/310b0512-8856-4475-9c98-3eed255a26fd.webp', url: '/stickers/doremon/310b0512-8856-4475-9c98-3eed255a26fd.webp', tags: ["doremon","doraemon","harami","harami mon","evil","grin"], width: 1254, height: 1254 },
        { id: 'doremon_bangalimon', name: 'बंगालीmon 😁', file: '/stickers/doremon/2814c750-c8bf-4573-8d0e-d257e25c7f5e.webp', url: '/stickers/doremon/2814c750-c8bf-4573-8d0e-d257e25c7f5e.webp', tags: ["doremon","doraemon","bangali","bangalimon","smile","happy"], width: 1254, height: 1254 },
        { id: 'doremon_delulu_mon', name: 'डेलुलु-mon 📢', file: '/stickers/doremon/430547e2-f356-47cf-adf7-b2b119fc6cc5.webp', url: '/stickers/doremon/430547e2-f356-47cf-adf7-b2b119fc6cc5.webp', tags: ["doremon","doraemon","delulu","delulu-mon","screaming","gaming"], width: 1254, height: 1254 },
        { id: 'doremon_gentlemon', name: 'GentleMon 🤵', file: '/stickers/doremon/a51d301d-b9f0-4ac6-8cd3-e2fdae63a6c9.webp', url: '/stickers/doremon/a51d301d-b9f0-4ac6-8cd3-e2fdae63a6c9.webp', tags: ["doremon","doraemon","gentlemon","gentleman","suit","tuxedo"], width: 1254, height: 1254 },
        { id: 'doremon_sharmate_mon', name: 'शर्मातेmon 🥰', file: '/stickers/doremon/a747a001-1985-4bc3-a8c9-1dae19ea1b42.webp', url: '/stickers/doremon/a747a001-1985-4bc3-a8c9-1dae19ea1b42.webp', tags: ["doremon","doraemon","sharmate","blush","shy","cute"], width: 1254, height: 1254 },
        { id: 'doremon_padhaku_mon', name: 'पढ़ाकुmon 📖', file: '/stickers/doremon/b8daee94-2df6-4027-837f-4b1b14905ca4.webp', url: '/stickers/doremon/b8daee94-2df6-4027-837f-4b1b14905ca4.webp', tags: ["doremon","doraemon","padhaku","study","exam","book"], width: 1254, height: 1254 },
        { id: 'doremon_tharkimon', name: 'tharkimon 😏', file: '/stickers/doremon/cd0e4108-41d4-4524-967f-9969c0e1c61f.webp', url: '/stickers/doremon/cd0e4108-41d4-4524-967f-9969c0e1c61f.webp', tags: ["doremon","doraemon","tharki","tharkimon","smirk","side eye"], width: 1254, height: 1254 },
        { id: 'doremon_ninnimon', name: 'Ninnimon 😴', file: '/stickers/doremon/eddad4ce-e8e1-4700-a04d-2d3e9fdb0ecf.webp', url: '/stickers/doremon/eddad4ce-e8e1-4700-a04d-2d3e9fdb0ecf.webp', tags: ["doremon","doraemon","ninnimon","ninni","sleep","pillow"], width: 1235, height: 1274 },
        { id: 'doremon_neele_racoon', name: 'Hatt Ja Neele Racoon 🦝', file: '/stickers/doremon/1027175c-c52c-4768-b0b9-dafc1919d7b8.webp', url: '/stickers/doremon/1027175c-c52c-4768-b0b9-dafc1919d7b8.webp', tags: ["doremon","doraemon","nobita","racoon","neele racoon","hatt ja"], width: 1254, height: 1254 },
        { id: 'doremon_raddimon', name: 'रद्दीmon 📰', file: '/stickers/doremon/108201a6-b4df-4448-a1b2-40ef808cf063.webp', url: '/stickers/doremon/108201a6-b4df-4448-a1b2-40ef808cf063.webp', tags: ["doremon","doraemon","raddi","raddimon","newspaper","box"], width: 1216, height: 1294 },
        { id: 'doremon_achi_bivi', name: 'Padhai Likhai Krunga 📖', file: '/stickers/doremon/19dbc0b6-ccd5-41ce-8cf3-cfb74e99fe3e.webp', url: '/stickers/doremon/19dbc0b6-ccd5-41ce-8cf3-cfb74e99fe3e.webp', tags: ["doremon","doraemon","study","padhai","achi bivi","exam"], width: 1254, height: 1254 },
        { id: 'doremon_motemon', name: 'मोटे-mon 😗', file: '/stickers/doremon/1d6b3e9a-6660-4d18-8d08-f884478e84a1.webp', url: '/stickers/doremon/1d6b3e9a-6660-4d18-8d08-f884478e84a1.webp', tags: ["doremon","doraemon","mote","motemon","fat","chubby"], width: 1209, height: 1301 },
        { id: 'doremon_devi_prasad', name: 'Devi Prasad Ghar Pe Hai? 📞', file: '/stickers/doremon/21959dff-d727-45cb-90fe-a9e9877ab8c2.webp', url: '/stickers/doremon/21959dff-d727-45cb-90fe-a9e9877ab8c2.webp', tags: ["doremon","doraemon","devi prasad","phone","call","hera pheri"], width: 1254, height: 1254 },
        { id: 'doremon_teri_shadi', name: 'Teri Shadi Ka Kya Hua? 👰', file: '/stickers/doremon/2767c879-07e0-404b-959d-62ef2667496b.webp', url: '/stickers/doremon/2767c879-07e0-404b-959d-62ef2667496b.webp', tags: ["doremon","oggy","cockroach","shadi","wedding","single"], width: 1254, height: 1254 },
        { id: 'doremon_sherni_ki_dahaad', name: 'Sherni ki Dahaad 🦁', file: '/stickers/doremon/2fbf25b0-4f1f-4a81-aab5-63d4dc73ae13.webp', url: '/stickers/doremon/2fbf25b0-4f1f-4a81-aab5-63d4dc73ae13.webp', tags: ["doremon","doraemon","nobita","mom","scolding","sherni"], width: 1379, height: 1141 },
        { id: 'doremon_kapti_insan', name: 'Kapti Insan 😈', file: '/stickers/doremon/3792f21e-a333-48c6-b840-f1593f03a19c.webp', url: '/stickers/doremon/3792f21e-a333-48c6-b840-f1593f03a19c.webp', tags: ["doremon","oggy","cockroach","joey","kapti","evil"], width: 1312, height: 1199 },
        { id: 'doremon_bhondu', name: 'Mein Toh Hun Hi Bhondu 🌇', file: '/stickers/doremon/393b7e59-777b-4578-83e9-915694ed23be.webp', url: '/stickers/doremon/393b7e59-777b-4578-83e9-915694ed23be.webp', tags: ["doremon","doraemon","bhondu","sunset","sad","alone"], width: 1254, height: 1254 },
        { id: 'doremon_acha_esa_kya', name: 'Acha Esa Kya! 😲', file: '/stickers/doremon/3c855061-fedd-4446-b40d-5b7e7d74a21b.webp', url: '/stickers/doremon/3c855061-fedd-4446-b40d-5b7e7d74a21b.webp', tags: ["doremon","doraemon","acha esa kya","really","gossip","surprise"], width: 1536, height: 1024 },
        { id: 'doremon_thodi_badmoshi', name: 'Thodi Badmoshi Hojaye 😈', file: '/stickers/doremon/46b0fa32-f32f-4a9b-ab4c-728564648060.webp', url: '/stickers/doremon/46b0fa32-f32f-4a9b-ab4c-728564648060.webp', tags: ["doremon","doraemon","badmoshi","evil grin","naughty","scheming"], width: 1254, height: 1254 },
        { id: 'doremon_financial_status', name: 'Financial Status Y\'all 💸', file: '/stickers/doremon/51c5a634-1bef-4a01-9542-9d66c53d8b03.webp', url: '/stickers/doremon/51c5a634-1bef-4a01-9542-9d66c53d8b03.webp', tags: ["doremon","doraemon","money","rupees","broke","empty wallet"], width: 1254, height: 1254 },
        { id: 'doremon_emotional_krdiya', name: 'Emotional Krdia Tune 🥺', file: '/stickers/doremon/563ecfe5-3baf-4b23-9e6d-f00b8720531c.webp', url: '/stickers/doremon/563ecfe5-3baf-4b23-9e6d-f00b8720531c.webp', tags: ["doremon","doraemon","emotional","crying","tears","wholesome"], width: 1254, height: 1254 },
        { id: 'doremon_sunimon', name: 'सुनिmon 😏', file: '/stickers/doremon/6231681e-5d3a-4bac-9a9e-4a9f647e7718.webp', url: '/stickers/doremon/6231681e-5d3a-4bac-9a9e-4a9f647e7718.webp', tags: ["doremon","doraemon","sunio","sunimon","smug","attitude"], width: 1316, height: 1195 },
        { id: 'doremon_theplamon', name: 'थेपला mon 🥱', file: '/stickers/doremon/69afff23-9ab9-4fd6-ba7e-f55fa597bf16.webp', url: '/stickers/doremon/69afff23-9ab9-4fd6-ba7e-f55fa597bf16.webp', tags: ["doremon","doraemon","thepla","theplamon","tired","flat"], width: 1364, height: 1153 },
        { id: 'doremon_pata_chl_gya', name: 'Tujhe Kese Pata Chl Gya? 🤫', file: '/stickers/doremon/71956ff1-34b7-4dd7-81b8-acf78c1d4ce3.webp', url: '/stickers/doremon/71956ff1-34b7-4dd7-81b8-acf78c1d4ce3.webp', tags: ["doremon","doraemon","secret","exposed","caught","guilty"], width: 1254, height: 1254 },
        { id: 'doremon_instagram_blocked', name: 'Instagram User Not Found 🚫', file: '/stickers/doremon/766e2c7c-6b49-4b7f-b6fb-da9fe9373eed.webp', url: '/stickers/doremon/766e2c7c-6b49-4b7f-b6fb-da9fe9373eed.webp', tags: ["doremon","oggy","instagram","blocked","user not found","heartbreak"], width: 1312, height: 1199 },
        { id: 'doremon_gusse_mon', name: 'गुस्से mon 💢', file: '/stickers/doremon/84141798-78ae-4cf9-ac0c-2cdd7a34d170.webp', url: '/stickers/doremon/84141798-78ae-4cf9-ac0c-2cdd7a34d170.webp', tags: ["doremon","doraemon","angry","gussa","mad","clenched teeth"], width: 1234, height: 1275 },
        { id: 'doremon_kya_baat_krdi', name: 'Ye Kya Baat Krdi Aapne!? 😱', file: '/stickers/doremon/861639f6-ad2c-4691-aa99-a6174b1ba5a4.webp', url: '/stickers/doremon/861639f6-ad2c-4691-aa99-a6174b1ba5a4.webp', tags: ["doremon","doraemon","nobita","shock","ye kya baat","hands up"], width: 1536, height: 1024 },
        { id: 'doremon_kya_he_bolu', name: 'Ab Isme Mai Kya He Bolu 🤷', file: '/stickers/doremon/9e79a457-4825-4524-b828-fb8a33ac8794.webp', url: '/stickers/doremon/9e79a457-4825-4524-b828-fb8a33ac8794.webp', tags: ["doremon","doraemon","speechless","confused","scratch head","no comments"], width: 1254, height: 1254 },
        { id: 'doremon_me_core', name: 'Me Core 📺', file: '/stickers/doremon/a5ced02b-94a3-4a79-8045-0a1bd7354ee0.webp', url: '/stickers/doremon/a5ced02b-94a3-4a79-8045-0a1bd7354ee0.webp', tags: ["doremon","doraemon","me core","lazy","tv","chilling"], width: 1536, height: 1024 },
        { id: 'doremon_pinjde_mon', name: 'पिंजड़े mon 🪤', file: '/stickers/doremon/a7a0608e-148f-447d-81ee-3209089e9c3c.webp', url: '/stickers/doremon/a7a0608e-148f-447d-81ee-3209089e9c3c.webp', tags: ["doremon","doraemon","pinjra","cage","trapped","jail"], width: 1316, height: 1195 },
        { id: 'doremon_matter_ho_gaya', name: 'Matter Ho Gaya 🚨', file: '/stickers/doremon/cf517aa2-346f-42fd-95d4-cee426ed7118.webp', url: '/stickers/doremon/cf517aa2-346f-42fd-95d4-cee426ed7118.webp', tags: ["doremon","doraemon","nobita","gian","sunio","lafda"], width: 1451, height: 1084 },
        { id: 'doremon_born_to_forced_to', name: 'Born To / Forced To 🥀', file: '/stickers/doremon/d3a78fc2-5ab4-41e4-bdc9-4364db37ed7c.webp', url: '/stickers/doremon/d3a78fc2-5ab4-41e4-bdc9-4364db37ed7c.webp', tags: ["doremon","shinchan","born to","forced to","romance","study"], width: 1199, height: 1312 },
        { id: 'doremon_party_deta_hu', name: 'Idhar Aa Tujhe Party Deta Hu 🚪', file: '/stickers/doremon/db479fac-ef57-473e-aa55-a9e4b01b6162.webp', url: '/stickers/doremon/db479fac-ef57-473e-aa55-a9e4b01b6162.webp', tags: ["doremon","doraemon","party deta hu","peeking","door","trap"], width: 1343, height: 1171 },
        { id: 'doremon_level_dekh', name: 'Level Dekh K Baat Kr Lala 💅', file: '/stickers/doremon/e3921b6c-233c-43de-8dc4-375b51620992.webp', url: '/stickers/doremon/e3921b6c-233c-43de-8dc4-375b51620992.webp', tags: ["doremon","doraemon","shizuka","nobita","level sabke niklenge","flex"], width: 1254, height: 1254 },
        { id: 'doremon_khana_do', name: 'Advice Nhi Khana Do 🍲', file: '/stickers/doremon/e89fee65-33fc-4631-bfcc-8e584bfc1259.webp', url: '/stickers/doremon/e89fee65-33fc-4631-bfcc-8e584bfc1259.webp', tags: ["doremon","doraemon","khana do","hungry","bowl","bhukhad"], width: 1188, height: 1324 },
        { id: 'doremon_refurbished_iphone', name: 'Refurbished iPhone Lelete H 📱', file: '/stickers/doremon/f8450505-58ec-4049-9dad-f8bbd7607372.webp', url: '/stickers/doremon/f8450505-58ec-4049-9dad-f8bbd7607372.webp', tags: ["doremon","oggy","iphone","refurbished","poor","beat up"], width: 1536, height: 1024 },
        { id: 'doremon_reacted_to_message', name: 'Reacted To Your Message 🤪', file: '/stickers/doremon/fb716cb8-7719-462b-a006-bf87664e0369.webp', url: '/stickers/doremon/fb716cb8-7719-462b-a006-bf87664e0369.webp', tags: ["doremon","shinchan","reacted","funny face","tongue","stretch face"], width: 1254, height: 1254 },
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
  ].map((pack) => ({
    ...pack,
    icon: canonicalizeStickerUrl(pack.icon),
    stickers: (pack.stickers || []).map((st) => ({
      ...st,
      file: canonicalizeStickerUrl(st.file),
      url: canonicalizeStickerUrl(st.url || st.file),
    })),
  }));
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
