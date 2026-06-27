// frontend/src/utils/videoEmbed.js
// Shared video-embed helpers used by VideoShortsRow and VideoDetailPage.
// Single source of truth — edit here, not in either component.

/**
 * Detect the hosting platform from a URL string.
 * Returns: 'youtube' | 'instagram' | 'twitter' | 'vimeo' | 'tiktok' | 'direct' | null
 */
export function detectPlatform(url) {
  if (!url) return null;
  if (/youtu\.be|youtube\.com/i.test(url))    return 'youtube';
  if (/instagram\.com/i.test(url))            return 'instagram';
  if (/twitter\.com|x\.com/i.test(url))       return 'twitter';
  if (/vimeo\.com/i.test(url))                return 'vimeo';
  if (/tiktok\.com/i.test(url))               return 'tiktok';
  return 'direct';
}

/**
 * Convert any YouTube URL to an embed URL.
 * Handles:
 *   - youtu.be/ID
 *   - youtube.com/watch?v=ID
 *   - youtube.com/embed/ID
 *   - youtube.com/shorts/ID
 *
 * @param {string} url
 * @param {boolean} [autoplay=false]
 * @returns {string|null}
 */
export function toYouTubeEmbed(url, autoplay = false) {
  if (!url) return null;

  const autoplayParam = autoplay ? '&autoplay=1' : '';
  const base = `?rel=0&modestbranding=1${autoplayParam}`;

  // youtu.be/ID
  const shortLink = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (shortLink) return `https://www.youtube.com/embed/${shortLink[1]}${base}`;

  // youtube.com/shorts/ID
  const shortsPage = url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/);
  if (shortsPage) return `https://www.youtube.com/embed/${shortsPage[1]}${base}`;

  // youtube.com/watch?v=ID  or  youtube.com/embed/ID
  const standard = url.match(/youtube\.com\/(?:watch\?v=|embed\/)([A-Za-z0-9_-]{11})/);
  if (standard) return `https://www.youtube.com/embed/${standard[1]}${base}`;

  return null;
}

/**
 * Convert an Instagram Reel or Post URL to an embed URL.
 *
 * Instagram supports embedding via:
 *   https://www.instagram.com/reel/{shortcode}/embed/
 *   https://www.instagram.com/p/{shortcode}/embed/
 *
 * Note: Instagram embeds do NOT support autoplay — the param is ignored.
 * The embed renders Instagram's native player with controls.
 *
 * @param {string} url
 * @returns {string|null}
 */
export function toInstagramEmbed(url) {
  if (!url) return null;

  // instagram.com/reel/SHORTCODE  or  instagram.com/reels/SHORTCODE
  const reel = url.match(/instagram\.com\/reels?\/([A-Za-z0-9_-]+)/);
  if (reel) return `https://www.instagram.com/reel/${reel[1]}/embed/captioned/`;

  // instagram.com/p/SHORTCODE  (regular post / video)
  const post = url.match(/instagram\.com\/p\/([A-Za-z0-9_-]+)/);
  if (post) return `https://www.instagram.com/p/${post[1]}/embed/captioned/`;

  return null;
}

/**
 * Convert a Vimeo URL to an embed URL.
 *
 * @param {string} url
 * @param {boolean} [autoplay=false]
 * @returns {string|null}
 */
export function toVimeoEmbed(url, autoplay = false) {
  if (!url) return null;
  const m = url.match(/vimeo\.com\/(\d+)/);
  if (!m) return null;
  const autoplayParam = autoplay ? '&autoplay=1' : '';
  return `https://player.vimeo.com/video/${m[1]}?title=0&byline=0&portrait=0${autoplayParam}`;
}

/**
 * Return the best embed URL for a video object, or null if not embeddable.
 * Respects video.source_platform when present; falls back to URL detection.
 *
 * Instagram embeds use the source_url (original reel link) not video_url,
 * because video_url may just be the thumbnail or a CDN asset.
 *
 * @param {object} video
 * @param {boolean} [autoplay=false]
 * @returns {string|null}
 */
export function getEmbedUrl(video, autoplay = false) {
  const platform = video.source_platform || detectPlatform(video.source_url || video.video_url);
  const rawUrl   = video.source_url || video.video_url;

  if (platform === 'youtube')   return toYouTubeEmbed(rawUrl, autoplay);
  if (platform === 'instagram') return toInstagramEmbed(rawUrl); // autoplay not supported
  if (platform === 'vimeo')     return toVimeoEmbed(rawUrl, autoplay);
  return null;
}

/**
 * Return true if the URL looks like a directly playable video file.
 *
 * @param {string|null|undefined} url
 * @returns {boolean}
 */
export function isDirectVideo(url) {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url);
}
