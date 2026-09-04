/**
 * CPA Media URL & CDN Resolution Utility
 * Automatically transforms S3 storage URLs and relative upload paths to the CloudFront CDN.
 * Preserves local static app assets (/stickers, /gifs, /assets) and external embeds (Unsplash, Google Drive).
 */

export const CDN_BASE_URL = (
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_CDN_URL) ||
  'https://cdn.codeplusacademy.in'
).replace(/\/$/, '');

// Regex matching S3 bucket URLs (both virtual-hosted-style and path-style)
const S3_BUCKET_REGEX = /^https?:\/\/(?:cpacontentstream\.s3[.-][a-z0-9-]*\.amazonaws\.com|s3[.-][a-z0-9-]*\.amazonaws\.com\/cpacontentstream)/i;

/**
 * Resolves any media URL to CloudFront CDN for S3 uploaded assets.
 *
 * @param {string | null | undefined} url - The media URL or relative path
 * @returns {string} - The CDN-optimized or original URL
 */
export function resolveCdnUrl(url) {
  if (url === null || url === undefined) return null;
  if (typeof url !== 'string') return url;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // 1. Data URLs, blob URLs, internal anchors, or local static assets remain local
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('/stickers/') ||
    trimmed.startsWith('/gifs/') ||
    trimmed.startsWith('/assets/') ||
    trimmed.startsWith('/templates/')
  ) {
    return trimmed;
  }

  // 2. Direct S3 bucket URLs -> rewrite to CloudFront CDN
  if (S3_BUCKET_REGEX.test(trimmed)) {
    return trimmed.replace(S3_BUCKET_REGEX, CDN_BASE_URL);
  }

  // 3. Relative uploads directory -> prepend CDN base
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${CDN_BASE_URL}${cleanPath}`;
  }

  // 4. External URLs (e.g. Unsplash, Google Drive, Tenor, Giphy) return as-is
  return trimmed;
}

export default resolveCdnUrl;
