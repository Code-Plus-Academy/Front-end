/**
 * Utility for sanitizing filenames for PDF downloads.
 * 
 * Rules:
 * 1. Replace invalid filesystem characters (/ \ : * ? < > | ") with safe alternatives.
 * 2. Collapse duplicate whitespace into a single space.
 * 3. Trim leading and trailing whitespace.
 * 4. Guarantee the filename ends with .pdf.
 * 5. Provide fallback if the input is empty or invalid.
 */

export function sanitizePdfFilename(rawFilename, titleFallback = 'Document') {
  let name = (rawFilename && typeof rawFilename === 'string' && rawFilename.trim()) 
    ? rawFilename.trim() 
    : (titleFallback && typeof titleFallback === 'string' && titleFallback.trim()) 
    ? titleFallback.trim() 
    : 'Document';

  // 1. If name already ends with .pdf (case insensitive), remove extension temporarily to clean stem
  if (/\.pdf$/i.test(name)) {
    name = name.slice(0, -4);
  }

  // 2. Replace invalid filesystem characters: / \ : * ? < > | "
  name = name.replace(/[/\\:*?"<>|]/g, ' - ');

  // 3. Replace non-printable ASCII / control characters
  name = name.replace(/[\x00-\x1F\x7F]/g, '');

  // 4. Collapse duplicate spaces or hyphens
  name = name.replace(/\s+/g, ' ');
  name = name.replace(/(\s*-\s*)+/g, ' - ');
  name = name.trim();

  // Strip leading/trailing hyphens or dots
  name = name.replace(/^[-.]+|[-.]+$|\.+$/g, '').trim();

  // If clean stem is empty after stripping invalid chars, use title fallback or 'Document'
  if (!name) {
    name = 'Document';
  }

  // Enforce reasonable length limit (max 200 chars) for filesystem/header safety
  if (name.length > 200) {
    name = name.substring(0, 200).trim();
  }

  // 5. Always append .pdf extension
  return `${name}.pdf`;
}

/**
 * Format Content-Disposition header values safely for both standard ASCII and RFC 5987 UTF-8 filenames.
 * Works across Chrome, Firefox, Safari, Edge, iOS Safari, Android browsers.
 */
export function buildContentDispositionHeader(filename) {
  const sanitized = sanitizePdfFilename(filename);
  
  // Create an ASCII-safe fallback filename for older browsers
  const asciiFallback = sanitized.replace(/[^\x20-\x7E]/g, '_');
  
  // RFC 5987 encoding for full UTF-8 support (spaces, unicode, special chars)
  const utf8Encoded = encodeURIComponent(sanitized).replace(/['()]/g, escape).replace(/\*/g, '%2A');

  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${utf8Encoded}`;
}
