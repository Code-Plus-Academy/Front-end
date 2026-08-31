/**
 * src/utils/overlayUrl.js
 * Utility helpers for managing post comment/share overlay URLs across Feed, Explore, Shorts, etc.
 * Supports both path-based overlay format: /feed/post="my-post-slug"?comment (or ?share)
 * and standard query format: /feed?post=my-post-slug&comment (or &share)
 */

/**
 * Parses current location (pathname & search) to detect if an overlay is active.
 * @param {Location} location - React Router or window.location object
 * @returns {{ postSlug: string|null, isComment: boolean, isShare: boolean, baseRoute: string }}
 */
export function parsePostOverlayParams(location) {
  if (!location) return { postSlug: null, isComment: false, isShare: false, baseRoute: '/' };

  const pathname = location.pathname || '';
  const search = location.search || '';

  let postSlug = null;
  let baseRoute = pathname;

  // Check path-based format: /feed/post="slug" or /feed/post=slug
  const pathMatch = pathname.match(/^(\/(?:feed|explore|shorts|videos|discover|community))\/(?:post=|post=")([^"/?#]+)"?/i);
  if (pathMatch) {
    baseRoute = pathMatch[1];
    postSlug = decodeURIComponent(pathMatch[2]);
  }

  // Parse search params
  const searchParams = new URLSearchParams(search);
  if (!postSlug && searchParams.has('post')) {
    postSlug = searchParams.get('post');
  }

  if (postSlug && typeof postSlug === 'string') {
    try { postSlug = decodeURIComponent(postSlug); } catch (_) {}
    postSlug = postSlug.replace(/^["']+|["']+$/g, '').trim() || null;
  }

  const isComment = searchParams.has('comment') || searchParams.has('comments') || search.includes('comment');
  const isShare = searchParams.has('share') || search.includes('share');

  return {
    postSlug,
    isComment,
    isShare,
    baseRoute,
  };
}

/**
 * Builds the URL to represent opening a Comment or Share overlay on a given post.
 * Output format: /feed/post="my-post-slug"?comment or /feed/post="my-post-slug"?share
 *
 * @param {string} currentPath - Current pathname (e.g. '/feed' or '/feed/post="abc"')
 * @param {string} postSlug - The post's slug or id
 * @param {'comment'|'share'} overlayType - Overlay type to open
 * @returns {string} URL string
 */
export function buildPostOverlayUrl(currentPath, postSlug, overlayType) {
  const cleanBase = (currentPath || '/feed').replace(/\/(?:post=|post=")[^"/?#]+"?.*/i, '') || '/feed';
  const encodedSlug = encodeURIComponent(String(postSlug || '').replace(/^"|"$/g, ''));
  const actionParam = overlayType === 'share' ? 'share' : 'comment';

  return `${cleanBase}/post="${encodedSlug}"?${actionParam}`;
}

/**
 * Clears the overlay parameters from the URL and returns the clean base route.
 * @param {Location} location - React Router or window.location object
 * @returns {string} Clean base route e.g. '/feed'
 */
export function clearPostOverlayUrl(location) {
  if (!location) return '/feed';
  const parsed = parsePostOverlayParams(location);
  const cleanPath = (location.pathname || '/feed').replace(/\/(?:post=|post=")[^"/?#]+"?.*/i, '') || parsed.baseRoute || '/feed';

  // Preserve any non-overlay query params if needed
  const searchParams = new URLSearchParams(location.search || '');
  searchParams.delete('post');
  searchParams.delete('comment');
  searchParams.delete('comments');
  searchParams.delete('share');

  const remainingQuery = searchParams.toString();
  return remainingQuery ? `${cleanPath}?${remainingQuery}` : cleanPath;
}
