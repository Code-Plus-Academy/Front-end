/**
 * FocusGram Centralized Media URL Classifier
 *
 * Implements strict classification and routing rules:
 * - Instagram /p/       -> 'social' (Media Post)
 * - Instagram /reel(s)/ -> 'video'  (Video Explorer)
 * - YouTube watch/shorts/youtu.be -> 'video' (Video Explorer)
 * - Direct video files  -> 'video'  (Video Explorer)
 * - Unsupported / Invalid -> returns isValid: false with explanatory error
 */

export function classifyMediaUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return {
      isValid: false,
      provider: null,
      type: null,
      mediaId: null,
      targetWorkflow: null,
      canonicalUrl: null,
      error: 'Please enter a URL.',
    };
  }

  const trimmed = inputUrl.trim();
  let parsedUrl;
  try {
    parsedUrl = new URL(trimmed);
  } catch (_) {
    // If lacks protocol, try prepending https://
    try {
      parsedUrl = new URL(`https://${trimmed}`);
    } catch (_) {
      return {
        isValid: false,
        provider: null,
        type: null,
        mediaId: null,
        targetWorkflow: null,
        canonicalUrl: null,
        error: 'Invalid URL format. Please check the address.',
      };
    }
  }

  const hostname = parsedUrl.hostname.toLowerCase().replace(/^(?:www\.|m\.)/, '');
  const pathname = parsedUrl.pathname;

  // ─── 1. Instagram ─────────────────────────────────────────────────────────────
  if (hostname === 'instagram.com' || hostname.endsWith('.instagram.com')) {
    // Instagram Post (/p/...) -> Media Post
    const pMatch = pathname.match(/^\/p\/([A-Za-z0-9_-]+)/i);
    if (pMatch) {
      const mediaId = pMatch[1];
      return {
        isValid: true,
        provider: 'instagram',
        type: 'post',
        mediaId,
        targetWorkflow: 'social',
        canonicalUrl: `https://www.instagram.com/p/${mediaId}/`,
        error: null,
      };
    }

    // Instagram Reel (/reel/... or /reels/...) -> Video Explorer
    const reelMatch = pathname.match(/^\/(?:reel|reels)\/([A-Za-z0-9_-]+)/i);
    if (reelMatch) {
      const mediaId = reelMatch[1];
      return {
        isValid: true,
        provider: 'instagram',
        type: 'reel',
        mediaId,
        targetWorkflow: 'video',
        canonicalUrl: `https://www.instagram.com/reel/${mediaId}/`,
        error: null,
      };
    }

    // Other Instagram paths (e.g. profiles, stories, explore)
    return {
      isValid: false,
      provider: 'instagram',
      type: 'unsupported',
      mediaId: null,
      targetWorkflow: null,
      canonicalUrl: null,
      error: 'Only Instagram Post (/p/...) and Reel (/reel/...) links are supported.',
    };
  }

  // ─── 2. YouTube ──────────────────────────────────────────────────────────────
  if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com') || hostname === 'youtu.be') {
    // YouTube Shorts: /shorts/VIDEO_ID
    const shortsMatch = pathname.match(/^\/shorts\/([A-Za-z0-9_-]{11})/i);
    if (shortsMatch) {
      const mediaId = shortsMatch[1];
      return {
        isValid: true,
        provider: 'youtube',
        type: 'short',
        mediaId,
        targetWorkflow: 'video',
        canonicalUrl: `https://www.youtube.com/shorts/${mediaId}`,
        error: null,
      };
    }

    // youtu.be/VIDEO_ID
    if (hostname === 'youtu.be') {
      const idMatch = pathname.match(/^\/([A-Za-z0-9_-]{11})/i);
      if (idMatch) {
        const mediaId = idMatch[1];
        return {
          isValid: true,
          provider: 'youtube',
          type: 'video',
          mediaId,
          targetWorkflow: 'video',
          canonicalUrl: `https://www.youtube.com/watch?v=${mediaId}`,
          error: null,
        };
      }
    }

    // youtube.com/watch?v=VIDEO_ID
    const vParam = parsedUrl.searchParams.get('v');
    if (vParam && /^[A-Za-z0-9_-]{11}$/.test(vParam)) {
      return {
        isValid: true,
        provider: 'youtube',
        type: 'video',
        mediaId: vParam,
        targetWorkflow: 'video',
        canonicalUrl: `https://www.youtube.com/watch?v=${vParam}`,
        error: null,
      };
    }

    // youtube.com/embed/VIDEO_ID
    const embedMatch = pathname.match(/^\/embed\/([A-Za-z0-9_-]{11})/i);
    if (embedMatch) {
      const mediaId = embedMatch[1];
      return {
        isValid: true,
        provider: 'youtube',
        type: 'video',
        mediaId,
        targetWorkflow: 'video',
        canonicalUrl: `https://www.youtube.com/watch?v=${mediaId}`,
        error: null,
      };
    }

    return {
      isValid: false,
      provider: 'youtube',
      type: 'unsupported',
      mediaId: null,
      targetWorkflow: null,
      canonicalUrl: null,
      error: 'Unsupported YouTube format. Use standard watch, shorts, or youtu.be links.',
    };
  }

  // ─── 3. Direct Video File ────────────────────────────────────────────────────
  if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(pathname)) {
    return {
      isValid: true,
      provider: 'direct',
      type: 'direct_video',
      mediaId: null,
      targetWorkflow: 'video',
      canonicalUrl: trimmed,
      error: null,
    };
  }

  // ─── 4. Unsupported Domain ───────────────────────────────────────────────────
  return {
    isValid: false,
    provider: 'unknown',
    type: 'unsupported',
    mediaId: null,
    targetWorkflow: null,
    canonicalUrl: null,
    error: 'Unsupported content. Please enter a valid Instagram post/reel or YouTube video link.',
  };
}
