// frontend/src/utils/videoEmbed.js

export function detectPlatform(url) {
  if (!url) return null;
  if (/youtu\.be|youtube\.com/i.test(url))    return 'youtube';
  if (/instagram\.com/i.test(url))            return 'instagram';
  if (/twitter\.com|x\.com/i.test(url))       return 'twitter';
  if (/vimeo\.com/i.test(url))                return 'vimeo';
  if (/tiktok\.com/i.test(url))               return 'tiktok';
  return 'direct';
}

export function toYouTubeEmbed(url, autoplay = false) {
  if (!url) return null;
  const autoplayParam = autoplay ? '&autoplay=1' : '';
  const base = `?rel=0&modestbranding=1${autoplayParam}`;
  const shortLink  = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (shortLink)  return `https://www.youtube.com/embed/${shortLink[1]}${base}`;
  const shortsPage = url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/);
  if (shortsPage) return `https://www.youtube.com/embed/${shortsPage[1]}${base}`;
  const standard   = url.match(/youtube\.com\/(?:watch\?v=|embed\/)([A-Za-z0-9_-]{11})/);
  if (standard)   return `https://www.youtube.com/embed/${standard[1]}${base}`;
  return null;
}

export function toInstagramEmbed(url) {
  if (!url) return null;
  const reel = url.match(/instagram\.com\/reels?\/([A-Za-z0-9_-]+)/);
  if (reel) return `https://www.instagram.com/reel/${reel[1]}/embed/captioned/`;
  const post = url.match(/instagram\.com\/p\/([A-Za-z0-9_-]+)/);
  if (post) return `https://www.instagram.com/p/${post[1]}/embed/captioned/`;
  return null;
}

export function toVimeoEmbed(url, autoplay = false) {
  if (!url) return null;
  const m = url.match(/vimeo\.com\/(\d+)/);
  if (!m) return null;
  return `https://player.vimeo.com/video/${m[1]}?title=0&byline=0&portrait=0${autoplay ? '&autoplay=1' : ''}`;
}

export function getEmbedUrl(video, autoplay = false) {
  const platform = video.source_platform || detectPlatform(video.source_url || video.video_url);
  const rawUrl   = video.source_url || video.video_url;
  if (platform === 'youtube')   return toYouTubeEmbed(rawUrl, autoplay);
  if (platform === 'instagram') return toInstagramEmbed(rawUrl);
  if (platform === 'vimeo')     return toVimeoEmbed(rawUrl, autoplay);
  return null;
}

export function isDirectVideo(url) {
  if (!url) return false;
  // ── Added .m3u8 for HLS manifests from CDN
  return /\.(mp4|webm|ogg|mov|m4v|m3u8)(\?|$)/i.test(url);
}

export function isHLS(url) {
  if (!url) return false;
  return /\.m3u8(\?|$)/i.test(url);
}
