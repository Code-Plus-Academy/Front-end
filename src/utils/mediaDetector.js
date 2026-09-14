/**
 * CPA Direct Messaging — Media Type Detector
 * Identifies whether a message payload represents a Sticker, GIF, Shared Content, Story Reply, or Text.
 */

export function getMessageMediaType(msg) {
  if (!msg) return 'text';

  // 1. Direct explicit type
  if (msg.type === 'sticker') return 'sticker';
  if (msg.type === 'gif') return 'gif';
  if (msg.type === 'story_reply') return 'story_reply';
  if (msg.type?.startsWith('shared_')) return 'shared_content';

  // 2. Parsed content_attachment inspection
  let attachment = msg.content_attachment;
  if (typeof attachment === 'string') {
    try {
      attachment = JSON.parse(attachment);
    } catch {
      attachment = null;
    }
  }

  if (attachment) {
    if (attachment.content_type === 'sticker' || attachment.sticker_id || attachment.pack_id) {
      return 'sticker';
    }
    if (attachment.content_type === 'gif' || attachment.gif_id) {
      return 'gif';
    }
    if (attachment.media_snapshot_url && msg.type === 'story_reply') {
      return 'story_reply';
    }
    if (attachment.content_type?.startsWith('shared_') || attachment.post_id || attachment.content_id) {
      return 'shared_content';
    }
  }

  // 3. Fallback: Body pattern heuristic
  if (msg.body && typeof msg.body === 'string') {
    const trimmed = msg.body.trim();
    if (trimmed.startsWith('https://') || trimmed.startsWith('http://') || trimmed.startsWith('/stickers/')) {
      if (trimmed.includes('/stickers/') && trimmed.match(/\.(webp|png|svg|jpg|jpeg)($|\?)/i)) {
        return 'sticker';
      }
      if (trimmed.match(/\.(gif|webp)($|\?)/i)) {
        return 'gif';
      }
    }
  }

  return 'text';
}

export function parseContentAttachment(attachment) {
  if (!attachment) return null;
  if (typeof attachment === 'object') return attachment;
  try {
    return JSON.parse(attachment);
  } catch {
    return null;
  }
}
